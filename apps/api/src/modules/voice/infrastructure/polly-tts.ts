import { Injectable, Logger } from '@nestjs/common';
import {
  PollyClient,
  SynthesizeSpeechCommand,
  Engine,
  OutputFormat,
  VoiceId,
} from '@aws-sdk/client-polly';
import {
  TtsPort,
  TtsRequest,
  TtsResponse,
  VoicePersona,
  SupportedLocale,
} from '../application/ports/tts.port';

/**
 * Production TtsPort backed by Amazon Polly Neural voices.
 *
 * Persona ↔ voice mapping is intentional rather than algorithmic:
 *   - "lupe"   → Lupe   (es-US, female, energetic — fits fitness coach)
 *   - "sergio" → Sergio (es-ES, male, formal — morning summary)
 *   - "mia"    → Mia    (es-MX, female, warm — recovery / mindset)
 *
 * All three are Neural-tier ($16/M chars) and cover the canonical
 * Spanish locales the app supports. Standard voices are cheaper but
 * the synthetic accent ruins the coach feel; Generative is overkill
 * for short cues.
 */
type VoiceConfig = {
  voiceId: VoiceId;
  /** Some Neural voices only run on certain engines. */
  engine: Engine;
};

const VOICE_MATRIX: Record<
  VoicePersona,
  Partial<Record<SupportedLocale, VoiceConfig>>
> = {
  lupe: {
    'es-US': { voiceId: VoiceId.Lupe, engine: Engine.NEURAL },
  },
  sergio: {
    'es-ES': { voiceId: VoiceId.Sergio, engine: Engine.NEURAL },
  },
  mia: {
    'es-MX': { voiceId: VoiceId.Mia, engine: Engine.NEURAL },
  },
};

@Injectable()
export class PollyTts implements TtsPort {
  private readonly logger = new Logger(PollyTts.name);
  private readonly client: PollyClient;

  constructor() {
    if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
      this.logger.warn(
        'AWS credentials missing — Polly synthesis will fail until they are set in apps/api/.env',
      );
    }
    this.client = new PollyClient({
      region: process.env.AWS_REGION ?? 'us-east-1',
    });
  }

  async synthesize(request: TtsRequest): Promise<TtsResponse> {
    const config = this.resolveVoice(request.voicePersona, request.locale);

    const response = await this.client.send(
      new SynthesizeSpeechCommand({
        OutputFormat: OutputFormat.MP3,
        Engine: config.engine,
        Text: request.text,
        VoiceId: config.voiceId,
        LanguageCode: request.locale,
      }),
    );

    if (!response.AudioStream) {
      throw new Error('Polly returned no AudioStream');
    }

    // The SDK exposes the audio as a Node.js Readable. Convert to a
    // Buffer so the rest of the pipeline can stay framework-agnostic.
    const chunks: Buffer[] = [];
    for await (const chunk of response.AudioStream as AsyncIterable<Uint8Array>) {
      chunks.push(Buffer.from(chunk));
    }
    const audio = Buffer.concat(chunks);

    return {
      audio,
      contentType: response.ContentType ?? 'audio/mpeg',
      // Polly does not return a duration; the mobile player computes it
      // on demand. Leave undefined so the persistence layer stores null.
    };
  }

  private resolveVoice(
    persona: VoicePersona,
    locale: SupportedLocale,
  ): VoiceConfig {
    const exact = VOICE_MATRIX[persona]?.[locale];
    if (exact) return exact;

    // Fall back to the persona's primary voice if the requested locale
    // doesn't have a dedicated mapping (e.g. asking for Lupe in es-MX).
    // Keeps the experience consistent even when locale / persona drift
    // out of sync.
    const fallbackEntries = Object.values(VOICE_MATRIX[persona] ?? {});
    if (fallbackEntries.length > 0) {
      this.logger.warn(
        `No exact ${persona}/${locale} voice; falling back to persona default`,
      );
      return fallbackEntries[0]!;
    }

    // Last-resort fallback: Lupe es-US.
    this.logger.error(
      `Unknown persona ${persona}; falling back to Lupe es-US`,
    );
    return { voiceId: VoiceId.Lupe, engine: Engine.NEURAL };
  }
}
