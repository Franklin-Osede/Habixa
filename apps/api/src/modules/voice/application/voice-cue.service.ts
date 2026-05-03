import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma.service';
import {
  TtsPort,
  TTS_PORT,
  SupportedLocale,
  VoicePersona,
} from './ports/tts.port';
import {
  AudioStoragePort,
  AUDIO_STORAGE_PORT,
} from './ports/audio-storage.port';
import {
  CueKind,
  VoiceCueScriptService,
} from './voice-cue-script.service';

interface VoiceCueRepoLike {
  findUnique(where: {
    exerciseId: string | null;
    cueKind: string;
    locale: string;
    voicePersona: string;
  }): Promise<{
    id: string;
    exerciseId: string | null;
    cueKind: string;
    locale: string;
    voicePersona: string;
    scriptText: string;
    audioUrl: string;
    durationMs: number | null;
  } | null>;
  create(data: {
    exerciseId: string | null;
    cueKind: string;
    locale: string;
    voicePersona: string;
    scriptText: string;
    audioUrl: string;
    durationMs: number | null;
  }): Promise<{
    id: string;
    audioUrl: string;
    scriptText: string;
    durationMs: number | null;
  }>;
}

export interface GetOrGenerateInput {
  exerciseId?: string;
  cueKind: CueKind;
  locale: SupportedLocale;
  voicePersona: VoicePersona;
  // Optional context forwarded to the script generator. Ignored on cache hit.
  exerciseName?: string;
  reps?: string;
  setNumber?: number;
  totalSets?: number;
  restSec?: number;
}

export interface VoiceCueResult {
  audioUrl: string;
  scriptText: string;
  durationMs: number | null;
}

/**
 * Cache-aside service for synthesized audio cues.
 *
 *  1. Look up the unique row keyed by (exerciseId, cueKind, locale,
 *     voicePersona). Hit -> return persisted audioUrl.
 *  2. Miss -> generate the script text via VoiceCueScriptService,
 *     synthesize via the TTS port, upload via the storage port,
 *     persist the row, and return.
 *
 * The repo dependency is typed as a small Prisma-shaped interface
 * rather than PrismaService directly so the service unit tests can
 * pass an in-memory implementation without spinning up Postgres.
 * The production DI uses a thin wrapper around prisma.voiceCue.
 */
@Injectable()
export class VoiceCueService {
  constructor(
    @Inject(TTS_PORT) private readonly tts: TtsPort,
    @Inject(AUDIO_STORAGE_PORT)
    private readonly storage: AudioStoragePort,
    private readonly scripts: VoiceCueScriptService,
    @Inject('VOICE_CUE_REPO') private readonly repo: VoiceCueRepoLike,
  ) {}

  async getOrGenerate(input: GetOrGenerateInput): Promise<VoiceCueResult> {
    const exerciseId = input.exerciseId ?? null;

    const cached = await this.repo.findUnique({
      exerciseId,
      cueKind: input.cueKind,
      locale: input.locale,
      voicePersona: input.voicePersona,
    });
    if (cached) {
      return {
        audioUrl: cached.audioUrl,
        scriptText: cached.scriptText,
        durationMs: cached.durationMs,
      };
    }

    const scriptText = this.scripts.build({
      kind: input.cueKind,
      locale: input.locale,
      voicePersona: input.voicePersona,
      exerciseName: input.exerciseName,
      setNumber: input.setNumber,
      totalSets: input.totalSets,
      reps: input.reps,
      restSec: input.restSec,
    });

    const ttsResult = await this.tts.synthesize({
      text: scriptText,
      locale: input.locale,
      voicePersona: input.voicePersona,
    });

    const key = this.buildStorageKey(input, exerciseId);
    const stored = await this.storage.upload({
      key,
      audio: ttsResult.audio,
      contentType: ttsResult.contentType,
    });

    const persisted = await this.repo.create({
      exerciseId,
      cueKind: input.cueKind,
      locale: input.locale,
      voicePersona: input.voicePersona,
      scriptText,
      audioUrl: stored.publicUrl,
      durationMs: ttsResult.durationMs ?? null,
    });

    return {
      audioUrl: persisted.audioUrl,
      scriptText: persisted.scriptText,
      durationMs: persisted.durationMs,
    };
  }

  private buildStorageKey(
    input: GetOrGenerateInput,
    exerciseId: string | null,
  ): string {
    // Layout: <persona>/<locale>/<cueKind>/<exerciseId|global>.mp3
    // - persona-first so we can list/delete a single voice cheaply
    //   (e.g. "discontinue Sergio" = drop the sergio/ prefix).
    // - exerciseId or "global" so morning / ambient cues live next to
    //   exercise-bound ones without colliding.
    const exerciseSlug = exerciseId ?? 'global';
    return `${input.voicePersona}/${input.locale}/${input.cueKind}/${exerciseSlug}.mp3`;
  }
}

/**
 * Production wrapper around prisma.voiceCue exposed under the
 * VOICE_CUE_REPO DI token. Kept tiny so it stays trivially correct;
 * any logic belongs in VoiceCueService.
 */
@Injectable()
export class PrismaVoiceCueRepo implements VoiceCueRepoLike {
  constructor(private readonly prisma: PrismaService) {}

  async findUnique(where: {
    exerciseId: string | null;
    cueKind: string;
    locale: string;
    voicePersona: string;
  }) {
    // Prisma's findUnique on a composite index whose columns include a
    // nullable one requires non-null values, so we drop down to
    // findFirst here. The (exerciseId, cueKind, locale, voicePersona)
    // unique index still backs the query — Postgres uses it.
    return this.prisma.voiceCue.findFirst({
      where: {
        exerciseId: where.exerciseId,
        cueKind: where.cueKind,
        locale: where.locale,
        voicePersona: where.voicePersona,
      },
    });
  }

  async create(data: {
    exerciseId: string | null;
    cueKind: string;
    locale: string;
    voicePersona: string;
    scriptText: string;
    audioUrl: string;
    durationMs: number | null;
  }) {
    return this.prisma.voiceCue.create({ data });
  }
}
