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
      await this.historyService.completeSession(req.body);
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
      
      // Add a 404 check for cleaner frontend handling
      if (!result) {
        return res.status(404).json({ error: 'No progress found for user' });
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
      return res.status(500).json({ error: 'Internal server error' });
    }
  };
}

