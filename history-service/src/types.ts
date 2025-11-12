export interface StartSessionInput {
  user1Id: string;
  user2Id: string;
  questionId: string;
  questionTitle: string;
  questionDifficulty: string;
  questionTopics: string[];
}

export interface StartSessionOutput {
  sessionId: string;
}

export interface CompleteSessionInput {
  sessionId: string;
  userId: string;
  code: string;
  isSolvedSuccessfully: boolean;
  hasPenalty: boolean;
  timeTakenMs?: number;
}

export interface UserProgress {
  user_id: string;
  total_sessions: number;
  total_sessions_completed: number;
  total_successes: number;
  success_rate: number;
  current_streak: number;
  last_practice_day: string | null;
  total_time_ms?: number;
}

export interface ParticipantAttempt {
  participant_id: string;
  session_id: string;
  user_id: string;
  partner_id: string;
  partner_username?: string;
  code: string | null;
  is_solved_successfully: boolean | null;
  has_penalty: boolean;
  is_active_in_history: boolean;
  started_at: string;
  time_taken_ms: number | null;
  question_title?: string;
}

export interface SessionSummary {
  session_id: string;
  question_id: string;
  question_title: string;
  question_difficulty: string;
  question_topics: string[];
  started_at: string;
  partner_id: string;
  partner_username?: string;
  is_solved_successfully: boolean | null;
  has_penalty: boolean;
  time_taken_ms: number | null;
}

