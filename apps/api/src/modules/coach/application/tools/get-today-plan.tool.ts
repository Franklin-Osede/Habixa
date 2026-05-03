import { Injectable } from '@nestjs/common';
import { z } from 'zod';
import { PrismaService } from '../../../../common/prisma.service';
import { openClawWeekResponseSchema } from '../../../planning/application/plan-week.schema';
import { CoachTool, CoachToolContext } from './coach-tool.types';

const inputSchema = z.object({});
type Input = z.infer<typeof inputSchema>;

interface Output {
  status:
    | 'NOT_STARTED'
    | 'GENERATING'
    | 'FAILED'
    | 'READY';
  date?: string; // YYYY-MM-DD
  workout?: {
    id: string;
    title: string;
    exercises: Array<{
      name: string;
      sets: number;
      reps: string;
      restSec: number;
    }>;
  } | null;
  nutrition?: {
    targetKcal: number;
    meals: Array<{
      mealType: string;
      title: string;
      calories: number;
    }>;
  } | null;
  habits?: Array<{ title: string; target?: string }> | null;
}

/**
 * Read-only tool that summarises today's plan for the coach. Mirrors the
 * shape the LLM cares about (titles, kcal, sets/reps) without dumping
 * entire ingredient lists — those would blow the prompt budget. The
 * coach can call get_recipe / get_exercise for details on demand.
 */
@Injectable()
export class GetTodayPlanTool implements CoachTool<Input, Output> {
  readonly name = 'get_today_plan';
  readonly description =
    "Returns the user's training, nutrition and habits scheduled for today, " +
    'plus the lifecycle state of their lifestyle plan. Call this whenever ' +
    "the user asks about today's session, meals, or habits.";
  readonly inputSchema = inputSchema;

  constructor(private readonly prisma: PrismaService) {}

  async execute(_input: Input, ctx: CoachToolContext): Promise<Output> {
    const lifestylePlan = await this.prisma.lifestylePlan.findFirst({
      where: { userId: ctx.userId },
      orderBy: { createdAt: 'desc' },
      include: { weeks: { orderBy: { weekIndex: 'asc' } } },
    });

    if (!lifestylePlan) return { status: 'NOT_STARTED' };
    if (lifestylePlan.status === 'PENDING' || lifestylePlan.status === 'RUNNING') {
      return { status: 'GENERATING' };
    }
    if (lifestylePlan.status === 'FAILED') return { status: 'FAILED' };

    // status === READY
    const startDate = new Date(lifestylePlan.startDate);
    startDate.setUTCHours(0, 0, 0, 0);
    const today = new Date(ctx.now);
    today.setUTCHours(0, 0, 0, 0);
    const elapsed = Math.max(
      0,
      Math.floor((today.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000)),
    );
    const weekIndex = Math.floor(elapsed / 7) + 1;
    const dayIndex = (elapsed % 7) + 1;
    const week =
      lifestylePlan.weeks.find((w) => w.weekIndex === weekIndex) ||
      lifestylePlan.weeks[0];
    if (!week) return { status: 'READY', workout: null, nutrition: null, habits: null };

    const parsed = openClawWeekResponseSchema.safeParse(week.content);
    if (!parsed.success) {
      return { status: 'READY', workout: null, nutrition: null, habits: null };
    }
    const day =
      parsed.data.days.find((d) => d.dayIndex === dayIndex) ||
      parsed.data.days[0];

    // Hydrate exercise + recipe titles in two batched queries.
    const exerciseIds = day.workout.blocks.flatMap((b) =>
      b.exercises.map((e) => e.exerciseId),
    );
    const recipeIds = day.nutrition.meals.map((m) => m.recipeId);

    const [exercises, recipes] = await Promise.all([
      exerciseIds.length
        ? this.prisma.exercise.findMany({
            where: { id: { in: exerciseIds } },
            select: { id: true, name: true },
          })
        : Promise.resolve([]),
      recipeIds.length
        ? this.prisma.recipe.findMany({
            where: { id: { in: recipeIds } },
            select: { id: true, title: true, calories: true },
          })
        : Promise.resolve([]),
    ]);

    const exerciseById = new Map(exercises.map((e) => [e.id, e]));
    const recipeById = new Map(recipes.map((r) => [r.id, r]));

    return {
      status: 'READY',
      date: today.toISOString().split('T')[0],
      workout: {
        id: day.workout.id,
        title: day.workout.title,
        exercises: day.workout.blocks.flatMap((b) =>
          b.exercises.map((e) => ({
            name: exerciseById.get(e.exerciseId)?.name ?? '(unknown)',
            sets: e.sets,
            reps: e.reps,
            restSec: e.restSec ?? 60,
          })),
        ),
      },
      nutrition: {
        targetKcal: day.nutrition.totalKcalTarget,
        meals: day.nutrition.meals.map((m) => ({
          mealType: m.mealType,
          title: recipeById.get(m.recipeId)?.title ?? '(unknown)',
          calories: recipeById.get(m.recipeId)?.calories ?? 0,
        })),
      },
      habits: day.habits.map((h) => ({ title: h.title, target: h.target })),
    };
  }
}
