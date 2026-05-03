/* eslint-disable @typescript-eslint/no-floating-promises */
/**
 * Pre-generates intro cues for every exercise in the catalog using the
 * production Polly + Supabase Storage pipeline. Idempotent: cues that
 * already exist (matching exerciseId, cueKind, locale, persona) are
 * skipped via the same VoiceCueService cache-aside path the runtime
 * uses.
 *
 * Usage (from apps/api/):
 *   pnpm tsx scripts/seed-voice-cues.ts                        # Lupe es-US
 *   pnpm tsx scripts/seed-voice-cues.ts --persona=sergio
 *   pnpm tsx scripts/seed-voice-cues.ts --persona=mia --kinds=intro,last_rep
 *   pnpm tsx scripts/seed-voice-cues.ts --dry                  # no DB / Polly calls
 *
 * Cost (Polly Neural ≈ $16 / 1M chars):
 *   30 exercises × ~120 chars (intro) ≈ $0.06 per persona.
 */

import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/common/prisma.service';
import { VoiceCueService } from '../src/modules/voice/application/voice-cue.service';
import {
  SupportedLocale,
  VoicePersona,
} from '../src/modules/voice/application/ports/tts.port';
import { CueKind } from '../src/modules/voice/application/voice-cue-script.service';

const PERSONA_DEFAULT_LOCALE: Record<VoicePersona, SupportedLocale> = {
  lupe: 'es-US',
  sergio: 'es-ES',
  mia: 'es-MX',
};

interface Args {
  persona: VoicePersona;
  locale: SupportedLocale;
  kinds: CueKind[];
  dry: boolean;
}

function parseArgs(argv: string[]): Args {
  const get = (flag: string): string | undefined => {
    const arg = argv.find((a) => a.startsWith(`${flag}=`));
    return arg?.split('=')[1];
  };

  const persona = (get('--persona') as VoicePersona) ?? 'lupe';
  const locale =
    (get('--locale') as SupportedLocale) ?? PERSONA_DEFAULT_LOCALE[persona];
  const kindsRaw = get('--kinds') ?? 'intro';
  const kinds = kindsRaw.split(',') as CueKind[];
  const dry = argv.includes('--dry');

  return { persona, locale, kinds, dry };
}

async function main() {
  const args = parseArgs(process.argv);

  if (!process.env.AWS_ACCESS_KEY_ID || !process.env.SUPABASE_URL) {
    console.error(
      'Missing AWS_ACCESS_KEY_ID or SUPABASE_URL in env — seed cannot run.',
    );
    process.exit(1);
  }

  console.log(
    `\n[seed-voice] persona=${args.persona} locale=${args.locale} kinds=${args.kinds.join(',')} ${args.dry ? '[DRY]' : ''}\n`,
  );

  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn'],
  });
  const prisma = app.get(PrismaService);
  const voiceCueService = app.get(VoiceCueService);

  const exercises = await prisma.exercise.findMany({
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  });
  console.log(`Found ${exercises.length} exercises in catalog`);

  let created = 0;
  let skipped = 0;
  let failed = 0;

  for (const kind of args.kinds) {
    if (kind === 'intro') {
      // intro is exercise-bound: one cue per exercise.
      for (const exercise of exercises) {
        try {
          const before = await prisma.voiceCue.findFirst({
            where: {
              exerciseId: exercise.id,
              cueKind: 'intro',
              locale: args.locale,
              voicePersona: args.persona,
            },
            select: { id: true },
          });
          if (before) {
            skipped += 1;
            console.log(`  ↻ ${kind}: ${exercise.name} (cached)`);
            continue;
          }

          if (args.dry) {
            console.log(`  · [dry] would synthesize ${kind}: ${exercise.name}`);
            created += 1;
            continue;
          }

          const result = await voiceCueService.getOrGenerate({
            exerciseId: exercise.id,
            cueKind: 'intro',
            locale: args.locale,
            voicePersona: args.persona,
            exerciseName: exercise.name,
            reps: '10-12',
          });
          created += 1;
          console.log(`  ✓ ${kind}: ${exercise.name}`);
          void result.audioUrl;
        } catch (err) {
          failed += 1;
          console.error(`  ✗ ${kind}: ${exercise.name}:`, err);
        }
      }
    } else {
      // mid_set / last_rep / rest_start / morning_summary are global —
      // not exercise-bound. One row per (kind, locale, persona).
      try {
        const before = await prisma.voiceCue.findFirst({
          where: {
            exerciseId: null,
            cueKind: kind,
            locale: args.locale,
            voicePersona: args.persona,
          },
          select: { id: true },
        });
        if (before) {
          skipped += 1;
          console.log(`  ↻ ${kind}: <global> (cached)`);
          continue;
        }

        if (args.dry) {
          console.log(`  · [dry] would synthesize ${kind}: <global>`);
          created += 1;
          continue;
        }

        await voiceCueService.getOrGenerate({
          cueKind: kind,
          locale: args.locale,
          voicePersona: args.persona,
        });
        created += 1;
        console.log(`  ✓ ${kind}: <global>`);
      } catch (err) {
        failed += 1;
        console.error(`  ✗ ${kind}: <global>:`, err);
      }
    }
  }

  console.log(
    `\n[seed-voice] done. created=${created}, skipped=${skipped}, failed=${failed}\n`,
  );
  await app.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
