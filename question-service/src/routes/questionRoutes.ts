import { Router } from 'express';
import * as questionController from '../controllers/questionController';

const router = Router();

// Route to get a question for a new session
router.post('/questions/select', questionController.selectQuestionForSession);

// Route to get all unique topics
router.get('/topics', questionController.getAllTopics);

// Standard CRUD routes for questions (likely admin-only)
router.get('/questions', questionController.getAllQuestions);
router.post('/questions', questionController.createQuestion);
router.get('/questions/:id', questionController.getQuestionById);
router.put('/questions/:id', questionController.updateQuestion);
router.delete('/questions/:id', questionController.deleteQuestion);

export default router;