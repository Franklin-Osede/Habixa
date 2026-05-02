import { z } from 'zod';

/**
 * Schema for an AI-generated recipe. Mirrors the Recipe + RecipeIngredient
 * tables but is intentionally decoupled: this is the contract WE send to
 * the LLM, not the storage shape.
 *
 * Tightening rules (chosen to keep the seed DB realistic):
 * - kcal/macro values are per-serving and bounded so no recipe wildly
 *   misses a normal meal range.
 * - Ingredient quantities are positive, ingredient names are non-empty.
 * - Categories are an enum that matches the canonical shopping order
 *   used by ShoppingListAggregatorService.
 */

export const INGREDIENT_CATEGORIES = [
  'Protein',
  'Carb',
  'Fat',
  'Veg',
  'Fruit',
  'Dairy',
  'Pantry',
] as const;

export type IngredientCategory = (typeof INGREDIENT_CATEGORIES)[number];

export const INGREDIENT_UNITS = ['g', 'ml', 'unit'] as const;
export type IngredientUnit = (typeof INGREDIENT_UNITS)[number];

export const MEAL_TYPES = [
  'breakfast',
  'lunch',
  'dinner',
  'snack',
] as const;
export type MealType = (typeof MEAL_TYPES)[number];

export const aiRecipeIngredientSchema = z.object({
  name: z.string().min(2).max(60),
  category: z.enum(INGREDIENT_CATEGORIES),
  quantityGrams: z.number().positive().max(2000),
  unit: z.enum(INGREDIENT_UNITS),
  caloriesPer100g: z.number().int().positive().max(900),
  isVegan: z.boolean(),
});

export const aiRecipeSchema = z.object({
  title: z.string().min(4).max(80),
  mealType: z.enum(MEAL_TYPES),
  instructions: z.string().min(20).max(2000),
  prepTimeMin: z.number().int().min(2).max(180),
  servings: z.number().int().min(1).max(8),
  isVegan: z.boolean(),
  isGlutenFree: z.boolean(),
  caloriesPerServing: z.number().int().min(80).max(1200),
  proteinGPerServing: z.number().int().min(0).max(120),
  carbsGPerServing: z.number().int().min(0).max(200),
  fatsGPerServing: z.number().int().min(0).max(80),
  ingredients: z.array(aiRecipeIngredientSchema).min(2).max(15),
});

export type AiRecipe = z.infer<typeof aiRecipeSchema>;
export type AiRecipeIngredient = z.infer<typeof aiRecipeIngredientSchema>;

export const aiRecipeBatchSchema = z.object({
  recipes: z.array(aiRecipeSchema).min(1).max(20),
});
export type AiRecipeBatch = z.infer<typeof aiRecipeBatchSchema>;
