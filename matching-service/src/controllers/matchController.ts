import type { Request, Response } from 'express';
import { findOrQueueUser, cancelMatch } from '../services/matchingService';
import type { MatchRequest } from '../models/matchModel';
import { HTTP_OK, HTTP_ACCEPTED, HTTP_BAD_REQUEST} from '../constants/httpStatus';

export const handleMatchRequest = async (req: Request, res: Response) => {
  try {
    const { userId, criteria }: MatchRequest = req.body;
    const atLeastOneDifficulty: boolean = criteria.difficulties && criteria.difficulties.length > 0;
    const atLeastOneTopic: boolean = criteria.topics && criteria.topics.length > 0;

    // validate input
    if (!atLeastOneDifficulty && !atLeastOneTopic) {
      return res.status(HTTP_BAD_REQUEST).json({ message: "Difficulty and at least one topic are required." });
    }

    // call the service to perform the matching logic
    const result = await findOrQueueUser(userId, criteria);

    // send the appropriate HTTP response based on the service's result
    if (result.status === 'matched') {
      return res.status(HTTP_OK).json(result);
    } else {
      return res.status(HTTP_ACCEPTED).json(result); // in the queue waiting for a match
    }
  } catch (error) {
    console.error("Error in handleMatchRequest:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const handleCancelMatch = async (req: Request, res: Response) => {
  const { userId } = req.params;

  if (!userId) {
    return res.status(400).json({ message: "User ID is required." });
  }

  try {
    await cancelMatch(userId);
    return res.status(200).json({ message: 'Search successfully cancelled.' })
  } catch (error) {
    console.error("Error in handleCancelMatch:", error);
    return res.status(500).json({ message: "Internal server error" });
  }

};
