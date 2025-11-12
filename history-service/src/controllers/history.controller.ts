import { Request, Response } from 'express';
import { HistoryService } from '../services/history.service';
// We no longer need to import 'db' here, as the service is given to us
// import db from '../config/database'; 

export class HistoryController {
  // We remove the old line:
  // private historyService = new HistoryService(db as any);

  // And replace it with a constructor that ACCEPTS the service instance.
  // This is the "dependency injection" fix.
  constructor(private historyService: HistoryService) {}

  public startSession = async (req: Request, res: Response): Promise<Response> => {
    try {
      const result = await this.historyService.startSession(req.body);
      return res.status(201).json(result);
    } catch (error) {
      // Add specific logging
      console.error('Error in startSession controller:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  };

  public completeSession = async (req: Request, res: Response): Promise<Response> => {
    try {
      // Support both query parameters and body for flexibility
      // Helper function to parse boolean from query string
      const parseBoolean = (value: any): boolean => {
        if (typeof value === 'boolean') return value;
        if (typeof value === 'string') return value.toLowerCase() === 'true';
        return false;
      };

      const timeTakenMsValue = req.body['timeTakenMs'] !== undefined
        ? Number(req.body['timeTakenMs'])
        : req.query['timeTakenMs'] !== undefined
          ? Number(req.query['timeTakenMs'])
          : undefined;

      const input: {
        sessionId: string;
        userId: string;
        code: string;
        isSolvedSuccessfully: boolean;
        hasPenalty: boolean;
        timeTakenMs?: number;
      } = {
        sessionId: (req.body['sessionId'] || req.query['sessionId']) as string,
        userId: (req.body['userId'] || req.query['userId']) as string,
        code: (req.body['code'] || req.query['code']) as string,
        isSolvedSuccessfully: req.body['isSolvedSuccessfully'] !== undefined 
          ? req.body['isSolvedSuccessfully'] 
          : parseBoolean(req.query['isSolvedSuccessfully']),
        hasPenalty: req.body['hasPenalty'] !== undefined
          ? req.body['hasPenalty']
          : parseBoolean(req.query['hasPenalty']),
        ...(timeTakenMsValue !== undefined && { timeTakenMs: timeTakenMsValue }),
      };

      // Validate required fields
      if (!input.sessionId || !input.userId) {
        return res.status(400).json({ error: 'sessionId and userId are required' });
      }

      // Log the input for debugging
      console.log('[completeSession] Input received:', {
        sessionId: input.sessionId,
        userId: input.userId,
        isSolvedSuccessfully: input.isSolvedSuccessfully,
        hasPenalty: input.hasPenalty,
        timeTakenMs: input.timeTakenMs,
        codeLength: input.code?.length || 0,
      });

      await this.historyService.completeSession(input);
      return res.status(200).send();
    } catch (error) {
      console.error('Error in completeSession controller:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  };

  public getActiveAttemptedQuestions = async (req: Request, res: Response): Promise<Response> => {
    try {
      const userId = req.params['userId'];
      if (!userId) {
        return res.status(400).json({ error: 'userId is required' });
      }
      // This is the fix for the typo
      const result = await this.historyService.getActiveAttemptedQuestionIds(userId);
      return res.status(200).json(result);
    } catch (error) {
      console.error('Error in getActiveAttemptedQuestions controller:', error);   
      return res.status(500).json({ error: 'Internal server error' });
    }
  };
  
  public getUserProgress = async (req: Request, res: Response): Promise<Response> => {
    try {
      const userId = req.params['userId'];
      if (!userId) {
        return res.status(400).json({ error: 'userId is required' });
      }
      const result = await this.historyService.getUserProgress(userId);
      
      // Return default progress object if no progress found (instead of 404)
      // This allows the frontend to show zero stats instead of an error
      if (!result) {
        return res.status(200).json({
          user_id: userId,
          total_sessions: 0,
          total_sessions_completed: 0,
          total_successes: 0,
          success_rate: 0,
          current_streak: 0,
          last_practice_day: null,
          total_time_ms: 0,
        });
      }
      return res.status(200).json(result);

    } catch (error) {
      console.error('Error in getUserProgress controller:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  };



  public resetQuestions = async (req: Request, res: Response): Promise<Response> => {
    try {
      const userId = req.params['userId'];
      if (!userId) {
        return res.status(400).json({ error: 'userId is required' });
      }
      const { questionIds } = req.body;
      if (!Array.isArray(questionIds)) {
        return res.status(400).json({ error: 'questionIds must be an array' });
      }
      await this.historyService.resetQuestions(userId, questionIds);
      return res.status(200).send();
    } catch (error) {
      console.error('Error in resetQuestions controller:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  };

  public getQuestionAttempts = async (req: Request, res: Response): Promise<Response> => {
    try {
      const userId = req.params['userId'];
      const questionId = req.params['questionId'];
      if (!userId || !questionId) {
        return res.status(400).json({ error: 'userId and questionId are required' });
      }
      const result = await this.historyService.getQuestionAttempts(userId, questionId);
      
      // Return an empty array instead of null for easier frontend handling
      return res.status(200).json(result || []);
    } catch (error) {
      console.error('Error in getQuestionAttempts controller:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  };

  public getAllSummaries = async (req: Request, res: Response): Promise<Response> => {
    try {
      const userId = req.params['userId'];
      if (!userId) {
        return res.status(400).json({ error: 'userId is required' });
      }
      const summaries = await this.historyService.getAllSummaries(userId);
      return res.status(200).json(summaries);
    } catch (error) {
      console.error('Error in getAllSummaries controller:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  };
}

