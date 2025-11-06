import { Request, Response } from 'express';
import { HistoryService } from '../services/history.service';

export class HistoryController {
  private historyService: HistoryService;

  constructor() {
    this.historyService = new HistoryService();
  }

  // Endpoint for Matching Service to GET history
  public getUserHistory = async (req: Request, res: Response): Promise<Response> => {
    try {
      const userId = req.params['userId']; 
      if (!userId) {
        return res.status(400).json({ message: 'userId is required in the URL' });
      }
      const history = await this.historyService.getAttemptedQuestions(userId);
      return res.status(200).json({ attemptedQuestionIds: history });
    } catch (error) {
      return res.status(500).json({ message: 'Server error' });
    }
  };

  // Endpoint for Matching Service to POST a new attempt
  public addAttempt = async (req: Request, res: Response): Promise<Response> => {
    try {
      const { userId, questionId } = req.body;
      if (!userId || !questionId) {
        return res.status(400).json({ message: 'userId and questionId are required' });
      }
      await this.historyService.addQuestionAttempt(userId, questionId);
      return res.status(201).json({ message: 'History updated' });
    } catch (error) {
      return res.status(500).json({ message: 'Server error' });
    }
  };

  // Updated endpoint to remove one or more questions from history
  public removeAttempts = async (req: Request, res: Response): Promise<Response> => {
    try {
      const userId = req.params['userId']; 
      const { questionIds } = req.body; // Expect an array of question IDs in the body

      if (!userId) {
        return res.status(400).json({ message: 'userId is required in the URL' });
      }
      if (!Array.isArray(questionIds) || questionIds.length === 0) {
        return res.status(400).json({ message: 'questionIds must be a non-empty array in the request body' });
      }

      await this.historyService.removeQuestionAttempts(userId, questionIds);
      return res.status(200).json({ message: 'Questions removed from history' });
    } catch (error) {
      return res.status(500).json({ message: 'Server error' });
    }
  };

  // New endpoint for users to clear their entire history
  public clearUserHistory = async (req: Request, res: Response): Promise<Response> => {
    try {
      const userId = req.params['userId']; 
      if (!userId) {
        return res.status(400).json({ message: 'userId is required in the URL' });
      }
      await this.historyService.clearHistory(userId);
      return res.status(200).json({ message: 'History cleared for user' });
    } catch (error) {
      return res.status(500).json({ message: 'Server error' });
    }
  };
}

