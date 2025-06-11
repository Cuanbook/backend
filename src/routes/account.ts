import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import prisma from '../lib/prisma';
import { authMiddleware } from '../middleware/auth';

const account = new Hono();

const passwordSchema = z.object({
  oldPassword: z.string().min(6),
  newPassword: z.string().min(6),
});

const profileSchema = z.object({
  name: z.string().optional(),
  businessName: z.string().optional(),
  businessOwner: z.string().optional(),
  email: z.string().email().optional(),
  phoneNumber: z.string().optional(),
});

account.use('*', authMiddleware);

account.put('/password', zValidator('json', passwordSchema), async (c) => {
  try {
    const { userId } = c.get('user');
    const { oldPassword, newPassword } = c.req.valid('json');
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return c.json({ status: 'error', message: 'User not found', code: 404 }, 404);
    }
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return c.json({ status: 'error', message: 'Password lama salah', code: 400 }, 400);
    }
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({ where: { id: userId }, data: { password: hashedPassword } });
    return c.json({ status: 'success', message: 'Password berhasil diubah' });
  } catch (error) {
    return c.json({ status: 'error', message: 'Server error', code: 500 }, 500);
  }
});

account.put('/', zValidator('json', profileSchema), async (c) => {
  try {
    const { userId } = c.get('user');
    const data = c.req.valid('json');
    if (data.email) {
      const existing = await prisma.user.findUnique({ where: { email: data.email } });
      if (existing && existing.id !== userId) {
        return c.json({ status: 'error', message: 'Email sudah terdaftar', code: 400 }, 400);
      }
    }
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

account.delete('/', async (c) => {
  try {
    const { userId } = c.get('user');
    await prisma.user.delete({ where: { id: userId } });
    return c.json({ status: 'success', message: 'Akun berhasil dihapus' });
  } catch (error) {
    return c.json({ status: 'error', message: 'Server error', code: 500 }, 500);
  }
});

export default account;
