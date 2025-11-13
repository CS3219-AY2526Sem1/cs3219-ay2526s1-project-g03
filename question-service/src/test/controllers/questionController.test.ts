
import { Request, Response, NextFunction } from 'express';
import * as questionController from '../../controllers/questionController';
import * as questionService from '../../services/questionService';
import { Difficulty } from '../../services/questionService';

// Mock the service layer
jest.mock('../../services/questionService', () => ({
  getAllQuestions: jest.fn(),
  getQuestionById: jest.fn(),
  updateQuestion: jest.fn(),
  deleteQuestion: jest.fn(),
  getAllTopics: jest.fn(),
  selectQuestion: jest.fn(),
}));

describe('controllers/questionController', () => {
  jest.setTimeout(10000);

  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;
  let jsonResponse: any;

  // Test constants
  const TEST_QUESTION_ID = 'test-question-id';
  const TEST_QUESTION = {
    question_id: TEST_QUESTION_ID,
    title: 'Test Question',
    description: 'Test Description',
    difficulty: 'Easy' as Difficulty,
    created_by: 'admin',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  beforeEach(() => {
    jest.clearAllMocks();

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

    mockNext = jest.fn();
  });

  describe('getAllQuestions', () => {
    it('should return all questions without filters', async () => {
      const mockQuestions = [TEST_QUESTION];
      (questionService.getAllQuestions as jest.Mock).mockResolvedValue(mockQuestions);

      mockRequest.query = {};

      await questionController.getAllQuestions(mockRequest as Request, mockResponse as Response, mockNext);

      expect(questionService.getAllQuestions).toHaveBeenCalledWith(undefined, undefined);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(jsonResponse).toEqual(mockQuestions);
    });

    it('should filter by topic when provided', async () => {
      const mockQuestions = [TEST_QUESTION];
      (questionService.getAllQuestions as jest.Mock).mockResolvedValue(mockQuestions);

      mockRequest.query = { topic: 'Array' };

      await questionController.getAllQuestions(mockRequest as Request, mockResponse as Response, mockNext);

      expect(questionService.getAllQuestions).toHaveBeenCalledWith('Array', undefined);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
    });

    it('should filter by difficulty when provided', async () => {
      const mockQuestions = [TEST_QUESTION];
      (questionService.getAllQuestions as jest.Mock).mockResolvedValue(mockQuestions);

      mockRequest.query = { difficulty: 'Easy' };

      await questionController.getAllQuestions(mockRequest as Request, mockResponse as Response, mockNext);

      expect(questionService.getAllQuestions).toHaveBeenCalledWith(undefined, 'Easy');
      expect(mockResponse.status).toHaveBeenCalledWith(200);
    });

    it('should handle service errors', async () => {
      const error = new Error('Database error');
      (questionService.getAllQuestions as jest.Mock).mockRejectedValue(error);

      questionController.getAllQuestions(mockRequest as Request, mockResponse as Response, mockNext);

      // asyncHandler catches errors asynchronously, so we need to wait
      await new Promise(resolve => setImmediate(resolve));

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('getQuestionById', () => {
    it('should return question when found', async () => {
      (questionService.getQuestionById as jest.Mock).mockResolvedValue(TEST_QUESTION);

      mockRequest.params = { id: TEST_QUESTION_ID };

      await questionController.getQuestionById(mockRequest as Request, mockResponse as Response, mockNext);

      expect(questionService.getQuestionById).toHaveBeenCalledWith(TEST_QUESTION_ID);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(jsonResponse).toEqual(TEST_QUESTION);
    });

    it('should return 404 when question not found', async () => {
      (questionService.getQuestionById as jest.Mock).mockResolvedValue(null);

      mockRequest.params = { id: 'non-existent-id' };

      await questionController.getQuestionById(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(jsonResponse).toEqual({ message: 'Question not found' });
    });

    it('should return 400 when id is missing', async () => {
      mockRequest.params = {};

      await questionController.getQuestionById(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(jsonResponse).toEqual({ message: 'Missing required path parameter: id' });
    });
  });

  describe('updateQuestion', () => {
    it('should update question and return updated question', async () => {
      const updatedQuestion = { ...TEST_QUESTION, title: 'Updated Title' };
      (questionService.updateQuestion as jest.Mock).mockResolvedValue(updatedQuestion);

      mockRequest.params = { id: TEST_QUESTION_ID };
      mockRequest.body = { title: 'Updated Title' };

      await questionController.updateQuestion(mockRequest as Request, mockResponse as Response, mockNext);

      expect(questionService.updateQuestion).toHaveBeenCalledWith(TEST_QUESTION_ID, { title: 'Updated Title' });
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(jsonResponse).toEqual(updatedQuestion);
    });

    it('should return 404 when question not found', async () => {
      (questionService.updateQuestion as jest.Mock).mockResolvedValue(null);

      mockRequest.params = { id: 'non-existent-id' };
      mockRequest.body = { title: 'Updated Title' };

      await questionController.updateQuestion(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(jsonResponse).toEqual({ message: 'Question not found' });
    });

    it('should return 400 when id is missing', async () => {
      mockRequest.params = {};

      await questionController.updateQuestion(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(jsonResponse).toEqual({ message: 'Missing required path parameter: id' });
    });
  });

  describe('deleteQuestion', () => {
    it('should delete question and return success message', async () => {
      (questionService.deleteQuestion as jest.Mock).mockResolvedValue(TEST_QUESTION);

      mockRequest.params = { id: TEST_QUESTION_ID };

      await questionController.deleteQuestion(mockRequest as Request, mockResponse as Response, mockNext);

      expect(questionService.deleteQuestion).toHaveBeenCalledWith(TEST_QUESTION_ID);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(jsonResponse).toEqual({ message: 'Question deleted successfully' });
    });

    it('should return 404 when question not found', async () => {
      (questionService.deleteQuestion as jest.Mock).mockResolvedValue(null);

      mockRequest.params = { id: 'non-existent-id' };

      await questionController.deleteQuestion(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(jsonResponse).toEqual({ message: 'Question not found' });
    });

    it('should return 400 when id is missing', async () => {
      mockRequest.params = {};

      await questionController.deleteQuestion(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(jsonResponse).toEqual({ message: 'Missing required path parameter: id' });
    });
  });

  describe('getAllTopics', () => {
    it('should return all topics', async () => {
      const mockTopics = ['Array', 'Hash Table', 'String'];
      (questionService.getAllTopics as jest.Mock).mockResolvedValue(mockTopics);

      await questionController.getAllTopics(mockRequest as Request, mockResponse as Response, mockNext);

      expect(questionService.getAllTopics).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(jsonResponse).toEqual(mockTopics);
    });
  });

  describe('selectQuestion', () => {
    it('should return selected question when found', async () => {
      const selectedQuestion = { ...TEST_QUESTION, topics: ['Array'] };
      (questionService.selectQuestion as jest.Mock).mockResolvedValue(selectedQuestion);

      mockRequest.body = {
        criteria: { topic: 'Array', difficulty: 'Easy' },
        excludedIds: [],
      };

      await questionController.selectQuestion(mockRequest as Request, mockResponse as Response, mockNext);

      expect(questionService.selectQuestion).toHaveBeenCalledWith(
        { topic: 'Array', difficulty: 'Easy' },
        []
      );
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(jsonResponse).toEqual(selectedQuestion);
    });

    it('should return 404 when no question found', async () => {
      (questionService.selectQuestion as jest.Mock).mockResolvedValue(null);

      mockRequest.body = {
        criteria: { topic: 'Array', difficulty: 'Easy' },
        excludedIds: [],
      };

      await questionController.selectQuestion(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(jsonResponse).toEqual({ message: 'No suitable question found for the given criteria.' });
    });

    it('should return 400 when criteria is missing', async () => {
      mockRequest.body = { excludedIds: [] };

      await questionController.selectQuestion(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(jsonResponse).toEqual({ message: 'Missing required fields: criteria (with topic and difficulty).' });
    });

    it('should return 400 when excludedIds is not an array', async () => {
      mockRequest.body = {
        criteria: { topic: 'Array', difficulty: 'Easy' },
        excludedIds: 'not-an-array',
      };

      await questionController.selectQuestion(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(jsonResponse).toEqual({ message: 'Missing required field: excludedIds (as an array).' });
    });
  });
});

