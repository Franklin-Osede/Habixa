/**
 * Provider-agnostic contract for synthesising speech audio. Polly is
 * the planned provider but anything returning an mp3 buffer works
 * (ElevenLabs, OpenAI tts-1, on-device TTS for offline mode...).
 *
 * Voice persona maps to a per-provider voice id inside the adapter so
 * the rest of the codebase only knows our internal names ("lupe" /
 * "sergio" / "mia") rather than provider-specific identifiers.
 */

export type SupportedLocale = 'es-US' | 'es-ES' | 'es-MX';
export type VoicePersona = 'lupe' | 'sergio' | 'mia';

export interface TtsRequest {
  text: string;
  locale: SupportedLocale;
  voicePersona: VoicePersona;
}

export interface TtsResponse {
  audio: Buffer;
  contentType: string; // e.g. "audio/mpeg"
  durationMs?: number;
}

export const TTS_PORT = Symbol('TTS_PORT');

export interface TtsPort {
  synthesize(request: TtsRequest): Promise<TtsResponse>;
}
