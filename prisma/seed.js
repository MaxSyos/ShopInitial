const { PrismaClient, PaymentStatus, Size } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed do banco de dados...');

  // Limpar dados existentes (apenas em desenvolvimento)
  console.log('🧹 Limpando dados existentes...');
  await prisma.email.deleteMany();
  await prisma.setting.deleteMany();
  await prisma.categoryGrid.deleteMany();
  await prisma.offer.deleteMany();
  await prisma.carouselImage.deleteMany();
  await prisma.banner.deleteMany();
  await prisma.favorite.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.orderItemListRow.deleteMany();
  await prisma.orderItemList.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.address.deleteMany();
  await prisma.review.deleteMany();
  await prisma.image.deleteMany();
  await prisma.product.deleteMany();
  await prisma.brand.deleteMany();
  await prisma.category.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany();

  console.log('📝 Criando usuários...');
  // Criar usuários
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@zishop.com',
      name: 'Administrador',
      password: '$2b$10$hashedpassword', // Senha: admin123
      role: 'ADMIN',
    },
  });

  const users = await Promise.all([
    prisma.user.create({
      data: {
        email: 'joao.silva@email.com',
        name: 'João Silva',
        password: '$2b$10$hashedpassword',
        cpf: '12345678901',
        whatsapp: '+5511999999999',
      },
    }),
    prisma.user.create({
      data: {
        email: 'maria.santos@email.com',
        name: 'Maria Santos',
        password: '$2b$10$hashedpassword',
        cpf: '98765432100',
        whatsapp: '+5511988888888',
      },
    }),
    prisma.user.create({
      data: {
        email: 'carlos.oliveira@email.com',
        name: 'Carlos Oliveira',
        password: '$2b$10$hashedpassword',
        cpf: '45678912345',
      },
    }),
  ]);

  console.log('🏢 Criando marcas...');
  // Criar marcas
  const brands = await Promise.all([
    prisma.brand.create({ data: { name: 'Nike', logo: '/images/brand-logo-img/nike.png' } }),
    prisma.brand.create({ data: { name: 'Adidas', logo: '/images/brand-logo-img/adidas.png' } }),
    prisma.brand.create({ data: { name: 'Puma', logo: '/images/brand-logo-img/puma.png' } }),
    prisma.brand.create({ data: { name: 'Zara', logo: '/images/brand-logo-img/zara.png' } }),
    prisma.brand.create({ data: { name: 'H&M', logo: '/images/brand-logo-img/hm.png' } }),
  ]);

  console.log('📂 Criando categorias...');
  // Criar categorias
  const clothingCategory = await prisma.category.create({
    data: { name: 'Roupas', description: 'Roupas masculinas e femininas' },
  });
  const shoesCategory = await prisma.category.create({
    data: { name: 'Calçados', description: 'Tênis, sapatos e sandálias' },
  });
  const accessoriesCategory = await prisma.category.create({
    data: { name: 'Acessórios', description: 'Bolsas, cintos e óculos' },
  });

  // Subcategorias
  const tshirtsSub = await prisma.category.create({
    data: { name: 'Camisetas', parentId: clothingCategory.id },
  });
  const pantsSub = await prisma.category.create({
    data: { name: 'Calças', parentId: clothingCategory.id },
  });
  const sneakersSub = await prisma.category.create({
    data: { name: 'Tênis', parentId: shoesCategory.id },
  });

  console.log('🛍️ Criando produtos...');
  // Produtos
  const products = [];

  // Camisetas
  for (let i = 1; i <= 10; i++) {
    const product = await prisma.product.create({
      data: {
        name: `Camiseta ${i}`,
        description: `Camiseta confortável e moderna, perfeita para o dia a dia. Modelo ${i}.`,
        price: 49.90 + (i * 10),
        stock: Math.floor(Math.random() * 50) + 10,
        sku: `TSHIRT-${i}`,
        brandId: brands[i % brands.length].id,
        categoryId: tshirtsSub.id,
        rating: Math.random() * 5,
        isOffer: i % 3 === 0,
      },
    });
    products.push(product);

    // Imagens
    await prisma.image.createMany({
      data: [
        { url: `/images/products/tshirt${i}.jpg`, alt: `Camiseta ${i}`, productId: product.id },
      ],
    });
  }

  // Calças
  for (let i = 1; i <= 8; i++) {
    const product = await prisma.product.create({
      data: {
        name: `Calça Jeans ${i}`,
        description: `Calça jeans de alta qualidade, confortável e durável. Modelo ${i}.`,
        price: 129.90 + (i * 20),
        stock: Math.floor(Math.random() * 30) + 5,
        sku: `PANTS-${i}`,
        brandId: brands[i % brands.length].id,
        categoryId: pantsSub.id,
        rating: Math.random() * 5,
        isOffer: i % 4 === 0,
      },
    });
    products.push(product);

    await prisma.image.createMany({
      data: [
        { url: `/images/products/pants${i}.jpg`, alt: `Calça Jeans ${i}`, productId: product.id },
      ],
    });
  }

  // Tênis
  for (let i = 1; i <= 6; i++) {
    const product = await prisma.product.create({
      data: {
        name: `Tênis ${i}`,
        description: `Tênis esportivo confortável para corrida e caminhada. Modelo ${i}.`,
        price: 199.90 + (i * 50),
        stock: Math.floor(Math.random() * 20) + 5,
        sku: `SNEAKERS-${i}`,
        brandId: brands[i % brands.length].id,
        categoryId: sneakersSub.id,
        rating: Math.random() * 5,
        isOffer: i % 2 === 0,
      },
    });
    products.push(product);

    await prisma.image.createMany({
      data: [
        { url: `/images/products/sneakers${i}.jpg`, alt: `Tênis ${i}`, productId: product.id },
      ],
    });
  }

  console.log('⭐ Criando reviews...');
  // Reviews para produtos
  for (const product of products) {
    const reviewCount = Math.floor(Math.random() * 5);
    for (let r = 0; r < reviewCount; r++) {
      await prisma.review.create({
        data: {
          rating: Math.floor(Math.random() * 5) + 1,
          comment: `Excelente produto! Recomendo muito. Review ${r + 1} para ${product.name}`,
          userId: users[Math.floor(Math.random() * users.length)].id,
          productId: product.id,
        },
      });
    }
  }

  console.log('🏠 Criando endereços...');
  // Endereços para usuários
  for (const user of users) {
    await prisma.address.create({
      data: {
        userId: user.id,
        street: `Rua ${user.name.split(' ')[0]} ${Math.floor(Math.random() * 1000) + 1}`,
        city: 'São Paulo',
        state: 'SP',
        postalCode: '01234-567',
        country: 'Brasil',
        number: `${Math.floor(Math.random() * 1000) + 1}`,
        complement: Math.random() > 0.5 ? 'Apto 123' : null,
        isDefault: true,
      },
    });
  }

  console.log('🛒 Criando carrinhos e favoritos...');
  // Carrinhos
  for (const user of users) {
    const cart = await prisma.cart.create({
      data: { userId: user.id },
    });

    // Adicionar itens ao carrinho
    const cartItemsCount = Math.floor(Math.random() * 3) + 1;
    for (let i = 0; i < cartItemsCount; i++) {
      const product = products[Math.floor(Math.random() * products.length)];
      await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId: product.id,
          quantity: Math.floor(Math.random() * 3) + 1,
          unitPrice: product.price,
          total: product.price * (Math.floor(Math.random() * 3) + 1),
        },
      });
    }

    // Favoritos - Evitar duplicatas usando Set para produtos únicos
    const favCount = Math.floor(Math.random() * 5);
    const favoriteProducts = new Set();
    
    // Garantir que não há duplicatas de productId para o mesmo user
    while (favoriteProducts.size < Math.min(favCount, products.length)) {
      const product = products[Math.floor(Math.random() * products.length)];
      favoriteProducts.add(product.id);
    }
    
    for (const productId of favoriteProducts) {
      const product = products.find(p => p.id === productId);
      if (product) {
        await prisma.favorite.create({
          data: {
            userId: user.id,
            productId: product.id,
            productData: {
              name: product.name,
              price: product.price,
              image: `/images/products/${product.name.toLowerCase().replace(' ', '')}1.jpg`,
              slug: product.name.toLowerCase().replace(' ', '-'),
            },
          },
        });
      }
    }
  }

  console.log('📦 Criando pedidos...');
  // Pedidos
  for (let i = 0; i < 10; i++) {
    const user = users[Math.floor(Math.random() * users.length)];
    let totalItems = 0;

    const itemCount = Math.floor(Math.random() * 3) + 1;
    const orderItemsData = [];

    for (let j = 0; j < itemCount; j++) {
      const product = products[Math.floor(Math.random() * products.length)];
      const quantity = Math.floor(Math.random() * 3) + 1;
      const unitPrice = product.price;
      const total = unitPrice * quantity;
      totalItems += total;

      orderItemsData.push({
        productId: product.id,
        quantity,
        unitPrice,
        total,
      });
    }

    const shippingCost = Math.random() > 0.5 ? 15.00 : 0;
    const tax = 0;
    const total = totalItems + shippingCost + tax;

    const order = await prisma.order.create({
      data: {
        userId: user.id,
        shippingAddress: {
          street: 'Rua Exemplo 123',
          city: 'São Paulo',
          state: 'SP',
          postalCode: '01234-567',
          country: 'Brasil',
          number: '123',
        },
        paymentMethod: 'PIX',
        paymentStatus: Math.random() > 0.5 ? PaymentStatus.PAID : PaymentStatus.PENDING,
        subtotal: totalItems,
        shippingCost,
        tax,
        total,
        status: Math.random() > 0.5 ? 'PAID' : 'PENDING',
        isDelivered: Math.random() > 0.5,
      },
    });

    // Criar OrderItems com orderId
    for (const itemData of orderItemsData) {
      const orderItem = await prisma.orderItem.create({
        data: {
          orderId: order.id,
          ...itemData,
        },
      });

      // Se for produto com listas
      if (Math.random() > 0.7) {
        const list = await prisma.orderItemList.create({
          data: { orderItemId: orderItem.id },
        });
        for (let k = 0; k < itemData.quantity; k++) {
          await prisma.orderItemListRow.create({
            data: {
              listId: list.id,
              name: `Item ${k + 1}`,
              number: `${k + 1}`,
              size: Object.values(Size)[Math.floor(Math.random() * Object.values(Size).length)],
            },
          });
        }
      }
    }
  }

  console.log('🎠 Criando banners e carrossel...');
  // Banners
  await prisma.banner.createMany({
    data: [
      {
        title: 'Oferta Especial',
        description: 'Descontos de até 50% em roupas selecionadas',
        imageUrl: '/images/banners/banner1.jpg',
        buttonText: 'Comprar Agora',
        linkUrl: '/offers',
        isActive: true,
        order: 1,
      },
      {
        title: 'Nova Coleção',
        description: 'Confira as últimas tendências da moda',
        imageUrl: '/images/banners/banner2.jpg',
        buttonText: 'Ver Coleção',
        linkUrl: '/products',
        isActive: true,
        order: 2,
      },
    ],
  });

  // Carrossel
  await prisma.carouselImage.createMany({
    data: [
      {
        title: 'Slide 1',
        description: 'Bem-vindo à nossa loja',
        imageUrl: '/images/carousel/slide1.jpg',
        linkUrl: '/',
        isActive: true,
        order: 1,
      },
      {
        title: 'Slide 2',
        description: 'Produtos em oferta',
        imageUrl: '/images/carousel/slide2.jpg',
        linkUrl: '/offers',
        isActive: true,
        order: 2,
      },
    ],
  });

  console.log('💰 Criando ofertas...');
  // Ofertas
  for (let i = 0; i < 5; i++) {
    const product = products[Math.floor(Math.random() * products.length)];
    await prisma.offer.create({
      data: {
        productId: product.id,
        discount: Math.floor(Math.random() * 30) + 10, // 10-40% desconto
        isActive: true,
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 dias
      },
    });
  }

  console.log('📊 Criando CategoryGrid...');
  // CategoryGrid
  await prisma.categoryGrid.createMany({
    data: [
      {
        name: 'roupas',
        title: 'Roupas',
        description: 'Encontre a roupa perfeita',
        href: '/products?category=roupas',
        imgSrc: '/images/categories/clothing.jpg',
        backgroundColor: '#f0f0f0',
        isActive: true,
        order: 1,
      },
      {
        name: 'calcados',
        title: 'Calçados',
        description: 'Os melhores tênis e sapatos',
        href: '/products?category=calcados',
        imgSrc: '/images/categories/shoes.jpg',
        backgroundColor: '#e0e0e0',
        isActive: true,
        order: 2,
      },
    ],
  });

  console.log('🚚 Criando tabelas de frete...');
  // Shipping Rates - Tabelas padrão para cálculo de frete
  await prisma.shippingRate.deleteMany();
  await prisma.shippingRate.createMany({
    data: [
      // Até 5 peças
      {
        quantityUpTo: 5,
        height: 10,
        width: 15,
        length: 20,
        weight: 0.5,
        sedexValue: 40.00,
        pacValue: 25.00,
      },
      // Até 10 peças
      {
        quantityUpTo: 10,
        height: 15,
        width: 20,
        length: 25,
        weight: 1.0,
        sedexValue: 65.00,
        pacValue: 35.00,
      },
      // Até 20 peças
      {
        quantityUpTo: 20,
        height: 20,
        width: 25,
        length: 30,
        weight: 2.0,
        sedexValue: 115.00,
        pacValue: 60.00,
      },
      // Até 50 peças
      {
        quantityUpTo: 50,
        height: 25,
        width: 30,
        length: 40,
        weight: 5.0,
        sedexValue: 265.00,
        pacValue: 135.00,
      },
      // Acima de 50 peças
      {
        quantityUpTo: 1000,
        height: 30,
        width: 40,
        length: 50,
        weight: 10.0,
        sedexValue: 515.00,
        pacValue: 260.00,
      },
    ],
  });

  console.log('⚙️ Criando configurações...');
  // Settings
  await prisma.setting.createMany({
    data: [
      { key: 'whatsapp', value: '+5511999999999' },
      { key: 'site_name', value: 'ZiShop' },
      { key: 'currency', value: 'BRL' },
    ],
  });

  console.log('📧 Criando emails...');
  // Emails
  await prisma.email.createMany({
    data: [
      { email: 'newsletter1@email.com' },
      { email: 'newsletter2@email.com' },
      { email: 'newsletter3@email.com' },
    ],
  });

  console.log('✅ Seed concluído com sucesso!');
}

main()
  .catch((e) => {
    console.error('❌ Erro durante o seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
