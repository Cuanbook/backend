import { Context, Next } from 'hono';
import { verifyToken } from '../lib/jwt';

export const authMiddleware = async (c: Context, next: Next) => {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({ status: 'error', message: 'Unauthorized', code: 401 }, 401);
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);
    c.set('user', decoded);
    await next();
  } catch (error) {
    return c.json({ status: 'error', message: 'Invalid token', code: 401 }, 401);
  }
}; 