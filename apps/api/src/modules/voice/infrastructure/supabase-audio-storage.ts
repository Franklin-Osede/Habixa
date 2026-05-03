import { Injectable, Logger } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  AudioStoragePort,
  AudioStorageResult,
  AudioStorageUpload,
} from '../application/ports/audio-storage.port';

const DEFAULT_BUCKET = 'habixa-voice';

@Injectable()
export class SupabaseAudioStorage implements AudioStoragePort {
  private readonly logger = new Logger(SupabaseAudioStorage.name);
  private readonly client: SupabaseClient | null;
  private readonly bucket: string;
  private bucketReady = false;

  constructor() {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    this.bucket = process.env.VOICE_AUDIO_BUCKET ?? DEFAULT_BUCKET;

    if (!url || !key) {
      this.logger.warn(
        'Supabase credentials missing — audio uploads will fail until SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in apps/api/.env',
      );
      this.client = null;
      return;
    }

    this.client = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }

  async upload(upload: AudioStorageUpload): Promise<AudioStorageResult> {
    if (!this.client) {
      throw new Error(
        'Supabase storage client is not configured. Add SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY to apps/api/.env.',
      );
    }

    await this.ensureBucket();

    const { error } = await this.client.storage
      .from(this.bucket)
      .upload(upload.key, upload.audio, {
        contentType: upload.contentType,
        // Overwrite on re-generation so we can refresh a cue's wording
        // without rotating its key (and breaking persisted audioUrl rows).
        upsert: true,
        cacheControl: '604800', // 1 week — cues are stable
      });

    if (error) {
      throw new Error(`Supabase upload failed: ${error.message}`);
    }

    const { data } = this.client.storage
      .from(this.bucket)
      .getPublicUrl(upload.key);

    return {
      publicUrl: data.publicUrl,
      storedAt: new Date(),
    };
  }

  /**
   * Idempotent — calls listBuckets first and only creates if missing.
   * Done lazily on the first upload so a missing bucket does not crash
   * app startup; the cost is one extra network round-trip on the very
   * first cue per process.
   */
  private async ensureBucket(): Promise<void> {
    if (this.bucketReady || !this.client) return;
    const { data, error } = await this.client.storage.listBuckets();
    if (error) {
      // Non-fatal: maybe the role doesn't have list permission. Try
      // the upload anyway — if the bucket really is missing we'll get
      // a clearer error from the upload call.
      this.logger.warn(`listBuckets failed: ${error.message}`);
      this.bucketReady = true;
      return;
    }
    const exists = (data ?? []).some((b) => b.name === this.bucket);
    if (!exists) {
      const { error: createErr } = await this.client.storage.createBucket(
        this.bucket,
        { public: true },
      );
      if (createErr) {
        // Race: another worker just created it. Treat name-conflict as success.
        const message = createErr.message.toLowerCase();
        if (!message.includes('already exists') && !message.includes('duplicate')) {
          throw new Error(
            `Supabase createBucket failed: ${createErr.message}`,
          );
        }
      } else {
        this.logger.log(`Created Supabase Storage bucket "${this.bucket}"`);
      }
    }
    this.bucketReady = true;
  }
}
