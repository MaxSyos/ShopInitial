import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../lib/prisma';

/**
 * Endpoint de diagnóstico para verificar status de um pedido e suas parcelas
 * GET /api/orders/diagnose-order?orderId=69710b33c9da0ab746b44321
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    const { orderId } = req.query;

    if (!orderId || typeof orderId !== 'string') {
      return res.status(400).json({ error: 'orderId é obrigatório' });
    }

    console.log(`[Diagnose Order] Verificando Order: ${orderId}`);

    // Buscar pedido com todas as parcelas
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { installments: true, user: true }
    });

    if (!order) {
      return res.status(404).json({ error: 'Pedido não encontrado' });
    }

    // Diagnosticar status
    const installments = order.installments || [];
    const inst1 = installments.find(i => i.installmentNumber === 1);
    const inst2 = installments.find(i => i.installmentNumber === 2);

    let diagnosis = '';
    let actions = [];

    // Verificar Parcela 1
    if (!inst1) {
      diagnosis += '❌ Parcela 1 NÃO EXISTE\n';
      actions.push('Criar Parcela 1');
    } else if (inst1.status === 'PAID') {
      diagnosis += '✅ Parcela 1: PAGA\n';
    } else if (inst1.status === 'PAYMENT_CREATED') {
      diagnosis += '⏳ Parcela 1: Aguardando pagamento\n';
    } else {
      diagnosis += `⚠️ Parcela 1: Status desconhecido (${inst1.status})\n`;
    }

    // Verificar Parcela 2
    if (!inst2) {
      diagnosis += '❌ Parcela 2 NÃO EXISTE\n';
      actions.push('Criar Parcela 2');
    } else if (inst2.status === 'PAID') {
      diagnosis += '✅ Parcela 2: PAGA\n';
    } else if (inst2.status === 'PAYMENT_CREATED') {
      diagnosis += '⏳ Parcela 2: Aguardando pagamento\n';
    } else {
      diagnosis += `⚠️ Parcela 2: Status desconhecido (${inst2.status})\n`;
    }

    // Verificar status geral da Order
    const allPaid = installments.every(i => i.status === 'PAID');
    
    diagnosis += '\n--- Status Geral ---\n';
    if (allPaid) {
      diagnosis += '✅ TODAS as parcelas PAGAS!\n';
      if (order.status !== 'CONFIRMED') {
        diagnosis += '⚠️ Mas Order ainda não está CONFIRMED\n';
        actions.push(`Atualizar Order para CONFIRMED (status atual: ${order.status})`);
      } else {
        diagnosis += '✅ Order está CONFIRMED\n';
      }
    } else {
      diagnosis += `⏳ Aguardando pagamento: ${installments.filter(i => i.status !== 'PAID').length} parcela(s)\n`;
    }

    // Executar ações necessárias
    let syncResults = '';
    
    if (actions.length > 0 && allPaid && order.status !== 'CONFIRMED') {
      console.log(`[Diagnose Order] Atualizando Order para CONFIRMED...`);
      
      const updated = await prisma.order.update({
        where: { id: orderId },
        data: {
          status: 'CONFIRMED',
          paymentStatus: 'PAID'
        }
      });

      syncResults = `✅ Order atualizada para CONFIRMED`;
      diagnosis += '\n→ ' + syncResults;
    }

    return res.status(200).json({
      orderId,
      orderStatus: order.status,
      paymentStatus: order.paymentStatus,
      installments: {
        parcela1: inst1 ? { 
          id: inst1.id, 
          status: inst1.status, 
          paidAt: inst1.paidAt,
          mpPreferenceId: inst1.mpPreferenceId,
          amount: inst1.amount
        } : null,
        parcela2: inst2 ? { 
          id: inst2.id, 
          status: inst2.status, 
          paidAt: inst2.paidAt,
          mpPreferenceId: inst2.mpPreferenceId,
          amount: inst2.amount
        } : null
      },
      diagnosis,
      syncResults: syncResults || 'Nenhuma sincronização necessária',
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('[Diagnose Order] Erro:', error);
    return res.status(500).json({
      error: 'Erro ao diagnosticar ordem',
      message: error.message
    });
  }
}
