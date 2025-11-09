import { Router } from 'express';
import { handleMatchRequest, handleCancelMatch } from '../controllers/matchController';

const matchRoutes :Router = Router();

matchRoutes.post('/', handleMatchRequest);
matchRoutes.delete('/:userId', handleCancelMatch);

export default matchRoutes;