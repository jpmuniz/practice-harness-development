import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { ThrottlerGuard } from '@nestjs/throttler';
import bcrypt from 'bcrypt';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/service/prisma.service';
import { Perfil } from './../src/generated/prisma/enums';

describe('PATCH /users/:id (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

  const adminId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  const userAId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
  const userBId = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
  const missingId = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';

  const password = 'secret123';
  let passwordHash: string;
  let adminToken: string;
  let userAToken: string;

  beforeAll(async () => {
    passwordHash = await bcrypt.hash(password, 10);
  });

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideGuard(ThrottlerGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    prisma = app.get(PrismaService);
    await prisma.commercial.deleteMany();
    await prisma.user.deleteMany();

    await prisma.user.createMany({
      data: [
        {
          id: adminId,
          email: 'admin@example.com',
          name: 'Admin',
          perfil: Perfil.admin,
          password: passwordHash,
          neighborhood: 'Centro',
          street: 'Rua Admin',
        },
        {
          id: userAId,
          email: 'usera@example.com',
          name: 'User A',
          perfil: Perfil.normal,
          password: passwordHash,
          neighborhood: 'Centro',
          street: 'Rua A',
        },
        {
          id: userBId,
          email: 'userb@example.com',
          name: 'User B',
          perfil: Perfil.normal,
          password: passwordHash,
          neighborhood: 'Centro',
          street: 'Rua B',
        },
      ],
    });

    const adminLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'admin@example.com', password })
      .expect(200);
    adminToken = (adminLogin.body as { access_token: string }).access_token;

    const userALogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'usera@example.com', password })
      .expect(200);
    userAToken = (userALogin.body as { access_token: string }).access_token;
  });

  afterEach(async () => {
    await app.close();
  });

  it('allows admin to update any user and omits password', async () => {
    const res = await request(app.getHttpServer())
      .patch(`/users/${userAId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'User A Updated', street: 'Nova Rua' })
      .expect(200);

    const body = res.body as {
      name: string;
      street: string;
      password?: string;
    };
    expect(body.name).toBe('User A Updated');
    expect(body.street).toBe('Nova Rua');
    expect(body).not.toHaveProperty('password');
  });

  it('allows normal user to update own profile', async () => {
    const res = await request(app.getHttpServer())
      .patch(`/users/${userAId}`)
      .set('Authorization', `Bearer ${userAToken}`)
      .send({ neighborhood: 'Bairro Novo' })
      .expect(200);

    const body = res.body as { neighborhood: string; password?: string };
    expect(body.neighborhood).toBe('Bairro Novo');
    expect(body).not.toHaveProperty('password');
  });

  it('forbids normal user updating another user', async () => {
    await request(app.getHttpServer())
      .patch(`/users/${userBId}`)
      .set('Authorization', `Bearer ${userAToken}`)
      .send({ name: 'Hacked' })
      .expect(403);
  });

  it('returns 404 when user id does not exist', async () => {
    await request(app.getHttpServer())
      .patch(`/users/${missingId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Ghost' })
      .expect(404);
  });

  it('returns 409 when email belongs to another user', async () => {
    await request(app.getHttpServer())
      .patch(`/users/${userAId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ email: 'userb@example.com' })
      .expect(409);
  });

  it('returns 400 for invalid uuid', async () => {
    await request(app.getHttpServer())
      .patch('/users/not-a-uuid')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'X' })
      .expect(400);
  });
});
