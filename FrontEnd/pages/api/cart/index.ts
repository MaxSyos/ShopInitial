import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../lib/prisma';
import { getUserFromRequest, requireAuth } from '../_utils/auth';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  // @ts-ignore
  const user = await getUserFromRequest(req);
  if (!user) return res.status(401).json({ error: 'Não autorizado' });

  if (req.method === 'GET') {
    try {
      // @ts-ignore
      const cart = await prisma.cart.findUnique({ where: { userId: user.id }, include: { items: true } });
      if (!cart) return res.status(200).json({ items: [], totalQuantity: 0, totalAmount: 0 });

      const totalQuantity = cart.items.reduce((s: number, it: any) => s + (it.quantity || 0), 0);
      const totalAmount = cart.items.reduce((s: number, it: any) => s + (it.total || 0), 0);
      return res.status(200).json({ items: cart.items, totalQuantity, totalAmount });
    } catch (error: any) {
      console.error('Erro ao buscar carrinho', error);
      return res.status(500).json({ error: 'Erro interno' });
    }
  }

  if (req.method === 'DELETE') {
    try {
      // @ts-ignore
      const cart = await prisma.cart.findUnique({ where: { userId: user.id } });
      if (cart) {
        // @ts-ignore
        await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
        // @ts-ignore
        await prisma.cart.delete({ where: { id: cart.id } });
      }
      return res.status(204).end();
    } catch (error: any) {
      console.error('Erro ao limpar carrinho', error);
      return res.status(500).json({ error: 'Erro interno' });
    }
  }

  res.setHeader('Allow', ['GET', 'DELETE']);
  return res.status(405).end(`Method ${req.method} Not Allowed`);
}

export default requireAuth(handler);
