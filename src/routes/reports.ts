import { Hono } from 'hono';
import { Context } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import prisma from '../lib/prisma';
import { authMiddleware } from '../middleware/auth';

const reports = new Hono();

reports.use('*', authMiddleware);

interface CategoryAnalysis {
  categoryId: string;
  categoryName: string;
  type: "INCOME" | "EXPENSE";
  amount: number;
  percentage: number;
}

// Helper function to calculate category analysis
const calculateCategoryAnalysis = (transactions: any[]) => {
  // Calculate category summaries
  const categoryAnalysis = transactions.reduce((acc, t) => {
    const categoryId = t.category.id;
    const existingCategory = acc.find((c: CategoryAnalysis) => c.categoryId === categoryId);
    
    if (existingCategory) {
      existingCategory.amount += t.amount;
    } else {
      acc.push({
        categoryId,
        categoryName: t.category.name,
        type: t.type,
        amount: t.amount,
        percentage: 0, // Will be calculated after
      });
    }
    
    return acc;
  }, [] as CategoryAnalysis[]);

  // Calculate totals for percentage calculation
  const totalIncome = transactions
    .filter(t => t.type === 'INCOME')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = transactions
    .filter(t => t.type === 'EXPENSE')
    .reduce((sum, t) => sum + t.amount, 0);

  // Calculate percentages for each category
  categoryAnalysis.forEach((category: CategoryAnalysis) => {
    const total = category.type === 'INCOME' ? totalIncome : totalExpense;
    category.percentage = total === 0 ? 0 : Math.round((category.amount / total) * 100);
  });

  // Sort categories by amount and get top 5 for each type
  return {
    income: categoryAnalysis
      .filter((c: CategoryAnalysis) => c.type === 'INCOME')
      .sort((a: CategoryAnalysis, b: CategoryAnalysis) => b.amount - a.amount)
      .slice(0, 5),
    expense: categoryAnalysis
      .filter((c: CategoryAnalysis) => c.type === 'EXPENSE')
      .sort((a: CategoryAnalysis, b: CategoryAnalysis) => b.amount - a.amount)
      .slice(0, 5),
  };
};

reports.get('/monthly', async (c: Context) => {
  try {
    const { userId } = c.get('user');
    const year = parseInt(c.req.query('year') || new Date().getFullYear().toString());
    const month = parseInt(c.req.query('month') || (new Date().getMonth() + 1).toString());

    // Get current month's data
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    // Get previous month's data for trend calculation
    const prevStartDate = new Date(year, month - 2, 1);
    const prevEndDate = new Date(year, month - 1, 0);

    // Get current month transactions
    const transactions = await prisma.transaction.findMany({
      where: {
        userId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    // Get previous month transactions for trend calculation
    const prevTransactions = await prisma.transaction.findMany({
      where: {
        userId,
        date: {
          gte: prevStartDate,
          lte: prevEndDate,
        },
      },
    });

    // Calculate totals
    const totalIncome = transactions
      .filter((t) => t.type === 'INCOME')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpense = transactions
      .filter((t) => t.type === 'EXPENSE')
      .reduce((sum, t) => sum + t.amount, 0);

    const prevTotalIncome = prevTransactions
      .filter((t) => t.type === 'INCOME')
      .reduce((sum, t) => sum + t.amount, 0);

    const prevTotalExpense = prevTransactions
      .filter((t) => t.type === 'EXPENSE')
      .reduce((sum, t) => sum + t.amount, 0);

    // Calculate trends
    const incomeTrend = prevTotalIncome === 0 
      ? 0 
      : Math.round(((totalIncome - prevTotalIncome) / prevTotalIncome) * 100);

    const expenseTrend = prevTotalExpense === 0 
      ? 0 
      : Math.round(((totalExpense - prevTotalExpense) / prevTotalExpense) * 100);

    // Calculate monthly chart data
    const chartData = await Promise.all(Array.from({ length: 12 }, async (_, i) => {
      const monthData = await prisma.transaction.aggregate({
        where: {
          userId,
          createdAt: {
            gte: new Date(year, i, 1),
            lt: new Date(year, i + 1, 1)
          }
        },
        _sum: {
          amount: true
        }
      });

      return {
        month: (i + 1).toString(),
        value: monthData._sum.amount || 0
      };
    }));

    // Create or update monthly report
    const report = await prisma.monthlyReport.upsert({
      where: {
        userId_year_month: {
          userId,
          year,
          month,
        },
      },
      create: {
        userId,
        year,
        month,
        totalIncome,
        totalExpense,
      },
      update: {
        totalIncome,
        totalExpense,
      },
    });

    return c.json({
      ...report,
      incomeTrend,
      expenseTrend,
      chartData,
      percentageChange: prevTotalIncome === 0 || prevTotalExpense === 0
        ? 0
        : Math.round(((totalIncome - totalExpense - (prevTotalIncome - prevTotalExpense)) / Math.abs(prevTotalIncome - prevTotalExpense)) * 100),
    });
  } catch (error) {
    console.error('Monthly report error:', error);
    return c.json({ status: 'error', message: 'Server error', code: 500 }, 500);
  }
});

// Daily category analysis
reports.get('/daily/categories', async (c) => {
  try {
    const { userId } = c.get('user');
    const date = c.req.query('date') || new Date().toISOString().slice(0, 10);

    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);

    const transactions = await prisma.transaction.findMany({
      where: {
        userId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
      },
    });

    const analysis = calculateCategoryAnalysis(transactions);

    return c.json(analysis);
  } catch (error) {
    console.error('Daily category analysis error:', error);
    return c.json({ status: 'error', message: 'Server error', code: 500 }, 500);
  }
});

// Weekly category analysis
reports.get('/weekly/categories', async (c) => {
  try {
    const { userId } = c.get('user');
    const year = parseInt(c.req.query('year') || new Date().getFullYear().toString());
    const week = parseInt(c.req.query('week') || '1');

    // Calculate start and end dates for the week
    const startDate = new Date(year, 0, 1 + (week - 1) * 7);
    const endDate = new Date(year, 0, 7 + (week - 1) * 7);

    const transactions = await prisma.transaction.findMany({
      where: {
        userId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
      },
    });

    const analysis = calculateCategoryAnalysis(transactions);

    return c.json(analysis);
  } catch (error) {
    console.error('Weekly category analysis error:', error);
    return c.json({ status: 'error', message: 'Server error', code: 500 }, 500);
  }
});

// Monthly category analysis
reports.get('/monthly/categories', async (c) => {
  try {
    const { userId } = c.get('user');
    const year = parseInt(c.req.query('year') || new Date().getFullYear().toString());
    const month = parseInt(c.req.query('month') || (new Date().getMonth() + 1).toString());

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
      include: {
        category: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
      },
    });

    const analysis = calculateCategoryAnalysis(transactions);

    return c.json(analysis);
  } catch (error) {
    console.error('Monthly category analysis error:', error);
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

reports.get('/daily', async (c) => {
  try {
    const { userId } = c.get('user');
    const dateStr = c.req.query('date') || new Date().toISOString().split('T')[0];
    const date = new Date(dateStr);
    
    // Set time to start of day
    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);
    
    // Set time to end of day
    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);

    const transactions = await prisma.transaction.findMany({
      where: {
        userId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { date: 'desc' },
    });

    // Calculate totals
    const totalIncome = transactions
      .filter((t) => t.type === 'INCOME')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpense = transactions
      .filter((t) => t.type === 'EXPENSE')
      .reduce((sum, t) => sum + t.amount, 0);

    // Group transactions by hour for the chart
    const hourlyData = Array.from({ length: 24 }, (_, hour) => {
      const hourTransactions = transactions.filter(t => t.date.getHours() === hour);
      return {
        hour,
        income: hourTransactions
          .filter(t => t.type === 'INCOME')
          .reduce((sum, t) => sum + t.amount, 0),
        expense: hourTransactions
          .filter(t => t.type === 'EXPENSE')
          .reduce((sum, t) => sum + t.amount, 0)
      };
    });

    return c.json({
      date: dateStr,
      totalIncome,
      totalExpense,
      balance: totalIncome - totalExpense,
      chart: {
        labels: hourlyData.map(d => `${d.hour}:00`),
        datasets: [
          {
            label: 'Pemasukan',
            data: hourlyData.map(d => d.income)
          },
          {
            label: 'Pengeluaran',
            data: hourlyData.map(d => d.expense)
          }
        ]
      },
      transactions: transactions.map(t => ({
        id: t.id,
        type: t.type,
        amount: t.amount,
        name: t.name,
        date: t.date
      }))
    });
  } catch (error) {
    console.error('Daily report error:', error);
    return c.json({ status: 'error', message: 'Gagal mengambil laporan harian', code: 500 }, 500);
  }
});

reports.get('/weekly', async (c) => {
  try {
    const { userId } = c.get('user');
    const dateStr = c.req.query('date') || new Date().toISOString().split('T')[0];
    const date = new Date(dateStr);
    
    // Get start of week (Sunday)
    const startDate = new Date(date);
    startDate.setDate(date.getDate() - date.getDay());
    startDate.setHours(0, 0, 0, 0);
    
    // Get end of week (Saturday)
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6);
    endDate.setHours(23, 59, 59, 999);

    const transactions = await prisma.transaction.findMany({
      where: {
        userId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { date: 'desc' },
    });

    // Day names in Indonesian
    const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

    // Group transactions by day for the chart
    const dailyData = Array.from({ length: 7 }, (_, index) => {
      const day = new Date(startDate);
      day.setDate(startDate.getDate() + index);
      const dayStr = day.toISOString().split('T')[0];
      
      const dayTransactions = transactions.filter(t => 
        t.date.toISOString().split('T')[0] === dayStr
      );

      return {
        date: dayStr,
        dayName: dayNames[index],
        income: dayTransactions
          .filter(t => t.type === 'INCOME')
          .reduce((sum, t) => sum + t.amount, 0),
        expense: dayTransactions
          .filter(t => t.type === 'EXPENSE')
          .reduce((sum, t) => sum + t.amount, 0)
      };
    });

    const totalIncome = transactions
      .filter((t) => t.type === 'INCOME')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpense = transactions
      .filter((t) => t.type === 'EXPENSE')
      .reduce((sum, t) => sum + t.amount, 0);

    return c.json({
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      totalIncome,
      totalExpense,
      balance: totalIncome - totalExpense,
      chart: {
        labels: dailyData.map(d => d.dayName),
        datasets: [
          {
            label: 'Pemasukan',
            data: dailyData.map(d => d.income)
          },
          {
            label: 'Pengeluaran',
            data: dailyData.map(d => d.expense)
          }
        ]
      },
      transactions: transactions.map(t => ({
        id: t.id,
        type: t.type,
        amount: t.amount,
        name: t.name,
        date: t.date
      }))
    });
  } catch (error) {
    console.error('Weekly report error:', error);
    return c.json({ status: 'error', message: 'Gagal mengambil laporan mingguan', code: 500 }, 500);
  }
});

export default reports; 