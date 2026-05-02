import {
  AdherenceService,
  AdherenceTaskInput,
} from './adherence.service';
import type { PlanWeekContent } from '../../planning/application/plan-week.schema';

/**
 * For these specs we anchor "now" at a fixed UTC midnight so the day
 * arithmetic stays deterministic. Walking backwards 6 days lands on the
 * windowStart, giving a 7-day inclusive window.
 */
const NOW = new Date('2026-05-02T00:00:00.000Z');
const PLAN_START = new Date('2026-05-02T00:00:00.000Z'); // day index 1 == today

const service = new AdherenceService();

function daysBefore(n: number): Date {
  const d = new Date(NOW);
  d.setUTCDate(d.getUTCDate() - n);
  return d;
}

const SCHEDULED_PER_DAY = {
  workout: 1,
  meals: 2,
  habits: 1,
};
const ACTIVITIES_PER_DAY =
  SCHEDULED_PER_DAY.workout + SCHEDULED_PER_DAY.meals + SCHEDULED_PER_DAY.habits;

function buildPlanWeekContent(): PlanWeekContent {
  return {
    weekIndex: 1,
    schemaVersion: 'plan_week_v1' as const,
    days: Array.from({ length: 7 }, (_, i) => {
      const dayIndex = i + 1;
      return {
        id: `week1_day${dayIndex}`,
        dayIndex,
        dailyTip: 'tip',
        workout: {
          id: `day${dayIndex}_workout`,
          type: 'workout' as const,
          title: 'X',
          blocks: [
            {
              id: `day${dayIndex}_block1`,
              type: 'main',
              exercises: [
                { exerciseId: 'e1', sets: 3, reps: '10', restSec: 60 },
              ],
            },
          ],
        },
        nutrition: {
          id: `day${dayIndex}_nutrition`,
          type: 'nutrition' as const,
          totalKcalTarget: 2000,
          meals: [
            {
              id: `day${dayIndex}_meal1`,
              type: 'meal' as const,
              mealType: 'breakfast',
              recipeId: 'r1',
            },
            {
              id: `day${dayIndex}_meal2`,
              type: 'meal' as const,
              mealType: 'lunch',
              recipeId: 'r2',
            },
          ],
        },
        habits: [
          {
            id: `day${dayIndex}_habit1`,
            type: 'habit' as const,
            title: 'water',
          },
        ],
      };
    }),
  };
}

const completed = (
  dateOffset: number,
  activityId: string,
  activityType: string,
): AdherenceTaskInput => ({
  date: daysBefore(dateOffset),
  activityId,
  activityType,
  isCompleted: true,
  skipReason: null,
});

const skipped = (
  dateOffset: number,
  activityId: string,
  activityType: string,
  reason: string = 'time',
): AdherenceTaskInput => ({
  date: daysBefore(dateOffset),
  activityId,
  activityType,
  isCompleted: false,
  skipReason: reason,
});

describe('AdherenceService.compute', () => {
  describe('zero state', () => {
    it('returns zeros and a 7-day window when there is no plan', () => {
      const result = service.compute({
        planWeekContent: null,
        planStartDate: PLAN_START,
        tasks: [],
        now: NOW,
      });
      expect(result.streakDays).toBe(0);
      expect(result.totals).toEqual({
        completed: 0,
        skipped: 0,
        scheduled: 0,
      });
      expect(result.consistency.overallPct).toBe(0);
      expect(result.windowDays).toBe(7);
    });

    it('counts scheduled even when nothing is completed', () => {
      const result = service.compute({
        planWeekContent: buildPlanWeekContent(),
        planStartDate: PLAN_START,
        tasks: [],
        now: NOW,
      });
      expect(result.totals.scheduled).toBe(ACTIVITIES_PER_DAY * 7);
      expect(result.totals.completed).toBe(0);
      expect(result.streakDays).toBe(0);
    });
  });

  describe('streak from today backwards', () => {
    it('counts a 3-day streak when last 3 days have completions', () => {
      const tasks = [0, 1, 2].map((d) =>
        completed(d, `day${7 - d}_workout`, 'workout'),
      );
      const result = service.compute({
        planWeekContent: buildPlanWeekContent(),
        planStartDate: PLAN_START,
        tasks,
        now: NOW,
      });
      expect(result.streakDays).toBe(3);
    });

    it('treats a fully skipped day as a streak freeze (still counts)', () => {
      // today (offset 0): skipped only
      // yesterday (offset 1): completed
      // day before (offset 2): completed
      const tasks: AdherenceTaskInput[] = [
        skipped(0, 'day7_workout', 'workout'),
        completed(1, 'day6_workout', 'workout'),
        completed(2, 'day5_workout', 'workout'),
      ];
      const result = service.compute({
        planWeekContent: buildPlanWeekContent(),
        planStartDate: PLAN_START,
        tasks,
        now: NOW,
      });
      expect(result.streakDays).toBe(3);
    });

    it('breaks the streak on a fully missed (no row) day', () => {
      // today completed, yesterday MISSING, day before completed
      const tasks: AdherenceTaskInput[] = [
        completed(0, 'day7_workout', 'workout'),
        // yesterday: nothing
        completed(2, 'day5_workout', 'workout'),
      ];
      const result = service.compute({
        planWeekContent: buildPlanWeekContent(),
        planStartDate: PLAN_START,
        tasks,
        now: NOW,
      });
      expect(result.streakDays).toBe(1);
    });

    it('walks back from yesterday when today has no activity', () => {
      // today empty, yesterday + day before completed
      const tasks: AdherenceTaskInput[] = [
        completed(1, 'day6_workout', 'workout'),
        completed(2, 'day5_workout', 'workout'),
      ];
      const result = service.compute({
        planWeekContent: buildPlanWeekContent(),
        planStartDate: PLAN_START,
        tasks,
        now: NOW,
      });
      expect(result.streakDays).toBe(2);
    });
  });

  describe('totals + consistency', () => {
    it('counts skipped tasks separately from completed', () => {
      const tasks: AdherenceTaskInput[] = [
        completed(0, 'day7_workout', 'workout'),
        skipped(0, 'day7_meal1', 'meal'),
      ];
      const result = service.compute({
        planWeekContent: buildPlanWeekContent(),
        planStartDate: PLAN_START,
        tasks,
        now: NOW,
      });
      expect(result.totals.completed).toBe(1);
      expect(result.totals.skipped).toBe(1);
      expect(result.totals.scheduled).toBe(ACTIVITIES_PER_DAY * 7);
    });

    it('overall consistency = completed / scheduled', () => {
      // Complete every workout for 7 days = 7 completions out of 28 scheduled
      const tasks = Array.from({ length: 7 }, (_, i) =>
        completed(i, `day${7 - i}_workout`, 'workout'),
      );
      const result = service.compute({
        planWeekContent: buildPlanWeekContent(),
        planStartDate: PLAN_START,
        tasks,
        now: NOW,
      });
      expect(result.totals.completed).toBe(7);
      expect(result.totals.scheduled).toBe(28);
      expect(result.consistency.overallPct).toBe(25); // 7/28
    });

    it('per-category consistency tracks workout / nutrition / habits independently', () => {
      // 1 workout completed (out of 7), 4 meals (out of 14), 0 habits (out of 7)
      const tasks: AdherenceTaskInput[] = [
        completed(0, 'day7_workout', 'workout'),
        completed(0, 'day7_meal1', 'meal'),
        completed(0, 'day7_meal2', 'meal'),
        completed(1, 'day6_meal1', 'meal'),
        completed(2, 'day5_meal1', 'meal'),
      ];
      const result = service.compute({
        planWeekContent: buildPlanWeekContent(),
        planStartDate: PLAN_START,
        tasks,
        now: NOW,
      });
      expect(result.consistency.workoutPct).toBe(14); // 1/7
      expect(result.consistency.nutritionPct).toBe(29); // 4/14 = 28.57 rounded
      expect(result.consistency.habitsPct).toBe(0);
    });

    it('returns 100% when fully completed', () => {
      const tasks: AdherenceTaskInput[] = [];
      for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
        const dayIndex = 7 - dayOffset;
        tasks.push(completed(dayOffset, `day${dayIndex}_workout`, 'workout'));
        tasks.push(completed(dayOffset, `day${dayIndex}_meal1`, 'meal'));
        tasks.push(completed(dayOffset, `day${dayIndex}_meal2`, 'meal'));
        tasks.push(completed(dayOffset, `day${dayIndex}_habit1`, 'habit'));
      }
      const result = service.compute({
        planWeekContent: buildPlanWeekContent(),
        planStartDate: PLAN_START,
        tasks,
        now: NOW,
      });
      expect(result.totals.completed).toBe(28);
      expect(result.consistency.overallPct).toBe(100);
      expect(result.streakDays).toBe(7);
    });
  });

  describe('window boundaries', () => {
    it('ignores tasks outside the 7-day window', () => {
      const tasks: AdherenceTaskInput[] = [
        completed(10, 'day1_workout', 'workout'), // 10 days ago — outside
        completed(0, 'day7_workout', 'workout'),
      ];
      const result = service.compute({
        planWeekContent: buildPlanWeekContent(),
        planStartDate: PLAN_START,
        tasks,
        now: NOW,
      });
      expect(result.totals.completed).toBe(1);
    });

    it('exposes windowStartDate and windowEndDate as ISO YYYY-MM-DD', () => {
      const result = service.compute({
        planWeekContent: buildPlanWeekContent(),
        planStartDate: PLAN_START,
        tasks: [],
        now: NOW,
      });
      expect(result.windowEndDate).toBe('2026-05-02');
      expect(result.windowStartDate).toBe('2026-04-26'); // 6 days back inclusive
    });
  });
});
