import { Router } from 'express';
import { handleMatchRequest, handleCancelMatch, handleIncurPenalty, handleResetPenalty } from '../controllers/matchController';

const matchRoutes :Router = Router();

matchRoutes.post('/', handleMatchRequest);
matchRoutes.delete('/:userId', handleCancelMatch);
matchRoutes.post('/penalty/incur', handleIncurPenalty);
matchRoutes.post('/penalty/reset', handleResetPenalty);

export default matchRoutes;