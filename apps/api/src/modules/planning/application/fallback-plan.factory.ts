import { PLAN_WEEK_SCHEMA_VERSION, PlanWeekContent } from './plan-week.schema';

type ExerciseItem = { id: string };
type RecipeItem = { id: string; calories?: number | null };

export interface FallbackOptions {
  targetKcal?: number;
}

const DEFAULT_FALLBACK_KCAL = 2000;

export function createFallbackWeekPlan(
  exercises: ExerciseItem[],
  recipes: RecipeItem[],
  options: FallbackOptions = {},
): PlanWeekContent {
  const targetKcal = options.targetKcal ?? DEFAULT_FALLBACK_KCAL;
  const exerciseIds = exercises.slice(0, 3).map((exercise) => exercise.id);
  const recipeIds = recipes.slice(0, 4).map((recipe) => recipe.id);
  const safeExerciseIds =
    exerciseIds.length > 0 ? exerciseIds : ['fallback_exercise'];
  const safeRecipeIds = recipeIds.length > 0 ? recipeIds : ['fallback_recipe'];

  return {
    weekIndex: 1,
    schemaVersion: PLAN_WEEK_SCHEMA_VERSION,
    days: Array.from({ length: 7 }, (_, index) => {
      const dayIndex = index + 1;
      return {
        id: `week1_day${dayIndex}`,
        dayIndex,
        dailyTip:
          'Mantén una ejecución técnica y prioriza la consistencia antes que la intensidad.',
        workout: {
          id: `day${dayIndex}_workout`,
          type: 'workout',
          title: dayIndex % 2 === 0 ? 'Sesión de movilidad activa' : 'Full Body Base',
          blocks: [
            {
              id: `day${dayIndex}_workout_block1`,
              type: 'main',
              exercises: safeExerciseIds.map((exerciseId) => ({
                exerciseId,
                sets: dayIndex % 2 === 0 ? 2 : 3,
                reps: dayIndex % 2 === 0 ? '8-10 suave' : '10-12',
                restSec: 75,
              })),
            },
          ],
        },
        nutrition: {
          id: `day${dayIndex}_nutrition`,
          type: 'nutrition',
          totalKcalTarget: targetKcal,
          meals: safeRecipeIds.map((recipeId, mealIndex) => ({
            id: `day${dayIndex}_meal${mealIndex + 1}`,
            type: 'meal',
            mealType: ['breakfast', 'lunch', 'snack', 'dinner'][mealIndex] ?? `meal_${mealIndex + 1}`,
            recipeId,
          })),
        },
        habits: [
          {
            id: `day${dayIndex}_habit1`,
            type: 'habit',
            title: 'Caminar 20 minutos',
            target: '20 min',
          },
          {
            id: `day${dayIndex}_habit2`,
            type: 'habit',
            title: 'Beber agua regularmente',
            target: '2 litros',
          },
        ],
      };
    }),
    rationale: {
      goalMatch: 'Plan base de bajo riesgo para asegurar continuidad.',
      dietMatch: 'Recetas seleccionadas desde el catálogo disponible.',
      equipmentMatch: 'Ejercicios seleccionados desde el catálogo disponible.',
    },
  };
}
