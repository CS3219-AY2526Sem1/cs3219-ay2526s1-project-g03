export interface MatchCriteria {
  difficulties: string[];
  topics: string[];
  languages: string[];
}

export interface MatchRequest {
  userId: string; // unique identifier for user
  criteria: MatchCriteria;
}

export type MatchStatus = 'pending' | 'accepted' | 'declined';

export interface PendingMatch {
  user1Id: string;
  user1Status: MatchStatus;
  user2Id: string;
  user2Status: MatchStatus;
}