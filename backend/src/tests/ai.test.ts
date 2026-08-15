import request from 'supertest';
import { createApp } from '../app';

const app = createApp();

describe('AI & Conversation Endpoints', () => {
  it('POST /api/v1/ai/conversations should create new AI session', async () => {
    const res = await request(app)
      .post('/api/v1/ai/conversations')
      .set('x-test-user-id', 'test-user-123')
      .send({ title: 'Sales Trend Q3 Analysis' });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.title).toBe('Sales Trend Q3 Analysis');
  });

  it('GET /api/v1/ai/conversations should return conversations list', async () => {
    const res = await request(app)
      .get('/api/v1/ai/conversations')
      .set('x-test-user-id', 'test-user-123');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});
