import type { NextApiRequest, NextApiResponse } from 'next';
import { getUserFromRequest } from '../_utils/auth';
import prisma from '../../../lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = await getUserFromRequest(req);
  if (!user) return res.status(401).json({ error: 'Não autorizado' });

  // Verificar se é ADMIN
  if (user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Acesso negado. Apenas administradores podem gerenciar pedidos.' });
  }

  try {
    // GET: Listar todos os pedidos para admin
    if (req.method === 'GET') {
      const orders = await prisma.order.findMany({
        include: {
          user: { select: { id: true, name: true, email: true } },
          items: { include: { product: { include: { images: true } } } }
        },
        orderBy: { createdAt: 'desc' }
      });

      const formattedOrders = orders.map((o: any) => ({
        id: o.id,
        userId: o.userId,
        status: o.status,
        paymentStatus: o.paymentStatus,
        createdAt: o.createdAt,
        updatedAt: o.updatedAt,
        subtotal: o.subtotal,
        shippingCost: o.shippingCost,
        tax: o.tax,
        totalAmount: o.total,
        user: {
          id: o.user?.id,
          name: o.user?.name || 'Usuário',
          email: o.user?.email || '-'
        },
        items: (o.items || []).map((it: any) => ({
          id: it.id,
          productId: it.productId,
          productName: it.product?.name || it.productName || '',
          sku: it.product?.sku || it.sku || '',
          quantity: it.quantity,
          price: it.unitPrice,
          unitPrice: it.unitPrice,
          total: it.total
        })),
        shippingAddress: o.shippingAddress || {},
        trackingCode: o.trackingCode || null,
        deliveryMethod: o.deliveryMethod || 'PENDING',
        isDelivered: o.isDelivered || false,
        deliveredAt: o.deliveredAt || null
      }));

      return res.status(200).json(formattedOrders);
    }

    // PATCH: Atualizar rastreamento e status de entrega
    if (req.method === 'PATCH') {
      const { id } = req.query;
      if (!id) return res.status(400).json({ error: 'ID do pedido é obrigatório' });

      const { trackingCode, deliveryMethod, isDelivered, deliveredAt } = req.body;

      // Validar dados
      if (deliveryMethod && !['PENDING', 'CORREIOS', 'LOCAL'].includes(deliveryMethod)) {
        return res.status(400).json({ error: 'Tipo de entrega inválido' });
      }

      const updateData: any = {};

      if (deliveryMethod) updateData.deliveryMethod = deliveryMethod;
      if (trackingCode !== undefined) updateData.trackingCode = trackingCode || null;
      if (isDelivered !== undefined) {
        updateData.isDelivered = isDelivered;
        if (isDelivered) {
          // Quando marcado como entregue, atualizar o status para DELIVERED
          updateData.status = 'DELIVERED';
          if (!deliveredAt) {
            updateData.deliveredAt = new Date();
          } else {
            updateData.deliveredAt = new Date(deliveredAt);
          }
        }
      }

      const order = await prisma.order.update({
        where: { id: String(id) },
        data: updateData,
        include: {
          user: { select: { id: true, name: true, email: true } },
          items: { include: { product: { include: { images: true } } } }
        }
      });

      const o: any = order as any;
      const response = {
        id: o.id,
        userId: o.userId,
        status: o.status,
        paymentStatus: o.paymentStatus,
        createdAt: o.createdAt,
        updatedAt: o.updatedAt,
        subtotal: o.subtotal,
        shippingCost: o.shippingCost,
        tax: o.tax,
        totalAmount: o.total,
        user: {
          id: o.user?.id,
          name: o.user?.name || 'Usuário',
          email: o.user?.email || '-'
        },
        items: (o.items || []).map((it: any) => ({
          id: it.id,
          productId: it.productId,
          productName: it.product?.name || it.productName || '',
          sku: it.product?.sku || it.sku || '',
          quantity: it.quantity,
          price: it.unitPrice,
          unitPrice: it.unitPrice,
          total: it.total
        })),
        shippingAddress: o.shippingAddress || {},
        trackingCode: o.trackingCode || null,
        deliveryMethod: o.deliveryMethod || 'PENDING',
        isDelivered: o.isDelivered || false,
        deliveredAt: o.deliveredAt || null
      };

      return res.status(200).json(response);
    }

    res.setHeader('Allow', ['GET', 'PATCH']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  } catch (error: any) {
    console.error('Admin orders API error:', error);
    return res.status(500).json({ error: 'Erro ao processar pedidos' });
  }
}
