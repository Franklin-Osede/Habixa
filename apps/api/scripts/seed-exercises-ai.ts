/* eslint-disable @typescript-eslint/no-floating-promises */
/**
 * Seed the exercise catalog with AI-generated entries using OpenAI
 * structured outputs.  Same pattern as seed-recipes-ai.ts.
 *
 * Usage (from apps/api/):
 *   pnpm tsx scripts/seed-exercises-ai.ts
 *   pnpm tsx scripts/seed-exercises-ai.ts --dry
 */

import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import OpenAI from 'openai';
import { zodResponseFormat } from 'openai/helpers/zod';
import {
  AiExercise,
  aiExerciseBatchSchema,
} from '../src/modules/planning/application/exercise-seed/exercise-seed.schema';

interface Slot {
  muscleGroup:
    | 'Legs'
    | 'Chest'
    | 'Back'
    | 'Shoulders'
    | 'Arms'
    | 'Core'
    | 'Glutes'
    | 'Full Body'
    | 'Cardio';
  count: number;
  guidance: string;
}

const DEFAULT_PLAN: Slot[] = [
  {
    muscleGroup: 'Legs',
    count: 6,
    guidance:
      'Mix bodyweight (squat, lunge), dumbbell (goblet squat, RDL) and barbell (back squat, deadlift) movements. Cover squat and hinge patterns. Include at least one beginner option.',
  },
  {
    muscleGroup: 'Chest',
    count: 4,
    guidance:
      'Push-up variations and presses. Bodyweight, dumbbell, barbell and machine. Avoid dips (already classified as triceps).',
  },
  {
    muscleGroup: 'Back',
    count: 5,
    guidance:
      'Pulling movements: rows (dumbbell, barbell, cable), pull-ups, lat pulldowns. Cover both vertical and horizontal pulls.',
  },
  {
    muscleGroup: 'Shoulders',
    count: 3,
    guidance: 'Overhead press variations and lateral raises. Mix equipment.',
  },
  {
    muscleGroup: 'Arms',
    count: 3,
    guidance: 'Biceps curl + triceps extension variations. Dumbbell or cable.',
  },
  {
    muscleGroup: 'Core',
    count: 4,
    guidance:
      'Anti-rotation, anti-extension and hip-flexion patterns. Plank variations, hanging leg raises, dead bug. Bodyweight by default.',
  },
  {
    muscleGroup: 'Glutes',
    count: 3,
    guidance:
      'Hip-thrust variations, glute bridges, single-leg variants. Hinge pattern.',
  },
  {
    muscleGroup: 'Cardio',
    count: 2,
    guidance:
      'Conditioning movements: kettlebell swings, burpees. Tag movementPattern Cardio.',
  },
];

const MODEL = 'gpt-4o-mini';
const BATCH_SIZE = 4;
const prisma = new PrismaClient();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

function buildSystemPrompt(): string {
  return [
    'You are a strength & conditioning coach generating exercises for a fitness app.',
    'Constraints (CRITICAL):',
    '- Exercise names in English Title Case (e.g. "Goblet Squat"), no abbreviations.',
    '- Each exercise gets ONE muscleGroup (the primary mover).',
    '- Each exercise gets ONE equipment from the canonical list.',
    '- jointStress is a comma-separated short list (e.g. "Knee, Hip"), max 80 chars.',
    '- expertCues are 1-2 short sentences with actionable form pointers.',
    '- description is 2-3 sentences explaining the movement.',
    '- Be honest about difficulty — beginner-friendly variants exist.',
  ].join('\n');
}

function buildUserPrompt(slot: Slot, count: number, existingNames: string[]): string {
  return [
    `Generate ${count} unique ${slot.muscleGroup} exercises.`,
    slot.guidance,
    existingNames.length
      ? `Avoid these names already in the catalog: ${existingNames.slice(-30).join('; ')}.`
      : 'There are no existing exercises yet.',
    'Return them as a JSON object with field "exercises": array of exercise objects matching the schema.',
  ].join('\n');
}

async function generateBatch(
  slot: Slot,
  count: number,
  existingNames: string[],
): Promise<AiExercise[]> {
  const completion = await openai.chat.completions.parse({
    model: MODEL,
    messages: [
      { role: 'system', content: buildSystemPrompt() },
      { role: 'user', content: buildUserPrompt(slot, count, existingNames) },
    ],
    response_format: zodResponseFormat(aiExerciseBatchSchema, 'exercise_batch'),
  });

  const parsed = completion.choices[0]?.message?.parsed;
  if (!parsed) throw new Error('OpenAI returned no parsed payload');
  return parsed.exercises;
}

async function persistExercise(exercise: AiExercise) {
  const conflict = await prisma.exercise.findUnique({
    where: { name: exercise.name },
    select: { id: true },
  });
  if (conflict) return { skipped: true, id: conflict.id };

  const created = await prisma.exercise.create({
    data: {
      name: exercise.name,
      description: exercise.description,
      expertCues: exercise.expertCues,
      difficulty: exercise.difficulty,
      muscleGroup: exercise.muscleGroup,
      equipment: exercise.equipment,
      movementPattern: exercise.movementPattern,
      jointStress: exercise.jointStress,
    },
  });
  return { skipped: false, id: created.id };
}

function parseArgs(argv: string[]): { dry: boolean } {
  return { dry: argv.includes('--dry') };
}

async function main() {
  if (!process.env.OPENAI_API_KEY) {
    console.error('Missing OPENAI_API_KEY in environment.');
    process.exit(1);
  }

  const args = parseArgs(process.argv);
  const startNames = (
    await prisma.exercise.findMany({ select: { name: true } })
  ).map((e) => e.name);

  console.log(
    `\n[seed] starting. existing exercises: ${startNames.length}. ` +
      `slots: ${DEFAULT_PLAN.map((s) => `${s.muscleGroup}=${s.count}`).join(', ')}. ` +
      `${args.dry ? '[DRY RUN]' : ''}\n`,
  );

  let totalCreated = 0;
  let totalSkipped = 0;
  let totalFailed = 0;
  const seenNames = new Set(startNames.map((n) => n.toLowerCase()));

  for (const slot of DEFAULT_PLAN) {
    let remaining = slot.count;
    while (remaining > 0) {
      const batchSize = Math.min(BATCH_SIZE, remaining);
      console.log(`[seed] requesting ${batchSize} ${slot.muscleGroup} exercises...`);
      try {
        const exercises = await generateBatch(slot, batchSize, Array.from(seenNames));

        for (const exercise of exercises) {
          if (seenNames.has(exercise.name.toLowerCase())) {
            totalSkipped += 1;
            console.log(`  ↻ skip duplicate: ${exercise.name}`);
            continue;
          }
          if (args.dry) {
            console.log(`  · [dry] would create: ${exercise.name}`);
            seenNames.add(exercise.name.toLowerCase());
            totalCreated += 1;
            continue;
          }
          try {
            const result = await persistExercise(exercise);
            seenNames.add(exercise.name.toLowerCase());
            if (result.skipped) {
              totalSkipped += 1;
              console.log(`  ↻ already in DB: ${exercise.name}`);
            } else {
              totalCreated += 1;
              console.log(`  ✓ created: ${exercise.name}`);
            }
          } catch (err) {
            totalFailed += 1;
            console.error(`  ✗ failed to persist ${exercise.name}:`, err);
          }
        }

        remaining -= batchSize;
      } catch (err) {
        totalFailed += batchSize;
        console.error(`[seed] batch for ${slot.muscleGroup} failed:`, err);
        remaining -= batchSize;
      }
    }
  }

  console.log(
    `\n[seed] done. created=${totalCreated}, skipped=${totalSkipped}, failed=${totalFailed}`,
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
