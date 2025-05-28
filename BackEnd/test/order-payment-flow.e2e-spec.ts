import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { PrismaService } from '../src/services/prisma.service';
import { ValidationPipe } from '@nestjs/common';
import { UserRole } from '@prisma/client';

describe('Order-Payment Flow (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let authToken: string;
  let productId: string;
  let orderId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    prisma = app.get<PrismaService>(PrismaService);

    // Limpar dados de teste anteriores
    await prisma.payment.deleteMany();
    await prisma.orderItem.deleteMany();
    await prisma.order.deleteMany();
    await prisma.cartItem.deleteMany();
    await prisma.cart.deleteMany();
    await prisma.product.deleteMany();
    await prisma.category.deleteMany();
    await prisma.brand.deleteMany();
    await prisma.user.deleteMany();

    // Criar dados iniciais necessários
    const brand = await prisma.brand.create({
      data: {
        name: 'Samsung',
        logo: 'https://example.com/samsung.png'
      }
    });

    const category = await prisma.category.create({
      data: {
        name: 'Smartphones',
        description: 'Telefones celulares e smartphones'
      }
    });

    const product = await prisma.product.create({
      data: {
        name: 'Samsung Galaxy S24 Ultra',
        description: 'Smartphone top de linha Samsung',
        price: 9999.99,
        stock: 10,
        sku: 'SGS24U-512GB',
        images: ['https://example.com/s24-ultra.jpg'],
        brandId: brand.id,
        categoryId: category.id
      }
    });

    productId = product.id;

    // Criar usuário de teste
    const user = await prisma.user.create({
      data: {
        email: 'test@example.com',
        password: '$2b$10$EpRnTzVlqHNP0.fUbXUwSOyuiXe/QLSUG6xNekdHgTGmrpHEfIoxm', // senha = 'Secret123!'
        name: 'Test User',
        role: UserRole.USER
      }
    });
  });

  it('Deve executar o fluxo completo de pedido e pagamento', async () => {
    // 1. Login
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'test@example.com',
        password: 'Secret123!'
      });

    expect(loginResponse.status).toBe(200);
    expect(loginResponse.body.access_token).toBeDefined();
    authToken = loginResponse.body.access_token;

    // 2. Adicionar produto ao carrinho
    const addToCartResponse = await request(app.getHttpServer())
      .post('/cart/items')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        productId: productId,
        quantity: 1
      });

    expect(addToCartResponse.status).toBe(201);
    expect(addToCartResponse.body.items).toHaveLength(1);

    // 3. Criar pedido
    const createOrderResponse = await request(app.getHttpServer())
      .post('/orders')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        street: 'Avenida Paulista, 1000',
        city: 'São Paulo',
        state: 'SP',
        country: 'Brasil',
        postalCode: '01310-100'
      });

    expect(createOrderResponse.status).toBe(201);
    expect(createOrderResponse.body.id).toBeDefined();
    expect(createOrderResponse.body.status).toBe('PENDING');
    orderId = createOrderResponse.body.id;

    // 4. Verificar se o pagamento foi gerado
    const payment = await prisma.payment.findFirst({
      where: {
        orderId: orderId
      }
    });

    expect(payment).toBeDefined();
    expect(payment.status).toBe('PENDING');
    expect(payment.amount).toBe('9999.99');

    // 5. Simular callback de pagamento bem-sucedido
    const webhookResponse = await request(app.getHttpServer())
      .post('/payments/webhook')
      .send({
        action: 'payment.updated',
        data: {
          id: payment.id
        },
        type: 'payment',
        date_created: new Date().toISOString()
      });

    expect(webhookResponse.status).toBe(200);

    // 6. Verificar status final do pedido e pagamento
    const finalOrder = await prisma.order.findUnique({
      where: { id: orderId }
    });

    const finalPayment = await prisma.payment.findFirst({
      where: { orderId: orderId }
    });

    expect(finalOrder.status).toBe('PAID');
    expect(finalPayment.status).toBe('COMPLETED');
  });

  afterAll(async () => {
    // Limpar dados de teste
    await prisma.payment.deleteMany();
    await prisma.orderItem.deleteMany();
    await prisma.order.deleteMany();
    await prisma.cartItem.deleteMany();
    await prisma.cart.deleteMany();
    await prisma.product.deleteMany();
    await prisma.category.deleteMany();
    await prisma.brand.deleteMany();
    await prisma.user.deleteMany();

    await app.close();
  });
});
