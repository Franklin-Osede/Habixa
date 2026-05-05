/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/common/prisma.service';
import { configureApp } from './../src/setup/configure-app';

const TEST_EMAIL = 'planning-today-detailed-e2e@example.com';
const TEST_PASSWORD = 'Password123!';
const ENDPOINT = '/v1/planning/lifestyle/today/detailed';

describe('GET /v1/planning/lifestyle/today/detailed (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let accessToken: string;
  let userId: string;
  // Test fixtures (seeded once)
  let chickenId: string;
  let riceId: string;
  let recipeId: string;
  let squatExerciseId: string;

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

    // Seed a recipe with two ingredients in known quantities.
    const chicken = await prisma.ingredient.create({
      data: {
        name: 'Test Chicken',
        category: 'Protein',
        caloriesPer100g: 165,
      },
    });
    const rice = await prisma.ingredient.create({
      data: { name: 'Test Rice', category: 'Carb', caloriesPer100g: 130 },
    });
    chickenId = chicken.id;
    riceId = rice.id;

    const recipe = await prisma.recipe.create({
      data: {
        title: 'Test Chicken & Rice',
        instructions: '1. Cook chicken. 2. Boil rice. 3. Serve.',
        calories: 500,
        protein: 45,
        carbs: 50,
        fats: 10,
        ingredients: {
          create: [
            { ingredientId: chicken.id, quantityGrams: 200, unit: 'g' },
            { ingredientId: rice.id, quantityGrams: 60, unit: 'g' },
          ],
        },
      },
    });
    recipeId = recipe.id;

    const squat = await prisma.exercise.create({
      data: {
        name: 'Test Goblet Squat',
        description: 'Squat down holding a dumbbell vertically against chest.',
        expertCues: 'Keep elbows tucked, drive through heels.',
        difficulty: 'Beginner',
        muscleGroup: 'Legs',
        equipment: 'Dumbbell',
        movementPattern: 'Squat',
        jointStress: 'Knee, Hip',
      },
    });
    squatExerciseId = squat.id;
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
    await prisma.exercise.deleteMany({
      where: { name: 'Test Goblet Squat' },
    });
    await app.close();
  });

  it('returns 401 when no auth token is provided', () => {
    return request(app.getHttpServer() as never)
      .get(ENDPOINT)
      .expect(401);
  });

  it('returns NOT_STARTED when the user has no lifestyle plan', async () => {
    const res = await request(app.getHttpServer() as never)
      .get(ENDPOINT)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(res.body).toEqual({ status: 'NOT_STARTED' });
  });

  it('returns GENERATING when a plan job is RUNNING', async () => {
    const plan = await prisma.lifestylePlan.create({
      data: {
        userId,
        status: 'PENDING',
        startDate: startOfTodayUtc(),
        source: 'OPENCLAW',
        version: '1',
      },
    });
    await prisma.planJob.create({
      data: {
        userId,
        lifestylePlanId: plan.id,
        status: 'RUNNING',
        progress: 55,
      },
    });

    const res = await request(app.getHttpServer() as never)
      .get(ENDPOINT)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(res.body.status).toBe('GENERATING');
    expect(res.body.progress).toBe(55);
  });

  it('returns FAILED with errorMessage when the plan failed', async () => {
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

  it('returns READY with hydrated recipe and ingredients on each meal', async () => {
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
        content: buildValidWeekContent(recipeId) as never,
        schemaVersion: 'plan_week_v1',
        validationScore: 100,
      },
    });

    const res = await request(app.getHttpServer() as never)
      .get(ENDPOINT)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(res.body.status).toBe('READY');
    expect(res.body.dayIndex).toBe(1);

    const meals = res.body.day.nutrition.meals;
    expect(Array.isArray(meals)).toBe(true);
    expect(meals.length).toBeGreaterThan(0);

    const breakfast = meals[0];
    expect(breakfast.mealType).toBe('breakfast');
    expect(breakfast.recipe).toBeDefined();
    expect(breakfast.recipe.id).toBe(recipeId);
    expect(breakfast.recipe.title).toBe('Test Chicken & Rice');
    expect(breakfast.recipe.instructions).toContain('Cook chicken');
    expect(breakfast.recipe.calories).toBe(500);

    expect(Array.isArray(breakfast.recipe.ingredients)).toBe(true);
    expect(breakfast.recipe.ingredients).toHaveLength(2);

    const chickenItem = breakfast.recipe.ingredients.find(
      (i: any) => i.ingredient.id === chickenId,
    );
    expect(chickenItem).toBeDefined();
    expect(chickenItem.quantityGrams).toBe(200);
    expect(chickenItem.unit).toBe('g');
    expect(chickenItem.ingredient.name).toBe('Test Chicken');
    expect(chickenItem.ingredient.caloriesPer100g).toBe(165);

    const riceItem = breakfast.recipe.ingredients.find(
      (i: any) => i.ingredient.id === riceId,
    );
    expect(riceItem.quantityGrams).toBe(60);
    expect(riceItem.ingredient.category).toBe('Carb');
  });

  it('hydrates workout.blocks[].exercises[] with full Exercise data', async () => {
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
        content: buildValidWeekContent(recipeId, squatExerciseId) as never,
        schemaVersion: 'plan_week_v1',
        validationScore: 100,
      },
    });

    const res = await request(app.getHttpServer() as never)
      .get(ENDPOINT)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    const blocks = res.body.day.workout.blocks;
    expect(Array.isArray(blocks)).toBe(true);
    const exercise = blocks[0].exercises[0];
    expect(exercise.sets).toBe(3);
    expect(exercise.reps).toBe('10-12');
    expect(exercise.restSec).toBe(75);
    expect(exercise.exercise).toBeDefined();
    expect(exercise.exercise.id).toBe(squatExerciseId);
    expect(exercise.exercise.name).toBe('Test Goblet Squat');
    expect(exercise.exercise.expertCues).toContain('Keep elbows tucked');
    expect(exercise.exercise.muscleGroup).toBe('Legs');
    expect(exercise.exercise.equipment).toBe('Dumbbell');
    expect(exercise.exercise.difficulty).toBe('Beginner');
  });

  it('returns exercise: null when exerciseId does not exist', async () => {
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
        content: buildValidWeekContent(
          recipeId,
          'unknown_exercise_id',
        ) as never,
        schemaVersion: 'plan_week_v1',
        validationScore: 100,
      },
    });

    const res = await request(app.getHttpServer() as never)
      .get(ENDPOINT)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    const exercise = res.body.day.workout.blocks[0].exercises[0];
    expect(exercise.exercise).toBeNull();
    // The drill (sets/reps/restSec) is preserved even when exercise is missing.
    expect(exercise.sets).toBe(3);
  });

  it('returns recipe: null for meals whose recipeId does not exist', async () => {
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
        content: buildValidWeekContent('non_existent_recipe_id') as never,
        schemaVersion: 'plan_week_v1',
        validationScore: 100,
      },
    });

    const res = await request(app.getHttpServer() as never)
      .get(ENDPOINT)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(res.body.status).toBe('READY');
    const meals = res.body.day.nutrition.meals;
    expect(meals[0].recipe).toBeNull();
    expect(meals[0].mealType).toBe('breakfast');
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
    where: { title: 'Test Chicken & Rice' },
  });
  for (const r of recipes) {
    await prisma.recipeIngredient.deleteMany({ where: { recipeId: r.id } });
    await prisma.recipe.delete({ where: { id: r.id } });
  }
  await prisma.ingredient.deleteMany({
    where: { name: { in: ['Test Chicken', 'Test Rice'] } },
  });
}

function startOfTodayUtc(): Date {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  return today;
}

function buildValidWeekContent(
  recipeId: string,
  exerciseId: string = 'fallback_exercise',
) {
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
                  exerciseId,
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
