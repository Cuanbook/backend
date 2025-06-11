import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import prisma from '../lib/prisma';
import { authMiddleware } from '../middleware/auth';

const categories = new Hono();

const defaultIncomeCategories = [
  'Penjualan Produk',
  'Investasi Masuk',
  'Biaya Konsultasi',
  'Pendapatan Sewa',
  'Lainnya',
];

const defaultExpenseCategories = [
  'Operasional',
  'Gaji Karyawan',
  'Transportasi',
  'Pembelian Kebutuhan',
  'Lainnya',
];

categories.use('*', authMiddleware);

categories.get('/', async (c) => {
  try {
    const { userId } = c.get('user');
    const type = c.req.query('type') as 'INCOME' | 'EXPENSE' | undefined;

    const existingCategories = await prisma.category.findMany({
      where: { userId },
      select: { id: true }
    });

    if (existingCategories.length === 0) {
      const createCategories = [
        ...defaultIncomeCategories.map(name => ({
          name,
          type: 'INCOME',
          userId
        })),
        ...defaultExpenseCategories.map(name => ({
          name,
          type: 'EXPENSE',
          userId
        }))
      ];

      await prisma.category.createMany({
        data: createCategories
      });
    }

    const where: any = { userId };
    if (type) where.type = type;

    const categories = await prisma.category.findMany({
      where,
      select: {
        id: true,
        name: true,
        type: true,
        description: true,
      },
      orderBy: { name: 'asc' },
    });

    const summary = categories.reduce(
      (acc, curr) => {
        acc[curr.type] = (acc[curr.type] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    return c.json({
      total: categories.length,
      categories,
      summary,
    });
  } catch (error) {
    console.error('Get categories error:', error);
    return c.json({ 
      status: 'error', 
      message: 'Gagal mengambil kategori', 
      code: 500 
    }, 500);
  }
});

categories.get('/income', async (c) => {
  try {
    return c.json({ categories: defaultIncomeCategories });
  } catch (error) {
    return c.json({ status: 'error', message: 'Server error', code: 500 }, 500);
  }
});

categories.get('/expense', async (c) => {
  try {
    return c.json({ categories: defaultExpenseCategories });
  } catch (error) {
    return c.json({ status: 'error', message: 'Server error', code: 500 }, 500);
  }
});

export default categories; 