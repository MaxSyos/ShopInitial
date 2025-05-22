import { PrismaClient, UserRole, OrderStatus, PaymentStatus, NotificationType } from '@prisma/client';
import * as bcrypt from 'bcrypt';

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

  // Criar usuários com diferentes papéis
  const hashedPassword = await bcrypt.hash('Senha@123456', 10);
  
  const admin = await prisma.user.create({
    data: {
      email: 'admin@shopinitial.com',
      password: hashedPassword,
      name: 'Administrador Principal',
      role: UserRole.ADMIN,
      isActive: true,
    },
  });

  const manager = await prisma.user.create({
    data: {
      email: 'gerente@shopinitial.com',
      password: hashedPassword,
      name: 'Gerente de Vendas',
      role: UserRole.MANAGER,
      isActive: true,
    },
  });

  const user1 = await prisma.user.create({
    data: {
      email: 'joao@email.com',
      password: hashedPassword,
      name: 'João Silva',
      role: UserRole.USER,
      isActive: true,
    },
  });

  const user2 = await prisma.user.create({
    data: {
      email: 'maria@email.com',
      password: hashedPassword,
      name: 'Maria Santos',
      role: UserRole.USER,
      isActive: true,
    },
  });

  // Criar endereços
  const address1 = await prisma.address.create({
    data: {
      street: 'Avenida Paulista, 1000',
      city: 'São Paulo',
      state: 'SP',
      country: 'Brasil',
      postalCode: '01310-100',
      userId: user1.id,
      isDefault: true,
    },
  });

  const address2 = await prisma.address.create({
    data: {
      street: 'Rua Copacabana, 500',
      city: 'Rio de Janeiro',
      state: 'RJ',
      country: 'Brasil',
      postalCode: '22050-002',
      userId: user2.id,
      isDefault: true,
    },
  });

  // Criar categorias com hierarquia
  const eletronicos = await prisma.category.create({
    data: {
      name: 'Eletrônicos',
      description: 'Todos os tipos de eletrônicos',
    },
  });

  const smartphones = await prisma.category.create({
    data: {
      name: 'Smartphones',
      description: 'Telefones celulares e smartphones',
      parentId: eletronicos.id,
    },
  });

  const notebooks = await prisma.category.create({
    data: {
      name: 'Notebooks',
      description: 'Notebooks e laptops',
      parentId: eletronicos.id,
    },
  });

  const audioVideo = await prisma.category.create({
    data: {
      name: 'Áudio e Vídeo',
      description: 'Equipamentos de áudio e vídeo',
      parentId: eletronicos.id,
    },
  });

  // Criar marcas
  const samsung = await prisma.brand.create({
    data: {
      name: 'Samsung',
      logo: 'https://storage.googleapis.com/shopinitial/brands/samsung.png',
    },
  });

  const apple = await prisma.brand.create({
    data: {
      name: 'Apple',
      logo: 'https://storage.googleapis.com/shopinitial/brands/apple.png',
    },
  });

  const dell = await prisma.brand.create({
    data: {
      name: 'Dell',
      logo: 'https://storage.googleapis.com/shopinitial/brands/dell.png',
    },
  });

  const sony = await prisma.brand.create({
    data: {
      name: 'Sony',
      logo: 'https://storage.googleapis.com/shopinitial/brands/sony.png',
    },
  });

  // Criar produtos
  const galaxyS23 = await prisma.product.create({
    data: {
      name: 'Samsung Galaxy S23 Ultra',
      description: 'O smartphone mais avançado da Samsung com câmera de 200MP',
      price: 6999.99,
      stock: 50,
      sku: 'SAM-S23U-256',
      images: [
        'https://storage.googleapis.com/shopinitial/products/galaxy-s23-ultra-1.jpg',
        'https://storage.googleapis.com/shopinitial/products/galaxy-s23-ultra-2.jpg',
      ],
      categoryId: smartphones.id,
      brandId: samsung.id,
    },
  });

  const iphone14 = await prisma.product.create({
    data: {
      name: 'iPhone 14 Pro Max',
      description: 'iPhone com Dynamic Island e câmera de 48MP',
      price: 9499.99,
      stock: 30,
      sku: 'APP-IP14PM-256',
      images: [
        'https://storage.googleapis.com/shopinitial/products/iphone-14-pro-max-1.jpg',
        'https://storage.googleapis.com/shopinitial/products/iphone-14-pro-max-2.jpg',
      ],
      categoryId: smartphones.id,
      brandId: apple.id,
    },
  });

  const xps13 = await prisma.product.create({
    data: {
      name: 'Dell XPS 13 Plus',
      description: 'Notebook premium com Intel Core i7 de 12ª geração',
      price: 12999.99,
      stock: 15,
      sku: 'DELL-XPS13P-512',
      images: [
        'https://storage.googleapis.com/shopinitial/products/dell-xps-13-plus-1.jpg',
        'https://storage.googleapis.com/shopinitial/products/dell-xps-13-plus-2.jpg',
      ],
      categoryId: notebooks.id,
      brandId: dell.id,
    },
  });

  const headphones = await prisma.product.create({
    data: {
      name: 'Sony WH-1000XM5',
      description: 'Fone de ouvido com cancelamento de ruído líder do mercado',
      price: 2499.99,
      stock: 40,
      sku: 'SONY-WH1000XM5',
      images: [
        'https://storage.googleapis.com/shopinitial/products/sony-wh1000xm5-1.jpg',
        'https://storage.googleapis.com/shopinitial/products/sony-wh1000xm5-2.jpg',
      ],
      categoryId: audioVideo.id,
      brandId: sony.id,
    },
  });

  // Criar reviews
  await prisma.review.createMany({
    data: [
      {
        productId: galaxyS23.id,
        userId: user1.id,
        rating: 5,
        comment: 'Melhor celular que já tive! A câmera é impressionante.',
      },
      {
        productId: galaxyS23.id,
        userId: user2.id,
        rating: 4,
        comment: 'Ótimo smartphone, mas a bateria poderia durar mais.',
      },
      {
        productId: iphone14.id,
        userId: user1.id,
        rating: 5,
        comment: 'Dynamic Island é uma feature incrível!',
      },
      {
        productId: xps13.id,
        userId: user2.id,
        rating: 5,
        comment: 'Notebook perfeito para trabalho e entretenimento.',
      },
    ],
  });

  // Criar pedidos com diferentes status
  const order1 = await prisma.order.create({
    data: {
      userId: user1.id,
      status: OrderStatus.DELIVERED,
      total: 6999.99,
      street: address1.street,
      city: address1.city,
      state: address1.state,
      country: address1.country,
      postalCode: address1.postalCode,
      items: {
        create: [{
          productId: galaxyS23.id,
          quantity: 1,
          price: 6999.99,
        }],
      },
      payment: {
        create: {
          amount: 6999.99,
          status: PaymentStatus.COMPLETED,
          paymentMethod: 'CREDIT_CARD',
          transactionId: 'txn_123456',
        },
      },
    },
  });

  const order2 = await prisma.order.create({
    data: {
      userId: user2.id,
      status: OrderStatus.PROCESSING,
      total: 14999.98,
      street: address2.street,
      city: address2.city,
      state: address2.state,
      country: address2.country,
      postalCode: address2.postalCode,
      items: {
        create: [
          {
            productId: xps13.id,
            quantity: 1,
            price: 12999.99,
          },
          {
            productId: headphones.id,
            quantity: 1,
            price: 1999.99,
          },
        ],
      },
      payment: {
        create: {
          amount: 14999.98,
          status: PaymentStatus.PENDING,
          paymentMethod: 'PIX',
        },
      },
    },
  });

  // Criar notificações
  await prisma.notification.createMany({
    data: [
      {
        userId: user1.id,
        type: NotificationType.ORDER_CREATED,
        title: 'Pedido Realizado',
        message: `Seu pedido #${order1.id} foi realizado com sucesso!`,
        link: `/orders/${order1.id}`,
        read: true,
      },
      {
        userId: user1.id,
        type: NotificationType.ORDER_STATUS_UPDATED,
        title: 'Pedido Entregue',
        message: `Seu pedido #${order1.id} foi entregue!`,
        link: `/orders/${order1.id}`,
        read: false,
      },
      {
        userId: user2.id,
        type: NotificationType.ORDER_CREATED,
        title: 'Pedido Realizado',
        message: `Seu pedido #${order2.id} foi realizado com sucesso!`,
        link: `/orders/${order2.id}`,
        read: true,
      },
      {
        userId: admin.id,
        type: NotificationType.LOW_STOCK,
        title: 'Estoque Baixo',
        message: 'O produto Dell XPS 13 Plus está com estoque baixo (15 unidades)',
        link: `/admin/products/${xps13.id}`,
        read: false,
      },
      {
        userId: manager.id,
        type: NotificationType.PAYMENT_COMPLETED,
        title: 'Pagamento Recebido',
        message: `Pagamento do pedido #${order1.id} foi confirmado`,
        link: `/admin/orders/${order1.id}`,
        read: false,
      },
    ],
  });

  // Criar carrinhos
  const cart1 = await prisma.cart.create({
    data: {
      userId: user1.id,
      items: {
        create: [{
          productId: iphone14.id,
          quantity: 1,
        }],
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
