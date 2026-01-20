import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';

import { PrismaService } from '../src/common/prisma.service';

describe('Gamification (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    // Clean up
    const email = 'gamification-test@example.com';
    const user = await prisma.user.findUnique({ where: { email } });
    if (user) {
      await prisma.dailyPlan.deleteMany({ where: { userId: user.id } });
      await prisma.habitLog.deleteMany({
        where: { habit: { userId: user.id } },
      });
      await prisma.habit.deleteMany({ where: { userId: user.id } });
      await prisma.userStats.delete({ where: { userId: user.id } });
      await prisma.user.delete({ where: { id: user.id } });
    }
    await app.close();
  });

  it('should award XP when habit is completed', async () => {
    const email = 'gamification-test@example.com';
    // 1. Create User
    // Clean first just in case
    try {
      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        await prisma.dailyPlan.deleteMany({
          where: { userId: existingUser.id },
        });
        await prisma.habitLog.deleteMany({
          where: { habit: { userId: existingUser.id } },
        });
        await prisma.habit.deleteMany({ where: { userId: existingUser.id } });
        await prisma.userStats.deleteMany({
          where: { userId: existingUser.id },
        });
        await prisma.user.delete({ where: { id: existingUser.id } });
      }
    } catch (e) {
      console.error('Cleanup failed', e);
    }

    const user = await prisma.user.create({
      data: {
        email,
        password: 'password',
      },
    });

    // 2. Create Habit
    const habit = await prisma.habit.create({
      data: {
        title: 'Test Habit',
        frequency: 'daily',
        userId: user.id,
      },
    });

    // 3. Complete Habit via API
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    await request(app.getHttpServer())
      .post(`/habits/${habit.id}/complete`)
      .send({ userId: user.id, date: new Date().toISOString() })
      .expect(201);

    // 4. Verify XP (Assumes synchronous event delivery for now)
    // 4. Verify XP (Assumes synchronous event delivery for now)
    const stats = await prisma.userStats.findUnique({
      where: { userId: user.id },
    });

    expect(stats).not.toBeNull();
    if (stats) {
      expect(stats.xp).toBe(10); // Standard XP value
      expect(stats.currentStreak).toBe(1);
    }
  });
});
