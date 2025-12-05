import type { NextApiRequest, NextApiResponse } from 'next';
import { getUserFromRequest } from '../_utils/auth';
import prisma from '../../../lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = await getUserFromRequest(req);
  if (!user) return res.status(401).json({ error: 'Não autorizado' });

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    // Obter parâmetros de paginação
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    // Buscar ordens do usuário com paginação
    const orders = await prisma.order.findMany({
      where: { userId: user.id },
      include: { items: { include: { product: true } } },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit
    });

    // Contar total de ordens
    const total = await prisma.order.count({
      where: { userId: user.id }
    });

    // Mapear ordens para o formato da UI
    const mappedOrders = orders.map((o: any) => ({
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
    }));

    return res.status(200).json({
      orders: mappedOrders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error: any) {
    console.error('GET /api/orders/list error', error);
    return res.status(500).json({ error: 'Erro interno' });
  }
}
