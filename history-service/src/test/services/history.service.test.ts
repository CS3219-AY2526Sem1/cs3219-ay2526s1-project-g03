
import { Pool } from 'pg';
import { HistoryService } from '../../services/history.service';
import { testPool, closeTestPool } from '../setup';

describe('services/historyService', () => {
  jest.setTimeout(15000); // 15 seconds for integration tests

  let historyService: HistoryService;
  let pool: Pool;

  // Test constants
  const TEST_USER_ID_1 = 'user1-test-id';
  const TEST_USER_ID_2 = 'user2-test-id';
  const TEST_QUESTION_ID = 'question-test-id';
  const TEST_QUESTION_TITLE = 'Test Question';
  const TEST_QUESTION_DIFFICULTY = 'Easy';
  const TEST_QUESTION_TOPICS = ['Array', 'Hash Table'];
  const TEST_SESSION_ID = 'session-test-id';

  beforeAll(async () => {
    pool = testPool;
    historyService = new HistoryService(pool);

    // Initialize database schema for tests
    await pool.query(`
      CREATE TABLE IF NOT EXISTS sessions (
        session_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        question_id TEXT NOT NULL,
        question_title TEXT NOT NULL,
        question_difficulty TEXT NOT NULL,
        question_topics TEXT[] NOT NULL,
        started_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS participants (
        participant_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        session_id UUID NOT NULL REFERENCES sessions(session_id) ON DELETE CASCADE,
        user_id TEXT NOT NULL,
        partner_id TEXT NOT NULL,
        code TEXT,
        is_solved_successfully BOOLEAN,
        has_penalty BOOLEAN NOT NULL DEFAULT FALSE,
        time_taken_ms INTEGER,
        is_active_in_history BOOLEAN NOT NULL DEFAULT TRUE,
        UNIQUE(session_id, user_id)
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_progress (
        user_id TEXT PRIMARY KEY,
        total_sessions INTEGER NOT NULL DEFAULT 0,
        total_sessions_completed INTEGER NOT NULL DEFAULT 0,
        total_time_ms BIGINT NOT NULL DEFAULT 0,
        total_successes INTEGER NOT NULL DEFAULT 0,
        success_rate REAL NOT NULL DEFAULT 0,
        current_streak INTEGER NOT NULL DEFAULT 0,
        last_practice_day DATE
      )
    `);
  }, 30000);

  afterAll(async () => {
    // Clean up test tables
    await pool.query('DROP TABLE IF EXISTS participants CASCADE');
    await pool.query('DROP TABLE IF EXISTS sessions CASCADE');
    await pool.query('DROP TABLE IF EXISTS user_progress CASCADE');
    await closeTestPool();
  }, 30000);

  beforeEach(async () => {
    // Clean up data before each test
    await pool.query('DELETE FROM participants');
    await pool.query('DELETE FROM sessions');
    await pool.query('DELETE FROM user_progress');
  });

  describe('startSession', () => {
    const validInput = {
      user1Id: TEST_USER_ID_1,
      user2Id: TEST_USER_ID_2,
      questionId: TEST_QUESTION_ID,
      questionTitle: TEST_QUESTION_TITLE,
      questionDifficulty: TEST_QUESTION_DIFFICULTY,
      questionTopics: TEST_QUESTION_TOPICS,
    };

    it('should create a new session with two participants', async () => {
      const result = await historyService.startSession(validInput);

      expect(result).toHaveProperty('sessionId');
      expect(result.sessionId).toBeTruthy();

      // Verify session was created
      const sessionRes = await pool.query(
        'SELECT * FROM sessions WHERE session_id = $1',
        [result.sessionId]
      );
      expect(sessionRes.rows.length).toBe(1);
      expect(sessionRes.rows[0].question_id).toBe(TEST_QUESTION_ID);
      expect(sessionRes.rows[0].question_title).toBe(TEST_QUESTION_TITLE);

      // Verify both participants were created
      const participantsRes = await pool.query(
        'SELECT * FROM participants WHERE session_id = $1',
        [result.sessionId]
      );
      expect(participantsRes.rows.length).toBe(2);
      
      const userIds = participantsRes.rows.map(p => p.user_id);
      expect(userIds).toContain(TEST_USER_ID_1);
      expect(userIds).toContain(TEST_USER_ID_2);
    });

    it('should set correct partner_id for each participant', async () => {
      const result = await historyService.startSession(validInput);

      const participantsRes = await pool.query(
        'SELECT * FROM participants WHERE session_id = $1 ORDER BY user_id',
        [result.sessionId]
      );

      expect(participantsRes.rows.length).toBe(2);
      expect(participantsRes.rows[0].partner_id).toBe(TEST_USER_ID_2);
      expect(participantsRes.rows[1].partner_id).toBe(TEST_USER_ID_1);
    });

    it('should rollback transaction on error', async () => {
      // Create invalid input that will cause an error
      const invalidInput = {
        ...validInput,
        questionId: null as any, // This will cause a database error
      };

      await expect(historyService.startSession(invalidInput)).rejects.toThrow();

      // Verify no data was persisted
      const sessionsRes = await pool.query('SELECT * FROM sessions');
      expect(sessionsRes.rows.length).toBe(0);
    });
  });

  describe('completeSession', () => {
    let sessionId: string;

    beforeEach(async () => {
      // Create a session for testing
      const startResult = await historyService.startSession({
        user1Id: TEST_USER_ID_1,
        user2Id: TEST_USER_ID_2,
        questionId: TEST_QUESTION_ID,
        questionTitle: TEST_QUESTION_TITLE,
        questionDifficulty: TEST_QUESTION_DIFFICULTY,
        questionTopics: TEST_QUESTION_TOPICS,
      });
      sessionId = startResult.sessionId;
    });

    it('should update participant with completion data', async () => {
      const input = {
        sessionId,
        userId: TEST_USER_ID_1,
        code: 'def solution(): return True',
        isSolvedSuccessfully: true,
        hasPenalty: false,
        timeTakenMs: 1800000, // 30 minutes
      };

      await historyService.completeSession(input);

      const participantRes = await pool.query(
        'SELECT * FROM participants WHERE session_id = $1 AND user_id = $2',
        [sessionId, TEST_USER_ID_1]
      );

      expect(participantRes.rows.length).toBe(1);
      expect(participantRes.rows[0].code).toBe(input.code);
      expect(participantRes.rows[0].is_solved_successfully).toBe(true);
      expect(participantRes.rows[0].has_penalty).toBe(false);
      expect(participantRes.rows[0].time_taken_ms).toBe(1800000);
    });

    it('should create user_progress entry for new user', async () => {
      const input = {
        sessionId,
        userId: TEST_USER_ID_1,
        code: 'def solution(): return True',
        isSolvedSuccessfully: true,
        hasPenalty: false,
        timeTakenMs: 1800000,
      };

      await historyService.completeSession(input);

      const progressRes = await pool.query(
        'SELECT * FROM user_progress WHERE user_id = $1',
        [TEST_USER_ID_1]
      );

      expect(progressRes.rows.length).toBe(1);
      expect(progressRes.rows[0].total_sessions).toBe(1);
      expect(progressRes.rows[0].total_sessions_completed).toBe(1);
      expect(progressRes.rows[0].total_successes).toBe(1);
      expect(progressRes.rows[0].total_time_ms).toBe(1800000);
      expect(progressRes.rows[0].success_rate).toBe(1.0);
      expect(progressRes.rows[0].current_streak).toBe(1);
    });

    it('should update existing user_progress entry', async () => {
      // Complete first session
      await historyService.completeSession({
        sessionId,
        userId: TEST_USER_ID_1,
        code: 'def solution(): return True',
        isSolvedSuccessfully: true,
        hasPenalty: false,
        timeTakenMs: 1800000,
      });

      // Create and complete second session
      const secondSession = await historyService.startSession({
        user1Id: TEST_USER_ID_1,
        user2Id: TEST_USER_ID_2,
        questionId: 'question-2',
        questionTitle: 'Question 2',
        questionDifficulty: 'Medium',
        questionTopics: ['String'],
      });

      await historyService.completeSession({
        sessionId: secondSession.sessionId,
        userId: TEST_USER_ID_1,
        code: 'def solution(): return False',
        isSolvedSuccessfully: false,
        hasPenalty: false,
        timeTakenMs: 2400000,
      });

      const progressRes = await pool.query(
        'SELECT * FROM user_progress WHERE user_id = $1',
        [TEST_USER_ID_1]
      );

      expect(progressRes.rows[0].total_sessions).toBe(2);
      expect(progressRes.rows[0].total_sessions_completed).toBe(2);
      expect(progressRes.rows[0].total_successes).toBe(1); // Only one success
      expect(progressRes.rows[0].total_time_ms).toBe(4200000); // Sum of both
      expect(progressRes.rows[0].success_rate).toBe(0.5); // 1 success / 2 sessions
    });

    it('should not increment completed count when hasPenalty is true', async () => {
      const input = {
        sessionId,
        userId: TEST_USER_ID_1,
        code: 'def solution(): return True',
        isSolvedSuccessfully: true,
        hasPenalty: true, // Has penalty
        timeTakenMs: 1800000,
      };

      await historyService.completeSession(input);

      const progressRes = await pool.query(
        'SELECT * FROM user_progress WHERE user_id = $1',
        [TEST_USER_ID_1]
      );

      expect(progressRes.rows[0].total_sessions).toBe(1);
      expect(progressRes.rows[0].total_sessions_completed).toBe(0); // Not completed due to penalty
    });
  });

  describe('getActiveAttemptedQuestionIds', () => {
    it('should return empty array when user has no active attempts', async () => {
      const result = await historyService.getActiveAttemptedQuestionIds(TEST_USER_ID_1);
      expect(result).toEqual([]);
    });

    it('should return question IDs for active attempts', async () => {
      // Create sessions
      const session1 = await historyService.startSession({
        user1Id: TEST_USER_ID_1,
        user2Id: TEST_USER_ID_2,
        questionId: 'question-1',
        questionTitle: 'Question 1',
        questionDifficulty: 'Easy',
        questionTopics: ['Array'],
      });

      const session2 = await historyService.startSession({
        user1Id: TEST_USER_ID_1,
        user2Id: TEST_USER_ID_2,
        questionId: 'question-2',
        questionTitle: 'Question 2',
        questionDifficulty: 'Medium',
        questionTopics: ['String'],
      });

      const result = await historyService.getActiveAttemptedQuestionIds(TEST_USER_ID_1);

      expect(result.length).toBe(2);
      expect(result).toContain('question-1');
      expect(result).toContain('question-2');
    });

    it('should not return inactive question IDs', async () => {
      const session = await historyService.startSession({
        user1Id: TEST_USER_ID_1,
        user2Id: TEST_USER_ID_2,
        questionId: 'question-1',
        questionTitle: 'Question 1',
        questionDifficulty: 'Easy',
        questionTopics: ['Array'],
      });

      // Deactivate the attempt
      await pool.query(
        'UPDATE participants SET is_active_in_history = FALSE WHERE session_id = $1 AND user_id = $2',
        [session.sessionId, TEST_USER_ID_1]
      );

      const result = await historyService.getActiveAttemptedQuestionIds(TEST_USER_ID_1);
      expect(result).not.toContain('question-1');
    });
  });

  describe('getUserProgress', () => {
    it('should return null when user has no progress', async () => {
      const result = await historyService.getUserProgress(TEST_USER_ID_1);
      expect(result).toBeNull();
    });

    it('should return user progress when it exists', async () => {
      // Create progress by completing a session
      const session = await historyService.startSession({
        user1Id: TEST_USER_ID_1,
        user2Id: TEST_USER_ID_2,
        questionId: TEST_QUESTION_ID,
        questionTitle: TEST_QUESTION_TITLE,
        questionDifficulty: TEST_QUESTION_DIFFICULTY,
        questionTopics: TEST_QUESTION_TOPICS,
      });

      await historyService.completeSession({
        sessionId: session.sessionId,
        userId: TEST_USER_ID_1,
        code: 'def solution(): return True',
        isSolvedSuccessfully: true,
        hasPenalty: false,
        timeTakenMs: 1800000,
      });

      const result = await historyService.getUserProgress(TEST_USER_ID_1);

      expect(result).not.toBeNull();
      expect(result?.user_id).toBe(TEST_USER_ID_1);
      expect(result?.total_sessions).toBe(1);
      expect(result?.total_sessions_completed).toBe(1);
    });
  });

  describe('resetQuestions', () => {
    it('should deactivate participants for given question IDs', async () => {
      // Create sessions with different questions
      const session1 = await historyService.startSession({
        user1Id: TEST_USER_ID_1,
        user2Id: TEST_USER_ID_2,
        questionId: 'question-1',
        questionTitle: 'Question 1',
        questionDifficulty: 'Easy',
        questionTopics: ['Array'],
      });

      const session2 = await historyService.startSession({
        user1Id: TEST_USER_ID_1,
        user2Id: TEST_USER_ID_2,
        questionId: 'question-2',
        questionTitle: 'Question 2',
        questionDifficulty: 'Medium',
        questionTopics: ['String'],
      });

      // Reset question-1
      await historyService.resetQuestions(TEST_USER_ID_1, ['question-1']);

      // Verify question-1 is deactivated
      const participant1 = await pool.query(
        'SELECT is_active_in_history FROM participants WHERE session_id = $1 AND user_id = $2',
        [session1.sessionId, TEST_USER_ID_1]
      );
      expect(participant1.rows[0].is_active_in_history).toBe(false);

      // Verify question-2 is still active
      const participant2 = await pool.query(
        'SELECT is_active_in_history FROM participants WHERE session_id = $1 AND user_id = $2',
        [session2.sessionId, TEST_USER_ID_1]
      );
      expect(participant2.rows[0].is_active_in_history).toBe(true);
    });

    it('should handle empty questionIds array gracefully', async () => {
      await expect(historyService.resetQuestions(TEST_USER_ID_1, [])).resolves.not.toThrow();
    });
  });

  describe('getQuestionAttempts', () => {
    it('should return null when user has no attempts for question', async () => {
      const result = await historyService.getQuestionAttempts(TEST_USER_ID_1, TEST_QUESTION_ID);
      expect(result).toBeNull();
    });

    it('should return attempts for a specific question', async () => {
      // Create and complete a session
      const session = await historyService.startSession({
        user1Id: TEST_USER_ID_1,
        user2Id: TEST_USER_ID_2,
        questionId: TEST_QUESTION_ID,
        questionTitle: TEST_QUESTION_TITLE,
        questionDifficulty: TEST_QUESTION_DIFFICULTY,
        questionTopics: TEST_QUESTION_TOPICS,
      });

      await historyService.completeSession({
        sessionId: session.sessionId,
        userId: TEST_USER_ID_1,
        code: 'def solution(): return True',
        isSolvedSuccessfully: true,
        hasPenalty: false,
        timeTakenMs: 1800000,
      });

      const result = await historyService.getQuestionAttempts(TEST_USER_ID_1, TEST_QUESTION_ID);

      expect(result).not.toBeNull();
      expect(Array.isArray(result)).toBe(true);
      expect(result!.length).toBeGreaterThan(0);
      expect(result![0].question_title).toBe(TEST_QUESTION_TITLE);
    });
  });

  describe('getAllSummaries', () => {
    it('should return empty array when user has no attempts', async () => {
      const result = await historyService.getAllSummaries(TEST_USER_ID_1);
      expect(result).toEqual([]);
    });

    it('should return summaries for all unique questions', async () => {
      // Create multiple sessions
      await historyService.startSession({
        user1Id: TEST_USER_ID_1,
        user2Id: TEST_USER_ID_2,
        questionId: 'question-1',
        questionTitle: 'Question 1',
        questionDifficulty: 'Easy',
        questionTopics: ['Array'],
      });

      await historyService.startSession({
        user1Id: TEST_USER_ID_1,
        user2Id: TEST_USER_ID_2,
        questionId: 'question-2',
        questionTitle: 'Question 2',
        questionDifficulty: 'Medium',
        questionTopics: ['String'],
      });

      const result = await historyService.getAllSummaries(TEST_USER_ID_1);

      expect(result.length).toBe(2);
      expect(result.map(r => r.question_id)).toContain('question-1');
      expect(result.map(r => r.question_id)).toContain('question-2');
    });

    it('should return only most recent attempt for each question', async () => {
      // Create two sessions with same question
      const session1 = await historyService.startSession({
        user1Id: TEST_USER_ID_1,
        user2Id: TEST_USER_ID_2,
        questionId: TEST_QUESTION_ID,
        questionTitle: TEST_QUESTION_TITLE,
        questionDifficulty: TEST_QUESTION_DIFFICULTY,
        questionTopics: TEST_QUESTION_TOPICS,
      });

      // Wait a bit to ensure different timestamps
      await new Promise(resolve => setTimeout(resolve, 100));

      const session2 = await historyService.startSession({
        user1Id: TEST_USER_ID_1,
        user2Id: TEST_USER_ID_2,
        questionId: TEST_QUESTION_ID,
        questionTitle: TEST_QUESTION_TITLE,
        questionDifficulty: TEST_QUESTION_DIFFICULTY,
        questionTopics: TEST_QUESTION_TOPICS,
      });

      const result = await historyService.getAllSummaries(TEST_USER_ID_1);

      // Should only return one summary (most recent)
      expect(result.length).toBe(1);
      expect(result[0].session_id).toBe(session2.sessionId);
    });
  });
});

