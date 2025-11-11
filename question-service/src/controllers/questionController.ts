import { Request, Response, NextFunction } from 'express';
import * as questionService from '../services/questionService';
import { Difficulty } from '../services/questionService'; 

// Typed async handler to preserve Express types
type AsyncRequestHandler = (req: Request, res: Response, next: NextFunction) => Promise<unknown>;
const asyncHandler = (fn: AsyncRequestHandler) => (req: Request, res: Response, next: NextFunction): void => {
  void Promise.resolve(fn(req, res, next)).catch(next);
};


export const getAllQuestions = asyncHandler(async (req: Request, res: Response) => {
  const topic = req.query['topic'] as string | undefined;
  const difficulty = req.query['difficulty'] as Difficulty | undefined;
  const questions = await questionService.getAllQuestions(topic, difficulty);
  
  return res.status(200).json(questions);
});

export const getQuestionById = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params && req.params['id'];
  if (!id) {
    return res.status(400).json({ message: 'Missing required path parameter: id' });
  }
  const question = await questionService.getQuestionById(id);
  if (!question) {
    return res.status(404).json({ message: 'Question not found' });
  }
  return res.status(200).json(question);
});

export const updateQuestion = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params && req.params['id'];
  if (!id) {
    return res.status(400).json({ message: 'Missing required path parameter: id' });
  }
  const updatedQuestion = await questionService.updateQuestion(id, req.body);
  if (!updatedQuestion) {
    return res.status(404).json({ message: 'Question not found' });
  }
  return res.status(200).json(updatedQuestion);
});

export const deleteQuestion = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params && req.params['id'];
  if (!id) {
    return res.status(400).json({ message: 'Missing required path parameter: id' });
  }
  const deletedQuestion = await questionService.deleteQuestion(id);
  if (!deletedQuestion) {
    return res.status(404).json({ message: 'Question not found' });
  }
  return res.status(200).json({ message: 'Question deleted successfully' });
});

export const getAllTopics = asyncHandler(async (req: Request, res: Response) => {
  void req;
  const topics = await questionService.getAllTopics();
  return res.status(200).json(topics);
});

export const selectQuestion = asyncHandler(async (req: Request, res: Response) => {
  const { criteria, excludedIds } = req.body;
  
  // Make validation more robust: check if keys exist and that excludedIds is an array.
  // The service will handle if topic/difficulty are strings or arrays.
  if (!criteria || !criteria.topic || !criteria.difficulty) {
    return res.status(400).json({ 
      message: 'Missing required fields: criteria (with topic and difficulty).' 
    });
  }

  if (!Array.isArray(excludedIds)) {
     return res.status(400).json({ 
      message: 'Missing required field: excludedIds (as an array).' 
    });
  }

  // The service layer no longer needs userIds, as history is pre-fetched
  const question = await questionService.selectQuestion(criteria, excludedIds);
  
  if (!question) {
    return res.status(404).json({ message: 'No suitable question found for the given criteria.' });
  }
  return res.status(200).json(question);
});
