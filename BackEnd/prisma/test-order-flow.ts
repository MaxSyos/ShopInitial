import { PrismaClient, UserRole, OrderStatus, PaymentStatus, PaymentMethod } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import axios from 'axios';

const prisma = new PrismaClient();
const API_URL = 'https://probable-xylophone-gxq4vjqv6wjf9xg6-3000.app.github.dev';  // URL local do backend

async function testOrderFlow() {
  try {
    console.log('🚀 Iniciando teste do fluxo de pedidos...');

    // Limpar dados anteriores
    console.log('🧹 Limpando dados de teste anteriores...');
    await prisma.payment.deleteMany();
    await prisma.orderItem.deleteMany();
    await prisma.order.deleteMany();
    await prisma.cartItem.deleteMany();
    await prisma.cart.deleteMany();
    await prisma.product.deleteMany();
    await prisma.category.deleteMany();
    await prisma.brand.deleteMany();
    await prisma.address.deleteMany();
    await prisma.refreshToken.deleteMany();
    await prisma.user.deleteMany();

    // Criar dados base
    console.log('📝 Criando dados base...');
    const hashedPassword = await bcrypt.hash('Senha@123456', 10);

    // Criar usuário
    console.log('👤 Criando usuário de teste...');
    const user = await prisma.user.create({
      data: {
        email: 'cliente@shopinitial.com',
        password: hashedPassword,
        name: 'Cliente Teste',
        role: UserRole.USER,
        isActive: true,
      },
    });

    // Criar marca
    console.log('🏢 Criando marca...');
    const brand = await prisma.brand.create({
      data: {
        name: 'Samsung',
        logo: 'https://example.com/samsung.png'
      }
    });

    // Criar categoria
    console.log('📁 Criando categoria...');
    const category = await prisma.category.create({
      data: {
        name: 'Smartphones',
        description: 'Telefones celulares e smartphones'
      }
    });

    // Criar produto
    console.log('📱 Criando produto...');
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

    // Criar endereço
    console.log('📍 Criando endereço...');
    const address = await prisma.address.create({
      data: {
        street: 'Avenida Paulista, 1000',
        city: 'São Paulo',
        state: 'SP',
        country: 'Brasil',
        postalCode: '01310-100',
        userId: user.id,
        isDefault: true,
      },
    });

    // Simular fluxo da API
    console.log('\n🔄 Iniciando fluxo da API...');

    // 1. Login
    console.log('\n🔑 Fazendo login...');
    const loginResponse = await axios.post(`${API_URL}/api/auth/login`, {
      email: 'cliente@shopinitial.com',
      password: 'Senha@123456'
    });

    if (!loginResponse.data.accessToken) {
      throw new Error('Token não retornado no login');
    }

    const token = loginResponse.data.accessToken;
    console.log('✅ Login realizado com sucesso!');

    // 2. Adicionar ao carrinho
    console.log('\n🛒 Adicionando produto ao carrinho...');
    const cartResponse = await axios.post(
      `${API_URL}/api/cart/items`,
      {
        productId: product.id,
        quantity: 1
      },
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    console.log('✅ Produto adicionado ao carrinho!');

    // 3. Criar pedido
    console.log('\n📦 Criando pedido...');
    const orderResponse = await axios.post(
      `${API_URL}/api/orders`,
      {
        street: address.street,
        city: address.city,
        state: address.state,
        country: address.country,
        postalCode: address.postalCode
      },
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    
    const orderId = orderResponse.data.id;
    console.log('✅ Pedido criado com sucesso!');

    // 4. Verificar pagamento gerado
    console.log('\n💳 Verificando pagamento...');
    const payment = await prisma.payment.findFirst({
      where: { orderId }
    });

    if (!payment) {
      throw new Error('Pagamento não foi gerado automaticamente!');
    }

    console.log('✅ Pagamento gerado automaticamente!');
    console.log('💰 Valor:', payment.amount);
    console.log('🏷️ Status:', payment.status);
    console.log('💳 Método:', payment.paymentMethod);

    // // 5. Simular webhook de pagamento
    // console.log('\n🔄 Simulando retorno do gateway de pagamento...');
    // await axios.post(`${API_URL}/api/payments/webhook`, {
    //   action: 'payment.updated',
    //   api_version: '1.0',
    //   data: {
    //     id: payment.id
    //   },
    //   date_created: new Date().toISOString(),
    //   live_mode: false,
    //   type: 'payment',
    //   user_id: 123456
    // });

    // // 6. Verificar status final
    // console.log('\n🔍 Verificando status final...');
    // const finalOrder = await prisma.order.findUnique({
    //   where: { id: orderId }
    // });

    // const finalPayment = await prisma.payment.findFirst({
    //   where: { orderId }
    // });

    // console.log('\n📊 Resultado final:');
    // console.log('Pedido:', {
    //   id: finalOrder.id,
    //   status: finalOrder.status,
    //   total: finalOrder.total
    // });
    
    // console.log('Pagamento:', {
    //   id: finalPayment.id,
    //   status: finalPayment.status,
    //   amount: finalPayment.amount
    // });

    console.log('\n✅ Teste concluído com sucesso!');

  } catch (error) {
    console.error('\n❌ Erro durante o teste:', error.message);
    if (error.response) {
      console.error('Detalhes do erro:', {
        status: error.response.status,
        data: error.response.data
      });
    }
  }
}

// Executar o teste
testOrderFlow()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
