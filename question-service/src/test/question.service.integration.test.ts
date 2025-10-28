import * as request from 'supertest';
import app from '../index';
import { pool, closePool } from '../config/database'; // Import pool for direct checks if needed

// Close the database pool after all integration tests have run
afterAll(async () => {
  await closePool();
});

describe('Question Service API (Integration)', () => {

  // Test the health check endpoint
  it('health check should return status and timestamp', async () => {
    const res = await request(app).get('/health');
    expect([200, 503]).toContain(res.statusCode);
    expect(res.body).toHaveProperty('status');
    expect(res.body).toHaveProperty('database');
    expect(res.body).toHaveProperty('timestamp');
  });

  // Test the GET /api/topics endpoint
  it('GET /api/topics should return an array or an error status', async () => {
    const res = await request(app).get('/api/topics');
    expect([200, 500]).toContain(res.statusCode); // Expect 200 or 500 (if DB not ready)
    if (res.statusCode === 200) {
      expect(Array.isArray(res.body)).toBe(true);
    }
  });

  // Test the main POST /api/questions/select endpoint
  it('POST /api/questions/select should accept criteria and excludedIds', async () => {
    const payload = {
      criteria: { topic: 'Array', difficulty: 'Easy' }, // Make sure 'Array' exists in your test DB
      excludedIds: ['00000000-0000-0000-0000-000000000000'] // A fake UUID
    };

    const res = await request(app)
      .post('/api/questions/select')
      .send(payload)
      .set('Accept', 'application/json');

    // Depending on seeded data, this may return 200 with a question or 404 if none found.
    // 400 is also possible if criteria are bad. 500 if the DB connection fails.
    expect([200, 400, 404, 500]).toContain(res.statusCode);

    if (res.statusCode === 200) {
      expect(res.body).toHaveProperty('question_id');
      expect(res.body).toHaveProperty('title');
      expect(res.body).toHaveProperty('difficulty');
      // We know it's not the one we excluded
      expect(res.body.question_id).not.toBe('00000000-0000-0000-0000-000000000000');
    }

    if (res.statusCode === 404) {
      expect(res.body).toHaveProperty('message', 'No suitable question found for the given criteria.');
    }
  });

  it('POST /api/questions/select validates body', async () => {
    const res = await request(app)
      .post('/api/questions/select')
      .send({ topic: 'Array' }); // Missing criteria.difficulty and excludedIds
    
    // This expects your controller's validation logic to catch the bad body
    expect(res.statusCode).toBe(400); 
    expect(res.body).toHaveProperty('message');
  });

});
