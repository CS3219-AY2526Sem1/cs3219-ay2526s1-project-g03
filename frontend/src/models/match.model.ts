export interface MatchCriteria {
  difficulties: string[];
  languages: string[],
  topics: string[];
}

export interface MatchRequestPayload {
  userId: string;
  criteria: MatchCriteria;
}

export interface MatchPayload {
  partnerId: string;
  matchId: string;
  criteria: any;
  expiryTimestamp: number;
  totalDuration: number;
}