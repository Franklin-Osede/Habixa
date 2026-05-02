import { PlanWeekValidatorService } from './plan-week-validator.service';

describe('PlanWeekValidatorService', () => {
  const service = new PlanWeekValidatorService();
  const exercises = [
    {
      id: 'exercise_1',
      equipment: 'Bodyweight',
      difficulty: 'Beginner',
      jointStress: null,
    },
  ];
  const recipes = [
    {
      id: 'recipe_1',
      isVegan: true,
      isGlutenFree: true,
    },
  ];

  const validWeek = {
    weekIndex: 1,
    schemaVersion: 'plan_week_v1',
    days: Array.from({ length: 7 }, (_, index) => {
      const dayIndex = index + 1;
      return {
        id: `week1_day${dayIndex}`,
        dayIndex,
        dailyTip: 'Keep the pace steady.',
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
                  exerciseId: 'exercise_1',
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
              recipeId: 'recipe_1',
            },
          ],
        },
        habits: [
          {
            id: `day${dayIndex}_habit1`,
            type: 'habit',
            title: 'Walk 20 minutes',
            target: '20 min',
          },
        ],
      };
    }),
  };

  it('accepts a valid week plan', () => {
    const result = service.validate({
      response: validWeek,
      exercises,
      recipes,
      userProfile: {
        equipment: 'Bodyweight',
        experienceLevel: 'Beginner',
        allergies: [],
        dietType: 'Vegan',
      },
    });

    expect(result.ok).toBe(true);
    expect(result.score).toBe(100);
  });

  it('rejects malformed plans', () => {
    const result = service.validate({
      response: { weekIndex: 1, days: [] },
      exercises,
      recipes,
      userProfile: {},
    });

    expect(result.ok).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('penalizes unknown catalog IDs', () => {
    const invalidWeek = structuredClone(validWeek);
    invalidWeek.days[0].workout.blocks[0].exercises[0].exerciseId = 'missing';

    const result = service.validate({
      response: invalidWeek,
      exercises,
      recipes,
      userProfile: {
        equipment: 'Bodyweight',
        experienceLevel: 'Beginner',
        allergies: [],
        dietType: 'Vegan',
      },
    });

    expect(result.ok).toBe(false);
    expect(result.score).toBeLessThan(100);
    expect(result.errors).toContain('Unknown exerciseId missing');
  });
});
