import type { NextApiRequest, NextApiResponse } from 'next';
import { getUserFromRequest } from '../_utils/auth';
import prisma from '../../../lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = await getUserFromRequest(req);
  if (!user) return res.status(401).json({ error: 'Não autorizado' });

  const { id } = req.query;
  if (!id) return res.status(400).json({ error: 'order id é obrigatório' });

  // helper para localizar pedido do usuário por id/external
  const findUserOrder = async () => {
    const whereClause = {
      OR: [
        { id: String(id) },
        { externalId: String(id) }
      ]
    };
    // @ts-ignore prisma typings
    const order = await prisma.order.findFirst({
      where: { AND: [{ userId: user.id }, whereClause] },
      include: { items: { include: { product: { include: { images: true } } } }, installments: true }
    });
    return order;
  };

  try {
    // atualizar shippingAddress (PATCH/PUT)
    if (req.method === 'PATCH' || req.method === 'PUT') {
      const payload = req.body || {};
      if (!payload.shippingAddress || typeof payload.shippingAddress !== 'object') {
        return res.status(400).json({ error: 'shippingAddress inválido' });
      }

      const order = await findUserOrder();
      if (!order) return res.status(404).json({ error: 'Pedido não encontrado' });

      const updated = await prisma.order.update({
        where: { id: String(order.id) },
        data: { shippingAddress: payload.shippingAddress }
      });

      const o: any = updated as any;
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
          isDelivered: o.isDelivered || false,
          deliveryMethod: o.deliveryMethod || 'PENDING',
          trackingCode: o.trackingCode || null,
          installments: [],
          items: [] // updated does not include items by default here
        }
      };
      // tentar incluir items se existirem
      try {
        const refreshed = await prisma.order.findUnique({ where: { id: updated.id }, include: { items: { include: { product: { include: { images: true } } } }, installments: true } });
        if (refreshed) {
          response.order.items = (refreshed.items || []).map((it: any) => ({
            id: it.id,
            productId: it.productId,
            productName: it.product?.name || it.productName || '',
            quantity: it.quantity,
            unitPrice: it.unitPrice,
            total: it.total,
            product: it.product ? {
              id: it.product.id,
              name: it.product.name,
              image: it.product.images && it.product.images.length > 0 ? it.product.images[0].url : null,
              images: it.product.images
            } : null
          }));
          response.order.installments = refreshed.installments || [];
        }
      } catch (e) {
        console.warn('Não foi possível incluir items ao retornar pedido atualizado', e);
      }

      return res.status(200).json(response);
    }

    // GET (padrão)
    if (req.method === 'GET') {
      const order = await findUserOrder();
      if (!order) return res.status(404).json({ error: 'Pedido não encontrado' });

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
          isDelivered: o.isDelivered || false,
          deliveryMethod: o.deliveryMethod || 'PENDING',
          trackingCode: o.trackingCode || null,
          installments: o.installments || [],
          items: (o.items || []).map((it: any) => ({
            id: it.id,
            productId: it.productId,
            productName: it.product?.name || it.productName || '',
            quantity: it.quantity,
            unitPrice: it.unitPrice,
            total: it.total,
            product: it.product ? {
              id: it.product.id,
              name: it.product.name,
              image: it.product.images && it.product.images.length > 0 ? it.product.images[0].url : null,
              images: it.product.images
            } : null
          }))
        }
      };

      return res.status(200).json(response);
    }

    res.setHeader('Allow', ['GET', 'PATCH', 'PUT']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  } catch (error: any) {
    console.error('GET /api/orders/[id] error', error);
    return res.status(500).json({ error: 'Erro interno' });
  }
}
