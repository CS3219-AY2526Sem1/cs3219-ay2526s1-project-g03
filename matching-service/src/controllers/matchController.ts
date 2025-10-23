import type { Request, Response } from 'express';
import { findOrQueueUser } from '../services/matchingService';
import type { MatchRequest } from '../models/matchModel';
import { HTTP_OK, HTTP_ACCEPTED, HTTP_BAD_REQUEST} from '../constants/httpStatus';

export const handleMatchRequest = (req: Request, res: Response) => {
  const matchRequestData: MatchRequest = req.body;

  const atLeastOneDifficulty: boolean = matchRequestData.criteria.difficulties && matchRequestData.criteria.difficulties.length > 0;
  const atLeastOneTopic: boolean = matchRequestData.criteria.topics && matchRequestData.criteria.topics.length > 0;

  // validate input
  if (!atLeastOneDifficulty && !atLeastOneTopic) {
    return res.status(HTTP_BAD_REQUEST).json({ message: "Difficulty and at least one topic are required." });
  }

  // call the service to perform the matching logic
  const result = findOrQueueUser(matchRequestData.userId, matchRequestData.criteria);

  // send the appropriate HTTP response based on the service's result
  if (result.status === 'matched') {
    return res.status(HTTP_OK).json(result);
  } else {
    return res.status(HTTP_ACCEPTED).json(result); // in the queue waiting for a match
  }
};

