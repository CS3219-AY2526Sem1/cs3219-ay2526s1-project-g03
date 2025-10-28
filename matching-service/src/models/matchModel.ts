export interface MatchCriteria {
  difficulties: string[];
  topics: string[];
}

export interface MatchRequest {
  userId: string; // unique identifier for user
  criteria: MatchCriteria;
}