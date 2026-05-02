import { Injectable } from '@nestjs/common';

export interface ShoppingListIngredient {
  id: string;
  name: string;
  category: string;
  caloriesPer100g: number;
  isVegan: boolean;
}

export interface ShoppingListMealIngredient {
  ingredient: ShoppingListIngredient;
  quantityGrams: number;
  unit: string;
}

export interface ShoppingListMealSource {
  recipeId: string;
  recipeTitle: string;
  mealType: string;
  dayIndex: number;
  ingredients: ShoppingListMealIngredient[];
}

export interface ShoppingListItem {
  ingredient: ShoppingListIngredient;
  quantityTotal: number;
  unit: string;
  usageCount: number;
}

// Canonical shopping order — protein first because it's the most expensive
// and dictates the rest of the meal plan; produce last because it's added
// to the cart at the supermarket entrance.
const CATEGORY_ORDER: Record<string, number> = {
  Protein: 0,
  Carb: 1,
  Fat: 2,
  Veg: 3,
  Fruit: 4,
  Dairy: 5,
  Pantry: 6,
};

@Injectable()
export class ShoppingListAggregatorService {
  aggregate(meals: ShoppingListMealSource[]): ShoppingListItem[] {
    const buckets = new Map<string, ShoppingListItem>();

    for (const meal of meals) {
      for (const item of meal.ingredients) {
        const key = `${item.ingredient.id}::${item.unit}`;
        const existing = buckets.get(key);
        if (existing) {
          existing.quantityTotal += item.quantityGrams;
          existing.usageCount += 1;
        } else {
          buckets.set(key, {
            ingredient: item.ingredient,
            quantityTotal: item.quantityGrams,
            unit: item.unit,
            usageCount: 1,
          });
        }
      }
    }

    const items = Array.from(buckets.values()).map((entry) => ({
      ...entry,
      quantityTotal: round1(entry.quantityTotal),
    }));

    items.sort((a, b) => {
      const ca = CATEGORY_ORDER[a.ingredient.category] ?? 99;
      const cb = CATEGORY_ORDER[b.ingredient.category] ?? 99;
      if (ca !== cb) return ca - cb;
      return a.ingredient.name.localeCompare(b.ingredient.name);
    });

    return items;
  }
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}
