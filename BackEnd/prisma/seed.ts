import { PrismaClient, UserRole, OrderStatus, PaymentStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // Limpar banco de dados
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
  await prisma.user.deleteMany();

  // Criar usuários
  const hashedPassword = await bcrypt.hash('Senha@123456', 10);
  const admin = await prisma.user.create({
    data: {
      email: 'admin@example.com',
      password: hashedPassword,
      name: 'Administrador do Sistema',
      role: UserRole.ADMIN,
      isActive: true,
      mfaEnabled: false,
    },
  });

  const user = await prisma.user.create({
    data: {
      email: 'usuario@example.com',
      password: hashedPassword,
      name: 'Usuário Teste',
      role: UserRole.USER,
      isActive: true,
      mfaEnabled: false,
    },
  });

  // Criar categorias
  const category = await prisma.category.create({
    data: {
      name: 'Eletrônicos',
      description: 'Produtos eletrônicos',
    },
  });

  // Criar marcas
  const brand = await prisma.brand.create({
    data: {
      name: 'TechBrand',
      logo: 'https://example.com/logo.png',
    },
  });

  // Criar produtos
  const product = await prisma.product.create({
    data: {
      name: 'Smartphone X',
      description: 'Um smartphone avançado',
      price: 1999.99,
      stock: 100,
      sku: 'SMART-X',
      images: ['https://example.com/smartphone.jpg'],
      categoryId: category.id,
      brandId: brand.id,
    },
  });

  // Criar mais categorias
  const category2 = await prisma.category.create({
    data: {
      name: 'Informática',
      description: 'Produtos de informática',
    },
  });

  const category3 = await prisma.category.create({
    data: {
      name: 'Áudio',
      description: 'Equipamentos de áudio',
    },
  });

  // Criar mais marcas
  const brand2 = await prisma.brand.create({
    data: {
      name: 'NotebookBrand',
      logo: 'https://example.com/notebookbrand-logo.png',
    },
  });

  const brand3 = await prisma.brand.create({
    data: {
      name: 'AudioBrand',
      logo: 'https://example.com/audiobrand-logo.png',
    },
  });

  // Criar mais produtos
  const product2 = await prisma.product.create({
    data: {
      name: 'Notebook Pro',
      description: 'Um notebook de alta performance',
      price: 4999.99,
      stock: 50,
      sku: 'NOTE-PRO',
      images: ['https://example.com/notebook.jpg'],
      categoryId: category2.id,
      brandId: brand2.id,
    },
  });

  const product3 = await prisma.product.create({
    data: {
      name: 'Fone de Ouvido',
      description: 'Fone de ouvido com cancelamento de ruído',
      price: 299.99,
      stock: 200,
      sku: 'FONE-OUV',
      images: ['https://example.com/headphone.jpg'],
      categoryId: category3.id,
      brandId: brand3.id,
    },
  });

  // Criar pedido
  await prisma.order.create({
    data: {
      userId: user.id,
      status: OrderStatus.DELIVERED,
      total: 1999.99,
      street: 'Rua Exemplo',
      city: 'São Paulo',
      state: 'SP',
      country: 'Brasil',
      postalCode: '01000-000',
      items: {
        create: [{
          productId: product.id,
          quantity: 1,
          price: 1999.99,
        }],
      },
      payment: {
        create: {
          amount: 1999.99,
          status: PaymentStatus.COMPLETED,
          paymentMethod: 'CREDIT_CARD',
        },
      },
    },
  });

  // Criar reviews
  await prisma.review.createMany({
    data: [
      {
        productId: product.id,
        userId: user.id,
        rating: 5,
        comment: 'Produto excelente! Superou minhas expectativas.',
      },
      {
        productId: product2.id,
        userId: user.id,
        rating: 4,
        comment: 'Ótimo desempenho, mas poderia ser mais leve.',
      },
      {
        productId: product3.id,
        userId: user.id,
        rating: 3,
        comment: 'Bom som, mas o preço é um pouco alto.',
      },
    ],
  });

  // Criar mais pedidos
  await prisma.order.create({
    data: {
      userId: user.id,
      status: OrderStatus.PENDING,
      total: 5299.98,
      street: 'Rua Nova',
      city: 'Rio de Janeiro',
      state: 'RJ',
      country: 'Brasil',
      postalCode: '20000-000',
      items: {
        create: [
          {
            productId: product2.id,
            quantity: 1,
            price: 4999.99,
          },
          {
            productId: product3.id,
            quantity: 1,
            price: 299.99,
          },
        ],
      },
      payment: {
        create: {
          amount: 5299.98,
          status: PaymentStatus.PENDING,
          paymentMethod: 'PIX',
        },
      },
    },
  });

  console.log('Seed concluído com sucesso!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
