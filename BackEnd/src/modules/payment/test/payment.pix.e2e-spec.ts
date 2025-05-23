import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AppModule } from '../../../app.module';
import { ConfigModule } from '@nestjs/config';
import { PrismaService } from '../../../services/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { Order, Payment } from '@prisma/client';
import * as request from 'supertest';

describe('Fluxo de Pagamento PIX (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let jwtService: JwtService;
  let authToken: string;
  let orderId: string;
  let paymentId: string;
  let userId: string;
  let productId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        AppModule,
        ConfigModule.forRoot({
          isGlobal: true,
        }),
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe()); // Adicionando ValidationPipe
    prisma = moduleFixture.get<PrismaService>(PrismaService);
    jwtService = moduleFixture.get<JwtService>(JwtService);

    await app.init();

    // Limpar dados existentes antes de começar
    await prisma.payment.deleteMany();
    await prisma.order.deleteMany();
    await prisma.product.deleteMany();
    await prisma.user.deleteMany();
    await prisma.category.deleteMany();
    await prisma.brand.deleteMany();

    // Criar um usuário de teste
    const user = await prisma.user.create({
      data: {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
      },
    });
    userId = user.id;

    // Gerar token JWT
    authToken = jwtService.sign({ userId: user.id, email: user.email });
  });

  afterAll(async () => {
    // Limpar dados de teste
    await prisma.payment.deleteMany();
    await prisma.order.deleteMany();
    await prisma.product.deleteMany();
    await prisma.user.deleteMany();
    await prisma.category.deleteMany();
    await prisma.brand.deleteMany();

    await prisma.$disconnect();
    await app.close();
  });

  it('deve criar um pedido', async () => {
    // Criar um produto de teste primeiro
    const product = await prisma.product.create({
      data: {
        name: 'Produto Teste',
        description: 'Descrição do produto teste',
        price: 100.00,
        stock: 10,
        sku: 'TEST-SKU-001',
        images: ['test-image.jpg'],
        category: {
          create: {
            name: 'Categoria Teste',
          }
        },
        brand: {
          create: {
            name: 'Marca Teste',
          }
        }
      }
    });

    const response = await request(app.getHttpServer())
      .post('/orders')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        items: [{
          productId: product.id,
          quantity: 1
        }],
        street: 'Rua Teste',
        city: 'São Paulo',
        state: 'SP',
        country: 'Brasil',
        postalCode: '01234-567'
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
    orderId = response.body.id;
  });

  it('deve criar um pagamento PIX', async () => {
    const response = await request(app.getHttpServer())
      .post('/payments')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        orderId,
        amount: 100.00,
        currency: 'BRL',
        paymentMethod: 'PIX',
        description: 'Teste de Pagamento PIX',
        customer: {
          email: 'test@example.com',
          firstName: 'Test',
          lastName: 'User',
          document: '12345678909'
        }
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('processorResponse');
    expect(response.body.processorResponse).toHaveProperty('pixQrCode');
    expect(response.body.processorResponse).toHaveProperty('pixCode');
    paymentId = response.body.id;
  });

  it('deve processar notificação do webhook', async () => {
    const response = await request(app.getHttpServer())
      .post('/payments/webhook')
      .send({
        action: 'payment.updated',
        api_version: 'v1',
        data: {
          id: paymentId
        },
        date_created: new Date().toISOString(),
        live_mode: false,
        type: 'payment',
        user_id: '123456'
      });

    expect(response.status).toBe(200);
  });

  it('deve retornar o status atualizado do pagamento', async () => {
    const response = await request(app.getHttpServer())
      .get(`/payments/${paymentId}/status`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('status');
  });

  it('deve verificar se o pedido foi atualizado', async () => {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        payment: true
      }
    });

    // Verificações com null safety
    if (!order) {
      throw new Error('Pedido não encontrado');
    }

    expect(order).toBeDefined();
    expect(order.payment).toBeDefined();
    
    if (!order.payment) {
      throw new Error('Pagamento não encontrado');
    }

    expect(order.payment.id).toBe(paymentId);

    // Verificações adicionais
    expect(order.payment.status).toBeDefined();
    expect(order.payment.paymentMethod).toBe('PIX');
    expect(order.payment.currency).toBe('BRL');
  });
});
