import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import prisma from '../lib/prisma';
import { authMiddleware } from '../middleware/auth';

const reports = new Hono();

reports.use('*', authMiddleware);

reports.get('/monthly', async (c) => {
  try {
    const { userId } = c.get('user');
    const year = parseInt(c.req.query('year') || new Date().getFullYear().toString());
    const month = parseInt(c.req.query('month') || (new Date().getMonth() + 1).toString());

    const report = await prisma.monthlyReport.findUnique({
      where: {
        userId_year_month: {
          userId,
          year,
          month,
        },
      },
    });

    if (!report) {
      // Calculate report if it doesn't exist
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);

      const transactions = await prisma.transaction.findMany({
        where: {
          userId,
          date: {
            gte: startDate,
            lte: endDate,
          },
        },
      });

      const totalIncome = transactions
        .filter((t) => t.type === 'INCOME')
        .reduce((sum, t) => sum + t.amount, 0);

      const totalExpense = transactions
        .filter((t) => t.type === 'EXPENSE')
        .reduce((sum, t) => sum + t.amount, 0);

      const newReport = await prisma.monthlyReport.create({
        data: {
          userId,
          year,
          month,
          totalIncome,
          totalExpense,
        },
      });

      return c.json(newReport);
    }

    return c.json(report);
  } catch (error) {
    return c.json({ status: 'error', message: 'Server error', code: 500 }, 500);
  }
});

reports.get('/income', async (c) => {
  try {
    const { userId } = c.get('user');
    const category = c.req.query('category');

    let where: any = {
      userId,
      type: 'INCOME',
    };

    if (category) {
      const cat = await prisma.category.findFirst({
        where: { name: category, type: 'INCOME', userId },
      });
      if (!cat) {
        return c.json({ total: 0, transactions: [], summary: {} });
      }
      where.categoryId = cat.id;
    }

    const transactions = await prisma.transaction.findMany({
      where,
      include: {
        category: {
          select: {
            name: true,
          },
        },
      },
      orderBy: { date: 'desc' },
    });

    const total = transactions.reduce((sum, t) => sum + t.amount, 0);

    const summary = transactions.reduce((acc, t) => {
      const categoryName = t.category.name;
      acc[categoryName] = (acc[categoryName] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>);

    console.log({ userId, category, where });
    console.log('Transactions:', transactions);

    return c.json({
      total,
      transactions,
      summary,
    });
  } catch (error) {
    return c.json({ status: 'error', message: 'Server error', code: 500 }, 500);
  }
});

reports.get('/expense', async (c) => {
  try {
    const { userId } = c.get('user');
    const category = c.req.query('category');

    let where: any = {
      userId,
      type: 'EXPENSE',
    };

    if (category) {
      const cat = await prisma.category.findFirst({
        where: { name: category, type: 'EXPENSE', userId },
      });
      if (!cat) {
        return c.json({ total: 0, transactions: [], summary: {} });
      }
      where.categoryId = cat.id;
    }

    const transactions = await prisma.transaction.findMany({
      where,
      include: {
        category: {
          select: {
            name: true,
          },
        },
      },
      orderBy: { date: 'desc' },
    });

    const total = transactions.reduce((sum, t) => sum + t.amount, 0);

    const summary = transactions.reduce((acc, t) => {
      const categoryName = t.category.name;
      acc[categoryName] = (acc[categoryName] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>);

    return c.json({
      total,
      transactions,
      summary,
    });
  } catch (error) {
    return c.json({ status: 'error', message: 'Server error', code: 500 }, 500);
  }
});

export default reports; 