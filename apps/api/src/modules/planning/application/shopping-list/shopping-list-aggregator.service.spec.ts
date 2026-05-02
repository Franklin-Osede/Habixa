import {
  ShoppingListAggregatorService,
  ShoppingListMealSource,
} from './shopping-list-aggregator.service';

describe('ShoppingListAggregatorService', () => {
  const service = new ShoppingListAggregatorService();

  const chicken = {
    id: 'ing_chicken',
    name: 'Chicken Breast',
    category: 'Protein',
    caloriesPer100g: 165,
    isVegan: false,
  };
  const rice = {
    id: 'ing_rice',
    name: 'White Rice',
    category: 'Carb',
    caloriesPer100g: 130,
    isVegan: true,
  };
  const oliveOil = {
    id: 'ing_olive_oil',
    name: 'Olive Oil',
    category: 'Fat',
    caloriesPer100g: 884,
    isVegan: true,
  };

  const sourceFor = (
    overrides: Partial<ShoppingListMealSource> = {},
  ): ShoppingListMealSource => ({
    recipeId: 'r1',
    recipeTitle: 'Chicken & Rice',
    mealType: 'lunch',
    dayIndex: 1,
    ingredients: [
      { ingredient: chicken, quantityGrams: 200, unit: 'g' },
      { ingredient: rice, quantityGrams: 60, unit: 'g' },
    ],
    ...overrides,
  });

  it('returns empty list for no meals', () => {
    expect(service.aggregate([])).toEqual([]);
  });

  it('keeps single ingredient untouched when used once', () => {
    const result = service.aggregate([
      sourceFor({
        ingredients: [{ ingredient: chicken, quantityGrams: 200, unit: 'g' }],
      }),
    ]);

    expect(result).toHaveLength(1);
    expect(result[0].ingredient.id).toBe('ing_chicken');
    expect(result[0].quantityTotal).toBe(200);
    expect(result[0].unit).toBe('g');
    expect(result[0].usageCount).toBe(1);
  });

  it('sums quantities of the same ingredient + unit across meals', () => {
    const result = service.aggregate([
      sourceFor({ dayIndex: 1 }),
      sourceFor({ dayIndex: 2 }),
      sourceFor({ dayIndex: 3 }),
    ]);

    const chickenItem = result.find((i) => i.ingredient.id === 'ing_chicken');
    const riceItem = result.find((i) => i.ingredient.id === 'ing_rice');
    expect(chickenItem!.quantityTotal).toBe(600);
    expect(chickenItem!.usageCount).toBe(3);
    expect(riceItem!.quantityTotal).toBe(180);
    expect(riceItem!.usageCount).toBe(3);
  });

  it('keeps the same ingredient in different units as separate entries', () => {
    const result = service.aggregate([
      sourceFor({
        ingredients: [
          { ingredient: oliveOil, quantityGrams: 10, unit: 'ml' },
        ],
      }),
      sourceFor({
        dayIndex: 2,
        ingredients: [
          { ingredient: oliveOil, quantityGrams: 50, unit: 'g' },
        ],
      }),
    ]);

    expect(result).toHaveLength(2);
    const ml = result.find((i) => i.unit === 'ml');
    const g = result.find((i) => i.unit === 'g');
    expect(ml!.quantityTotal).toBe(10);
    expect(g!.quantityTotal).toBe(50);
  });

  it('preserves ingredient metadata (category, kcal, vegan)', () => {
    const result = service.aggregate([sourceFor()]);
    const item = result.find((i) => i.ingredient.id === 'ing_chicken')!;
    expect(item.ingredient.category).toBe('Protein');
    expect(item.ingredient.caloriesPer100g).toBe(165);
    expect(item.ingredient.isVegan).toBe(false);
  });

  it('rounds totals to 1 decimal to avoid floating-point ugliness', () => {
    const result = service.aggregate([
      sourceFor({
        ingredients: [{ ingredient: chicken, quantityGrams: 100.123, unit: 'g' }],
      }),
      sourceFor({
        dayIndex: 2,
        ingredients: [{ ingredient: chicken, quantityGrams: 200.456, unit: 'g' }],
      }),
    ]);
    const item = result[0];
    // 100.123 + 200.456 = 300.579 -> 300.6
    expect(item.quantityTotal).toBe(300.6);
  });

  it('groups results by ingredient.category in a stable, useful order', () => {
    const result = service.aggregate([
      sourceFor({
        ingredients: [
          { ingredient: oliveOil, quantityGrams: 10, unit: 'ml' },
          { ingredient: rice, quantityGrams: 60, unit: 'g' },
          { ingredient: chicken, quantityGrams: 200, unit: 'g' },
        ],
      }),
    ]);

    // Protein > Carb > Fat is the canonical shopping order.
    expect(result.map((i) => i.ingredient.category)).toEqual([
      'Protein',
      'Carb',
      'Fat',
    ]);
  });

  it('within the same category, sorts by ingredient name (stable)', () => {
    const beef = {
      id: 'ing_beef',
      name: 'Beef',
      category: 'Protein',
      caloriesPer100g: 250,
      isVegan: false,
    };
    const result = service.aggregate([
      sourceFor({
        ingredients: [
          { ingredient: chicken, quantityGrams: 200, unit: 'g' },
          { ingredient: beef, quantityGrams: 100, unit: 'g' },
        ],
      }),
    ]);

    expect(result.map((i) => i.ingredient.name)).toEqual([
      'Beef',
      'Chicken Breast',
    ]);
  });
});
