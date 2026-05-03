import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/common/prisma.service';
import { configureApp } from './../src/setup/configure-app';
import { COACH_LLM_PORT } from './../src/modules/coach/application/ports/coach-llm.port';
import {
  CoachLlmStub,
  textTurn,
  toolUseTurn,
} from './../src/modules/coach/application/coach-llm.stub';

const TEST_EMAIL = 'coach-e2e@example.com';
const TEST_PASSWORD = 'Password123!';
const ENDPOINT = '/v1/coach/message';

describe('POST /v1/coach/message (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let accessToken: string;
  let userId: string;
  let stub: CoachLlmStub;

  beforeAll(async () => {
    stub = new CoachLlmStub([]);

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(COACH_LLM_PORT)
      .useValue(stub)
      .compile();

    app = moduleFixture.createNestApplication();
    configureApp(app);
    await app.init();

    prisma = app.get<PrismaService>(PrismaService);
    await cleanupUser(prisma, TEST_EMAIL);

    await request(app.getHttpServer() as never)
      .post('/v1/identity/register')
      .send({ email: TEST_EMAIL, password: TEST_PASSWORD });
    const loginRes = await request(app.getHttpServer() as never)
      .post('/v1/auth/login')
      .send({ email: TEST_EMAIL, password: TEST_PASSWORD });
    accessToken = loginRes.body.accessToken;
    const user = await prisma.user.findUnique({
      where: { email: TEST_EMAIL },
    });
    userId = user!.id;
  });

  beforeEach(async () => {
    await prisma.coachMessage.deleteMany({
      where: { conversation: { userId } },
    });
    await prisma.coachConversation.deleteMany({ where: { userId } });
    // Reset the scripted stub.
    (stub as any).cursor = 0;
    (stub as any).script = [];
    (stub as any).receivedRequests.length = 0;
  });

  afterAll(async () => {
    await cleanupUser(prisma, TEST_EMAIL);
    await app.close();
  });

  function loadScript(...turns: ReturnType<typeof textTurn>[]) {
    (stub as any).cursor = 0;
    (stub as any).script = turns;
  }

  it('returns 401 without auth', () => {
    return request(app.getHttpServer() as never)
      .post(ENDPOINT)
      .send({ message: 'hi' })
      .expect(401);
  });

  it('returns 400 when message is missing or blank', async () => {
    await request(app.getHttpServer() as never)
      .post(ENDPOINT)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({})
      .expect(400);
    await request(app.getHttpServer() as never)
      .post(ENDPOINT)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ message: '   ' })
      .expect(400);
  });

  it('returns the assistant reply and a fresh conversationId', async () => {
    loadScript(textTurn('¡Hola! ¿En qué te ayudo?'));

    const res = await request(app.getHttpServer() as never)
      .post(ENDPOINT)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ message: 'Hola' })
      .expect(201);

    expect(res.body.reply).toBe('¡Hola! ¿En qué te ayudo?');
    expect(res.body.conversationId).toEqual(expect.any(String));

    const persisted = await prisma.coachMessage.findMany({
      where: { conversation: { userId } },
      orderBy: { createdAt: 'asc' },
    });
    expect(persisted.map((m) => m.role)).toEqual(['user', 'assistant']);
  });

  it('drives a tool-use loop end-to-end and persists tool turns', async () => {
    loadScript(
      toolUseTurn('call-1', 'get_today_plan', {}),
      textTurn('Hoy te toca pierna y 2000 kcal.'),
    );

    const res = await request(app.getHttpServer() as never)
      .post(ENDPOINT)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ message: '¿Qué entreno toca?' })
      .expect(201);

    expect(res.body.reply).toContain('pierna');

    const persisted = await prisma.coachMessage.findMany({
      where: { conversation: { userId } },
      orderBy: { createdAt: 'asc' },
    });
    // user, assistant(tool_use), tool, assistant(text)
    expect(persisted.map((m) => m.role)).toEqual([
      'user',
      'assistant',
      'tool',
      'assistant',
    ]);

    // The tool message should record which tool was called.
    const toolMsg = persisted.find((m) => m.role === 'tool');
    expect(toolMsg).toBeDefined();
    expect((toolMsg!.metadata as any).toolName).toBe('get_today_plan');
  });

  it('reuses an existing conversation when conversationId is supplied', async () => {
    loadScript(textTurn('First'));
    const first = await request(app.getHttpServer() as never)
      .post(ENDPOINT)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ message: 'first' })
      .expect(201);

    loadScript(textTurn('Second'));
    const second = await request(app.getHttpServer() as never)
      .post(ENDPOINT)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        message: 'second',
        conversationId: first.body.conversationId,
      })
      .expect(201);

    expect(second.body.conversationId).toBe(first.body.conversationId);
    const persisted = await prisma.coachMessage.findMany({
      where: { conversationId: first.body.conversationId },
    });
    expect(persisted).toHaveLength(4); // 2 user + 2 assistant
  });
});

async function cleanupUser(prisma: PrismaService, email: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return;
  await prisma.coachMessage.deleteMany({
    where: { conversation: { userId: user.id } },
  });
  await prisma.coachConversation.deleteMany({ where: { userId: user.id } });
  await prisma.user.deleteMany({ where: { id: user.id } });
}
