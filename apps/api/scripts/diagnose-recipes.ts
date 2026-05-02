/* eslint-disable @typescript-eslint/no-floating-promises */
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const total = await prisma.recipe.count();
  console.log(`\n=== Recipe catalog: ${total} total ===\n`);

  const ingredientTotal = await prisma.ingredient.count();
  console.log(`Ingredients: ${ingredientTotal} unique\n`);

  console.log('Sample 3 recipes with ingredients:\n');
  const recipes = await prisma.recipe.findMany({
    take: 3,
    orderBy: { id: 'desc' },
    include: {
      ingredients: { include: { ingredient: true } },
    },
  });

  for (const r of recipes) {
    console.log(`▶ ${r.title}`);
    console.log(
      `  ${r.calories} kcal · ${r.protein}g P · ${r.carbs}g C · ${r.fats}g F · ${r.prepTimeMin} min`,
    );
    console.log(
      `  ${r.isVegan ? '🌱' : ''} ${r.isGlutenFree ? '🌾' : ''}`.trim() || '  (omnivore)',
    );
    for (const ri of r.ingredients) {
      console.log(
        `   - ${ri.quantityGrams}${ri.unit} ${ri.ingredient.name} [${ri.ingredient.category}]`,
      );
    }
    console.log();
  }

  console.log('=== Ingredient categories ===');
  const ingredients = await prisma.ingredient.findMany({
    select: { category: true },
  });
  const byCategory = new Map<string, number>();
  for (const i of ingredients) {
    byCategory.set(i.category, (byCategory.get(i.category) ?? 0) + 1);
  }
  for (const [cat, count] of [...byCategory.entries()].sort()) {
    console.log(`  ${cat}: ${count}`);
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
