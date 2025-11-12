import type {Request, Response} from 'express';
import {
  handleMatchRequest,
  handleCancelMatch,
  handleIncurPenalty,
  handleResetPenalty,
} from '../controllers/matchController';
import {
  findOrQueueUser,
  cancelMatch,
  incurPenalty,
  resetPenaltyLevel,
} from '../services/matchingService';

jest.mock('../services/matchingService', () => ({
  findOrQueueUser: jest.fn(),
  cancelMatch: jest.fn(),
  incurPenalty: jest.fn(),
  resetPenaltyLevel: jest.fn(),
}));

const mockResponse = () => {
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
  } as unknown as Response & {
    status: jest.Mock;
    json: jest.Mock;
  };
  return res;
};

describe('matchController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('handleMatchRequest', () => {
    it('returns 200 when service returns matched', async () => {
      (findOrQueueUser as jest.Mock).mockResolvedValueOnce({status: 'matched', matchId: 'match-1'});
      const req = {body: {userId: 'user-1', criteria: {}}} as unknown as Request;
      const res = mockResponse();

      await handleMatchRequest(req, res);

      expect(findOrQueueUser).toHaveBeenCalledWith('user-1', {});
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({status: 'matched', matchId: 'match-1'});
    });

    it('returns 202 when service returns waiting', async () => {
      (findOrQueueUser as jest.Mock).mockResolvedValueOnce({status: 'waiting'});
      const req = {body: {userId: 'user-2', criteria: {}}} as unknown as Request;
      const res = mockResponse();

      await handleMatchRequest(req, res);

      expect(res.status).toHaveBeenCalledWith(202);
      expect(res.json).toHaveBeenCalledWith({status: 'waiting'});
    });

    it('returns 429 when service returns penalized', async () => {
      (findOrQueueUser as jest.Mock).mockResolvedValueOnce({status: 'penalized', cooldown: 30});
      const req = {body: {userId: 'user-3', criteria: {}}} as unknown as Request;
      const res = mockResponse();

      await handleMatchRequest(req, res);

      expect(res.status).toHaveBeenCalledWith(429);
      expect(res.json).toHaveBeenCalledWith({status: 'penalized', cooldown: 30});
    });

    it('returns 500 for unknown status', async () => {
      (findOrQueueUser as jest.Mock).mockResolvedValueOnce({status: 'unexpected'});
      const req = {body: {userId: 'user-4', criteria: {}}} as unknown as Request;
      const res = mockResponse();

      await handleMatchRequest(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({message: 'Internal server error'});
    });

    it('returns 500 on exception', async () => {
      (findOrQueueUser as jest.Mock).mockRejectedValueOnce(new Error('boom'));
      const req = {body: {userId: 'user-5', criteria: {}}} as unknown as Request;
      const res = mockResponse();

      await handleMatchRequest(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({message: 'Internal server error'});
    });
  });

  describe('handleCancelMatch', () => {
    it('returns 400 when userId missing', async () => {
      const req = {params: {}} as unknown as Request;
      const res = mockResponse();

      await handleCancelMatch(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({message: 'User ID is required.'});
    });

    it('returns 200 on success', async () => {
      const req = {params: {userId: 'user-6'}} as unknown as Request;
      const res = mockResponse();

      await handleCancelMatch(req, res);

      expect(cancelMatch).toHaveBeenCalledWith('user-6');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({message: 'Search successfully cancelled.'});
    });

    it('returns 500 on exception', async () => {
      (cancelMatch as jest.Mock).mockRejectedValueOnce(new Error('oops'));
      const req = {params: {userId: 'user-7'}} as unknown as Request;
      const res = mockResponse();

      await handleCancelMatch(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({message: 'Internal server error'});
    });
  });

  describe('handleIncurPenalty', () => {
    it('returns 400 when userId missing', async () => {
      const req = {body: {}} as unknown as Request;
      const res = mockResponse();

      await handleIncurPenalty(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({message: 'User ID is required.'});
    });

    it('applies penalty with default increment', async () => {
      (incurPenalty as jest.Mock).mockResolvedValueOnce(120);
      const req = {body: {userId: 'user-8'}} as unknown as Request;
      const res = mockResponse();

      await handleIncurPenalty(req, res);

      expect(incurPenalty).toHaveBeenCalledWith('user-8', 1);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Penalty applied. User on cooldown for 120s.',
        cooldown: 120,
      });
    });

    it('returns 500 on exception', async () => {
      (incurPenalty as jest.Mock).mockRejectedValueOnce(new Error('fail'));
      const req = {body: {userId: 'user-9', increment: 2}} as unknown as Request;
      const res = mockResponse();

      await handleIncurPenalty(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({message: 'Internal server error'});
    });
  });

  describe('handleResetPenalty', () => {
    it('returns 400 when userId missing', async () => {
      const req = {body: {}} as unknown as Request;
      const res = mockResponse();

      await handleResetPenalty(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({message: 'User ID is required.'});
    });

    it('resets penalty successfully', async () => {
      const req = {body: {userId: 'user-10'}} as unknown as Request;
      const res = mockResponse();

      await handleResetPenalty(req, res);

      expect(resetPenaltyLevel).toHaveBeenCalledWith('user-10');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({message: 'Penalty level reset successfully.'});
    });

    it('returns 500 on exception', async () => {
      (resetPenaltyLevel as jest.Mock).mockRejectedValueOnce(new Error('error'));
      const req = {body: {userId: 'user-11'}} as unknown as Request;
      const res = mockResponse();

      await handleResetPenalty(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({message: 'Internal server error'});
    });
  });
});

