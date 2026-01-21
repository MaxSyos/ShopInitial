/**
 * Script para atualizar manualmente o status de um pagamento no banco de dados
 * quando o webhook falhou em processar
 */
import prisma from '../../lib/prisma';

async function fixPayment() {
  const mpId = '142834461102';

  console.log('\n=== CORRIGINDO PAGAMENTO ===\n');

  try {
    // 1. Encontrar a parcela
    console.log('1. Procurando parcela com mpPreferenceId:', mpId);
    const installment = await prisma.paymentInstallment.findUnique({
      where: { mpPreferenceId: mpId.toString() },
      include: { order: true }
    });

    if (!installment) {
      console.log('❌ Parcela não encontrada!');
      console.log('\nProcurando todas as parcelas com status PAYMENT_CREATED...');
      const allPaymentCreated = await prisma.paymentInstallment.findMany({
        where: { status: 'PAYMENT_CREATED' },
        select: { id: true, orderId: true, installmentNumber: true, mpPreferenceId: true, amount: true }
      });
      
      console.log(`\nEncontradas ${allPaymentCreated.length} parcelas:`);
      allPaymentCreated.forEach(inst => {
        console.log(`  - Order: ${inst.orderId}, Inst: ${inst.installmentNumber}, mpPreferenceId: ${inst.mpPreferenceId}`);
      });
      return;
    }

    console.log('✅ Encontrada!');
    console.log('   - Order:', installment.orderId);
    console.log('   - Installment:', installment.installmentNumber);
    console.log('   - Status Atual:', installment.status);
    console.log('   - Valor:', installment.amount);
    console.log('   - Order Status:', installment.order.paymentStatus);

    // 2. Atualizar para PAID
    console.log('\n2. Atualizando para PAID...');
    const updated = await prisma.paymentInstallment.update({
      where: { id: installment.id },
      data: {
        status: 'PAID',
        paidAt: new Date()
      }
    });

    console.log('✅ Parcela atualizada!');
    console.log('   - Novo Status:', updated.status);
    console.log('   - Data Pagamento:', updated.paidAt);

    // 3. Verificar se ambas as parcelas foram pagas
    console.log('\n3. Verificando status das parcelas...');
    const allInstallments = await prisma.paymentInstallment.findMany({
      where: { orderId: installment.orderId }
    });

    const allPaid = allInstallments.every(inst => inst.status === 'PAID');
    console.log(`   - Parcela 1: ${allInstallments[0]?.status}`);
    console.log(`   - Parcela 2: ${allInstallments[1]?.status}`);
    console.log(`   - Todas pagas: ${allPaid}`);

    // 4. Se todas estão pagas, atualizar Order
    if (allPaid) {
      console.log('\n4. Todas as parcelas foram pagas! Atualizando Order...');
      const orderUpdated = await prisma.order.update({
        where: { id: installment.orderId },
        data: {
          paymentStatus: 'PAID',
          status: 'CONFIRMED'
        }
      });

      console.log('✅ Order atualizada!');
      console.log('   - Payment Status:', orderUpdated.paymentStatus);
      console.log('   - Order Status:', orderUpdated.status);
    } else {
      console.log('\n⏳ Nem todas as parcelas foram pagas ainda.');
      console.log('   - Parcela 1/2 será paga quando a outra também estiver PAID');
    }

    console.log('\n=== CONCLUÍDO COM SUCESSO ===\n');

  } catch (error: any) {
    console.error('❌ Erro:', error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

fixPayment();
