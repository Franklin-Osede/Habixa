/* eslint-disable @typescript-eslint/no-floating-promises */
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('\n=== Users (last 5) ===');
  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5,
    select: { id: true, email: true, createdAt: true },
  });
  console.table(users);

  console.log('\n=== LifestylePlan (last 10) ===');
  const plans = await prisma.lifestylePlan.findMany({
    orderBy: { createdAt: 'desc' },
    take: 10,
    select: {
      id: true,
      userId: true,
      status: true,
      startDate: true,
      source: true,
      version: true,
      createdAt: true,
    },
  });
  console.table(plans);

  console.log('\n=== PlanJob (last 10) ===');
  const jobs = await prisma.planJob.findMany({
    orderBy: { createdAt: 'desc' },
    take: 10,
    select: {
      id: true,
      userId: true,
      lifestylePlanId: true,
      status: true,
      progress: true,
      errorMessage: true,
      createdAt: true,
    },
  });
  console.table(jobs);

  console.log('\n=== PlanWeek summary ===');
  const weeks = await prisma.planWeek.findMany({
    select: {
      lifestylePlanId: true,
      weekIndex: true,
      schemaVersion: true,
      validationScore: true,
      createdAt: true,
    },
  });
  console.table(weeks);

  console.log('\n=== Plan status counts ===');
  const grouped = await prisma.lifestylePlan.groupBy({
    by: ['status'],
    _count: { _all: true },
  });
  console.table(grouped.map((g) => ({ status: g.status, count: g._count._all })));
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
