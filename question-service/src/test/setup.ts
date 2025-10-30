process.env['NODE_ENV'] = 'test';

// Mock the required database environment variables
// Use the same values as your .env.test file
process.env['POSTGRES_HOST'] = 'question-db-pg'; 
process.env['POSTGRES_PORT'] = '5432';
process.env['POSTGRES_USER'] = 'postgres';
process.env['POSTGRES_PASSWORD'] = 'postgres';
process.env['POSTGRES_DB'] = 'question-db';


console.log('Jest setup: Environment variables mocked for test environment.');

