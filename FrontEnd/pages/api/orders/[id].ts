import type { NextApiRequest, NextApiResponse } from 'next';
import { getUserFromRequest } from '../_utils/auth';
import prisma from '../../../lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = await getUserFromRequest(req);
  if (!user) return res.status(401).json({ error: 'Não autorizado' });

  const { id } = req.query;
  if (!id) return res.status(400).json({ error: 'order id é obrigatório' });

  try {
    // procurar por id (local), ou externalId igual ao id passado
    const whereClause = {
      OR: [
        { id: String(id) },
        { externalId: String(id) },
        { mpPreferenceId: String(id) }
      ]
    };

    // buscar pedido incluindo items
    // @ts-ignore prisma typings
    const order = await prisma.order.findFirst({
      where: { AND: [{ userId: user.id }, whereClause] },
      include: { items: { include: { product: true } } }
    });

    if (!order) return res.status(404).json({ error: 'Pedido não encontrado' });

    // estruturar retorno com campos relevantes para a UI
    const o: any = order as any;
    const response = {
      order: {
        id: o.id,
        userId: o.userId,
        status: o.status,
        createdAt: o.createdAt,
        subtotal: o.subtotal,
        shippingCost: o.shippingCost,
        tax: o.tax,
        total: o.total,
        paymentMethod: o.paymentMethod,
        paymentStatus: o.paymentStatus,
        mpPreferenceId: o.mpPreferenceId,
        mpIdempotencyKey: o.mpIdempotencyKey,
        mpQrCodeBase64: o.mpQrCodeBase64,
        mpQrCodeUrl: o.mpQrCodeUrl,
        paymentExpiresAt: o.paymentExpiresAt,
        paidAt: o.paidAt,
        shippingAddress: o.shippingAddress,
        items: (o.items || []).map((it: any) => ({
          id: it.id,
          productId: it.productId,
          productName: it.product?.name || it.productName || '',
          quantity: it.quantity,
          unitPrice: it.unitPrice,
          total: it.total,
          product: it.product || null
        }))
      }
    };

    return res.status(200).json(response);
  } catch (error: any) {
    console.error('GET /api/orders/[id] error', error);
    return res.status(500).json({ error: 'Erro interno' });
  }
}
