import type { Request, Response } from 'express';
import { findOrQueueUser, cancelMatch, incurPenalty, resetPenaltyLevel } from '../services/matchingService';
import type { MatchRequest } from '../models/matchModel';
import { HTTP_OK, HTTP_ACCEPTED, HTTP_BAD_REQUEST, HTTP_TOO_MANY_REQUEST, HTTP_INTERNAL_SERVER_ERROR } from '../constants/httpStatus';

export const handleMatchRequest = async (req: Request, res: Response) => {
  try {
    const { userId, criteria }: MatchRequest = req.body;

    // call the service to perform the matching logic
    const result = await findOrQueueUser(userId, criteria);

    // send the appropriate HTTP response based on the service's result
    if (result.status === 'matched') {
      return res.status(HTTP_OK).json(result);
    } else if (result.status === 'waiting') {
      return res.status(HTTP_ACCEPTED).json(result); // in the queue waiting for a match
    } else if (result.status === 'penalized') {
    // Use 429 Too Many Requests for cooldowns
      return res.status(HTTP_TOO_MANY_REQUEST).json(result);
    } else {
      console.error("Unknown result status in handleMatchRequest:", result);
      return res.status(HTTP_INTERNAL_SERVER_ERROR).json({ message: "Internal server error" });
    }
  } catch (error) {
    console.error("Error in handleMatchRequest:", error);
    return res.status(HTTP_INTERNAL_SERVER_ERROR).json({ message: "Internal server error" });
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

// API Endpoint for Collab Service to apply penalty
export const handleIncurPenalty = async (req: Request, res: Response) => {
  try {
    const { userId, increment } = req.body;
    if (!userId) {
      return res.status(HTTP_BAD_REQUEST).json({ message: "User ID is required." });
    }

    // Validate increment or default to 1
    const amount = (typeof increment === 'number' && increment > 0) ? increment : 1;

    // Call the shared service logic
    const cooldown = await incurPenalty(userId, amount);

    return res.status(HTTP_OK).json({
      message: `Penalty applied. User on cooldown for ${cooldown}s.`,
      cooldown
    });
  } catch (error) {
    console.error("Error in handleIncurPenalty:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// API Endpoint for Collab Service to reset penalty
export const handleResetPenalty = async (req: Request, res: Response) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      return res.status(HTTP_BAD_REQUEST).json({ message: "User ID is required." });
    }

    // Call the shared service logic
    await resetPenaltyLevel(userId);

    return res.status(HTTP_OK).json({ message: "Penalty level reset successfully." });
  } catch (error) {
    console.error("Error in handleResetPenalty:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

