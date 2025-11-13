// Mock environment variables for history-service tests
import { Pool } from 'pg';

process.env['NODE_ENV'] = 'test';
process.env['DATABASE_URL'] = process.env['DATABASE_URL'] || 'postgresql://postgres:postgres@localhost:5432/history_test';

// Export a test pool that can be used in tests
// In CI, this will use the PostgreSQL service container
// Locally, it will use the DATABASE_URL or default to localhost
export const testPool = new Pool({
  connectionString: process.env['DATABASE_URL'],
  max: 5,
});

// Clean up function for afterAll hooks
export const closeTestPool = async (): Promise<void> => {
  await testPool.end();
};

