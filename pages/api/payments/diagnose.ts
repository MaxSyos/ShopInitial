import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { orderId, idempotencyKey } = req.query;

    if (!orderId && !idempotencyKey) {
      return res.status(400).json({ error: 'Forneça orderId ou idempotencyKey como query param' });
    }

    let order = null;
    if (orderId) {
      // @ts-ignore
      order = await prisma.order.findUnique({ where: { id: String(orderId) } });
    }

    if (!order && idempotencyKey) {
      // @ts-ignore
      order = await prisma.order.findFirst({ where: { mpIdempotencyKey: String(idempotencyKey) } });
    }

    if (!order) return res.status(404).json({ error: 'Pedido não encontrado' });

    // Retornar dados do pedido e campos MP relevantes para diagnóstico
    const debug = {
      id: order.id,
      mpPreferenceId: order.mpPreferenceId || null,
      mpIdempotencyKey: order.mpIdempotencyKey || null,
      mpQrCodeBase64: order.mpQrCodeBase64 || null,
      paymentExpiresAt: order.paymentExpiresAt || null,
      paymentStatus: order.paymentStatus || null
    };

    return res.status(200).json({ ok: true, order: debug });
  } catch (err: any) {
    console.error('diagnose error', err);
    return res.status(500).json({ error: 'Erro interno', details: err.message });
  }
}
