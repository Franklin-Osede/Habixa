/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/common/prisma.service';
import { configureApp } from './../src/setup/configure-app';

describe('Authentication (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    configureApp(app);
    await app.init();

    prisma = app.get<PrismaService>(PrismaService);
    // Cleanup
    await prisma.user.deleteMany({ where: { email: 'e2e@example.com' } });
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email: 'e2e@example.com' } });
    await app.close();
  });

  it('should register a new user', () => {
    return request(app.getHttpServer())
      .post('/v1/identity/register')
      .send({
        email: 'e2e@example.com',
        password: 'Password123!',
      })
      .expect(201);
  });

  it('should login with created user', async () => {
    const response = await request(app.getHttpServer())
      .post('/v1/auth/login')
      .send({
        email: 'e2e@example.com',
        password: 'Password123!',
      })
      .expect(201);

    expect(response.body).toHaveProperty('accessToken');
    expect(response.body).toHaveProperty('refreshToken');
  });

  it('should fail login with wrong password', () => {
    return request(app.getHttpServer())
      .post('/v1/auth/login')
      .send({
        email: 'e2e@example.com',
        password: 'WrongPassword!',
      })
      .expect(400);
  });
});

describe('Refresh token rotation (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  const email = 'e2e-refresh@example.com';
  const password = 'Password123!';
  const graceEnvBackup = process.env.JWT_REFRESH_GRACE_MS;

  const cleanup = async () => {
    const user = await prisma.user.findUnique({ where: { email } });
    if (user) {
      await prisma.refreshToken.deleteMany({ where: { userId: user.id } });
    }
    await prisma.user.deleteMany({ where: { email } });
  };

  const login = async (): Promise<{ accessToken: string; refreshToken: string }> => {
    const res = await request(app.getHttpServer())
      .post('/v1/auth/login')
      .send({ email, password })
      .expect(201);
    return res.body;
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    configureApp(app);
    await app.init();

    prisma = app.get<PrismaService>(PrismaService);
    await cleanup();
    await request(app.getHttpServer())
      .post('/v1/identity/register')
      .send({ email, password })
      .expect(201);
  });

  afterAll(async () => {
    await cleanup();
    if (graceEnvBackup === undefined) delete process.env.JWT_REFRESH_GRACE_MS;
    else process.env.JWT_REFRESH_GRACE_MS = graceEnvBackup;
    await app.close();
  });

  it('rotates: refresh returns a new, different token pair', async () => {
    const { refreshToken } = await login();

    const res = await request(app.getHttpServer())
      .post('/v1/auth/refresh')
      .send({ refreshToken })
      .expect(201);

    expect(res.body).toHaveProperty('accessToken');
    expect(res.body).toHaveProperty('refreshToken');
    expect(res.body.refreshToken).not.toBe(refreshToken);
  });

  it('detects reuse: replaying a rotated token (past grace) revokes the whole family', async () => {
    process.env.JWT_REFRESH_GRACE_MS = '0'; // any rotated token is immediately "reused"
    const { refreshToken: original } = await login();

    // First rotation succeeds and yields a new token.
    const rotated = await request(app.getHttpServer())
      .post('/v1/auth/refresh')
      .send({ refreshToken: original })
      .expect(201);
    const newToken = rotated.body.refreshToken;

    // Replaying the ORIGINAL (already rotated) token is a reuse → 401.
    await request(app.getHttpServer())
      .post('/v1/auth/refresh')
      .send({ refreshToken: original })
      .expect(401);

    // Reuse must have revoked the family, so the freshly-issued token is dead too.
    await request(app.getHttpServer())
      .post('/v1/auth/refresh')
      .send({ refreshToken: newToken })
      .expect(401);

    process.env.JWT_REFRESH_GRACE_MS = graceEnvBackup ?? '';
  });

  it('handles two concurrent refreshes of the same token within grace: both succeed', async () => {
    process.env.JWT_REFRESH_GRACE_MS = '10000';
    const { refreshToken } = await login();

    const [a, b] = await Promise.all([
      request(app.getHttpServer()).post('/v1/auth/refresh').send({ refreshToken }),
      request(app.getHttpServer()).post('/v1/auth/refresh').send({ refreshToken }),
    ]);

    // Deterministic: neither concurrent caller is falsely flagged as reuse.
    expect(a.status).toBe(201);
    expect(b.status).toBe(201);
    expect(a.body.refreshToken).not.toBe(b.body.refreshToken);
  });

  it('rejects an unknown refresh token with 401', async () => {
    await request(app.getHttpServer())
      .post('/v1/auth/refresh')
      .send({ refreshToken: 'not-a-real-token' })
      .expect(401);
  });

  it('logout works without a valid access token and kills the family', async () => {
    const { refreshToken } = await login();

    await request(app.getHttpServer())
      .post('/v1/auth/logout')
      .send({ refreshToken })
      .expect(204);

    await request(app.getHttpServer())
      .post('/v1/auth/refresh')
      .send({ refreshToken })
      .expect(401);
  });
});
