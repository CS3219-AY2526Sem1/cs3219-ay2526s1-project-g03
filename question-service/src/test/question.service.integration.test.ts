import request from 'supertest';
import app from '../index';
import { closePool } from '../config/database';

describe('Question Service API (Integration)', () => {
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
    });
  });

  describe('Questions API', () => {
    describe('GET /api/questions', () => {
      it('should return all questions', async () => {
        const res = await request(app).get('/api/questions');
        expect(res.statusCode).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
      });
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
        // First get all questions
        const allQuestionsRes = await request(app).get('/api/questions');
        if (allQuestionsRes.body.length > 0) {
          const firstQuestion = allQuestionsRes.body[0];
          
          const payload = {
            criteria: { 
              topic: firstQuestion.topic,
              difficulty: firstQuestion.difficulty 
            },
            excludedIds: [firstQuestion.question_id]
          };

          const res = await request(app)
            .post('/api/questions/select')
            .send(payload);

          if (res.statusCode === 200) {
            expect(res.body.question_id).not.toBe(firstQuestion.question_id);
          } else {
            expect([404]).toContain(res.statusCode);
          }
        }
      });
    });
  });
});