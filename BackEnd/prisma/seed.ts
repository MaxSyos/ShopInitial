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

  // Criar categorias principais
  const eletronicos = await prisma.category.create({
    data: {
      name: 'Eletrônicos',
      description: 'Todos os tipos de eletrônicos e gadgets',
    },
  });

  const modaCasa = await prisma.category.create({
    data: {
      name: 'Moda Casa',
      description: 'Produtos para sua casa',
    },
  });

  const esporteLazer = await prisma.category.create({
    data: {
      name: 'Esporte e Lazer',
      description: 'Produtos para esporte e lazer',
    },
  });

  // Criar subcategorias de Eletrônicos
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

  const tablets = await prisma.category.create({
    data: {
      name: 'Tablets',
      description: 'Tablets e iPads',
      parentId: eletronicos.id,
    },
  });

  // Criar subcategorias de Moda Casa
  const decoracao = await prisma.category.create({
    data: {
      name: 'Decoração',
      description: 'Itens decorativos para sua casa',
      parentId: modaCasa.id,
    },
  });

  const moveis = await prisma.category.create({
    data: {
      name: 'Móveis',
      description: 'Móveis para todos os ambientes',
      parentId: modaCasa.id,
    },
  });

  const camaMesaBanho = await prisma.category.create({
    data: {
      name: 'Cama, Mesa e Banho',
      description: 'Produtos para cama, mesa e banho',
      parentId: modaCasa.id,
    },
  });

  // Criar subcategorias de Esporte e Lazer
  const fitness = await prisma.category.create({
    data: {
      name: 'Fitness e Musculação',
      description: 'Equipamentos para exercícios',
      parentId: esporteLazer.id,
    },
  });

  const ciclismo = await prisma.category.create({
    data: {
      name: 'Ciclismo',
      description: 'Bicicletas e acessórios',
      parentId: esporteLazer.id,
    },
  });

  const esportesColetivosCat = await prisma.category.create({
    data: {
      name: 'Esportes Coletivos',
      description: 'Equipamentos para esportes em equipe',
      parentId: esporteLazer.id,
    },
  });

  // Criar marcas de Eletrônicos
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

  // Criar marcas de Moda Casa
  const artex = await prisma.brand.create({
    data: {
      name: 'Artex',
      logo: 'https://storage.googleapis.com/shopinitial/brands/artex.png',
    },
  });

  const tok = await prisma.brand.create({
    data: {
      name: 'Tok&Stok',
      logo: 'https://storage.googleapis.com/shopinitial/brands/tokstok.png',
    },
  });

  const buddemeyer = await prisma.brand.create({
    data: {
      name: 'Buddemeyer',
      logo: 'https://storage.googleapis.com/shopinitial/brands/buddemeyer.png',
    },
  });

  // Criar marcas de Esporte e Lazer
  const nike = await prisma.brand.create({
    data: {
      name: 'Nike',
      logo: 'https://storage.googleapis.com/shopinitial/brands/nike.png',
    },
  });

  const adidas = await prisma.brand.create({
    data: {
      name: 'Adidas',
      logo: 'https://storage.googleapis.com/shopinitial/brands/adidas.png',
    },
  });

  const caloi = await prisma.brand.create({
    data: {
      name: 'Caloi',
      logo: 'https://storage.googleapis.com/shopinitial/brands/caloi.png',
    },
  });

  const speedo = await prisma.brand.create({
    data: {
      name: 'Speedo',
      logo: 'https://storage.googleapis.com/shopinitial/brands/speedo.png',
    },
  });

  // Criar produtos de Eletrônicos
  const galaxyS23 = await prisma.product.create({
    data: {
      name: 'Samsung Galaxy S23 Ultra',
      description: 'O smartphone mais avançado da Samsung com câmera de 200MP',
      price: 0.99,
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
      price: 1.99,
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
      price: 0.39,
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
      price: 0.29,
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

  const ipadPro = await prisma.product.create({
    data: {
      name: 'iPad Pro 12.9" M2',
      description: 'iPad Pro com chip M2 e tela Liquid Retina XDR',
      price: 0.59,
      stock: 25,
      sku: 'APP-IPADPM2-256',
      images: [
        'https://storage.googleapis.com/shopinitial/products/ipad-pro-m2-1.jpg',
        'https://storage.googleapis.com/shopinitial/products/ipad-pro-m2-2.jpg',
      ],
      categoryId: tablets.id,
      brandId: apple.id,
    },
  });

  // Criar produtos de Moda Casa
  const jogoCama = await prisma.product.create({
    data: {
      name: 'Jogo de Cama King Size 400 Fios',
      description: 'Jogo de cama completo em algodão egípcio',
      price: 0.19,
      stock: 30,
      sku: 'BUD-JC400-KING',
      images: [
        'https://storage.googleapis.com/shopinitial/products/jogo-cama-1.jpg',
        'https://storage.googleapis.com/shopinitial/products/jogo-cama-2.jpg',
      ],
      categoryId: camaMesaBanho.id,
      brandId: buddemeyer.id,
    },
  });

  const sofaRetratil = await prisma.product.create({
    data: {
      name: 'Sofá Retrátil 3 Lugares',
      description: 'Sofá retrátil e reclinável em suede',
      price: 0.09,
      stock: 10,
      sku: 'TOK-SOF3-RET',
      images: [
        'https://storage.googleapis.com/shopinitial/products/sofa-retratil-1.jpg',
        'https://storage.googleapis.com/shopinitial/products/sofa-retratil-2.jpg',
      ],
      categoryId: moveis.id,
      brandId: tok.id,
    },
  });

  // Criar produtos de Esporte e Lazer
  const bikeCaloi = await prisma.product.create({
    data: {
      name: 'Bicicleta Caloi Elite Carbon',
      description: 'Bicicleta de carbono para ciclismo profissional',
      price: 0.89,
      stock: 8,
      sku: 'CAL-ELITE-CAR',
      images: [
        'https://storage.googleapis.com/shopinitial/products/bike-caloi-1.jpg',
        'https://storage.googleapis.com/shopinitial/products/bike-caloi-2.jpg',
      ],
      categoryId: ciclismo.id,
      brandId: caloi.id,
    },
  });

  const kitHalteres = await prisma.product.create({
    data: {
      name: 'Kit Halter Emborrachado 1-10kg',
      description: 'Kit completo de halteres emborrachados',
      price: 0.99,
      stock: 20,
      sku: 'ADI-HALT-KIT',
      images: [
        'https://storage.googleapis.com/shopinitial/products/kit-halteres-1.jpg',
        'https://storage.googleapis.com/shopinitial/products/kit-halteres-2.jpg',
      ],
      categoryId: fitness.id,
      brandId: adidas.id,
    },
  });

  const bolaFutebol = await prisma.product.create({
    data: {
      name: 'Bola Nike Flight Premier League',
      description: 'Bola oficial da Premier League',
      price: 0.69,
      stock: 50,
      sku: 'NIK-BOLA-PL',
      images: [
        'https://storage.googleapis.com/shopinitial/products/bola-nike-1.jpg',
        'https://storage.googleapis.com/shopinitial/products/bola-nike-2.jpg',
      ],
      categoryId: esportesColetivosCat.id,
      brandId: nike.id,
    },
  });

  // Criar reviews
  await prisma.review.createMany({
    data: [
      // Reviews de Eletrônicos
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
      {
        productId: headphones.id,
        userId: user1.id,
        rating: 5,
        comment: 'Melhor cancelamento de ruído do mercado!',
      },
      {
        productId: ipadPro.id,
        userId: user2.id,
        rating: 5,
        comment: 'Perfeito para trabalhos criativos, o M2 é muito rápido.',
      },
      // Reviews de Moda Casa
      {
        productId: jogoCama.id,
        userId: user1.id,
        rating: 5,
        comment: 'Qualidade excepcional, muito macio e confortável.',
      },
      {
        productId: sofaRetratil.id,
        userId: user2.id,
        rating: 4,
        comment: 'Ótimo custo-benefício, confortável e bonito.',
      },
      // Reviews de Esporte e Lazer
      {
        productId: bikeCaloi.id,
        userId: user1.id,
        rating: 5,
        comment: 'Bike profissional de altíssima qualidade!',
      },
      {
        productId: kitHalteres.id,
        userId: user2.id,
        rating: 5,
        comment: 'Kit completo e com ótimo acabamento.',
      },
      {
        productId: bolaFutebol.id,
        userId: user1.id,
        rating: 4,
        comment: 'Bola oficial com ótima durabilidade.',
      },
    ],
  });

  // Criar pedidos com diferentes status
  // Pedido 1 - Eletrônicos (Entregue)
  const order1 = await prisma.order.create({
    data: {
      userId: user1.id,
      status: OrderStatus.DELIVERED,
      total: 9499.98,
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
        },
        {
          productId: headphones.id,
          quantity: 1,
          price: 2499.99,
        }],
      },
      payment: {
        create: {
          amount: 9499.98,
          status: PaymentStatus.COMPLETED,
          paymentMethod: 'CREDIT_CARD',
          transactionId: 123456n,
        },
      },
    },
  });

  // Pedido 2 - Mix de Categorias (Processando)
  const order2 = await prisma.order.create({
    data: {
      userId: user2.id,
      status: OrderStatus.PROCESSING,
      total: 14699.97,
      street: address2.street,
      city: address2.city,
      state: address2.state,
      country: address2.country,
      postalCode: address2.postalCode,
      items: {
        create: [
          {
            productId: jogoCama.id,
            quantity: 1,
            price: 899.99,
          },
          {
            productId: kitHalteres.id,
            quantity: 1,
            price: 799.99,
          },
          {
            productId: xps13.id,
            quantity: 1,
            price: 12999.99,
          },
        ],
      },
      payment: {
        create: {
          amount: 14699.97,
          status: PaymentStatus.PENDING,
          paymentMethod: 'PIX',
        },
      },
    },
  });

  // Pedido 3 - Esporte e Lazer (Aguardando Pagamento)
  const order3 = await prisma.order.create({
    data: {
      userId: user1.id,
      status: OrderStatus.PENDING,
      total: 16899.98,
      street: address1.street,
      city: address1.city,
      state: address1.state,
      country: address1.country,
      postalCode: address1.postalCode,
      items: {
        create: [
          {
            productId: bikeCaloi.id,
            quantity: 1,
            price: 15999.99,
          },
          {
            productId: bolaFutebol.id,
            quantity: 1,
            price: 899.99,
          },
        ],
      },
      payment: {
        create: {
          amount: 16899.98,
          status: PaymentStatus.PENDING,
          paymentMethod: 'BOLETO',
        },
      },
    },
  });

  // Criar notificações
  await prisma.notification.createMany({
    data: [
      // Notificações do Usuário 1
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
        read: true,
      },
      {
        userId: user1.id,
        type: NotificationType.ORDER_CREATED,
        title: 'Novo Pedido',
        message: `Seu pedido #${order3.id} foi realizado com sucesso!`,
        link: `/orders/${order3.id}`,
        read: false,
      },
      // Notificações do Usuário 2
      {
        userId: user2.id,
        type: NotificationType.ORDER_CREATED,
        title: 'Pedido Realizado',
        message: `Seu pedido #${order2.id} foi realizado com sucesso!`,
        link: `/orders/${order2.id}`,
        read: true,
      },
      {
        userId: user2.id,
        type: NotificationType.PAYMENT_PENDING,
        title: 'Pagamento Pendente',
        message: `Aguardando pagamento do pedido #${order2.id}`,
        link: `/orders/${order2.id}/payment`,
        read: false,
      },
      // Notificações do Admin
      {
        userId: admin.id,
        type: NotificationType.LOW_STOCK,
        title: 'Estoque Baixo',
        message: 'O produto Dell XPS 13 Plus está com estoque baixo (15 unidades)',
        link: `/admin/products/${xps13.id}`,
        read: false,
      },
      {
        userId: admin.id,
        type: NotificationType.LOW_STOCK,
        title: 'Estoque Baixo',
        message: 'Bicicleta Caloi Elite Carbon está com estoque baixo (8 unidades)',
        link: `/admin/products/${bikeCaloi.id}`,
        read: false,
      },
      // Notificações do Gerente
      {
        userId: manager.id,
        type: NotificationType.PAYMENT_COMPLETED,
        title: 'Pagamento Recebido',
        message: `Pagamento do pedido #${order1.id} foi confirmado`,
        link: `/admin/orders/${order1.id}`,
        read: false,
      },
      {
        userId: manager.id,
        type: NotificationType.ORDER_STATUS_UPDATED,
        title: 'Pedido em Processamento',
        message: `O pedido #${order2.id} está em processamento`,
        link: `/admin/orders/${order2.id}`,
        read: false,
      },
    ],
  });

  // Criar carrinhos
  const cart1 = await prisma.cart.create({
    data: {
      userId: user1.id,
      items: {
        create: [
          {
            productId: iphone14.id,
            quantity: 1,
          },
          {
            productId: ipadPro.id,
            quantity: 1,
          }
        ],
      },
    },
  });

  const cart2 = await prisma.cart.create({
    data: {
      userId: user2.id,
      items: {
        create: [
          {
            productId: sofaRetratil.id,
            quantity: 1,
          },
          {
            productId: jogoCama.id,
            quantity: 2,
          }
        ],
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
