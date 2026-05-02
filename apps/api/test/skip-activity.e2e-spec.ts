import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/common/prisma.service';
import { configureApp } from './../src/setup/configure-app';

const TEST_EMAIL = 'skip-activity-e2e@example.com';
const TEST_PASSWORD = 'Password123!';
const ENDPOINT = '/v1/planning/lifestyle/activity/skip';

describe('POST /v1/planning/lifestyle/activity/skip (e2e)', () => {
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

    const user = await prisma.user.findUnique({
      where: { email: TEST_EMAIL },
    });
    userId = user!.id;
  });

  beforeEach(async () => {
    await prisma.dailyUserTask.deleteMany({ where: { userId } });
  });

  afterAll(async () => {
    await cleanupUserData(prisma, TEST_EMAIL);
    await app.close();
  });

  it('returns 401 when no auth token is provided', () => {
    return request(app.getHttpServer() as never)
      .post(ENDPOINT)
      .send({})
      .expect(401);
  });

  it('returns 400 when reason is missing', () => {
    return request(app.getHttpServer() as never)
      .post(ENDPOINT)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        activityId: 'day1_workout',
        activityType: 'workout',
        title: 'Workout',
      })
      .expect(400);
  });

  it('returns 400 on unknown reason', () => {
    return request(app.getHttpServer() as never)
      .post(ENDPOINT)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        activityId: 'day1_workout',
        activityType: 'workout',
        title: 'Workout',
        reason: 'feeling_lazy',
      })
      .expect(400);
  });

  it('persists a skipped DailyUserTask with the chosen reason', async () => {
    const res = await request(app.getHttpServer() as never)
      .post(ENDPOINT)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        activityId: 'day1_workout',
        activityType: 'workout',
        title: 'Pull Day',
        reason: 'illness',
        notes: 'Sick today, will pick up tomorrow.',
      })
      .expect(201);

    expect(res.body.task).toBeDefined();
    expect(res.body.task.isCompleted).toBe(false);
    expect(res.body.task.skipReason).toBe('illness');

    const stored = await prisma.dailyUserTask.findFirst({
      where: { userId, activityId: 'day1_workout' },
    });
    expect(stored).toBeDefined();
    expect(stored!.isCompleted).toBe(false);
    expect(stored!.skipReason).toBe('illness');
    expect(stored!.skipNotes).toBe('Sick today, will pick up tomorrow.');
    expect(stored!.skippedAt).toBeInstanceOf(Date);
  });

  it('is idempotent: skipping twice updates the same row', async () => {
    await request(app.getHttpServer() as never)
      .post(ENDPOINT)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        activityId: 'day2_meal1',
        activityType: 'meal',
        title: 'Breakfast',
        reason: 'time',
      })
      .expect(201);

    await request(app.getHttpServer() as never)
      .post(ENDPOINT)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        activityId: 'day2_meal1',
        activityType: 'meal',
        title: 'Breakfast',
        reason: 'mood',
        notes: 'Ate something else.',
      })
      .expect(201);

    const rows = await prisma.dailyUserTask.findMany({
      where: { userId, activityId: 'day2_meal1' },
    });
    expect(rows).toHaveLength(1);
    expect(rows[0].skipReason).toBe('mood');
    expect(rows[0].skipNotes).toBe('Ate something else.');
  });

  it('clears a previous completion when skipping the same activity', async () => {
    // Pretend the user marked it complete via the existing activity endpoint.
    await prisma.dailyUserTask.create({
      data: {
        userId,
        date: startOfTodayUtc(),
        title: 'Cardio',
        activityId: 'day3_workout',
        activityType: 'workout',
        isCompleted: true,
        completedAt: new Date(),
      },
    });

    await request(app.getHttpServer() as never)
      .post(ENDPOINT)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        activityId: 'day3_workout',
        activityType: 'workout',
        title: 'Cardio',
        reason: 'travel',
      })
      .expect(201);

    const stored = await prisma.dailyUserTask.findFirst({
      where: { userId, activityId: 'day3_workout' },
    });
    expect(stored!.isCompleted).toBe(false);
    expect(stored!.skipReason).toBe('travel');
  });
});

async function cleanupUserData(prisma: PrismaService, email: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return;
  await prisma.dailyUserTask.deleteMany({ where: { userId: user.id } });
  await prisma.user.deleteMany({ where: { id: user.id } });
}

function startOfTodayUtc(): Date {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  return today;
}
