import { z } from 'zod';

export const PLAN_WEEK_SCHEMA_VERSION = 'plan_week_v1';

const generatedExerciseSchema = z.object({
  exerciseId: z.string().min(1),
  sets: z.number().int().min(1).max(10),
  reps: z.string().min(1).max(40),
  restSec: z.number().int().min(0).max(600).optional(),
});

const workoutBlockSchema = z.object({
  id: z.string().min(1),
  type: z.string().min(1),
  exercises: z.array(generatedExerciseSchema).min(1).max(12),
});

const workoutSchema = z.object({
  id: z.string().min(1),
  type: z.literal('workout'),
  title: z.string().min(1).max(120),
  blocks: z.array(workoutBlockSchema).min(1).max(6),
});

const mealSchema = z.object({
  id: z.string().min(1),
  type: z.literal('meal'),
  mealType: z.string().min(1).max(40),
  recipeId: z.string().min(1),
});

const nutritionSchema = z.object({
  id: z.string().min(1),
  type: z.literal('nutrition'),
  totalKcalTarget: z.number().int().min(800).max(6000),
  meals: z.array(mealSchema).min(1).max(8),
});

const habitSchema = z.object({
  id: z.string().min(1),
  type: z.literal('habit'),
  title: z.string().min(1).max(120),
  target: z.string().min(1).max(120).optional(),
});

export const planDaySchema = z.object({
  id: z.string().min(1),
  dayIndex: z.number().int().min(1).max(7),
  dailyTip: z.string().min(1).max(280),
  workout: workoutSchema,
  nutrition: nutritionSchema,
  habits: z.array(habitSchema).max(8).default([]),
});

export const openClawWeekResponseSchema = z.object({
  weekIndex: z.number().int().min(1).max(52),
  schemaVersion: z.literal(PLAN_WEEK_SCHEMA_VERSION).default(PLAN_WEEK_SCHEMA_VERSION),
  days: z.array(planDaySchema).length(7),
  rationale: z
    .object({
      goalMatch: z.string().max(300).optional(),
      dietMatch: z.string().max(300).optional(),
      equipmentMatch: z.string().max(300).optional(),
    })
    .optional(),
});

export type PlanWeekContent = z.infer<typeof openClawWeekResponseSchema>;
export type PlanDayContent = z.infer<typeof planDaySchema>;
