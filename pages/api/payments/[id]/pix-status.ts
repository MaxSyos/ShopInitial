import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../../lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).end('Method Not Allowed');

  try {
    const { id } = req.query;
    if (!id || Array.isArray(id)) return res.status(400).json({ error: 'id é obrigatório' });

    const mpId = String(id);
    const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;

    // Tentar localizar pela Parcela (Payment Installment) ou pelo orderId
    let installment: any = null;
    let order: any = null;

    // Primeiro: buscar por mpPreferenceId na Parcela 1
    installment = await prisma.paymentInstallment.findFirst({
      where: { mpPreferenceId: mpId },
      include: { order: true }
    });

    if (installment) {
      order = installment.order;
    }

    // Se não encontrado, talvez o id enviado é o id do pedido local
    if (!order) {
      order = await prisma.order.findUnique({
        where: { id: mpId },
        include: { installments: true }
      });
      if (order) {
        // Buscar Parcela 1 do pedido
        installment = order.installments?.find((i: any) => i.installmentNumber === 1);
      }
    }

    // Se não temos accessToken, retornamos o status salvo localmente
    if (!accessToken) {
      if (!order) return res.status(404).json({ error: 'Pedido não encontrado' });
      const localStatus = order.paymentStatus || 'PENDING';
      const uiStatus = localStatus === 'PENDING' ? 'WAITING_PAYMENT' : (localStatus === 'PAID' ? 'COMPLETED' : (localStatus === 'FAILED' ? 'FAILED' : localStatus));
      return res.status(200).json({ status: uiStatus, localStatus, order });
    }

    // Consultar detalhes do pagamento no MercadoPago
    const resp = await fetch(`https://api.mercadopago.com/v1/payments/${mpId}`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    if (!resp.ok) {
      const text = await resp.text().catch(() => null);
      console.warn('MP status fetch failed', mpId, text);
      if (!order) return res.status(502).json({ error: 'Falha ao consultar MP', details: text });
      const localStatus = order.paymentStatus || 'PENDING';
      const uiStatus = localStatus === 'PENDING' ? 'WAITING_PAYMENT' : (localStatus === 'PAID' ? 'COMPLETED' : (localStatus === 'FAILED' ? 'FAILED' : localStatus));
      return res.status(200).json({ status: uiStatus, localStatus, order, mpError: text });
    }

    const mpDetails = await resp.json();

    // Se o MP retornou external_reference, tentar localizar pedido por ele
    if (!order && mpDetails?.external_reference) {
      order = await prisma.order.findUnique({
        where: { id: mpDetails.external_reference },
        include: { installments: true }
      });
      if (order) {
        installment = order.installments?.find((i: any) => i.installmentNumber === 1);
      }
    }

    // Mapear status MP para status de UI
    let status = 'WAITING_PAYMENT';
    const mpStatus = mpDetails?.status || mpDetails?.status_detail || '';
    if (mpStatus === 'approved' || mpStatus === 'paid' || mpStatus === 'success') {
      status = 'COMPLETED';
    } else if (mpStatus === 'rejected' || mpStatus === 'cancelled' || mpStatus === 'refunded') {
      status = 'FAILED';
    } else if (mpStatus === 'in_process' || mpStatus === 'pending' || mpStatus === '') {
      status = 'WAITING_PAYMENT';
    }

    // Atualizar registro local com o status do pagamento quando possível
    try {
      if (installment) {
        // Atualizar Parcela 1
        const updateData: any = {
          webhookLog: {
            lastCheck: new Date().toISOString(),
            mpStatus: mpStatus,
            uiStatus: status
          }
        };

        if (status === 'COMPLETED') {
          updateData.status = 'PAID';
          updateData.paidAt = new Date();
        } else if (status === 'FAILED') {
          updateData.status = 'FAILED';
        }

        await prisma.paymentInstallment.update({
          where: { id: installment.id },
          data: updateData
        });
      }

      // Atualizar Order se ambas parcelas estiverem PAID
      if (order) {
        const allInstallments = await prisma.paymentInstallment.findMany({
          where: { orderId: order.id }
        });

        const allPaid = allInstallments.every((i: any) => i.status === 'PAID');
        if (allPaid && order.paymentStatus !== 'PAID') {
          await prisma.order.update({
            where: { id: order.id },
            data: {
              paymentStatus: 'PAID',
              status: 'CONFIRMED'
            }
          });
        }
      }
    } catch (e) {
      console.warn('Falha ao atualizar status local', e);
    }

    return res.status(200).json({ status, mpDetails, order: order || null });
  } catch (error: any) {
    console.error('pix-status error', error);
    return res.status(500).json({ error: 'Erro interno', details: error.message });
  }
}
