import { aiRecipeSchema, aiRecipeBatchSchema } from './recipe-seed.schema';

describe('aiRecipeSchema', () => {
  const validRecipe = {
    title: 'Grilled Chicken Bowl',
    mealType: 'lunch' as const,
    instructions:
      '1. Marinate chicken with lemon and herbs. 2. Grill 6 min per side. 3. Serve over rice with broccoli.',
    prepTimeMin: 25,
    servings: 1,
    isVegan: false,
    isGlutenFree: true,
    caloriesPerServing: 480,
    proteinGPerServing: 42,
    carbsGPerServing: 50,
    fatsGPerServing: 10,
    ingredients: [
      {
        name: 'Chicken Breast',
        category: 'Protein' as const,
        quantityGrams: 200,
        unit: 'g' as const,
        caloriesPer100g: 165,
        isVegan: false,
      },
      {
        name: 'White Rice',
        category: 'Carb' as const,
        quantityGrams: 60,
        unit: 'g' as const,
        caloriesPer100g: 130,
        isVegan: true,
      },
    ],
  };

  it('accepts a well-formed recipe', () => {
    expect(() => aiRecipeSchema.parse(validRecipe)).not.toThrow();
  });

  it('rejects a recipe with too few ingredients', () => {
    expect(() =>
      aiRecipeSchema.parse({
        ...validRecipe,
        ingredients: [validRecipe.ingredients[0]],
      }),
    ).toThrow();
  });

  it('rejects negative quantities', () => {
    expect(() =>
      aiRecipeSchema.parse({
        ...validRecipe,
        ingredients: [
          { ...validRecipe.ingredients[0], quantityGrams: -10 },
          ...validRecipe.ingredients.slice(1),
        ],
      }),
    ).toThrow();
  });

  it('rejects unknown category', () => {
    expect(() =>
      aiRecipeSchema.parse({
        ...validRecipe,
        ingredients: [
          { ...validRecipe.ingredients[0], category: 'Snack' as never },
          ...validRecipe.ingredients.slice(1),
        ],
      }),
    ).toThrow();
  });

  it('rejects unknown unit', () => {
    expect(() =>
      aiRecipeSchema.parse({
        ...validRecipe,
        ingredients: [
          { ...validRecipe.ingredients[0], unit: 'cup' as never },
          ...validRecipe.ingredients.slice(1),
        ],
      }),
    ).toThrow();
  });

  it('rejects unrealistic kcal (over 1200/serving)', () => {
    expect(() =>
      aiRecipeSchema.parse({ ...validRecipe, caloriesPerServing: 5000 }),
    ).toThrow();
  });

  it('rejects empty instructions', () => {
    expect(() =>
      aiRecipeSchema.parse({ ...validRecipe, instructions: 'eat' }),
    ).toThrow();
  });

  it('rejects unknown mealType', () => {
    expect(() =>
      aiRecipeSchema.parse({ ...validRecipe, mealType: 'brunch' as never }),
    ).toThrow();
  });
});

describe('aiRecipeBatchSchema', () => {
  it('rejects an empty batch', () => {
    expect(() => aiRecipeBatchSchema.parse({ recipes: [] })).toThrow();
  });

  it('caps batches at 20 recipes', () => {
    const minimal = {
      title: 'Test Recipe',
      mealType: 'snack' as const,
      instructions:
        'Mix all ingredients together and chill for 10 minutes before serving.',
      prepTimeMin: 5,
      servings: 1,
      isVegan: true,
      isGlutenFree: true,
      caloriesPerServing: 200,
      proteinGPerServing: 10,
      carbsGPerServing: 25,
      fatsGPerServing: 5,
      ingredients: [
        {
          name: 'Greek Yogurt',
          category: 'Dairy' as const,
          quantityGrams: 150,
          unit: 'g' as const,
          caloriesPer100g: 60,
          isVegan: false,
        },
        {
          name: 'Honey',
          category: 'Pantry' as const,
          quantityGrams: 10,
          unit: 'g' as const,
          caloriesPer100g: 304,
          isVegan: true,
        },
      ],
    };
    const recipes = Array.from({ length: 21 }, () => ({ ...minimal }));
    expect(() => aiRecipeBatchSchema.parse({ recipes })).toThrow();
  });
});
