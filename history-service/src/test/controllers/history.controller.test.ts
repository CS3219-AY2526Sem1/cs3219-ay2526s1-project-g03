
import { Request, Response } from 'express';
import { HistoryController } from '../../controllers/history.controller';
import { HistoryService } from '../../services/history.service';
import { Pool } from 'pg';
import { testPool, closeTestPool } from '../setup';

describe('controllers/historyController', () => {
  jest.setTimeout(15000); // 15 seconds for integration tests
  let historyController: HistoryController;
  let historyService: HistoryService;
  let pool: Pool;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let jsonResponse: any;

  // Test constants
  const TEST_USER_ID = 'user-test-id';
  const TEST_QUESTION_ID = 'question-test-id';

  beforeAll(async () => {
    pool = testPool;
    historyService = new HistoryService(pool);
    historyController = new HistoryController(historyService);

    // Initialize database schema
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
    await pool.query('DROP TABLE IF EXISTS participants CASCADE');
    await pool.query('DROP TABLE IF EXISTS sessions CASCADE');
    await pool.query('DROP TABLE IF EXISTS user_progress CASCADE');
    await closeTestPool();
  }, 30000);

  beforeEach(async () => {
    // Clean up data
    await pool.query('DELETE FROM participants');
    await pool.query('DELETE FROM sessions');
    await pool.query('DELETE FROM user_progress');

    // Setup mock request and response
    jsonResponse = null;
    mockRequest = {
      body: {},
      params: {},
      query: {},
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn((data) => {
        jsonResponse = data;
        return mockResponse as Response;
      }),
      send: jest.fn().mockReturnThis(),
    };
  });

  describe('startSession', () => {
    it('should create a session and return 201', async () => {
      mockRequest.body = {
        user1Id: 'user1',
        user2Id: 'user2',
        questionId: TEST_QUESTION_ID,
        questionTitle: 'Test Question',
        questionDifficulty: 'Easy',
        questionTopics: ['Array'],
      };

      await historyController.startSession(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalled();
      expect(jsonResponse).toHaveProperty('sessionId');
    });

    it('should return 500 on service error', async () => {
      mockRequest.body = {
        user1Id: null, // Invalid input
        user2Id: 'user2',
        questionId: TEST_QUESTION_ID,
        questionTitle: 'Test Question',
        questionDifficulty: 'Easy',
        questionTopics: ['Array'],
      };

      await historyController.startSession(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(jsonResponse).toEqual({ error: 'Internal server error' });
    });
  });

  describe('completeSession', () => {
    it('should complete session and return 200', async () => {
      // First create a session
      const session = await historyService.startSession({
        user1Id: TEST_USER_ID,
        user2Id: 'user2',
        questionId: TEST_QUESTION_ID,
        questionTitle: 'Test Question',
        questionDifficulty: 'Easy',
        questionTopics: ['Array'],
      });

      mockRequest.body = {
        sessionId: session.sessionId,
        userId: TEST_USER_ID,
        code: 'def solution(): return True',
        isSolvedSuccessfully: true,
        hasPenalty: false,
        timeTakenMs: 1800000,
      };

      await historyController.completeSession(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.send).toHaveBeenCalled();
    });

    it('should return 500 on service error', async () => {
      mockRequest.body = {
        sessionId: 'invalid-session-id',
        userId: TEST_USER_ID,
        code: 'def solution(): return True',
        isSolvedSuccessfully: true,
        hasPenalty: false,
        timeTakenMs: 1800000,
      };

      await historyController.completeSession(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(jsonResponse).toEqual({ error: 'Internal server error' });
    });
  });

  describe('getActiveAttemptedQuestions', () => {
    it('should return active question IDs', async () => {
      // Create a session
      await historyService.startSession({
        user1Id: TEST_USER_ID,
        user2Id: 'user2',
        questionId: TEST_QUESTION_ID,
        questionTitle: 'Test Question',
        questionDifficulty: 'Easy',
        questionTopics: ['Array'],
      });

      mockRequest.params = { userId: TEST_USER_ID };

      await historyController.getActiveAttemptedQuestions(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalled();
      expect(Array.isArray(jsonResponse)).toBe(true);
    });

    it('should return 400 when userId is missing', async () => {
      mockRequest.params = {};

      await historyController.getActiveAttemptedQuestions(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(jsonResponse).toEqual({ error: 'userId is required' });
    });

    it('should return 500 on service error', async () => {
      mockRequest.params = { userId: null as any };

      await historyController.getActiveAttemptedQuestions(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
    });
  });

  describe('getUserProgress', () => {
    it('should return user progress', async () => {
      // Create progress
      const session = await historyService.startSession({
        user1Id: TEST_USER_ID,
        user2Id: 'user2',
        questionId: TEST_QUESTION_ID,
        questionTitle: 'Test Question',
        questionDifficulty: 'Easy',
        questionTopics: ['Array'],
      });

      await historyService.completeSession({
        sessionId: session.sessionId,
        userId: TEST_USER_ID,
        code: 'def solution(): return True',
        isSolvedSuccessfully: true,
        hasPenalty: false,
        timeTakenMs: 1800000,
      });

      mockRequest.params = { userId: TEST_USER_ID };

      await historyController.getUserProgress(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(jsonResponse).toHaveProperty('user_id', TEST_USER_ID);
    });

    it('should return 404 when progress not found', async () => {
      mockRequest.params = { userId: 'non-existent-user' };

      await historyController.getUserProgress(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(jsonResponse).toEqual({ error: 'No progress found for user' });
    });

    it('should return 400 when userId is missing', async () => {
      mockRequest.params = {};

      await historyController.getUserProgress(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(jsonResponse).toEqual({ error: 'userId is required' });
    });
  });

  describe('resetQuestions', () => {
    it('should reset questions and return 200', async () => {
      // Create a session
      const session = await historyService.startSession({
        user1Id: TEST_USER_ID,
        user2Id: 'user2',
        questionId: TEST_QUESTION_ID,
        questionTitle: 'Test Question',
        questionDifficulty: 'Easy',
        questionTopics: ['Array'],
      });

      mockRequest.params = { userId: TEST_USER_ID };
      mockRequest.body = { questionIds: [TEST_QUESTION_ID] };

      await historyController.resetQuestions(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.send).toHaveBeenCalled();
    });

    it('should return 400 when userId is missing', async () => {
      mockRequest.params = {};
      mockRequest.body = { questionIds: [TEST_QUESTION_ID] };

      await historyController.resetQuestions(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(jsonResponse).toEqual({ error: 'userId is required' });
    });

    it('should return 400 when questionIds is not an array', async () => {
      mockRequest.params = { userId: TEST_USER_ID };
      mockRequest.body = { questionIds: 'not-an-array' };

      await historyController.resetQuestions(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(jsonResponse).toEqual({ error: 'questionIds must be an array' });
    });
  });

  describe('getQuestionAttempts', () => {
    it('should return question attempts', async () => {
      // Create and complete a session
      const session = await historyService.startSession({
        user1Id: TEST_USER_ID,
        user2Id: 'user2',
        questionId: TEST_QUESTION_ID,
        questionTitle: 'Test Question',
        questionDifficulty: 'Easy',
        questionTopics: ['Array'],
      });

      await historyService.completeSession({
        sessionId: session.sessionId,
        userId: TEST_USER_ID,
        code: 'def solution(): return True',
        isSolvedSuccessfully: true,
        hasPenalty: false,
        timeTakenMs: 1800000,
      });

      mockRequest.params = { userId: TEST_USER_ID, questionId: TEST_QUESTION_ID };

      await historyController.getQuestionAttempts(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(Array.isArray(jsonResponse)).toBe(true);
    });

    it('should return 400 when userId is missing', async () => {
      mockRequest.params = { questionId: TEST_QUESTION_ID };

      await historyController.getQuestionAttempts(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(jsonResponse).toEqual({ error: 'userId and questionId are required' });
    });

    it('should return 400 when questionId is missing', async () => {
      mockRequest.params = { userId: TEST_USER_ID };

      await historyController.getQuestionAttempts(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(jsonResponse).toEqual({ error: 'userId and questionId are required' });
    });
  });

  describe('getAllSummaries', () => {
    it('should return all summaries', async () => {
      // Create a session
      await historyService.startSession({
        user1Id: TEST_USER_ID,
        user2Id: 'user2',
        questionId: TEST_QUESTION_ID,
        questionTitle: 'Test Question',
        questionDifficulty: 'Easy',
        questionTopics: ['Array'],
      });

      mockRequest.params = { userId: TEST_USER_ID };

      await historyController.getAllSummaries(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(Array.isArray(jsonResponse)).toBe(true);
    });

    it('should return 400 when userId is missing', async () => {
      mockRequest.params = {};

      await historyController.getAllSummaries(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(jsonResponse).toEqual({ error: 'userId is required' });
    });

    it('should return 500 on service error', async () => {
      mockRequest.params = { userId: null as any };

      await historyController.getAllSummaries(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(jsonResponse).toEqual({ error: 'Internal server error' });
    });
  });
});

