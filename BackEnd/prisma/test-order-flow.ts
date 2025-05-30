import { PrismaClient, UserRole, OrderStatus, PaymentStatus, PaymentMethod } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import axios from 'axios';
import * as crypto from 'crypto';

const prisma = new PrismaClient();
const API_URL = 'https://solid-goggles-4jrjw6prwq4qfj7rg-3000.app.github.dev';  // URL local do backend

// Função para gerar assinatura do webhook
function generateWebhookSignature(payload: Buffer, secret: string): string {
  return crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
}

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

    // Verificar se o produto foi adicionado ao carrinho
    const cartItems = await prisma.cartItem.findFirst({
      where: {
        cart: {
          userId: user.id
        },
        productId: product.id
      },
      include: {
        cart: true,
        product: true
      }
    });

    if (!cartItems) {
      throw new Error('Produto não foi adicionado ao carrinho corretamente');
    }

    console.log('✅ Produto adicionado ao carrinho!');
    console.log('🛒 Detalhes do carrinho:', {
      cartId: cartItems.cartId,
      produto: cartItems.product.name,
      quantidade: cartItems.quantity,
      preço: cartItems.product.price
    });

    // Calcular o total do carrinho
    const cartTotal = Number(cartItems.quantity) * Number(cartItems.product.price);
    console.log('💰 Total do carrinho:', cartTotal);

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

    // Verificar se o pedido foi criado corretamente com os valores do carrinho
    const createdOrder = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            product: true
          }
        }
      }
    });

    if (!createdOrder) {
      throw new Error('Pedido não foi criado corretamente');
    }

    if (Number(createdOrder.total) !== cartTotal) {
      throw new Error(`Valor do pedido (${createdOrder.total}) não corresponde ao total do carrinho (${cartTotal})`);
    }

    console.log('✅ Valores do pedido conferem com o carrinho');

    // 4. Fluxo de pagamento PIX
    console.log('\n💳 Iniciando fluxo de pagamento PIX...');
    
    // 4.1 Criar registro inicial do pagamento (simulando dados do frontend)
    const paymentData = {
      orderId: orderId,
      amount: cartTotal,
      currency: 'BRL',
      paymentMethod: PaymentMethod.PIX,
      description: `Pedido #${orderId}`,
      metadata: {
        testPayment: true,
        customerName: user.name,
        customerEmail: user.email,
        cartItems: [{
          productId: product.id,
          quantity: cartItems.quantity,
          price: Number(cartItems.product.price)
        }]
      }
    };

    // 4.2 Criar registro inicial no banco
    console.log('💾 Salvando dados iniciais no banco...');
    const initialPayment = await prisma.payment.create({
      data: {
        order: {
          connect: { id: orderId }
        },
        amount: cartTotal,
        currency: 'BRL',
        status: PaymentStatus.PENDING,
        paymentMethod: PaymentMethod.PIX,
        provider: 'MERCADOPAGO',
        installments: 1,
        metadata: paymentData.metadata
      }
    });

    console.log('✅ Registro inicial criado no banco com ID:', initialPayment.id);

    // 4.3 Enviar para API do Mercado Pago
    console.log('🌐 Enviando dados para Mercado Pago...');
    const paymentResponse = await axios.post(
      `${API_URL}/api/payments/mercadopago/pix`,
      {
        dbPaymentId: initialPayment.id,
        ...paymentData,
        items: [{
          id: product.id,
          title: product.name,
          quantity: cartItems.quantity,
          unitPrice: Number(cartItems.product.price)
        }]
      },
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );

    // 4.4 Verificar atualização no banco com dados do Mercado Pago
    console.log('🔍 Verificando atualização dos dados do PIX...');
    const updatedPayment = await prisma.payment.findUnique({
      where: { id: initialPayment.id }
    });

    if (!updatedPayment) {
      throw new Error('Pagamento não encontrado no banco');
    }

    // Verificar campos obrigatórios do PIX
    const requiredFields = ['pixQrCode', 'pixCode', 'pixExpiresAt', 'transactionId'];
    for (const field of requiredFields) {
      if (!updatedPayment[field]) {
        throw new Error(`Campo ${field} não foi atualizado com dados do Mercado Pago`);
      }
    }

    console.log('✅ Dados do PIX atualizados no banco:', {
      transactionId: updatedPayment.transactionId,
      status: updatedPayment.status,
      pixExpiresAt: updatedPayment.pixExpiresAt
    });

    // 5. Verificar QR Code PIX via API (simulando frontend)
    console.log('\n🔍 Verificando QR Code PIX via API...');
    const pixStatusResponse = await axios.get(
      `${API_URL}/api/payments/${initialPayment.id}/pix-status`,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );

    if (!pixStatusResponse.data.pixQrCode) {
      throw new Error('QR Code PIX não foi gerado!');
    }

    console.log('✅ QR Code PIX gerado com sucesso!');
    console.log('📱 QR Code:', pixStatusResponse.data.pixQrCode);
    console.log('⏰ Expira em:', pixStatusResponse.data.pixExpiresAt);

    // 6. Simular webhook de pagamento confirmado
    console.log('\n🔄 Simulando confirmação de pagamento pelo Mercado Pago...');
    const webhookPayload = {
      action: 'payment.updated',
      api_version: '1.0',
      data: {
        id: paymentId
      },
      type: 'payment',
      date_created: new Date().toISOString(),
      live_mode: false
    };

    const webhookSecret = process.env.MERCADOPAGO_WEBHOOK_SECRET || 'test_webhook_secret';
    const payloadBuffer = Buffer.from(JSON.stringify(webhookPayload));
    const signature = generateWebhookSignature(payloadBuffer, webhookSecret);

    await axios.post(
      `${API_URL}/api/payments/webhook`,
      webhookPayload,
      {
        headers: {
          'x-signature': signature,
          'Content-Type': 'application/json'
        }
      }
    );

    // 7. Verificar status final
    console.log('\n🔍 Verificando status final do pedido e pagamento...');
    const finalOrder = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        payment: true,
        items: {
          include: {
            product: true
          }
        }
      }
    });

    if (!finalOrder) {
      throw new Error('Pedido não encontrado após pagamento!');
    }

    console.log('\n📊 Resultado final:');
    console.log('Pedido:', {
      id: finalOrder.id,
      status: finalOrder.status,
      total: finalOrder.total,
      items: finalOrder.items.map(item => ({
        product: item.product.name,
        quantity: item.quantity,
        price: item.price
      }))
    });
    
    console.log('Pagamento:', {
      id: finalOrder.payment?.id,
      status: finalOrder.payment?.status,
      method: finalOrder.payment?.paymentMethod,
      amount: finalOrder.payment?.amount
    });

    // 8. Verificar se o estoque foi atualizado
    console.log('\n📦 Verificando atualização do estoque...');
    const updatedProduct = await prisma.product.findUnique({
      where: { id: product.id }
    });

    if (!updatedProduct) {
      throw new Error('Produto não encontrado após atualização de estoque!');
    }

    console.log('Estoque atual:', updatedProduct.stock);
    console.log('Estoque inicial:', product.stock);

    if (updatedProduct.stock !== product.stock - 1) {
      throw new Error(`Estoque não foi atualizado corretamente! Esperado: ${product.stock - 1}, Atual: ${updatedProduct.stock}`);
    }

    console.log('\n✅ Teste concluído com sucesso!');

  } catch (error) {
    console.error('\n❌ Erro durante o teste:', error.message);
    if (error.response) {
      console.error('Detalhes do erro:', {
        status: error.response.status,
        data: error.response.data
      });
    }
    throw error;
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
