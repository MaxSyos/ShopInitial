import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { PrismaService } from '../src/services/prisma.service';
import { UserRole } from '../src/modules/user/entities/user.entity';

describe('AuthController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prisma = moduleFixture.get<PrismaService>(PrismaService);
    await app.init();
  });

  beforeEach(async () => {
    // Limpa os dados de teste
    await prisma.refreshToken.deleteMany();
    await prisma.user.deleteMany();
  });

  afterAll(async () => {
    await prisma.refreshToken.deleteMany();
    await prisma.user.deleteMany();
    await app.close();
  });

  const testUser = {
    email: 'test@example.com',
    password: 'Test@123',
    name: 'Test User',
  };

  it('deve registrar um novo usuário, fazer login e atualizar tokens', async () => {
    // 1. Registra um novo usuário
    const registerResponse = await request(app.getHttpServer())
      .post('/auth/register')
      .send(testUser)
      .expect(201);

    expect(registerResponse.body).toHaveProperty('id');
    expect(registerResponse.body.email).toBe(testUser.email);
    expect(registerResponse.body.role).toBe(UserRole.USER);

    // 2. Faz login com o usuário criado
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password,
      })
      .expect(200);

    expect(loginResponse.body).toHaveProperty('accessToken');
    expect(loginResponse.body).toHaveProperty('refreshToken');

    const { accessToken, refreshToken } = loginResponse.body;

    // 3. Verifica se o token foi salvo no banco
    const savedToken = await prisma.refreshToken.findFirst({
      where: { token: refreshToken },
    });
    expect(savedToken).toBeTruthy();
    expect(savedToken.lastUsed).toBeTruthy();

    // 4. Espera um momento para garantir que o lastUsed será diferente
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // 5. Atualiza os tokens usando o refresh token
    const refreshResponse = await request(app.getHttpServer())
      .post('/auth/refresh')
      .send({ refreshToken })
      .expect(200);

    expect(refreshResponse.body).toHaveProperty('accessToken');
    expect(refreshResponse.body).toHaveProperty('refreshToken');
    expect(refreshResponse.body.accessToken).not.toBe(accessToken);
    expect(refreshResponse.body.refreshToken).not.toBe(refreshToken);

    // 6. Verifica se o token antigo foi removido e o novo foi salvo
    const oldToken = await prisma.refreshToken.findFirst({
      where: { token: refreshToken },
    });
    expect(oldToken).toBeNull();

    const newToken = await prisma.refreshToken.findFirst({
      where: { token: refreshResponse.body.refreshToken },
    });
    expect(newToken).toBeTruthy();
    expect(newToken.lastUsed).toBeTruthy();
    
    // 7. Revoga o refresh token
    await request(app.getHttpServer())
      .post('/auth/revoke')
      .send({ refreshToken: refreshResponse.body.refreshToken })
      .expect(200);

    const revokedToken = await prisma.refreshToken.findFirst({
      where: { token: refreshResponse.body.refreshToken },
    });
    expect(revokedToken).toBeNull();
  });

  it('deve falhar ao usar um refresh token expirado', async () => {
    // 1. Faz login com o usuário
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password,
      })
      .expect(200);

    const { refreshToken } = loginResponse.body;

    // 2. Define a data de expiração para o passado
    await prisma.refreshToken.update({
      where: { token: refreshToken },
      data: { expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000) }, // -1 dia
    });

    // 3. Tenta atualizar os tokens com o token expirado
    await request(app.getHttpServer())
      .post('/auth/refresh')
      .send({ refreshToken })
      .expect(401);

    // 4. Verifica se o token expirado foi removido
    const expiredToken = await prisma.refreshToken.findFirst({
      where: { token: refreshToken },
    });
    expect(expiredToken).toBeNull();
  });
});
