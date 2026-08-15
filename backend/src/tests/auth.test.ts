import request from 'supertest';
import { createApp } from '../app';

const app = createApp();

describe('Health Check & Auth Endpoints', () => {
  it('GET /health should return status ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.service).toBe('InsightAI API');
  });

  it('GET /api/v1/auth/me without token should return 401 Unauthorized', async () => {
    const res = await request(app).get('/api/v1/auth/me');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('GET /api/v1/auth/me with test header should return user profile', async () => {
    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('x-test-user-id', 'test-user-123');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user_id).toBe('test-user-123');
  });

  it('POST /api/v1/auth/login should record user login and return profile', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'biswajitnas195@gmail.com',
        full_name: 'Biswajit Naskar',
        user_id: 'usr-test-100',
        provider: 'email',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.email).toBe('biswajitnas195@gmail.com');
    expect(res.body.data.full_name).toBe('Biswajit Naskar');
    expect(res.body.data.user_id).toBeDefined();
  });

  it('POST /api/v1/auth/register should record user signup and return profile', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: 'newuser@example.com',
        full_name: 'New Test User',
        user_id: 'usr-signup-200',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.email).toBe('newuser@example.com');
    expect(res.body.data.full_name).toBe('New Test User');
    expect(res.body.data.user_id).toBeDefined();
  });
});

