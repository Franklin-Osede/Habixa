import { Injectable } from '@nestjs/common';
import { PlanWeekContent } from '../../planning/application/plan-week.schema';

export interface AdherenceTaskInput {
  date: Date;
  activityId: string | null;
  activityType: string | null;
  isCompleted: boolean;
  skipReason: string | null;
}

export interface AdherenceComputeInput {
  planWeekContent: PlanWeekContent | null;
  planStartDate: Date;
  tasks: AdherenceTaskInput[];
  now: Date;
  windowDays?: number;
}

export interface AdherenceTotals {
  completed: number;
  skipped: number;
  scheduled: number;
}

export interface AdherenceConsistency {
  overallPct: number;
  workoutPct: number;
  nutritionPct: number;
  habitsPct: number;
}

export interface AdherenceResult {
  windowDays: number;
  windowStartDate: string; // YYYY-MM-DD
  windowEndDate: string; // YYYY-MM-DD
  streakDays: number;
  totals: AdherenceTotals;
  consistency: AdherenceConsistency;
}

@Injectable()
export class AdherenceService {
  compute(input: AdherenceComputeInput): AdherenceResult {
    const windowDays = input.windowDays ?? 7;
    const windowEnd = startOfDayUtc(input.now);
    const windowStart = addDays(windowEnd, -(windowDays - 1));

    const scheduled = this.countScheduledInWindow(
      input.planWeekContent,
      input.planStartDate,
      windowStart,
      windowEnd,
    );

    const tasksByDate = this.bucketTasksByDate(
      input.tasks,
      windowStart,
      windowEnd,
    );

    const totals: AdherenceTotals = {
      completed: 0,
      skipped: 0,
      scheduled: scheduled.total,
    };
    for (const tasks of tasksByDate.values()) {
      for (const task of tasks) {
        if (task.isCompleted) totals.completed += 1;
        else if (task.skipReason) totals.skipped += 1;
      }
    }

    const completedByCategory = { workout: 0, nutrition: 0, habits: 0 };
    for (const tasks of tasksByDate.values()) {
      for (const task of tasks) {
        if (!task.isCompleted) continue;
        const cat = mapTypeToCategory(task.activityType);
        if (cat) completedByCategory[cat] += 1;
      }
    }

    const consistency: AdherenceConsistency = {
      overallPct: pct(totals.completed, totals.scheduled),
      workoutPct: pct(completedByCategory.workout, scheduled.workout),
      nutritionPct: pct(completedByCategory.nutrition, scheduled.nutrition),
      habitsPct: pct(completedByCategory.habits, scheduled.habits),
    };

    const streakDays = this.computeStreak(tasksByDate, windowEnd);

    return {
      windowDays,
      windowStartDate: toDateString(windowStart),
      windowEndDate: toDateString(windowEnd),
      streakDays,
      totals,
      consistency,
    };
  }

  private countScheduledInWindow(
    planWeekContent: PlanWeekContent | null,
    planStartDate: Date,
    windowStart: Date,
    windowEnd: Date,
  ): { total: number; workout: number; nutrition: number; habits: number } {
    const result = { total: 0, workout: 0, nutrition: 0, habits: 0 };
    if (!planWeekContent) return result;

    const planStart = startOfDayUtc(planStartDate);

    let cursor = new Date(windowStart);
    while (cursor.getTime() <= windowEnd.getTime()) {
      const elapsed = Math.floor(
        (cursor.getTime() - planStart.getTime()) / DAY_MS,
      );
      // Normalize to 1..7 day index. The same week template applies
      // across the window — including dates before the plan's startDate
      // — because the user's adherence is being measured against the
      // template they currently follow.
      const normalized = ((elapsed % 7) + 7) % 7;
      const dayIndex = normalized + 1;
      const day = planWeekContent.days.find((d) => d.dayIndex === dayIndex);
      if (day) {
        if (day.workout) {
          result.workout += 1;
          result.total += 1;
        }
        const meals = day.nutrition?.meals?.length ?? 0;
        result.nutrition += meals;
        result.total += meals;
        const habits = day.habits?.length ?? 0;
        result.habits += habits;
        result.total += habits;
      }
      cursor = addDays(cursor, 1);
    }

    return result;
  }

  private bucketTasksByDate(
    tasks: AdherenceTaskInput[],
    windowStart: Date,
    windowEnd: Date,
  ): Map<string, AdherenceTaskInput[]> {
    const map = new Map<string, AdherenceTaskInput[]>();
    for (const task of tasks) {
      const dayKey = toDateString(startOfDayUtc(task.date));
      const dayMs = startOfDayUtc(task.date).getTime();
      if (dayMs < windowStart.getTime() || dayMs > windowEnd.getTime()) continue;
      const bucket = map.get(dayKey);
      if (bucket) bucket.push(task);
      else map.set(dayKey, [task]);
    }
    return map;
  }

  private computeStreak(
    tasksByDate: Map<string, AdherenceTaskInput[]>,
    windowEnd: Date,
  ): number {
    // Walk from windowEnd backwards. A day "counts" toward the streak if
    // it has at least one completed task OR at least one skipped task
    // (treating skips as freezes). A day with NO tasks at all breaks.
    // If today (windowEnd) has nothing, we allow starting from yesterday.
    let cursor = new Date(windowEnd);
    let streak = 0;
    let allowedToStartLate = true;

    while (true) {
      const key = toDateString(cursor);
      const tasks = tasksByDate.get(key) ?? [];
      const hasCompleted = tasks.some((t) => t.isCompleted);
      const hasSkip = tasks.some((t) => !t.isCompleted && t.skipReason);
      const isActive = hasCompleted || hasSkip;

      if (!isActive) {
        if (allowedToStartLate && streak === 0) {
          // Today empty — try yesterday before declaring streak=0.
          allowedToStartLate = false;
          cursor = addDays(cursor, -1);
          continue;
        }
        break;
      }

      streak += 1;
      allowedToStartLate = false;
      cursor = addDays(cursor, -1);
    }

    return streak;
  }
}

const DAY_MS = 24 * 60 * 60 * 1000;

function startOfDayUtc(date: Date): Date {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

function toDateString(date: Date): string {
  return date.toISOString().split('T')[0];
}

function pct(numerator: number, denominator: number): number {
  if (denominator <= 0) return 0;
  return Math.round((numerator / denominator) * 100);
}

function mapTypeToCategory(
  type: string | null,
): 'workout' | 'nutrition' | 'habits' | null {
  if (!type) return null;
  const t = type.toLowerCase();
  if (t === 'workout') return 'workout';
  if (t === 'meal' || t === 'nutrition') return 'nutrition';
  if (t === 'habit') return 'habits';
  return null;
}
