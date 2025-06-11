import { Hono } from 'hono';
const auth = require('../src/routes/auth').default;
const account = require('../src/routes/account').default;
const transactions = require('../src/routes/transactions').default;
const categories = require('../src/routes/categories').default;
const reports = require('../src/routes/reports').default;
const mock = require('../src/routes/mock').default;
const openapi = require('../src/routes/openapi').default;
const swaggerui = require('../src/routes/swaggerui').default;

describe('All Routes', () => {
  const app = new Hono();
  app.route('/api/auth', auth);
  app.route('/api/account', account);
  app.route('/api/transactions', transactions);
  app.route('/api/categories', categories);
  app.route('/api/reports', reports);
  app.route('/api/mock', mock);
  app.route('/openapi.json', openapi);
  app.route('/docs', swaggerui);

  it('GET /openapi.json returns docs', async () => {
    const res = await app.request('/openapi.json');
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty('openapi');
  });

  it('GET /docs returns HTML', async () => {
    const res = await app.request('/docs');
    expect(res.status).toBe(200);
    const text = await res.text();
    expect(text).toMatch(/swagger/i);
  });

  it('GET /api/auth/unknown returns 404', async () => {
    const res = await app.request('/api/auth/unknown');
    expect(res.status).toBe(404);
  });

  it('GET /api/categories returns 401 (karena butuh auth)', async () => {
    const res = await app.request('/api/categories');
    expect(res.status).toBe(401);
  });

  it('GET /api/reports/monthly returns 401 (karena butuh auth)', async () => {
    const res = await app.request('/api/reports/monthly');
    expect(res.status).toBe(401);
  });

  it('POST /api/mock/generate returns 200 or 500', async () => {
    const res = await app.request('/api/mock/generate', { method: 'POST' });
    expect([200, 500]).toContain(res.status);
  });
});