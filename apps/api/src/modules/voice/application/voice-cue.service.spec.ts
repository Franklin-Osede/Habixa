import { VoiceCueService } from './voice-cue.service';
import {
  TtsPort,
  TtsRequest,
  TtsResponse,
} from './ports/tts.port';
import {
  AudioStoragePort,
  AudioStorageResult,
  AudioStorageUpload,
} from './ports/audio-storage.port';
import { VoiceCueScriptService } from './voice-cue-script.service';

class StubTts implements TtsPort {
  calls: TtsRequest[] = [];
  constructor(
    private readonly response: TtsResponse = {
      audio: Buffer.from('fake-mp3'),
      contentType: 'audio/mpeg',
      durationMs: 1500,
    },
  ) {}
  async synthesize(req: TtsRequest): Promise<TtsResponse> {
    this.calls.push(req);
    return this.response;
  }
}

class StubStorage implements AudioStoragePort {
  uploads: AudioStorageUpload[] = [];
  async upload(upload: AudioStorageUpload): Promise<AudioStorageResult> {
    this.uploads.push(upload);
    return {
      publicUrl: `https://stub.local/${upload.key}`,
      storedAt: new Date(),
    };
  }
}

interface VoiceCueRow {
  id: string;
  exerciseId: string | null;
  cueKind: string;
  locale: string;
  voicePersona: string;
  scriptText: string;
  audioUrl: string;
  durationMs: number | null;
  generatedAt: Date;
}

class InMemoryVoiceCueRepo {
  private rows: VoiceCueRow[] = [];
  private idCounter = 0;

  async findUnique(where: {
    exerciseId: string | null;
    cueKind: string;
    locale: string;
    voicePersona: string;
  }): Promise<VoiceCueRow | null> {
    return (
      this.rows.find(
        (r) =>
          r.exerciseId === where.exerciseId &&
          r.cueKind === where.cueKind &&
          r.locale === where.locale &&
          r.voicePersona === where.voicePersona,
      ) ?? null
    );
  }

  async create(data: Omit<VoiceCueRow, 'id' | 'generatedAt'>): Promise<VoiceCueRow> {
    this.idCounter += 1;
    const row: VoiceCueRow = {
      ...data,
      id: `cue-${this.idCounter}`,
      generatedAt: new Date(),
    };
    this.rows.push(row);
    return row;
  }

  // helper for tests
  getAll() {
    return [...this.rows];
  }
}

function makeService(opts: {
  tts?: StubTts;
  storage?: StubStorage;
  repo?: InMemoryVoiceCueRepo;
} = {}) {
  const tts = opts.tts ?? new StubTts();
  const storage = opts.storage ?? new StubStorage();
  const repo = opts.repo ?? new InMemoryVoiceCueRepo();
  const scripts = new VoiceCueScriptService();
  const service = new VoiceCueService(tts, storage, scripts, repo as never);
  return { service, tts, storage, repo, scripts };
}

describe('VoiceCueService.getOrGenerate', () => {
  it('returns the cached cue without calling TTS or storage on hit', async () => {
    const repo = new InMemoryVoiceCueRepo();
    await repo.create({
      exerciseId: 'ex-1',
      cueKind: 'intro',
      locale: 'es-US',
      voicePersona: 'lupe',
      scriptText: 'cached',
      audioUrl: 'https://stub.local/cached.mp3',
      durationMs: 1000,
    });

    const { service, tts, storage } = makeService({ repo });

    const result = await service.getOrGenerate({
      exerciseId: 'ex-1',
      cueKind: 'intro',
      locale: 'es-US',
      voicePersona: 'lupe',
    });

    expect(result.audioUrl).toBe('https://stub.local/cached.mp3');
    expect(result.scriptText).toBe('cached');
    expect(tts.calls).toHaveLength(0);
    expect(storage.uploads).toHaveLength(0);
  });

  it('synthesizes + uploads + persists on cache miss', async () => {
    const { service, tts, storage, repo } = makeService();

    const result = await service.getOrGenerate({
      exerciseId: 'ex-2',
      cueKind: 'intro',
      locale: 'es-US',
      voicePersona: 'lupe',
      exerciseName: 'Goblet Squat',
      reps: '10-12',
    });

    expect(tts.calls).toHaveLength(1);
    expect(tts.calls[0].locale).toBe('es-US');
    expect(tts.calls[0].voicePersona).toBe('lupe');
    expect(tts.calls[0].text).toContain('Goblet Squat');

    expect(storage.uploads).toHaveLength(1);
    expect(storage.uploads[0].contentType).toBe('audio/mpeg');
    expect(storage.uploads[0].key).toContain('intro');
    expect(storage.uploads[0].key).toContain('lupe');

    expect(result.audioUrl).toContain('stub.local');
    expect(result.scriptText).toContain('Goblet Squat');

    const persisted = repo.getAll();
    expect(persisted).toHaveLength(1);
    expect(persisted[0].audioUrl).toBe(result.audioUrl);
    expect(persisted[0].durationMs).toBe(1500);
  });

  it('keeps separate cache rows per (exercise, kind, locale, persona)', async () => {
    const { service, tts, repo } = makeService();

    await service.getOrGenerate({
      exerciseId: 'ex-3',
      cueKind: 'intro',
      locale: 'es-US',
      voicePersona: 'lupe',
    });
    await service.getOrGenerate({
      exerciseId: 'ex-3',
      cueKind: 'intro',
      locale: 'es-ES',
      voicePersona: 'sergio',
    });
    await service.getOrGenerate({
      exerciseId: 'ex-3',
      cueKind: 'last_rep',
      locale: 'es-US',
      voicePersona: 'lupe',
    });

    expect(tts.calls).toHaveLength(3);
    expect(repo.getAll()).toHaveLength(3);
  });

  it('hits cache on the second call for the same key', async () => {
    const { service, tts } = makeService();

    await service.getOrGenerate({
      exerciseId: 'ex-4',
      cueKind: 'mid_set',
      locale: 'es-MX',
      voicePersona: 'mia',
    });
    await service.getOrGenerate({
      exerciseId: 'ex-4',
      cueKind: 'mid_set',
      locale: 'es-MX',
      voicePersona: 'mia',
    });

    expect(tts.calls).toHaveLength(1);
  });

  it('supports non-exercise cues (exerciseId=null) such as morning_summary', async () => {
    const { service, repo } = makeService();

    const result = await service.getOrGenerate({
      cueKind: 'morning_summary',
      locale: 'es-US',
      voicePersona: 'lupe',
    });

    expect(result.audioUrl).toContain('stub.local');
    const persisted = repo.getAll();
    expect(persisted).toHaveLength(1);
    expect(persisted[0].exerciseId).toBeNull();
  });

  it('builds an object key that is namespaced by persona + locale + kind', async () => {
    const { service, storage } = makeService();

    await service.getOrGenerate({
      exerciseId: 'ex-5',
      cueKind: 'rest_start',
      locale: 'es-ES',
      voicePersona: 'sergio',
      restSec: 60,
    });

    const key = storage.uploads[0].key;
    expect(key.startsWith('sergio/')).toBe(true);
    expect(key).toContain('es-ES');
    expect(key).toContain('rest_start');
    expect(key).toContain('ex-5');
    expect(key.endsWith('.mp3')).toBe(true);
  });
});
