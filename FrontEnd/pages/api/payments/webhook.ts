import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end('Method Not Allowed');

  try {
    const body = req.body;

    // MP sends different webhook shapes; we expect { type: 'payment', data: { id: <mpPaymentId> } }
    const mpId = body?.data?.id || body?.id || null;
    if (!mpId) {
      console.warn('Webhook recebido sem mp id', body);
      return res.status(200).json({ received: true });
    }

    const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
    let mpDetails: any = null;

    if (accessToken) {
      // tentar buscar detalhes do pagamento no MP
      const resp = await fetch(`https://api.mercadopago.com/v1/payments/${mpId}`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      mpDetails = await resp.json();
    }

    // Tentar localizar pedido pelo external_reference (mpDetails.external_reference) ou pelo mpPreferenceId
    let order: any = null;
    if (mpDetails?.external_reference) {
      // @ts-ignore - prisma client model typing may need regeneration
      order = await prisma.order.findUnique({ where: { id: mpDetails.external_reference } });
    }

    if (!order) {
      // procurar por mpPreferenceId que contenha mpId (fallback)
      // @ts-ignore - prisma client model typing may need regeneration
      order = await prisma.order.findFirst({ where: { mpPreferenceId: mpId.toString() } });
    }

    if (!order && mpDetails?.metadata?.orderId) {
      // @ts-ignore - prisma client model typing may need regeneration
      order = await prisma.order.findUnique({ where: { id: mpDetails.metadata.orderId } });
    }

    if (!order) {
      console.warn('Pedido não encontrado para webhook MP id:', mpId);
      return res.status(200).json({ received: true, message: 'Pedido não encontrado' });
    }

    // Determinar status
    let status: string = 'PENDING';
    if (mpDetails?.status === 'approved' || mpDetails?.status === 'paid' || mpDetails?.status === 'approved') {
      status = 'PAID';
    } else if (mpDetails?.status === 'rejected' || mpDetails?.status === 'cancelled') {
      status = 'FAILED';
    } else if (mpDetails?.status === 'in_process') {
      status = 'PENDING';
    }

    const updateData: any = { paymentStatus: status };
    if (status === 'PAID') updateData.paidAt = new Date();

  // @ts-ignore - prisma client model typing may need regeneration
  await prisma.order.update({ where: { id: order.id }, data: updateData });

    return res.status(200).json({ received: true });
  } catch (error: any) {
    console.error('webhook error', error);
    return res.status(500).json({ received: false, error: error.message });
  }
}
