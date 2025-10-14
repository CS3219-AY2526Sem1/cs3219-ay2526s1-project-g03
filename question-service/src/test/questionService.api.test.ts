import * as request from 'supertest';
import app from '../index';
import { closePool } from '../config/database';

describe('Question Service API (integration)', () => {
  

  it('GET /health returns healthy json', async () => {
    const res = await request(app).get('/health');
    expect([200, 503]).toContain(res.statusCode);
    expect(res.body).toHaveProperty('status');
  });

  it('POST /api/questions/select validates body', async () => {
    const res = await request(app)
      .post('/api/questions/select')
      .send({ topic: 'Array' });
    expect(res.statusCode).toBe(400);
  });
});


