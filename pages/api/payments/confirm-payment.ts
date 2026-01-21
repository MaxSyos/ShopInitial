import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../lib/prisma';
import { getUserFromRequest } from '../_utils/auth';

/**
 * Endpoint para verificar e confirmar pagamento de segunda parcela
 * Se ambas as parcelas estão pagas, marca o pedido como PAGO
 */
async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end('Method Not Allowed');

  const user = await getUserFromRequest(req);
  if (!user) return res.status(401).json({ error: 'Não autorizado' });

  const { orderId } = req.body;
  if (!orderId) return res.status(400).json({ error: 'orderId é obrigatório' });

  try {
    console.log(`[Confirm Payment] Verificando se pedido ${orderId} está completamente pago`);

    // Buscar todas as parcelas do pedido
    const installments = await prisma.paymentInstallment.findMany({
      where: { orderId },
      orderBy: { installmentNumber: 'asc' }
    });

    if (!installments || installments.length === 0) {
      return res.status(404).json({ error: 'Nenhuma parcela encontrada para este pedido' });
    }

    // Verificar se todas estão pagas
    const allPaid = installments.every(inst => 
      String(inst.status).toUpperCase() === 'PAID'
    );

    console.log(`[Confirm Payment] Parcelas encontradas: ${installments.length}, Todas pagas: ${allPaid}`);
    console.log(`[Confirm Payment] Status das parcelas:`, installments.map(i => `Inst${i.installmentNumber}: ${i.status}`));

    if (allPaid) {
      // Atualizar pedido como pago
      const updatedOrder = await prisma.order.update({
        where: { id: orderId },
        data: {
          paymentStatus: 'PAID',
          status: 'CONFIRMED'
        },
        include: {
          items: { include: { product: { include: { images: true } } } },
          installments: true
        }
      });

      console.log(`[Confirm Payment] ✅ Pedido ${orderId} marcado como PAGO e CONFIRMADO`);

      return res.status(200).json({
        success: true,
        message: 'Pedido marcado como pago',
        order: updatedOrder,
        installments
      });
    } else {
      // Retornar status atual
      console.log(`[Confirm Payment] Pedido ainda não está completamente pago`);

      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
          items: { include: { product: { include: { images: true } } } },
          installments: true
        }
      });

      return res.status(200).json({
        success: false,
        message: 'Pedido não está completamente pago',
        order,
        installments,
        pendingInstallments: installments.filter(inst => 
          String(inst.status).toUpperCase() !== 'PAID'
        ).map(inst => ({
          installmentNumber: inst.installmentNumber,
          status: inst.status,
          amount: inst.amount
        }))
      });
    }
  } catch (error: any) {
    console.error(`[Confirm Payment] Error:`, error);
    return res.status(500).json({ 
      error: 'Erro ao confirmar pagamento', 
      details: error.message 
    });
  }
}

export default handler;
