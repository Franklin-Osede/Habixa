/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/common/prisma.service';
import { configureApp } from './../src/setup/configure-app';

const TEST_EMAIL = 'me-adherence-e2e@example.com';
const TEST_PASSWORD = 'Password123!';
const ENDPOINT = '/v1/me/adherence';

describe('GET /v1/me/adherence (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let accessToken: string;
  let userId: string;
  let planWeekId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    configureApp(app);
    await app.init();

    prisma = app.get<PrismaService>(PrismaService);
    await cleanupUserData(prisma, TEST_EMAIL);

    await request(app.getHttpServer() as never)
      .post('/v1/identity/register')
      .send({ email: TEST_EMAIL, password: TEST_PASSWORD });

    const loginRes = await request(app.getHttpServer() as never)
      .post('/v1/auth/login')
      .send({ email: TEST_EMAIL, password: TEST_PASSWORD });
    accessToken = loginRes.body.accessToken;

    const user = await prisma.user.findUnique({
      where: { email: TEST_EMAIL },
    });
    userId = user!.id;
  });

  beforeEach(async () => {
    await prisma.dailyUserTask.deleteMany({ where: { userId } });
    await prisma.planJob.deleteMany({ where: { userId } });
    await prisma.planWeek.deleteMany({
      where: { lifestylePlan: { userId } },
    });
    await prisma.lifestylePlan.deleteMany({ where: { userId } });
  });

  afterAll(async () => {
    await cleanupUserData(prisma, TEST_EMAIL);
    await app.close();
  });

  it('returns 401 when no auth token is provided', () => {
    return request(app.getHttpServer() as never)
      .get(ENDPOINT)
      .expect(401);
  });

  it('returns zero adherence with windowDays=7 when the user has no plan', async () => {
    const res = await request(app.getHttpServer() as never)
      .get(ENDPOINT)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(res.body.windowDays).toBe(7);
    expect(res.body.streakDays).toBe(0);
    expect(res.body.totals).toEqual({
      completed: 0,
      skipped: 0,
      scheduled: 0,
    });
    expect(res.body.consistency.overallPct).toBe(0);
  });

  it('returns full week adherence (100%) when every scheduled activity is marked complete', async () => {
    await seedPlanForUser(prisma, userId);
    planWeekId = await firstPlanWeekId(prisma, userId);

    // Seed completed tasks for every activity across the 7-day window.
    const today = startOfTodayUtc();
    for (let offset = 0; offset < 7; offset++) {
      const date = addDaysUtc(today, -offset);
      const dayIndex = ((6 - offset) % 7) + 1;
      const ids = [
        { activityId: `day${dayIndex}_workout`, type: 'workout' },
        { activityId: `day${dayIndex}_meal1`, type: 'meal' },
        { activityId: `day${dayIndex}_meal2`, type: 'meal' },
        { activityId: `day${dayIndex}_habit1`, type: 'habit' },
      ];
      for (const item of ids) {
        await prisma.dailyUserTask.create({
          data: {
            userId,
            date,
            title: item.activityId,
            activityId: item.activityId,
            activityType: item.type,
            planWeekId,
            isCompleted: true,
            completedAt: new Date(),
          },
        });
      }
    }

    const res = await request(app.getHttpServer() as never)
      .get(ENDPOINT)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(res.body.totals.completed).toBe(28);
    expect(res.body.totals.scheduled).toBe(28);
    expect(res.body.consistency.overallPct).toBe(100);
    expect(res.body.streakDays).toBe(7);
  });

  it('treats skipped tasks separately and does not break streak', async () => {
    await seedPlanForUser(prisma, userId);
    planWeekId = await firstPlanWeekId(prisma, userId);

    const today = startOfTodayUtc();
    // Today: skipped only (no completions). Yesterday + day before: completed.
    await prisma.dailyUserTask.create({
      data: {
        userId,
        date: today,
        title: 'day7_workout',
        activityId: 'day7_workout',
        activityType: 'workout',
        planWeekId,
        isCompleted: false,
        skipReason: 'time',
        skippedAt: new Date(),
      },
    });
    for (let offset = 1; offset <= 2; offset++) {
      const date = addDaysUtc(today, -offset);
      const dayIndex = 7 - offset;
      await prisma.dailyUserTask.create({
        data: {
          userId,
          date,
          title: `day${dayIndex}_workout`,
          activityId: `day${dayIndex}_workout`,
          activityType: 'workout',
          planWeekId,
          isCompleted: true,
          completedAt: new Date(),
        },
      });
    }

    const res = await request(app.getHttpServer() as never)
      .get(ENDPOINT)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(res.body.totals.completed).toBe(2);
    expect(res.body.totals.skipped).toBe(1);
    expect(res.body.streakDays).toBe(3);
  });

  it('exposes per-category consistency', async () => {
    await seedPlanForUser(prisma, userId);
    planWeekId = await firstPlanWeekId(prisma, userId);

    const today = startOfTodayUtc();
    // Complete 1 workout, 4 meals, 0 habits across the week
    await prisma.dailyUserTask.create({
      data: {
        userId,
        date: today,
        title: 'day7_workout',
        activityId: 'day7_workout',
        activityType: 'workout',
        planWeekId,
        isCompleted: true,
        completedAt: new Date(),
      },
    });
    for (let i = 0; i < 4; i++) {
      const date = addDaysUtc(today, -i);
      await prisma.dailyUserTask.create({
        data: {
          userId,
          date,
          title: `day${7 - i}_meal1`,
          activityId: `day${7 - i}_meal1`,
          activityType: 'meal',
          planWeekId,
          isCompleted: true,
          completedAt: new Date(),
        },
      });
    }

    const res = await request(app.getHttpServer() as never)
      .get(ENDPOINT)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(res.body.consistency.workoutPct).toBe(14); // 1/7
    expect(res.body.consistency.nutritionPct).toBe(29); // 4/14
    expect(res.body.consistency.habitsPct).toBe(0);
  });
});

async function cleanupUserData(prisma: PrismaService, email: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return;
  await prisma.dailyUserTask.deleteMany({ where: { userId: user.id } });
  await prisma.planJob.deleteMany({ where: { userId: user.id } });
  await prisma.planWeek.deleteMany({
    where: { lifestylePlan: { userId: user.id } },
  });
  await prisma.lifestylePlan.deleteMany({ where: { userId: user.id } });
  await prisma.user.deleteMany({ where: { id: user.id } });
}

async function seedPlanForUser(prisma: PrismaService, userId: string) {
  const plan = await prisma.lifestylePlan.create({
    data: {
      userId,
      status: 'READY',
      startDate: startOfTodayUtc(),
      source: 'OPENCLAW',
      version: '1',
    },
  });
  await prisma.planWeek.create({
    data: {
      lifestylePlanId: plan.id,
      weekIndex: 1,
      content: buildPlanContent() as never,
      schemaVersion: 'plan_week_v1',
      validationScore: 100,
    },
  });
}

async function firstPlanWeekId(
  prisma: PrismaService,
  userId: string,
): Promise<string> {
  const week = await prisma.planWeek.findFirst({
    where: { lifestylePlan: { userId } },
    orderBy: { weekIndex: 'asc' },
  });
  return week!.id;
}

function startOfTodayUtc(): Date {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  return today;
}

function addDaysUtc(date: Date, days: number): Date {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

function buildPlanContent() {
  return {
    weekIndex: 1,
    schemaVersion: 'plan_week_v1',
    days: Array.from({ length: 7 }, (_, i) => {
      const dayIndex = i + 1;
      return {
        id: `week1_day${dayIndex}`,
        dayIndex,
        dailyTip: 'tip',
        workout: {
          id: `day${dayIndex}_workout`,
          type: 'workout',
          title: 'X',
          blocks: [
            {
              id: `day${dayIndex}_block1`,
              type: 'main',
              exercises: [
                {
                  exerciseId: 'fallback_exercise',
                  sets: 3,
                  reps: '10',
                  restSec: 60,
                },
              ],
            },
          ],
        },
        nutrition: {
          id: `day${dayIndex}_nutrition`,
          type: 'nutrition',
          totalKcalTarget: 2000,
          meals: [
            {
              id: `day${dayIndex}_meal1`,
              type: 'meal',
              mealType: 'breakfast',
              recipeId: 'r1',
            },
            {
              id: `day${dayIndex}_meal2`,
              type: 'meal',
              mealType: 'lunch',
              recipeId: 'r2',
            },
          ],
        },
        habits: [
          {
            id: `day${dayIndex}_habit1`,
            type: 'habit',
            title: 'water',
          },
        ],
      };
    }),
  };
}
