import { Router } from 'express';
import { handleMatchRequest } from '../controllers/matchController';

const matchRoutes :Router = Router();

matchRoutes.post('/', handleMatchRequest);

export default matchRoutes;