import { Hono } from 'hono';
import prisma from '../lib/prisma';
import bcrypt from 'bcryptjs';

const mock = new Hono();

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

mock.post('/generate', async (c) => {
  try {
    // Create a mock user
    const email = 'mockuser@email.com';
    const password = await bcrypt.hash('mockpassword', 10);
    let user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          password,
          name: 'Mock User',
          businessName: 'Mock Business',
          businessOwner: 'Mock Owner',
          phoneNumber: '+628123456789',
        },
      });
    }

    // Create categories
    for (const name of defaultIncomeCategories) {
      await prisma.category.upsert({
        where: { name_type_userId: { name, type: 'INCOME', userId: user.id } },
        update: {},
        create: {
          name,
          type: 'INCOME',
          userId: user.id,
        },
      });
    }
    for (const name of defaultExpenseCategories) {
      await prisma.category.upsert({
        where: { name_type_userId: { name, type: 'EXPENSE', userId: user.id } },
        update: {},
        create: {
          name,
          type: 'EXPENSE',
          userId: user.id,
        },
      });
    }

    // Create mock transactions
    const incomeCategories = await prisma.category.findMany({ where: { userId: user.id, type: 'INCOME' } });
    const expenseCategories = await prisma.category.findMany({ where: { userId: user.id, type: 'EXPENSE' } });

    for (let i = 0; i < 5; i++) {
      await prisma.transaction.create({
        data: {
          type: 'INCOME',
          amount: 1000000 + i * 100000,
          date: new Date(Date.now() - i * 86400000),
          name: `Mock Income ${i + 1}`,
          description: `Mock income transaction #${i + 1}`,
          categoryId: incomeCategories[i % incomeCategories.length].id,
          userId: user.id,
        },
      });
      await prisma.transaction.create({
        data: {
          type: 'EXPENSE',
          amount: 500000 + i * 50000,
          date: new Date(Date.now() - i * 86400000),
          name: `Mock Expense ${i + 1}`,
          description: `Mock expense transaction #${i + 1}`,
          categoryId: expenseCategories[i % expenseCategories.length].id,
          userId: user.id,
        },
      });
    }

    return c.json({ status: 'ok', message: 'Mock data generated', user });
  } catch (error) {
    console.error(error);
    return c.json({ status: 'error', message: 'Failed to generate mock data' }, 500);
  }
});

export default mock; 