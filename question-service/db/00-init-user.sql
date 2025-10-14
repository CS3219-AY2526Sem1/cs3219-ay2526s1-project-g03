-- This file runs AFTER postgres creates the main user
-- Create our application user
CREATE USER "user" WITH PASSWORD 'password';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE "question-db" TO "user";

-- Connect to database and set schema privileges
\c question-db

GRANT ALL ON SCHEMA public TO "user";
GRANT ALL ON ALL TABLES IN SCHEMA public TO "user";
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO "user";
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO "user";
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO "user";