const { Hono } = require('hono');
const { authMiddleware } = require('../src/middleware/auth');
// @ts-ignore
// Mock JWT verifyToken
jest.mock('../src/lib/jwt', () => ({
  verifyToken: (token: any) => {
    if (token === 'validtoken') return { userId: '123' };
    throw new Error('Invalid token');
  },
}));
// @ts-ignore
describe('authMiddleware', () => {
  const app = new Hono();
  app.use(authMiddleware);
  app.get('/protected', (c: any) => c.json({ ok: true }));
// @ts-ignore
  it('should reject if no Authorization header', async () => {
    const res = await app.request('/protected');
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.message).toMatch(/Unauthorized/i);
  });

  it('should reject if token invalid', async () => {
    const res = await app.request('/protected', {
      headers: { Authorization: 'Bearer invalidtoken' },
    });
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.message).toMatch(/Invalid token/i);
  });

  it('should allow if token valid', async () => {
    const res = await app.request('/protected', {
      headers: { Authorization: 'Bearer validtoken' },
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
  });
});
