/**
 * Provider-agnostic contract for storing synthesized audio.
 *
 * Implementations:
 * - SupabaseAudioStorage (production) — uploads to Supabase Storage's
 *   `habixa-voice` bucket and returns the public URL.
 * - InMemoryAudioStorage (tests) — keeps the buffer in a Map and
 *   returns a deterministic in-memory URL the test can introspect.
 *
 * The key argument is opaque to the port — adapters decide how to
 * map it (Supabase uses it as the object path; a S3 adapter would
 * use it as the key after prefixing the bucket).
 */

export interface AudioStorageUpload {
  key: string;
  audio: Buffer;
  contentType: string;
}

export interface AudioStorageResult {
  publicUrl: string;
  storedAt: Date;
}

export const AUDIO_STORAGE_PORT = Symbol('AUDIO_STORAGE_PORT');

export interface AudioStoragePort {
  upload(upload: AudioStorageUpload): Promise<AudioStorageResult>;
}
