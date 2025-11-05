import { Pool } from 'pg';
import { StartSessionInput, StartSessionOutput, CompleteSessionInput, UserProgress, ParticipantAttempt } from '../types';

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
      await client.query(
        `UPDATE participants
         SET code = $1, is_solved_successfully = $2, has_penalty = $3
         WHERE session_id = $4 AND user_id = $5`,
        [input.code, input.isSolvedSuccessfully, input.hasPenalty, input.sessionId, input.userId]
      );

      // --- REFACTORED PROGRESS UPDATE ---
      // This is the critical fix.
      
      // Determine the increments based on the outcome
      const completedIncrement = input.hasPenalty ? 0 : 1;
      const solvedIncrement = input.isSolvedSuccessfully ? 1 : 0;

      // This query is now robust and calculates all stats correctly.
      await client.query(
        `INSERT INTO user_progress (
           user_id, 
           total_sessions, 
           total_sessions_completed, 
           total_successes, 
           success_rate, 
           current_streak, 
           last_practice_day
         )
         -- THE FIX IS HERE: We use a separate parameter $4 for the float value
         VALUES ($1, 1, $2, $3, $4, 1, CURRENT_DATE)
         ON CONFLICT (user_id) DO UPDATE SET
           total_sessions = user_progress.total_sessions + 1,
           
           total_sessions_completed = user_progress.total_sessions_completed + $2,
           
           total_successes = user_progress.total_successes + $3,
           
           success_rate = 
             -- Calculate new rate, use GREATEST to avoid division by zero
             (user_progress.total_successes + $3)::float / 
             GREATEST(user_progress.total_sessions_completed + $2, 1),
           
           current_streak = 
             CASE
               -- If last practice was yesterday, increment streak
               WHEN user_progress.last_practice_day = (CURRENT_DATE - INTERVAL '1 day') THEN user_progress.current_streak + 1
               -- If last practice was today, streak is unchanged
               WHEN user_progress.last_practice_day = CURRENT_DATE THEN user_progress.current_streak
               -- Otherwise, reset streak to 1
               ELSE 1
             END,
             
           last_practice_day = CURRENT_DATE`,
        // AND THE FIX IS HERE: We pass the value twice.
        // The driver will infer $3 as INT and $4 as FLOAT.
        [input.userId, completedIncrement, solvedIncrement, solvedIncrement]
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
    // Your correct query
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

  public async getQuestionAttempts(userId: string, questionId: string): Promise<ParticipantAttempt[] | null> {
    // Your correct query
    const res = await this.pool.query(
      `SELECT p.*, s.started_at 
       FROM participants p 
       JOIN sessions s ON p.session_id = s.session_id 
       WHERE p.user_id = $1 AND s.question_id = $2 
       ORDER BY s.started_at DESC`,
      [userId, questionId]
    );
    return res.rows.length > 0 ? res.rows : null;
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
}

