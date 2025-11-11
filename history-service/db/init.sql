-- Enable UUID generation functionality
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

--
-- Table for shared session data
-- One row is created per match.
--
CREATE TABLE IF NOT EXISTS sessions (
    session_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    question_id TEXT NOT NULL,
    question_title TEXT NOT NULL,
    question_difficulty TEXT NOT NULL,
    question_topics TEXT[] NOT NULL,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

--
-- Table for individual participant outcomes
-- Two rows are created per session (one for each user).
--
CREATE TABLE IF NOT EXISTS participants (
    participant_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES sessions(session_id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    partner_id TEXT NOT NULL,
    
    -- Outcome fields, nullable as they are filled in later
    code TEXT,
    is_solved_successfully BOOLEAN,
    has_penalty BOOLEAN NOT NULL DEFAULT FALSE,
    is_active_in_history BOOLEAN NOT NULL DEFAULT TRUE,
    
    -- Ensures a user cannot be in the same session twice
    UNIQUE(session_id, user_id)
);

--
-- Table for aggregated user statistics
-- One row per user, updated on session completion.
--
CREATE TABLE IF NOT EXISTS user_progress (
    user_id TEXT PRIMARY KEY,
    total_sessions INTEGER NOT NULL DEFAULT 0,
    total_sessions_completed INTEGER NOT NULL DEFAULT 0,
    total_successes INTEGER NOT NULL DEFAULT 0,
    success_rate REAL NOT NULL DEFAULT 0,
    current_streak INTEGER NOT NULL DEFAULT 0,
    last_practice_day DATE
);



--
-- Indexes
--
-- Create index for faster lookups of a user's participation history
CREATE INDEX idx_participants_user_id ON participants(user_id);