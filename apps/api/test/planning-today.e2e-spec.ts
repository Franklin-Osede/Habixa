import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/common/prisma.service';
import { configureApp } from './../src/setup/configure-app';

const TEST_EMAIL = 'planning-today-e2e@example.com';
const TEST_PASSWORD = 'Password123!';
const ENDPOINT = '/v1/planning/lifestyle/today';

describe('GET /v1/planning/lifestyle/today (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let accessToken: string;
  let userId: string;

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
    const user = await prisma.user.findUnique({ where: { email: TEST_EMAIL } });
    userId = user!.id;
  });

  beforeEach(async () => {
    // Reset plan-related state before every test so order does not matter.
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
    return request(app.getHttpServer() as never).get(ENDPOINT).expect(401);
  });

  it('returns NOT_STARTED when the user has no lifestyle plan', async () => {
    const res = await request(app.getHttpServer() as never)
      .get(ENDPOINT)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(res.body).toEqual({ status: 'NOT_STARTED' });
  });

  it('returns GENERATING with jobId and progress when a PlanJob is RUNNING', async () => {
    const plan = await prisma.lifestylePlan.create({
      data: {
        userId,
        status: 'PENDING',
        startDate: startOfTodayUtc(),
        source: 'OPENCLAW',
        version: '1',
      },
    });

    const job = await prisma.planJob.create({
      data: {
        userId,
        lifestylePlanId: plan.id,
        status: 'RUNNING',
        progress: 42,
      },
    });

    const res = await request(app.getHttpServer() as never)
      .get(ENDPOINT)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(res.body).toEqual({
      status: 'GENERATING',
      jobId: job.id,
      progress: 42,
    });
  });

  it('returns GENERATING when the LifestylePlan is PENDING but no job exists yet', async () => {
    const plan = await prisma.lifestylePlan.create({
      data: {
        userId,
        status: 'PENDING',
        startDate: startOfTodayUtc(),
        source: 'OPENCLAW',
        version: '1',
      },
    });

    const res = await request(app.getHttpServer() as never)
      .get(ENDPOINT)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(res.body.status).toBe('GENERATING');
    expect(res.body.progress).toBe(0);
    // jobId may be null when no job has been created yet
    expect(res.body).toHaveProperty('jobId');
    expect(plan.status).toBe('PENDING');
  });

  it('returns FAILED with errorMessage and canRetry=true when generation failed', async () => {
    const plan = await prisma.lifestylePlan.create({
      data: {
        userId,
        status: 'FAILED',
        startDate: startOfTodayUtc(),
        source: 'OPENCLAW',
        version: '1',
      },
    });

    await prisma.planJob.create({
      data: {
        userId,
        lifestylePlanId: plan.id,
        status: 'FAILED',
        progress: 30,
        errorMessage: 'OpenClaw timeout',
      },
    });

    const res = await request(app.getHttpServer() as never)
      .get(ENDPOINT)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(res.body).toEqual({
      status: 'FAILED',
      errorMessage: 'OpenClaw timeout',
      canRetry: true,
    });
  });

  it('returns READY with the day plan corresponding to today', async () => {
    const plan = await prisma.lifestylePlan.create({
      data: {
        userId,
        status: 'READY',
        startDate: startOfTodayUtc(),
        source: 'OPENCLAW',
        version: '1',
      },
    });

    const week = await prisma.planWeek.create({
      data: {
        lifestylePlanId: plan.id,
        weekIndex: 1,
        content: buildValidWeekContent() as never,
        schemaVersion: 'plan_week_v1',
        validationScore: 100,
      },
    });

    const res = await request(app.getHttpServer() as never)
      .get(ENDPOINT)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(res.body.status).toBe('READY');
    expect(res.body.lifestylePlanId).toBe(plan.id);
    expect(res.body.planWeekId).toBe(week.id);
    expect(res.body.weekIndex).toBe(1);
    expect(res.body.dayIndex).toBe(1);
    expect(res.body.date).toBe(startOfTodayUtc().toISOString().split('T')[0]);
    expect(res.body.source).toBe('OPENCLAW');
    expect(res.body.day).toBeDefined();
    expect(res.body.day.dayIndex).toBe(1);
    expect(res.body.day.workout.title).toBe('Full Body Base');
    expect(Array.isArray(res.body.day.nutrition.meals)).toBe(true);
    expect(Array.isArray(res.body.completion)).toBe(true);
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

function startOfTodayUtc(): Date {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  return today;
}

function buildValidWeekContent() {
  return {
    weekIndex: 1,
    schemaVersion: 'plan_week_v1',
    days: Array.from({ length: 7 }, (_, index) => {
      const dayIndex = index + 1;
      return {
        id: `week1_day${dayIndex}`,
        dayIndex,
        dailyTip: 'Mantén la consistencia.',
        workout: {
          id: `day${dayIndex}_workout`,
          type: 'workout',
          title: 'Full Body Base',
          blocks: [
            {
              id: `day${dayIndex}_block1`,
              type: 'main',
              exercises: [
                {
                  exerciseId: 'fallback_exercise',
                  sets: 3,
                  reps: '10-12',
                  restSec: 75,
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
              recipeId: 'fallback_recipe',
            },
          ],
        },
        habits: [
          {
            id: `day${dayIndex}_habit1`,
            type: 'habit',
            title: 'Caminar 20 minutos',
            target: '20 min',
          },
        ],
      };
    }),
    rationale: {
      goalMatch: 'Plan base de bajo riesgo.',
      dietMatch: 'Recetas seleccionadas del catálogo.',
      equipmentMatch: 'Ejercicios seleccionados del catálogo.',
    },
  };
}
