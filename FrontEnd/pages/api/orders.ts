import { NextApiRequest, NextApiResponse } from 'next';
import { getUserFromRequest } from './_utils/auth';
import prisma from '../../lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // autenticação via token Bearer (helper local)
  const user = await getUserFromRequest(req);
  if (!user) {
    return res.status(401).json({ error: 'Não autorizado' });
  }

  if (req.method === 'POST') {
    try {
      const payload = req.body;

      // Persistir pedido localmente primeiro
      const createdOrder = await prisma.order.create({
        data: {
          user: { connect: { id: user.id } },
          shippingAddress: payload.shippingAddress || {},
          billingAddress: payload.billingAddress || null,
          subtotal: payload.subtotal || 0,
          shippingCost: payload.shippingCost || 0,
          tax: payload.tax || 0,
          total: payload.total || 0,
          status: 'PENDING',
          itemsJson: payload.items || [],
        }
      });

      // Criar OrderItems locais (opcionalmente)
      if (Array.isArray(payload.items) && payload.items.length > 0) {
        for (const it of payload.items) {
          await prisma.orderItem.create({
            data: {
              order: { connect: { id: createdOrder.id } },
              // conectar produto pelo id (Prisma Mongo exige objeto relation em vez de productId direto)
              product: { connect: { id: String(it.productId) } },
              quantity: it.quantity || 0,
              unitPrice: it.price || 0,
              total: (it.price || 0) * (it.quantity || 0)
            }
          });
        }
      }

      // Forward para API upstream
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': req.headers.authorization || ''
        },
        body: JSON.stringify(req.body),
      });

      if (!response.ok) {
        const text = await response.text().catch(() => null);
        console.error('Erro ao criar pedido (upstream):', text);
        // Retornar o pedido local criado para o frontend, mas sinalizar que upstream falhou
        return res.status(200).json({ localOrder: createdOrder, warning: 'Pedido criado localmente, mas falha ao criar no serviço upstream' });
      }

      const data = await response.json();

      // Atualizar registro local com externalId/infos do upstream quando disponível
      try {
        await prisma.order.update({ where: { id: createdOrder.id }, data: { externalId: data.id?.toString() || undefined } });
      } catch (e) {
        console.warn('Falha ao atualizar externalId localmente', e);
      }

      res.status(200).json(data);
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
