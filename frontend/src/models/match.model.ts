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
  criteria?: MatchCriteria;
  partnerId: string;
  sessionId: string;
}