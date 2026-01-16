import type { NextApiRequest, NextApiResponse } from 'next';
import { getUserFromRequest } from '../_utils/auth';
import prisma from '../../../lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('===== [Orders List API] Request received =====');
  console.log('[Orders List API] Method:', req.method);
  console.log('[Orders List API] URL:', req.url);
  console.log('[Orders List API] Authorization header:', req.headers.authorization ? `present (${req.headers.authorization.substring(0, 20)}...)` : '❌ missing');
  console.log('[Orders List API] All headers keys:', Object.keys(req.headers).join(', '));
  
  const user = await getUserFromRequest(req);
  if (!user) {
    console.error('[Orders List API] ❌ User not authenticated - returning 401');
    return res.status(401).json({ error: 'Não autorizado' });
  }

  console.log('[Orders List API] ✅ User authenticated:', user.id);

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
      include: { items: { include: { product: { include: { images: true } } } } },
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
      isDelivered: o.isDelivered || false,
      deliveryMethod: o.deliveryMethod || 'PENDING',
      trackingCode: o.trackingCode || null,
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
