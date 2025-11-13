-- ============================================
-- Schema Migration: Create Tables
-- ============================================
-- 1. Remove the join table first (depends on questions and topics)

BEGIN;

-- ============================================
-- 1. Create topics table
-- ============================================
CREATE TABLE IF NOT EXISTS topics (
    topic_name VARCHAR(100) PRIMARY KEY,
    description TEXT
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_topics_name ON topics(topic_name);

-- ============================================
-- 2. Create questions table
-- ============================================
CREATE TABLE IF NOT EXISTS questions (
    question_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    difficulty VARCHAR(20) NOT NULL CHECK (difficulty IN ('Easy', 'Medium', 'Hard')),
    examples JSONB,
    constraints JSONB,
    testcases JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100)
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_questions_difficulty ON questions(difficulty);
CREATE INDEX IF NOT EXISTS idx_questions_created_at ON questions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_questions_title ON questions(title);

-- Create trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_questions_updated_at 
    BEFORE UPDATE ON questions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 3. Create question_topics junction table
-- ============================================
CREATE TABLE IF NOT EXISTS question_topics (
    question_id UUID NOT NULL REFERENCES questions(question_id) ON DELETE CASCADE,
    topic_name VARCHAR(100) NOT NULL REFERENCES topics(topic_name) ON DELETE CASCADE,
    PRIMARY KEY (question_id, topic_name)
);

-- Create indexes for efficient joins
CREATE INDEX IF NOT EXISTS idx_question_topics_question ON question_topics(question_id);
CREATE INDEX IF NOT EXISTS idx_question_topics_topic ON question_topics(topic_name);

-- ============================================
-- 4. Add useful views for common queries
-- ============================================

-- View: Questions with their topics as an array
CREATE OR REPLACE VIEW questions_with_topics AS
SELECT 
    q.question_id,
    q.title,
    q.description,
    q.difficulty,
    q.examples,
    q.constraints,
    q.testcases,
    q.created_at,
    q.updated_at,
    q.created_by,
    COALESCE(
        array_agg(qt.topic_name ORDER BY qt.topic_name) 
        FILTER (WHERE qt.topic_name IS NOT NULL),
        ARRAY[]::VARCHAR[]
    ) as topics
FROM questions q
LEFT JOIN question_topics qt ON q.question_id = qt.question_id
GROUP BY q.question_id;

-- View: Topic statistics
CREATE OR REPLACE VIEW topic_stats AS
SELECT 
    t.topic_name,
    t.description,
    COUNT(qt.question_id) as question_count,
    COUNT(CASE WHEN q.difficulty = 'Easy' THEN 1 END) as easy_count,
    COUNT(CASE WHEN q.difficulty = 'Medium' THEN 1 END) as medium_count,
    COUNT(CASE WHEN q.difficulty = 'Hard' THEN 1 END) as hard_count
FROM topics t
LEFT JOIN question_topics qt ON t.topic_name = qt.topic_name
LEFT JOIN questions q ON qt.question_id = q.question_id
GROUP BY t.topic_name, t.description
ORDER BY question_count DESC;

-- ============================================
-- 5. Add comments for documentation
-- ============================================

COMMENT ON TABLE topics IS 'Stores all available coding question topics (e.g., Array, Hash Table, Dynamic Programming)';
COMMENT ON TABLE questions IS 'Stores coding interview questions with examples, constraints, and test cases';
COMMENT ON TABLE question_topics IS 'Junction table linking questions to their related topics (many-to-many relationship)';

COMMENT ON COLUMN questions.examples IS 'Array of example inputs/outputs in JSONB format';
COMMENT ON COLUMN questions.constraints IS 'Array of problem constraints in JSONB format';
COMMENT ON COLUMN questions.testcases IS 'Array of test cases in JSONB format';
COMMENT ON COLUMN questions.created_by IS 'Username or system identifier of who created the question';

COMMIT;

-- ============================================
-- Verification queries (optional - comment out for production)
-- ============================================

-- Show all tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Show all indexes
SELECT 
    tablename, 
    indexname, 
    indexdef 
FROM pg_indexes 
WHERE schemaname = 'public' 
ORDER BY tablename, indexname;