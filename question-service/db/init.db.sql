CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE topics (
    topic_name VARCHAR(50) PRIMARY KEY,
    description TEXT
);

CREATE TABLE questions (
    question_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    difficulty VARCHAR(10) NOT NULL CHECK (difficulty IN ('Easy', 'Medium', 'Hard')),
    examples JSONB,
    constraints JSONB,
    testcases JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ,
    created_by UUID NOT NULL
);

CREATE TABLE question_topics (
    question_id UUID NOT NULL REFERENCES Questions(question_id) ON DELETE CASCADE,
    topic_name VARCHAR(50) NOT NULL REFERENCES Topics(topic_name) ON DELETE CASCADE,
    PRIMARY KEY (question_id, topic_name)
);

INSERT INTO Topics (topic_name) VALUES ('Arrays'), ('Strings'), ('Hash Table'), ('Linked Lists'); -- And more