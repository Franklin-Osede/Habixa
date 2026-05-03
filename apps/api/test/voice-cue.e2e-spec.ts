import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/common/prisma.service';
import { configureApp } from './../src/setup/configure-app';
import { TTS_PORT } from './../src/modules/voice/application/ports/tts.port';
import { AUDIO_STORAGE_PORT } from './../src/modules/voice/application/ports/audio-storage.port';

const TEST_EMAIL = 'voice-cue-e2e@example.com';
const TEST_PASSWORD = 'Password123!';
const ENDPOINT = '/v1/voice/cue';

describe('GET /v1/voice/cue (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let accessToken: string;
  let userId: string;
  let exerciseId: string;

  // In-memory stand-ins for the real Polly + Supabase adapters so the
  // suite is fast and free.
  const ttsStub = {
    calls: [] as unknown[],
    async synthesize(req: unknown) {
      this.calls.push(req);
      return {
        audio: Buffer.from('fake-mp3'),
        contentType: 'audio/mpeg',
        durationMs: 1234,
      };
    },
  };

  const storageStub = {
    uploads: [] as Array<{ key: string }>,
    async upload(payload: { key: string; audio: Buffer; contentType: string }) {
      this.uploads.push({ key: payload.key });
      return {
        publicUrl: `https://stub.local/voice/${payload.key}`,
        storedAt: new Date(),
      };
    },
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(TTS_PORT)
      .useValue(ttsStub)
      .overrideProvider(AUDIO_STORAGE_PORT)
      .useValue(storageStub)
      .compile();

    app = moduleFixture.createNestApplication();
    configureApp(app);
    await app.init();

    prisma = app.get<PrismaService>(PrismaService);
    await cleanup(prisma, TEST_EMAIL);

    await request(app.getHttpServer() as never)
      .post('/v1/identity/register')
      .send({ email: TEST_EMAIL, password: TEST_PASSWORD });
    const loginRes = await request(app.getHttpServer() as never)
      .post('/v1/auth/login')
      .send({ email: TEST_EMAIL, password: TEST_PASSWORD });
    accessToken = loginRes.body.accessToken;
    const user = await prisma.user.findUnique({ where: { email: TEST_EMAIL } });
    userId = user!.id;

    const exercise = await prisma.exercise.create({
      data: {
        name: 'Voice Test Squat',
        description: 'Test exercise for voice cue tests.',
        expertCues: 'Keep chest up.',
        difficulty: 'Beginner',
        muscleGroup: 'Legs',
        equipment: 'Bodyweight',
        movementPattern: 'Squat',
        jointStress: 'Knee',
      },
    });
    exerciseId = exercise.id;
  });

  beforeEach(async () => {
    await prisma.voiceCue.deleteMany({ where: { exerciseId } });
    await prisma.voiceCue.deleteMany({ where: { exerciseId: null } });
    ttsStub.calls.length = 0;
    storageStub.uploads.length = 0;
  });

  afterAll(async () => {
    await prisma.voiceCue.deleteMany({ where: { exerciseId } });
    await prisma.exercise.deleteMany({ where: { id: exerciseId } });
    await cleanup(prisma, TEST_EMAIL);
    await app.close();
  });

  it('returns 401 without auth', () => {
    return request(app.getHttpServer() as never)
      .get(`${ENDPOINT}?kind=intro`)
      .expect(401);
  });

  it('returns 400 when kind is missing or invalid', async () => {
    await request(app.getHttpServer() as never)
      .get(ENDPOINT)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(400);

    await request(app.getHttpServer() as never)
      .get(`${ENDPOINT}?kind=lol`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(400);
  });

  it('synthesizes on cache miss and persists with the inferred persona/locale', async () => {
    const res = await request(app.getHttpServer() as never)
      .get(`${ENDPOINT}?kind=intro&exerciseId=${exerciseId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(res.body.audioUrl).toMatch(/^https:\/\/stub\.local\/voice\//);
    expect(res.body.voicePersona).toBe('lupe'); // default
    expect(res.body.locale).toBe('es-US'); // default for lupe
    expect(res.body.cueKind).toBe('intro');

    // The script should reference the seeded exercise name.
    expect(res.body.scriptText).toContain('Voice Test Squat');

    expect(ttsStub.calls).toHaveLength(1);
    expect(storageStub.uploads).toHaveLength(1);
    expect(storageStub.uploads[0].key).toContain('lupe/');
    expect(storageStub.uploads[0].key).toContain('intro');

    const persisted = await prisma.voiceCue.findFirst({
      where: { exerciseId },
    });
    expect(persisted).not.toBeNull();
    expect(persisted!.voicePersona).toBe('lupe');
    expect(persisted!.audioUrl).toBe(res.body.audioUrl);
    expect(persisted!.durationMs).toBe(1234);
  });

  it('hits cache on the second call (no extra TTS / upload work)', async () => {
    await request(app.getHttpServer() as never)
      .get(`${ENDPOINT}?kind=last_rep&exerciseId=${exerciseId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    await request(app.getHttpServer() as never)
      .get(`${ENDPOINT}?kind=last_rep&exerciseId=${exerciseId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(ttsStub.calls).toHaveLength(1);
    expect(storageStub.uploads).toHaveLength(1);
  });

  it('respects an explicit persona + locale combo', async () => {
    const res = await request(app.getHttpServer() as never)
      .get(`${ENDPOINT}?kind=intro&persona=sergio&locale=es-ES&exerciseId=${exerciseId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(res.body.voicePersona).toBe('sergio');
    expect(res.body.locale).toBe('es-ES');
    expect(storageStub.uploads[0].key).toContain('sergio/es-ES/');
    // Sergio's intro phrasing differs from Lupe's.
    expect(res.body.scriptText.toLowerCase()).toContain('comenzamos');
  });

  it('supports global cues (no exerciseId) for morning_summary', async () => {
    const res = await request(app.getHttpServer() as never)
      .get(`${ENDPOINT}?kind=morning_summary`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(res.body.exerciseId).toBeNull();
    expect(storageStub.uploads[0].key).toContain('/global.mp3');
    expect(res.body.scriptText.toLowerCase()).toContain('buenos días');

    // Stored row uses NULL exerciseId.
    const row = await prisma.voiceCue.findFirst({
      where: { cueKind: 'morning_summary' },
    });
    expect(row?.exerciseId).toBeNull();
  });
});

async function cleanup(prisma: PrismaService, email: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return;
  await prisma.userVoicePreference.deleteMany({ where: { userId: user.id } });
  await prisma.user.deleteMany({ where: { id: user.id } });
}
