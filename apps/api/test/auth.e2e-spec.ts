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
