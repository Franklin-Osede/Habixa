import { Injectable } from '@nestjs/common';
import {
  openClawWeekResponseSchema,
  PLAN_WEEK_SCHEMA_VERSION,
  PlanWeekContent,
} from './plan-week.schema';

type ExerciseCatalogItem = {
  id: string;
  equipment?: string | null;
  difficulty?: string | null;
  jointStress?: string | null;
};

type RecipeCatalogItem = {
  id: string;
  isVegan?: boolean | null;
  isGlutenFree?: boolean | null;
};

type UserPlanProfile = {
  equipment?: string | null;
  experienceLevel?: string | null;
  allergies?: string[];
  dietType?: string | null;
};

export type PlanWeekValidationInput = {
  response: unknown;
  exercises: ExerciseCatalogItem[];
  recipes: RecipeCatalogItem[];
  userProfile: UserPlanProfile;
};

export type PlanWeekValidationResult =
  | {
      ok: true;
      content: PlanWeekContent;
      score: number;
      errors: string[];
    }
  | {
      ok: false;
      score: number;
      errors: string[];
    };

@Injectable()
export class PlanWeekValidatorService {
  validate(input: PlanWeekValidationInput): PlanWeekValidationResult {
    const parsed = openClawWeekResponseSchema.safeParse(input.response);
    if (!parsed.success) {
      return {
        ok: false,
        score: 0,
        errors: parsed.error.issues.map(
          (issue) => `${issue.path.join('.') || 'root'}: ${issue.message}`,
        ),
      };
    }

    const errors = this.validateSemantics(parsed.data, input);
    const score = Math.max(0, 100 - errors.length * 15);

    return {
      ok: errors.length === 0,
      content: parsed.data,
      score,
      errors,
    };
  }

  private validateSemantics(
    content: PlanWeekContent,
    input: Omit<PlanWeekValidationInput, 'response'>,
  ): string[] {
    const errors: string[] = [];
    const exerciseById = new Map(input.exercises.map((item) => [item.id, item]));
    const recipeById = new Map(input.recipes.map((item) => [item.id, item]));
    const equipment = input.userProfile.equipment?.toLowerCase();
    const level = input.userProfile.experienceLevel?.toLowerCase();
    const dietType = input.userProfile.dietType?.toLowerCase();

    for (const day of content.days) {
      for (const block of day.workout.blocks) {
        for (const exercise of block.exercises) {
          const catalogExercise = exerciseById.get(exercise.exerciseId);
          if (!catalogExercise) {
            errors.push(`Unknown exerciseId ${exercise.exerciseId}`);
            continue;
          }

          if (
            equipment &&
            catalogExercise.equipment &&
            !catalogExercise.equipment.toLowerCase().includes(equipment) &&
            equipment !== 'gym'
          ) {
            errors.push(
              `Exercise ${exercise.exerciseId} requires ${catalogExercise.equipment}, incompatible with ${input.userProfile.equipment}`,
            );
          }

          if (
            level === 'beginner' &&
            catalogExercise.difficulty?.toLowerCase() === 'advanced'
          ) {
            errors.push(`Advanced exercise ${exercise.exerciseId} assigned to beginner`);
          }
        }
      }

      for (const meal of day.nutrition.meals) {
        const recipe = recipeById.get(meal.recipeId);
        if (!recipe) {
          errors.push(`Unknown recipeId ${meal.recipeId}`);
          continue;
        }

        if (dietType?.includes('vegan') && !recipe.isVegan) {
          errors.push(`Non-vegan recipe ${meal.recipeId} assigned to vegan diet`);
        }

        if (dietType?.includes('gluten') && !recipe.isGlutenFree) {
          errors.push(`Gluten recipe ${meal.recipeId} assigned to gluten-free diet`);
        }
      }
    }

    return errors;
  }

  normalizeResponse(response: any): unknown {
    const plan = response?.plan ?? response;
    const days = Array.isArray(plan) ? plan : plan?.days;

    if (!Array.isArray(days)) {
      return plan;
    }

    return {
      weekIndex: plan?.weekIndex ?? 1,
      schemaVersion: plan?.schemaVersion ?? PLAN_WEEK_SCHEMA_VERSION,
      days: days.slice(0, 7).map((day: any, index: number) => {
        const dayIndex = Number(day?.dayIndex ?? index + 1);
        return {
          id: day?.id ?? `week1_day${dayIndex}`,
          dayIndex,
          dailyTip: day?.dailyTip ?? day?.info ?? 'Completa el plan de hoy con ritmo constante.',
          workout: {
            id: day?.workout?.id ?? `day${dayIndex}_workout`,
            type: 'workout',
            title: day?.workout?.title ?? 'Entreno del día',
            blocks: (day?.workout?.blocks ?? []).map((block: any, blockIndex: number) => ({
              id: block?.id ?? `day${dayIndex}_workout_block${blockIndex + 1}`,
              type: block?.type ?? 'main',
              exercises: block?.exercises ?? [],
            })),
          },
          nutrition: {
            id: day?.nutrition?.id ?? `day${dayIndex}_nutrition`,
            type: 'nutrition',
            totalKcalTarget: day?.nutrition?.totalKcalTarget ?? 2000,
            meals: (day?.nutrition?.meals ?? []).map((meal: any, mealIndex: number) => ({
              id: meal?.id ?? `day${dayIndex}_meal${mealIndex + 1}`,
              type: 'meal',
              mealType: meal?.mealType ?? `meal_${mealIndex + 1}`,
              recipeId: meal?.recipeId,
            })),
          },
          habits: (day?.habits ?? []).map((habit: any, habitIndex: number) => ({
            id: habit?.id ?? `day${dayIndex}_habit${habitIndex + 1}`,
            type: 'habit',
            title: habit?.title ?? 'Hábito diario',
            target: habit?.target,
          })),
        };
      }),
      rationale: plan?.rationale,
    };
  }
}
