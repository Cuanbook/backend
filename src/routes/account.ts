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

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return c.json({ status: 'error', message: 'User not found', code: 404 }, 404);
    }

    if (data.email && data.email !== user.email) {
      const existingUser = await prisma.user.findUnique({ 
        where: { 
          email: data.email,
          NOT: { id: userId }
        } 
      });
      if (existingUser) {
        return c.json({ 
          status: 'error', 
          message: 'Email sudah terdaftar', 
          code: 400 
        }, 400);
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        name: data.name !== undefined ? data.name : undefined,
        email: data.email !== undefined ? data.email : undefined,
        businessName: data.businessName !== undefined ? data.businessName : undefined,
        businessOwner: data.businessOwner !== undefined ? data.businessOwner : undefined,
        phoneNumber: data.phoneNumber !== undefined ? data.phoneNumber : undefined
      },
      select: {
        id: true,
        email: true,
        name: true,
        businessName: true,
        businessOwner: true,
        phoneNumber: true
      }
    });

    return c.json(updatedUser);
  } catch (error) {
    console.error('Update profile error:', error);
    return c.json({ 
      status: 'error', 
      message: 'Gagal mengupdate profil, silakan coba lagi', 
      code: 500 
    }, 500);
  }
});

account.delete('/', async (c) => {
  try {
    const { userId } = c.get('user');
    
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return c.json({ status: 'error', message: 'User not found', code: 404 }, 404);
    }

    await prisma.$transaction([
      prisma.transaction.deleteMany({ where: { userId } }),
      prisma.category.deleteMany({ where: { userId } }),
      prisma.monthlyReport.deleteMany({ where: { userId } }),
      prisma.user.delete({ where: { id: userId } })
    ]);

    return c.json({ status: 'success', message: 'Akun berhasil dihapus' });
  } catch (error) {
    console.error('Delete account error:', error);
    return c.json({ 
      status: 'error', 
      message: 'Gagal menghapus akun, silakan coba lagi', 
      code: 500 
    }, 500);
  }
});

export default account;
