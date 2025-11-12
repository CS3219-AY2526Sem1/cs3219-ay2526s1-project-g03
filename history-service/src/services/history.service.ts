import { Pool } from 'pg';
import axios from 'axios';
import { StartSessionInput, StartSessionOutput, CompleteSessionInput, UserProgress, ParticipantAttempt, SessionSummary } from '../types';

export class HistoryService {
  // The service now accepts the pool via its constructor.
  // This is a standard practice called "dependency injection".
  constructor(private pool: Pool) {}

  public async startSession(input: StartSessionInput): Promise<StartSessionOutput> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const sessionRes = await client.query(
        `INSERT INTO sessions (question_id, question_title, question_difficulty, question_topics)
         VALUES ($1, $2, $3, $4) RETURNING session_id`,
        [input.questionId, input.questionTitle, input.questionDifficulty, input.questionTopics]
      );
      const sessionId: string = sessionRes.rows[0].session_id;

      await client.query(
        `INSERT INTO participants (session_id, user_id, partner_id) VALUES ($1, $2, $3)`,
        [sessionId, input.user1Id, input.user2Id]
      );
      await client.query(
        `INSERT INTO participants (session_id, user_id, partner_id) VALUES ($1, $2, $3)`,
        [sessionId, input.user2Id, input.user1Id]
      );

      await client.query('COMMIT');
      return { sessionId };
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error in startSession:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  public async completeSession(input: CompleteSessionInput): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      
      // Query 1: Update the participant's row
      await client.query(
        `UPDATE participants
         SET code = $1, is_solved_successfully = $2, has_penalty = $3, time_taken_ms = $6
         WHERE session_id = $4 AND user_id = $5`,
        [
          input.code, 
          input.isSolvedSuccessfully, 
          input.hasPenalty, 
          input.sessionId, 
          input.userId, 
          input.timeTakenMs ?? 0 // $6
        ]
      );

      
      // Determine the increments based on the outcome
      const completedIncrement = input.hasPenalty ? 0 : 1;
      const solvedIncrement = input.isSolvedSuccessfully ? 1 : 0;
      const timeIncrement = input.timeTakenMs || 0;

      // Query 2: This query is now robust and calculates all stats correctly.
      await client.query(
        `INSERT INTO user_progress (
            user_id, 
            total_sessions, 
            total_sessions_completed, 
            total_successes, 
            success_rate, 
            current_streak, 
            last_practice_day,
            total_time_ms
         )
         VALUES ($1, 1, $2, $3, $4, 1, CURRENT_DATE, $5)
         ON CONFLICT (user_id) DO UPDATE SET
            total_sessions = user_progress.total_sessions + 1,
            
            total_sessions_completed = user_progress.total_sessions_completed + $2,
            
            total_successes = user_progress.total_successes + $3,
            
            success_rate = 
              -- Calculate new rate based on TOTAL sessions, not just completed ones
              (user_progress.total_successes + $3)::float / 
              GREATEST(user_progress.total_sessions + 1, 1),
            
            current_streak = 
              CASE
                -- If last practice was yesterday, increment streak
                WHEN user_progress.last_practice_day = (CURRENT_DATE - INTERVAL '1 day') THEN user_progress.current_streak + 1
                -- If last practice was today, streak is unchanged
                WHEN user_progress.last_practice_day = CURRENT_DATE THEN user_progress.current_streak
                -- Otherwise, reset streak to 1
                ELSE 1
              END,
               
            last_practice_day = CURRENT_DATE,

            total_time_ms = user_progress.total_time_ms + $5
        `,
        [
          input.userId,         // $1
          completedIncrement,     // $2
          solvedIncrement,        // $3 (as int)
          solvedIncrement,        // $4 (as float)
          timeIncrement           // $5 (as int)
        ]
      );

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error in completeSession:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  public async getActiveAttemptedQuestionIds(userId: string): Promise<string[]> {
    const res = await this.pool.query(
      `SELECT DISTINCT s.question_id
       FROM participants p
       JOIN sessions s ON s.session_id = p.session_id
       WHERE p.user_id = $1 AND p.is_active_in_history = TRUE`,
      [userId]
    );
    return res.rows.map(r => r.question_id);
  }

  public async getUserProgress(userId: string): Promise<UserProgress | null> {
    const res = await this.pool.query(`SELECT * FROM user_progress WHERE user_id = $1`, [userId]);
    return res.rows[0] || null;
  }

  public async resetQuestions(userId: string, questionIds: string[]): Promise<void> {
    if (!questionIds || questionIds.length === 0) {
      return; // Nothing to do
    }
    // Your correct query
    await this.pool.query(
      `UPDATE participants 
       SET is_active_in_history = FALSE 
       WHERE user_id = $1 
       AND session_id IN (
         SELECT session_id FROM sessions WHERE question_id = ANY($2::text[])
       )`,
      [userId, questionIds]
    );
  }

  public async automaticallyResetOldAttempts(): Promise<void> {
    console.log('[History Service] Running automatic 30-day reset job...');
    try {
      const res = await this.pool.query(
        `UPDATE participants p 
         SET is_active_in_history = FALSE 
         FROM sessions s 
         WHERE p.session_id = s.session_id 
         AND p.is_active_in_history = TRUE 
         AND s.started_at < NOW() - INTERVAL '30 days'`
      );
      console.log(`[History Service] Automatic reset completed. ${res.rowCount} participant records deactivated.`);
    } catch (error) {
      console.error('[History Service] Error during automatic reset:', error);
      throw error;
    }
  }

  /**
   * Fetches partner usernames from the user-service for a list of partner IDs.
   * Returns a map of partner_id -> username.
   * This method is designed to fail gracefully - it will return an empty map
   * or partial results if the user-service is unavailable.
   */
  private async fetchPartnerUsernames(partnerIds: string[]): Promise<Map<string, string>> {
    const usernameMap = new Map<string, string>();
    const userServiceUrl = process.env['USER_SERVICE_URL'] || 'http://user-service:8080';
    
    // Filter out empty or invalid partner IDs
    const validPartnerIds = partnerIds.filter(id => id && id.trim() !== '');
    
    if (validPartnerIds.length === 0) {
      return usernameMap;
    }

    try {
      // Fetch usernames in parallel for all partner IDs with individual error handling
      // Use Promise.allSettled instead of Promise.all to ensure all requests complete
      const usernamePromises = validPartnerIds.map(async (partnerId) => {
        try {
          const response = await axios.get(
            `${userServiceUrl}/api/service/user/${encodeURIComponent(partnerId)}`,
            {
              timeout: 3000, // Reduced timeout to 3 seconds
              validateStatus: (status) => status < 500, // Don't throw on 4xx errors
            }
          );
          if (response.status === 200 && response.data?.username) {
            return { partnerId, username: response.data.username };
          }
          return { partnerId, username: 'Unknown' };
        } catch (error: any) {
          // Silently handle errors - don't log every failure to avoid log spam
          if (error.code !== 'ECONNREFUSED' && error.code !== 'ETIMEDOUT') {
            console.error(`Failed to fetch username for partner ${partnerId}:`, error.message || error);
          }
          return { partnerId, username: 'Unknown' };
        }
      });

      // Use Promise.allSettled to ensure we don't fail if some requests fail
      const results = await Promise.allSettled(usernamePromises);
      results.forEach((result) => {
        if (result.status === 'fulfilled') {
          const { partnerId, username } = result.value;
          usernameMap.set(partnerId, username);
        }
      });
    } catch (error: any) {
      // Log only unexpected errors
      console.error('Unexpected error in fetchPartnerUsernames:', error.message || error);
    }
    
    return usernameMap;
  }

  /**
   * [CORRECTED] Gets the summary list of all unique questions a user has attempted.
   * This query uses 'DISTINCT ON' to get ONLY the *most recent*
   * attempt for each unique question_id.
   * Also fetches partner usernames from the user-service.
   */
  public async getAllSummaries(userId: string): Promise<SessionSummary[]> {
    try {
      const res = await this.pool.query(
        `SELECT DISTINCT ON (s.question_id)
            s.session_id,
            s.question_id,
            s.question_title,
            s.question_difficulty,
            s.question_topics,
            s.started_at,
            p.partner_id,
            p.is_solved_successfully,
            p.has_penalty,
            p.time_taken_ms
         FROM participants p
         JOIN sessions s ON p.session_id = s.session_id
         WHERE p.user_id = $1
         ORDER BY s.question_id, s.started_at DESC`, // The ORDER BY is crucial for DISTINCT ON
        [userId]
      );
      
      const summaries = res.rows as SessionSummary[];
      
      // If no summaries, return empty array immediately
      if (!summaries || summaries.length === 0) {
        return [];
      }
      
      // Extract unique partner IDs
      const partnerIds = [...new Set(summaries.map(s => s.partner_id).filter(id => id && id.trim() !== ''))];
      
      // Fetch partner usernames asynchronously - fail gracefully if user-service is unavailable
      // We use a short timeout and Promise.race to ensure we don't hang
      let usernameMap = new Map<string, string>();
      if (partnerIds.length > 0) {
        try {
          // Create a timeout promise that resolves to empty map after 2 seconds
          const timeoutPromise = new Promise<Map<string, string>>((resolve) => {
            setTimeout(() => {
              resolve(new Map());
            }, 2000);
          });
          
          // Race between username fetch and timeout
          const usernamePromise = this.fetchPartnerUsernames(partnerIds).catch(() => new Map<string, string>());
          usernameMap = await Promise.race([usernamePromise, timeoutPromise]);
        } catch (error: any) {
          // If anything fails, just use empty map (usernames will be 'Unknown')
          console.error('Error in username fetch, using empty map:', error.message || error);
        }
      }
      
      // Map usernames to summaries - always return summaries even if username fetch failed
      return summaries.map(summary => ({
        ...summary,
        partner_username: usernameMap.get(summary.partner_id) || 'Unknown',
      }));
    } catch (error: any) {
      console.error('Error in getAllSummaries:', error.message || error);
      throw error;
    }
  }

  public async getQuestionAttempts(userId: string, questionId: string): Promise<ParticipantAttempt[] | null> {
    try {
      const res = await this.pool.query(
        `SELECT p.*, s.started_at, s.question_title
         FROM participants p 
         JOIN sessions s ON p.session_id = s.session_id 
         WHERE p.user_id = $1 AND s.question_id = $2 
         ORDER BY s.started_at DESC`,
        [userId, questionId]
      );
      
      if (res.rows.length === 0) {
        return null;
      }
      
      const attempts = res.rows as ParticipantAttempt[];
      
      // Extract unique partner IDs
      const partnerIds = [...new Set(attempts.map(a => a.partner_id).filter(id => id && id.trim() !== ''))];
      
      // Fetch partner usernames asynchronously - fail gracefully if user-service is unavailable
      // We use a short timeout and Promise.race to ensure we don't hang
      let usernameMap = new Map<string, string>();
      if (partnerIds.length > 0) {
        try {
          // Create a timeout promise that resolves to empty map after 2 seconds
          const timeoutPromise = new Promise<Map<string, string>>((resolve) => {
            setTimeout(() => {
              resolve(new Map());
            }, 2000);
          });
          
          // Race between username fetch and timeout
          const usernamePromise = this.fetchPartnerUsernames(partnerIds).catch(() => new Map<string, string>());
          usernameMap = await Promise.race([usernamePromise, timeoutPromise]);
        } catch (error: any) {
          // If anything fails, just use empty map (usernames will be 'Unknown')
          console.error('Error in username fetch, using empty map:', error.message || error);
        }
      }
      
      // Map usernames to attempts - always return attempts even if username fetch failed
      return attempts.map(attempt => ({
        ...attempt,
        partner_username: usernameMap.get(attempt.partner_id) || 'Unknown',
      }));
    } catch (error: any) {
      console.error('Error in getQuestionAttempts:', error.message || error);
      throw error;
    }
  }
}