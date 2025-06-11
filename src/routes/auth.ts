import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import prisma from '../lib/prisma';
import { generateToken } from '../lib/jwt';
import { authMiddleware } from '../middleware/auth';

const auth = new Hono();

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().optional(),
  businessName: z.string().optional(),
  businessOwner: z.string().optional(),
  phoneNumber: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

const profileSchema = z.object({
  name: z.string().optional(),
  businessName: z.string().optional(),
  businessOwner: z.string().optional(),
  phoneNumber: z.string().optional(),
});

auth.post('/register', zValidator('json', registerSchema), async (c) => {
  try {
    const data = c.req.valid('json');
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      return c.json({ status: 'error', message: 'Email sudah terdaftar', code: 400 }, 400);
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);
    const user = await prisma.user.create({
      data: {
        ...data,
        password: hashedPassword,
      },
      select: {
        id: true,
        email: true,
        name: true,
        businessName: true,
        businessOwner: true,
        phoneNumber: true,
      },
    });

    const token = generateToken({ userId: user.id });
    return c.json({ token, user }, 201);
  } catch (error) {
    console.error(error);
    return c.json({ status: 'error', message: 'Server error', code: 500 }, 500);
  }
});

auth.post('/login', zValidator('json', loginSchema), async (c) => {
  try {
    const { email, password } = c.req.valid('json');
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return c.json({ status: 'error', message: 'Email atau password salah', code: 401 }, 401);
    }

    const token = generateToken({ userId: user.id });
    const { password: _, ...userWithoutPassword } = user;
    return c.json({ token, user: userWithoutPassword });
  } catch (error) {
    return c.json({ status: 'error', message: 'Server error', code: 500 }, 500);
  }
});

auth.get('/me', authMiddleware, async (c) => {
  try {
    const { userId } = c.get('user');
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        businessName: true,
        businessOwner: true,
        phoneNumber: true,
      },
    });

    if (!user) {
      return c.json({ status: 'error', message: 'User not found', code: 404 }, 404);
    }

    return c.json(user);
  } catch (error) {
    return c.json({ status: 'error', message: 'Server error', code: 500 }, 500);
  }
});

auth.put('/profile', authMiddleware, zValidator('json', profileSchema), async (c) => {
  try {
    const { userId } = c.get('user');
    const data = c.req.valid('json');

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        email: true,
        name: true,
        businessName: true,
        businessOwner: true,
        phoneNumber: true,
      },
    });

    return c.json(updatedUser);
  } catch (error) {
    return c.json({ status: 'error', message: 'Server error', code: 500 }, 500);
  }
});

export default auth;
