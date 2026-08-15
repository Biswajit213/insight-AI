import request from 'supertest';
import { createApp } from '../app';

const app = createApp();

describe('Datasets API', () => {
  it('GET /api/v1/datasets should return user dataset list', async () => {
    const res = await request(app)
      .get('/api/v1/datasets')
      .set('x-test-user-id', 'test-user-123');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.meta).toBeDefined();
  });

  it('GET /api/v1/datasets/non-existent-id should return 404', async () => {
    const res = await request(app)
      .get('/api/v1/datasets/00000000-0000-0000-0000-000000000000')
      .set('x-test-user-id', 'test-user-123');

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('DATASET_NOT_FOUND');
  });
});
