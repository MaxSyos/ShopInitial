import { PrismaClient, PaymentStatus, PaymentMethod, OrderStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {

  // Limpar banco de dados
  await prisma.notification.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.order.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.review.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.brand.deleteMany();
  await prisma.address.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany();

  try {
    // Criar usuário de teste
    const user = await prisma.user.upsert({
      where: { email: 'teste@exemplo.com' },
      update: {},
      create: {
        email: 'teste@exemplo.com',
        name: 'Usuário Teste',
        password: 'teste123', // Em produção, deve ser uma senha hasheada
      },
    });

    // Criar categoria de teste
    const category = await prisma.category.upsert({
      where: { id: 'cat-test-1' },
      update: {},
      create: {
        id: 'cat-test-1',
        name: 'Categoria Teste',
      },
    });

    // Criar marca de teste
    const brand = await prisma.brand.upsert({
      where: { id: 'brand-test-1' },
      update: {},
      create: {
        id: 'brand-test-1',
        name: 'Marca Teste',
      },
    });

    // Criar produto de teste
    const product = await prisma.product.upsert({
      where: { id: '1' },
      update: {},
      create: {
        id: '1',
        name: 'Produto Teste',
        description: 'Produto para teste de pagamento',
        price: 100.00,
        stock: 10,
        sku: 'PROD-TEST-001',
        categoryId: category.id,
        brandId: brand.id,
      },
    });

    // Criar pedido de teste
    const order = await prisma.order.create({
      data: {
        userId: user.id,
        status: OrderStatus.PENDING,
        total: 100.00,
        items: {
          create: [{
            productId: product.id,
            quantity: 1,
            price: 100.00,
          }]
        },
        street: 'Rua de Teste',
        city: 'Cidade Teste',
        state: 'Estado Teste',
        postalCode: '12345-678',
        country: 'BR',
      },
    });

    // Criar pagamento de teste que corresponde ao webhook
    const payment = await prisma.payment.create({
      data: {
        orderId: order.id,
        amount: 100.00,
        currency: 'BRL',
        status: PaymentStatus.WAITING_PAYMENT,
        paymentMethod: PaymentMethod.PIX,
        provider: 'MERCADOPAGO',
        transactionId: '123456', // ID que será usado no webhook
        metadata: {
          action: 'payment.updated',
          api_version: 'v1',
          data: { id: '123456' },
          date_created: '2021-11-01T02:02:02Z',
          id: '123456',
          live_mode: false,
          type: 'payment',
          user_id: 2457506170
        }
      },
    });

    console.log('✅ Dados de teste criados com sucesso');
    console.log({
      user: {
        id: user.id,
        email: user.email
      },
      category: {
        id: category.id,
        name: category.name
      },
      brand: {
        id: brand.id,
        name: brand.name
      },
      product: {
        id: product.id,
        sku: product.sku
      },
      order: {
        id: order.id,
        total: order.total
      },
      payment: {
        id: payment.id,
        transactionId: payment.transactionId
      }
    });

  } catch (error) {
    console.error('❌ Erro ao criar dados de teste:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
