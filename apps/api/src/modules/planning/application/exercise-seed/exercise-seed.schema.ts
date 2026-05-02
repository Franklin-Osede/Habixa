import { z } from 'zod';

/**
 * Schema for an AI-generated exercise. Mirrors the Exercise table.
 *
 * Tightening rules:
 * - Difficulty / muscleGroup / equipment / movementPattern are constrained
 *   enums so the catalog stays consistent and shoppable by tags (which the
 *   OpenClaw planner already uses).
 * - jointStress is a free-text list of joints, but capped to keep things
 *   sane.
 * - expertCues are short, actionable form pointers — not paragraphs.
 */

export const DIFFICULTIES = ['Beginner', 'Intermediate', 'Advanced'] as const;
export type Difficulty = (typeof DIFFICULTIES)[number];

export const MUSCLE_GROUPS = [
  'Legs',
  'Chest',
  'Back',
  'Shoulders',
  'Arms',
  'Core',
  'Glutes',
  'Full Body',
  'Cardio',
] as const;
export type MuscleGroup = (typeof MUSCLE_GROUPS)[number];

export const EQUIPMENT_OPTIONS = [
  'Bodyweight',
  'Dumbbell',
  'Barbell',
  'Kettlebell',
  'Machine',
  'Cable',
  'Resistance Band',
  'Pull-up Bar',
] as const;
export type Equipment = (typeof EQUIPMENT_OPTIONS)[number];

export const MOVEMENT_PATTERNS = [
  'Squat',
  'Hinge',
  'Push',
  'Pull',
  'Carry',
  'Rotation',
  'Lunge',
  'Core',
  'Cardio',
] as const;
export type MovementPattern = (typeof MOVEMENT_PATTERNS)[number];

export const aiExerciseSchema = z.object({
  name: z.string().min(3).max(60),
  description: z.string().min(20).max(400),
  expertCues: z.string().min(10).max(300),
  difficulty: z.enum(DIFFICULTIES),
  muscleGroup: z.enum(MUSCLE_GROUPS),
  equipment: z.enum(EQUIPMENT_OPTIONS),
  movementPattern: z.enum(MOVEMENT_PATTERNS),
  jointStress: z.string().max(80),
});

export type AiExercise = z.infer<typeof aiExerciseSchema>;

export const aiExerciseBatchSchema = z.object({
  exercises: z.array(aiExerciseSchema).min(1).max(30),
});
export type AiExerciseBatch = z.infer<typeof aiExerciseBatchSchema>;
