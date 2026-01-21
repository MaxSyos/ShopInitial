import prisma from '../../lib/prisma';

async function investigatePayment() {
  const mpId = '142834461102';

  console.log('\n=== INVESTIGANDO PAGAMENTO MP ID:', mpId, '===\n');

  // 1. Procurar por mpPreferenceId
  console.log('1. Procurando por mpPreferenceId na tabela PaymentInstallment...');
  const installmentByPreference = await prisma.paymentInstallment.findUnique({
    where: { mpPreferenceId: mpId.toString() },
    include: { order: { include: { user: true } } }
  });

  if (installmentByPreference) {
    console.log('✅ Encontrado!');
    console.log('  - Installment ID:', installmentByPreference.id);
    console.log('  - Order ID:', installmentByPreference.orderId);
    console.log('  - Installment Number:', installmentByPreference.installmentNumber);
    console.log('  - Status:', installmentByPreference.status);
    console.log('  - Amount:', installmentByPreference.amount);
    console.log('  - Order Status:', installmentByPreference.order.paymentStatus);
    console.log('  - Order Installments:', installmentByPreference.order.installments);
  } else {
    console.log('❌ Não encontrado por mpPreferenceId');
  }

  // 2. Procurar todos os PaymentInstallments com status PAYMENT_CREATED
  console.log('\n2. Procurando TODOS os PaymentInstallment com status PAYMENT_CREATED...');
  const allPaymentCreated = await prisma.paymentInstallment.findMany({
    where: { status: 'PAYMENT_CREATED' },
    include: { order: true }
  });

  console.log(`Encontrados ${allPaymentCreated.length} com PAYMENT_CREATED`);
  allPaymentCreated.forEach((inst, i) => {
    console.log(`  ${i + 1}. Order: ${inst.orderId}, Installment: ${inst.installmentNumber}, Amount: ${inst.amount}, mpPreferenceId: ${inst.mpPreferenceId?.substring(0, 20)}...`);
  });

  // 3. Procurar no webhook log
  console.log('\n3. Procurando registros do webhook no banco...');
  const allInstallments = await prisma.paymentInstallment.findMany({
    where: {
      webhookLog: {
        path: ['142834461102']
      }
    }
  });

  console.log(`Encontrados ${allInstallments.length} registros com mpId no webhook log`);

  // 4. Procurar na Order se tem referência ao MP
  console.log('\n4. Procurando em todas as Orders...');
  const orders = await prisma.order.findMany({
    include: { installments: true }
  });

  for (const order of orders) {
    for (const inst of order.installments) {
      if (inst.mpPreferenceId === mpId.toString() || inst.mpPreferenceId?.includes('142834461102')) {
        console.log('✅ Encontrado em Order:');
        console.log('  - Order ID:', order.id);
        console.log('  - Installment Number:', inst.installmentNumber);
        console.log('  - Status:', inst.status);
        console.log('  - Amount:', inst.amount);
        console.log('  - Order Payment Status:', order.paymentStatus);
      }
    }
  }

  console.log('\n=== FIM DA INVESTIGAÇÃO ===\n');
}

investigatePayment()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
