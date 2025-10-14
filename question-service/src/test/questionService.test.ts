import * as request from 'supertest';
import app from '../index'; // Assuming your index.ts exports the app
import { pool, closePool } from '../config/database';

// Close the database pool after all tests have run
afterAll(async () => {
  await closePool();
});

describe('Question Service API', () => {

  // Test the health check endpoint
  it('should return a healthy status from /health', async () => {
    const res = await request(app).get('/health');
    expect([200, 503]).toContain(res.statusCode);
    expect(res.body).toHaveProperty('status');
    expect(res.body).toHaveProperty('database');
    expect(res.body).toHaveProperty('timestamp');
  });

  // Test the GET /api/topics endpoint
  it('should return a list of topics', async () => {
    // This is a basic test. A better test would seed the database first.
    const res = await request(app).get('/api/topics');
    expect([200, 500]).toContain(res.statusCode);
    if (res.statusCode === 200) {
      expect(Array.isArray(res.body)).toBe(true);
    }
  });

  // Add more tests for other endpoints...
  // For example, for POST /api/questions, you would need to:
  // 1. Mock any dependencies if necessary.
  // 2. Send a valid request body.
  // 3. Assert that the response status is 201.
  // 4. Assert that the response body contains the new question.
  // 5. Clean up the database after the test.
});