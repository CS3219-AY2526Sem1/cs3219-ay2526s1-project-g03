import request from 'supertest';
import app from '../index';
import { closePool } from '../config/database';

describe('Question Service API (Integration)', () => {
  // Increase timeout for integration tests that may need database connections
  jest.setTimeout(15000);

  afterAll(async () => {
    await closePool();
  });

  describe('Health Check', () => {
    it('should return status and timestamp', async () => {
      const res = await request(app).get('/health');
      expect([200, 503]).toContain(res.statusCode);
      expect(res.body).toHaveProperty('status');
      expect(res.body).toHaveProperty('database');
      expect(res.body).toHaveProperty('timestamp');
    }, 10000); // 10 second timeout for health check
  });

  describe('Questions API', () => {
    describe('GET /api/questions', () => {
      it('should return all questions', async () => {
        const res = await request(app).get('/api/questions');
        expect(res.statusCode).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
      }, 10000);
    });

    describe('GET /api/questions/:id', () => {
      it('should return question by id if exists', async () => {
        // First get all questions to get a valid ID
        const allQuestionsRes = await request(app).get('/api/questions');
        if (allQuestionsRes.body.length > 0) {
          const questionId = allQuestionsRes.body[0].question_id;
          const res = await request(app).get(`/api/questions/${questionId}`);
          expect(res.statusCode).toBe(200);
          expect(res.body).toHaveProperty('question_id', questionId);
        }
      });

      it('should return 404 for non-existent question', async () => {
        const res = await request(app).get('/api/questions/652c60dc-f518-4a7c-9c3c-bab6bf4b6cc0');
        expect(res.statusCode).toBe(404);
      });
    });

    describe('GET /api/topics', () => {
      it('should return array of topics', async () => {
        const res = await request(app).get('/api/topics');
        expect(res.statusCode).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
      });
    });

    describe('POST /api/questions/select', () => {
      it('should return a question matching criteria', async () => {
        const payload = {
          criteria: { topic: 'Array', difficulty: 'Easy' },
          excludedIds: []
        };

        const res = await request(app)
          .post('/api/questions/select')
          .send(payload);

        if (res.statusCode === 200) {
          expect(res.body).toMatchObject({
            question_id: expect.any(String),
            title: expect.any(String),
            difficulty: expect.stringMatching(/^(Easy|Medium|Hard)$/)
          });
        } else {
          expect([404]).toContain(res.statusCode); // No matching questions found
        }
      });

      it('should validate request payload', async () => {
        const invalidPayload = {
          criteria: { topic: '', difficulty: 'Invalid' }
        };

        const res = await request(app)
          .post('/api/questions/select')
          .send(invalidPayload);

        expect(res.statusCode).toBe(400);
        expect(res.body).toHaveProperty('message');
      });

      it('should handle excludedIds correctly', async () => {
        // --- THIS IS THE FIX ---
        // We must first get a valid topic, THEN get all questions.
        
        // 1. Get all topics
        const topicsRes = await request(app).get('/api/topics');
        expect(topicsRes.statusCode).toBe(200);
        expect(topicsRes.body.length).toBeGreaterThan(0);
        const validTopic = topicsRes.body[0]; // e.g., "Arrays"

        // 2. Get all questions
        const allQuestionsRes = await request(app).get('/api/questions');
        expect(allQuestionsRes.statusCode).toBe(200);

        if (allQuestionsRes.body.length > 0) {
          const firstQuestion = allQuestionsRes.body[0];
          
          // 3. Send a VALID payload
          const payload = {
            criteria: { 
              topic: validTopic, // Use the valid topic
              difficulty: firstQuestion.difficulty 
            },
            excludedIds: [firstQuestion.question_id]
          };

          const res = await request(app)
            .post('/api/questions/select')
            .send(payload);

          // 4. The test logic is now valid.
          if (res.statusCode === 200) {
            expect(res.body.question_id).not.toBe(firstQuestion.question_id);
          } else {
            // Your controller logic correctly returns 404 if no question is found
            expect([404]).toContain(res.statusCode);
          }
        } else {
          // Skip test if no questions in database (CI might have empty DB)
          console.warn('Skipping excludedIds test: No questions in database');
        }
      }, 15000); // Longer timeout for complex integration test
    });
  });
});