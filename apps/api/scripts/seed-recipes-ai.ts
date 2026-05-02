/* eslint-disable @typescript-eslint/no-floating-promises */
/**
 * Seed the recipe catalog with AI-generated recipes using OpenAI structured
 * outputs. The schema (Zod) is the single source of truth — anything OpenAI
 * returns that does not parse is rejected, so the DB never gets garbage.
 *
 * Idempotent: a recipe whose title already exists is skipped. Ingredients
 * are matched by name first; new ones are created on demand.
 *
 * Usage (from apps/api/):
 *   pnpm tsx scripts/seed-recipes-ai.ts          # default plan: ~50 recipes
 *   pnpm tsx scripts/seed-recipes-ai.ts --dry    # call OpenAI but skip DB write
 *   pnpm tsx scripts/seed-recipes-ai.ts --slot=breakfast --count=5
 */

import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import OpenAI from 'openai';
import { zodResponseFormat } from 'openai/helpers/zod';
import {
  AiRecipe,
  aiRecipeBatchSchema,
  IngredientUnit,
} from '../src/modules/planning/application/recipe-seed/recipe-seed.schema';

interface Slot {
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  count: number;
  guidance: string;
}

const DEFAULT_PLAN: Slot[] = [
  {
    mealType: 'breakfast',
    count: 10,
    guidance:
      'Quick (≤15 min) breakfasts. Mix high-protein options (eggs, Greek yogurt, cottage cheese), Mediterranean classics (avocado toast, tomato + olive oil), and lighter vegan options (overnight oats, smoothie bowls). 250–550 kcal per serving.',
  },
  {
    mealType: 'lunch',
    count: 15,
    guidance:
      'Balanced lunches: lean protein + complex carb + vegetables. Include Mediterranean (chicken + couscous + salad), Asian-inspired (rice bowls), Mexican (burrito bowls, tacos), and at least 3 fully vegan options. 450–750 kcal per serving.',
  },
  {
    mealType: 'dinner',
    count: 15,
    guidance:
      'Lighter dinners that emphasize protein and vegetables. White fish, salmon, lean meats, tofu/tempeh. Avoid heavy fried dishes. 400–700 kcal per serving.',
  },
  {
    mealType: 'snack',
    count: 10,
    guidance:
      'Healthy snacks: protein-focused (Greek yogurt + berries, cottage cheese), nut/seed combos, fruit-based, hummus + crudités. 100–300 kcal per serving.',
  },
];

const MODEL = 'gpt-4o-mini';
const BATCH_SIZE = 5; // OpenAI batches per request — keeps response size sane
const prisma = new PrismaClient();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

function buildSystemPrompt(): string {
  return [
    'You are a fitness-focused dietitian generating recipes for a meal-planning app.',
    'Constraints (CRITICAL):',
    '- Quantities must be realistic per single serving.',
    '- Ingredient names in English (Title Case), no brand names.',
    '- caloriesPerServing must roughly match the macros (4 kcal/g protein and carbs, 9 kcal/g fat) ±15%.',
    '- Diversity: never repeat a title.',
    '- Each ingredient gets a category from the canonical list and a unit (g, ml, or unit).',
    '- prepTimeMin must be honest. Do not lowball.',
    '- Set isVegan to true ONLY if every ingredient is vegan.',
    '- Set isGlutenFree to true ONLY if no ingredient contains gluten.',
  ].join('\n');
}

function buildUserPrompt(slot: Slot, count: number, existingTitles: string[]): string {
  return [
    `Generate ${count} unique ${slot.mealType} recipes.`,
    slot.guidance,
    existingTitles.length
      ? `Avoid these titles already in the database: ${existingTitles.slice(-30).join('; ')}.`
      : 'There are no existing recipes yet.',
    'Return them as a JSON object with field "recipes": array of recipe objects matching the schema.',
  ].join('\n');
}

async function generateBatch(slot: Slot, count: number, existingTitles: string[]): Promise<AiRecipe[]> {
  const completion = await openai.chat.completions.parse({
    model: MODEL,
    messages: [
      { role: 'system', content: buildSystemPrompt() },
      { role: 'user', content: buildUserPrompt(slot, count, existingTitles) },
    ],
    response_format: zodResponseFormat(aiRecipeBatchSchema, 'recipe_batch'),
  });

  const parsed = completion.choices[0]?.message?.parsed;
  if (!parsed) throw new Error('OpenAI returned no parsed payload');
  return parsed.recipes;
}

async function findOrCreateIngredient(input: AiRecipe['ingredients'][number]) {
  const existing = await prisma.ingredient.findFirst({
    where: { name: { equals: input.name, mode: 'insensitive' } },
  });
  if (existing) return existing;
  return prisma.ingredient.create({
    data: {
      name: input.name,
      category: input.category,
      caloriesPer100g: input.caloriesPer100g,
      isVegan: input.isVegan,
    },
  });
}

async function persistRecipe(recipe: AiRecipe) {
  const titleConflict = await prisma.recipe.findFirst({
    where: { title: { equals: recipe.title, mode: 'insensitive' } },
    select: { id: true },
  });
  if (titleConflict) return { skipped: true, id: titleConflict.id };

  const created = await prisma.recipe.create({
    data: {
      title: recipe.title,
      instructions: recipe.instructions,
      prepTimeMin: recipe.prepTimeMin,
      isVegan: recipe.isVegan,
      isGlutenFree: recipe.isGlutenFree,
      calories: recipe.caloriesPerServing,
      protein: recipe.proteinGPerServing,
      carbs: recipe.carbsGPerServing,
      fats: recipe.fatsGPerServing,
    },
  });

  for (const ing of recipe.ingredients) {
    const ingredient = await findOrCreateIngredient(ing);
    await prisma.recipeIngredient.create({
      data: {
        recipeId: created.id,
        ingredientId: ingredient.id,
        quantityGrams: ing.quantityGrams,
        unit: ing.unit as IngredientUnit,
      },
    });
  }

  return { skipped: false, id: created.id };
}

function parseArgs(argv: string[]): { dry: boolean; only?: Slot['mealType']; count?: number } {
  const out: { dry: boolean; only?: Slot['mealType']; count?: number } = { dry: false };
  for (const arg of argv.slice(2)) {
    if (arg === '--dry') out.dry = true;
    else if (arg.startsWith('--slot=')) {
      const v = arg.split('=')[1];
      if (['breakfast', 'lunch', 'dinner', 'snack'].includes(v)) {
        out.only = v as Slot['mealType'];
      }
    } else if (arg.startsWith('--count=')) {
      out.count = parseInt(arg.split('=')[1], 10);
    }
  }
  return out;
}

async function main() {
  if (!process.env.OPENAI_API_KEY) {
    console.error('Missing OPENAI_API_KEY in environment.');
    process.exit(1);
  }

  const args = parseArgs(process.argv);
  const plan = args.only
    ? DEFAULT_PLAN.filter((s) => s.mealType === args.only).map((s) => ({
        ...s,
        count: args.count ?? s.count,
      }))
    : DEFAULT_PLAN;

  const startTitles = (
    await prisma.recipe.findMany({ select: { title: true } })
  ).map((r) => r.title);

  console.log(
    `\n[seed] starting. existing recipes: ${startTitles.length}. ` +
      `slots: ${plan.map((s) => `${s.mealType}=${s.count}`).join(', ')}. ` +
      `${args.dry ? '[DRY RUN — no DB writes]' : ''}\n`,
  );

  let totalCreated = 0;
  let totalSkipped = 0;
  let totalFailed = 0;
  const seenTitles = new Set(startTitles.map((t) => t.toLowerCase()));

  for (const slot of plan) {
    let remaining = slot.count;
    while (remaining > 0) {
      const batchSize = Math.min(BATCH_SIZE, remaining);
      console.log(`[seed] requesting ${batchSize} ${slot.mealType} recipes...`);
      try {
        const recipes = await generateBatch(
          slot,
          batchSize,
          Array.from(seenTitles),
        );

        for (const recipe of recipes) {
          if (seenTitles.has(recipe.title.toLowerCase())) {
            totalSkipped += 1;
            console.log(`  ↻ skip duplicate: ${recipe.title}`);
            continue;
          }
          if (args.dry) {
            console.log(`  · [dry] would create: ${recipe.title}`);
            seenTitles.add(recipe.title.toLowerCase());
            totalCreated += 1;
            continue;
          }
          try {
            const result = await persistRecipe(recipe);
            seenTitles.add(recipe.title.toLowerCase());
            if (result.skipped) {
              totalSkipped += 1;
              console.log(`  ↻ already in DB: ${recipe.title}`);
            } else {
              totalCreated += 1;
              console.log(`  ✓ created: ${recipe.title}`);
            }
          } catch (err) {
            totalFailed += 1;
            console.error(`  ✗ failed to persist ${recipe.title}:`, err);
          }
        }

        remaining -= batchSize;
      } catch (err) {
        totalFailed += batchSize;
        console.error(`[seed] batch for ${slot.mealType} failed:`, err);
        remaining -= batchSize;
      }
    }
  }

  console.log(
    `\n[seed] done. created=${totalCreated}, skipped=${totalSkipped}, failed=${totalFailed}`,
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
