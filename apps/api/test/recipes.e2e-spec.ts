/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/common/prisma.service';
import { configureApp } from './../src/setup/configure-app';

const TEST_EMAIL = 'recipes-e2e@example.com';
const TEST_PASSWORD = 'Password123!';

describe('GET /v1/recipes/:id (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let accessToken: string;
  let userId: string;
  let recipeId: string;
  let chickenId: string;
  let riceId: string;

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
        name: 'Recipes Chicken',
        category: 'Protein',
        caloriesPer100g: 165,
      },
    });
    const rice = await prisma.ingredient.create({
      data: { name: 'Recipes Rice', category: 'Carb', caloriesPer100g: 130 },
    });
    chickenId = chicken.id;
    riceId = rice.id;

    const recipe = await prisma.recipe.create({
      data: {
        title: 'Recipes Endpoint Sample',
        instructions: '1. Cook chicken. 2. Boil rice. 3. Plate.',
        calories: 500,
        protein: 45,
        carbs: 50,
        fats: 10,
        prepTimeMin: 25,
        ingredients: {
          create: [
            { ingredientId: chicken.id, quantityGrams: 200, unit: 'g' },
            { ingredientId: rice.id, quantityGrams: 60, unit: 'g' },
          ],
        },
      },
    });
    recipeId = recipe.id;
  });

  afterAll(async () => {
    await cleanupUserData(prisma, TEST_EMAIL);
    await cleanupTestRecipe(prisma);
    await app.close();
  });

  it('returns 401 when no auth token is provided', () => {
    return request(app.getHttpServer() as never)
      .get(`/v1/recipes/${recipeId}`)
      .expect(401);
  });

  it('returns 404 when the recipe does not exist', () => {
    return request(app.getHttpServer() as never)
      .get('/v1/recipes/00000000-0000-0000-0000-000000000000')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(404);
  });

  it('returns the hydrated recipe with ingredient quantities', async () => {
    const res = await request(app.getHttpServer() as never)
      .get(`/v1/recipes/${recipeId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(res.body.id).toBe(recipeId);
    expect(res.body.title).toBe('Recipes Endpoint Sample');
    expect(res.body.instructions).toContain('Cook chicken');
    expect(res.body.calories).toBe(500);
    expect(res.body.protein).toBe(45);
    expect(res.body.prepTimeMin).toBe(25);

    expect(Array.isArray(res.body.ingredients)).toBe(true);
    expect(res.body.ingredients).toHaveLength(2);

    const chickenItem = res.body.ingredients.find(
      (i: any) => i.ingredient.id === chickenId,
    );
    expect(chickenItem).toBeDefined();
    expect(chickenItem.quantityGrams).toBe(200);
    expect(chickenItem.unit).toBe('g');
    expect(chickenItem.ingredient.name).toBe('Recipes Chicken');
    expect(chickenItem.ingredient.caloriesPer100g).toBe(165);

    const riceItem = res.body.ingredients.find(
      (i: any) => i.ingredient.id === riceId,
    );
    expect(riceItem.quantityGrams).toBe(60);
    expect(riceItem.ingredient.category).toBe('Carb');

    // Sanity: track userId is set so cleanup runs
    expect(userId).toBeDefined();
  });
});

async function cleanupUserData(prisma: PrismaService, email: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return;
  await prisma.user.deleteMany({ where: { id: user.id } });
}

async function cleanupTestRecipe(prisma: PrismaService) {
  const recipes = await prisma.recipe.findMany({
    where: { title: 'Recipes Endpoint Sample' },
  });
  for (const r of recipes) {
    await prisma.recipeIngredient.deleteMany({ where: { recipeId: r.id } });
    await prisma.recipe.delete({ where: { id: r.id } });
  }
  await prisma.ingredient.deleteMany({
    where: { name: { in: ['Recipes Chicken', 'Recipes Rice'] } },
  });
}
