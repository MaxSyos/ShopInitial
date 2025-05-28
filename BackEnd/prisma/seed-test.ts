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

  // try {
  //   // Criar usuário de teste
  //   const user = await prisma.user.upsert({
  //     where: { email: 'teste@exemplo.com' },
  //     update: {},
  //     create: {
  //       email: 'teste@exemplo.com',
  //       name: 'Usuário Teste',
  //       password: 'teste123', // Em produção, deve ser uma senha hasheada
  //     },
  //   });

  //   // Criar categoria de teste
  //   const category = await prisma.category.create({
  //     data: {
  //       name: 'Categoria Teste',
  //     },
  //   });

  //   // Criar marca de teste
  //   const brand = await prisma.brand.create({
  //     data: {
  //       name: 'Marca Teste',
  //     },
  //   });

  //   // Criar categorias
  //   const categories = await Promise.all([
  //     prisma.category.create({
  //       data: { name: 'Eletrônicos' }
  //     }),
  //     prisma.category.create({
  //       data: { name: 'Roupas' }
  //     }),
  //     prisma.category.create({
  //       data: { name: 'Calçados' }
  //     }),
  //     prisma.category.create({
  //       data: { name: 'Acessórios' }
  //     }),
  //     prisma.category.create({
  //       data: { name: 'Informática' }
  //     }),
  //   ]);

  //   // Criar marcas
  //   const brands = await Promise.all([
  //     prisma.brand.create({
  //       data: { name: 'Samsung' }
  //     }),
  //     prisma.brand.create({
  //       data: { name: 'Apple' }
  //     }),
  //     prisma.brand.create({
  //       data: { name: 'Nike' }
  //     }),
  //     prisma.brand.create({
  //       data: { name: 'Adidas' }
  //     }),
  //     prisma.brand.create({
  //       data: { name: 'Dell' }
  //     }),
  //   ]);

  //   // Criar produto de teste
  //   const product = await prisma.product.create({
  //     data: {
  //       name: 'Produto Teste',
  //       description: 'Produto para teste de pagamento',
  //       price: 100.00,
  //       stock: 10,
  //       sku: 'PROD-TEST-001',
  //       categoryId: categories[0].id, // Usando a categoria Eletrônicos
  //       brandId: brands[0].id, // Usando a marca Samsung
  //     },
  //   });

  //   // Criar produtos de teste com diferentes categorias e marcas
  //   const products = await Promise.all([
  //     prisma.product.create({
  //       data: {
  //         name: 'Smartphone Galaxy S21',
  //         description: 'Smartphone Samsung Galaxy S21 com 128GB',
  //         price: 3999.99,
  //         stock: 15,
  //         sku: 'SAMS-S21-001',
  //         categoryId: categories[0].id, // Eletrônicos
  //         brandId: brands[1].id, // Samsung
  //       },
  //     }),
  //     prisma.product.create({
  //       data: {
  //         name: 'Tênis Air Max',
  //         description: 'Tênis Nike Air Max confortável para corrida',
  //         price: 599.99,
  //         stock: 20,
  //         sku: 'NIKE-AM-001',
  //         categoryId: categories[3].id, // Calçados
  //         brandId: brands[0].id, // Nike
  //       },
  //     }),
  //     prisma.product.create({
  //       data: {
  //         name: 'iPhone 13',
  //         description: 'iPhone 13 com 256GB de armazenamento',
  //         price: 5999.99,
  //         stock: 10,
  //         sku: 'APPL-IP13-001',
  //         categoryId: categories[0].id, // Eletrônicos
  //         brandId: brands[2].id, // Apple
  //       },
  //     })
  //   ]);

  //   // Criar pedido de teste com múltiplos produtos
  //   const order = await prisma.order.create({
  //     data: {
  //       userId: user.id,
  //       status: OrderStatus.PENDING,
  //       total: products.reduce((acc, product) => acc + product.price.toNumber(), 0),
  //       items: {
  //         create: products.map(product => ({
  //           productId: product.id,
  //           quantity: 1,
  //           price: product.price,
  //         }))
  //       },
  //       street: 'Rua de Teste',
  //       city: 'Cidade Teste',
  //       state: 'Estado Teste',
  //       postalCode: '12345-678',
  //       country: 'BR',
  //     },
  //   });

  //   // Criar pagamento de teste que corresponde ao webhook
  //   const payment = await prisma.payment.create({
  //     data: {
  //       orderId: order.id,
  //       amount: 100.00,
  //       currency: 'BRL',
  //       status: PaymentStatus.WAITING_PAYMENT,
  //       paymentMethod: PaymentMethod.PIX,
  //       provider: 'MERCADOPAGO',
  //       transactionId: '123456', // ID que será usado no webhook
  //       metadata: {
  //         action: 'payment.updated',
  //         api_version: 'v1',
  //         data: { id: '123456' },
  //         date_created: '2021-11-01T02:02:02Z',
  //         id: '123456',
  //         live_mode: false,
  //         type: 'payment',
  //         user_id: 2457506170
  //       }
  //     },
  //   });

  //   console.log('✅ Dados de teste criados com sucesso');
  //   console.log({
  //     user: {
  //       id: user.id,
  //       email: user.email
  //     },
  //     category: {
  //       id: category.id,
  //       name: category.name
  //     },
  //     brand: {
  //       id: brand.id,
  //       name: brand.name
  //     },
  //     product: {
  //       id: product.id,
  //       sku: product.sku
  //     },
  //     order: {
  //       id: order.id,
  //       total: order.total
  //     },
  //     payment: {
  //       id: payment.id,
  //       transactionId: payment.transactionId
  //     }
  //   });

  // } catch (error) {
  //   console.error('❌ Erro ao criar dados de teste:', error);
  //   throw error;
  // } finally {
  //   await prisma.$disconnect();
  //}
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
