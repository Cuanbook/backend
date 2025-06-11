import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import prisma from '../lib/prisma';
import { authMiddleware } from '../middleware/auth';

const transactions = new Hono();

const transactionSchema = z.object({
  type: z.enum(['INCOME', 'EXPENSE']),
  amount: z.number().positive(),
  date: z.string().datetime(),
  categoryId: z.string(),
  name: z.string(),
  description: z.string().optional(),
});

transactions.use('*', authMiddleware);

transactions.get('/', async (c) => {
  try {
    const { userId } = c.get('user');
    const type = c.req.query('type') as 'INCOME' | 'EXPENSE' | undefined;
    const startDate = c.req.query('startDate');
    const endDate = c.req.query('endDate');

    const where: any = { userId };
    if (type) where.type = type;
    if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    const transactions = await prisma.transaction.findMany({
      where,
      include: {
        category: {
          select: {
            name: true,
            type: true,
          },
        },
      },
      orderBy: { date: 'desc' },
    });

    const summary = transactions.reduce(
      (acc, curr) => {
        acc[curr.type] = (acc[curr.type] || 0) + curr.amount;
        return acc;
      },
      {} as Record<string, number>
    );

    return c.json({
      total: transactions.length,
      transactions,
      summary,
    });
  } catch (error) {
    return c.json({ status: 'error', message: 'Server error', code: 500 }, 500);
  }
});

transactions.post('/', zValidator('json', transactionSchema), async (c) => {
  try {
    const { userId } = c.get('user');
    const data = c.req.valid('json');

    const category = await prisma.category.findFirst({
      where: {
        id: data.categoryId,
        userId,
      },
    });

    if (!category) {
      return c.json({ status: 'error', message: 'Category not found', code: 404 }, 404);
    }

    if (category.type.toUpperCase() !== data.type) {
      return c.json(
        {
          status: 'error',
          message: 'Category type does not match transaction type',
          code: 400,
        },
        400
      );
    }

    const transaction = await prisma.transaction.create({
      data: {
        ...data,
        userId,
        date: new Date(data.date),
      },
      include: {
        category: {
          select: {
            name: true,
            type: true,
          },
        },
      },
    });

    return c.json(transaction, 201);
  } catch (error) {
    return c.json({ status: 'error', message: 'Server error', code: 500 }, 500);
  }
});

export default transactions; 