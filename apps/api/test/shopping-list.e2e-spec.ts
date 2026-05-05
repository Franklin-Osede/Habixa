/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/common/prisma.service';
import { configureApp } from './../src/setup/configure-app';

const TEST_EMAIL = 'shopping-list-e2e@example.com';
const TEST_PASSWORD = 'Password123!';
const ENDPOINT = '/v1/planning/lifestyle/shopping-list';

describe('GET /v1/planning/lifestyle/shopping-list (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let accessToken: string;
  let userId: string;
  let chickenId: string;
  let riceId: string;
  let oilId: string;
  let recipeId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    configureApp(app);
    await app.init();

    prisma = app.get<PrismaService>(PrismaService);

    await cleanupUserData(prisma, TEST_EMAIL);
    await cleanupTestRecipe(prisma);

    await request(app.getHttpServer() as never)
      .post('/v1/identity/register')
      .send({ email: TEST_EMAIL, password: TEST_PASSWORD });

    const loginRes = await request(app.getHttpServer() as never)
      .post('/v1/auth/login')
      .send({ email: TEST_EMAIL, password: TEST_PASSWORD });

    accessToken = loginRes.body.accessToken;
    const user = await prisma.user.findUnique({ where: { email: TEST_EMAIL } });
    userId = user!.id;

    const chicken = await prisma.ingredient.create({
      data: {
        name: 'Shopping Chicken',
        category: 'Protein',
        caloriesPer100g: 165,
      },
    });
    const rice = await prisma.ingredient.create({
      data: { name: 'Shopping Rice', category: 'Carb', caloriesPer100g: 130 },
    });
    const oil = await prisma.ingredient.create({
      data: { name: 'Shopping Oil', category: 'Fat', caloriesPer100g: 884 },
    });
    chickenId = chicken.id;
    riceId = rice.id;
    oilId = oil.id;

    const recipe = await prisma.recipe.create({
      data: {
        title: 'Shopping Chicken Bowl',
        instructions: '1. Cook. 2. Eat.',
        calories: 500,
        protein: 45,
        carbs: 50,
        fats: 10,
        ingredients: {
          create: [
            { ingredientId: chicken.id, quantityGrams: 200, unit: 'g' },
            { ingredientId: rice.id, quantityGrams: 60, unit: 'g' },
            { ingredientId: oil.id, quantityGrams: 10, unit: 'ml' },
          ],
        },
      },
    });
    recipeId = recipe.id;
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
    await cleanupTestRecipe(prisma);
    await app.close();
  });

  it('returns 401 when no auth token is provided', () => {
    return request(app.getHttpServer() as never)
      .get(ENDPOINT)
      .expect(401);
  });

  it('returns 404 when the user has no READY lifestyle plan', () => {
    return request(app.getHttpServer() as never)
      .get(ENDPOINT)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(404);
  });

  it('aggregates ingredients across all 7 days of the current week', async () => {
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
        content: buildWeekUsingRecipe(recipeId) as never,
        schemaVersion: 'plan_week_v1',
        validationScore: 100,
      },
    });

    const res = await request(app.getHttpServer() as never)
      .get(ENDPOINT)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(res.body.range).toBe('week');
    expect(Array.isArray(res.body.items)).toBe(true);

    // The week has 7 days × 1 meal/day all using the same recipe.
    // chicken: 200g × 7 = 1400g, rice: 60g × 7 = 420g, oil: 10ml × 7 = 70ml.
    const items: any[] = res.body.items;
    const chickenItem = items.find((i) => i.ingredient.id === chickenId);
    const riceItem = items.find((i) => i.ingredient.id === riceId);
    const oilItem = items.find((i) => i.ingredient.id === oilId);

    expect(chickenItem.quantityTotal).toBe(1400);
    expect(chickenItem.unit).toBe('g');
    expect(chickenItem.usageCount).toBe(7);

    expect(riceItem.quantityTotal).toBe(420);
    expect(oilItem.quantityTotal).toBe(70);
    expect(oilItem.unit).toBe('ml');
  });

  it('returns category-ordered items (Protein -> Carb -> Fat)', async () => {
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
        content: buildWeekUsingRecipe(recipeId) as never,
        schemaVersion: 'plan_week_v1',
        validationScore: 100,
      },
    });

    const res = await request(app.getHttpServer() as never)
      .get(ENDPOINT)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    const categories = (res.body.items as any[]).map(
      (i) => i.ingredient.category,
    );
    expect(categories).toEqual(['Protein', 'Carb', 'Fat']);
  });

  it('skips meals whose recipeId does not exist (no crash)', async () => {
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
        content: buildWeekUsingRecipe('non_existent_id') as never,
        schemaVersion: 'plan_week_v1',
        validationScore: 100,
      },
    });

    const res = await request(app.getHttpServer() as never)
      .get(ENDPOINT)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(res.body.items).toEqual([]);
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

async function cleanupTestRecipe(prisma: PrismaService) {
  const recipes = await prisma.recipe.findMany({
    where: { title: 'Shopping Chicken Bowl' },
  });
  for (const r of recipes) {
    await prisma.recipeIngredient.deleteMany({ where: { recipeId: r.id } });
    await prisma.recipe.delete({ where: { id: r.id } });
  }
  await prisma.ingredient.deleteMany({
    where: {
      name: { in: ['Shopping Chicken', 'Shopping Rice', 'Shopping Oil'] },
    },
  });
}

function startOfTodayUtc(): Date {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  return today;
}

function buildWeekUsingRecipe(recipeId: string) {
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
              recipeId,
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
