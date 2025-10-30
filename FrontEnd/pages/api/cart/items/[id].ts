import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../../lib/prisma';
import { requireAuth, getUserFromRequest } from '../../_utils/auth';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = await getUserFromRequest(req);
  if (!user) return res.status(401).json({ error: 'Não autorizado' });

  const { id } = req.query;
  if (!id || Array.isArray(id)) return res.status(400).json({ error: 'Id inválido' });

  console.log('/api/cart/items/[id]', req.method, 'user:', user.id, 'itemId:', id);

  if (req.method === 'PUT') {
    try {
      const { quantity } = req.body || {};
      if (quantity == null || Number(quantity) < 1) return res.status(400).json({ error: 'Quantidade inválida' });

      const item = await prisma.cartItem.findUnique({ where: { id } });
      if (!item) return res.status(404).json({ error: 'Item não encontrado' });

      const cart = await prisma.cart.findUnique({ where: { id: item.cartId } });
      if (!cart || cart.userId !== user.id) return res.status(403).json({ error: 'Não autorizado' });

  // If unitPrice wasn't stored for some reason, read product price as fallback
  const product = await prisma.product.findUnique({ where: { id: item.productId } });
  const productPrice = product ? (product as any).price : 0;
  const unitPrice = (item.unitPrice ?? productPrice) || 0;
  const total = unitPrice * Number(quantity);

  await prisma.cartItem.update({ where: { id }, data: { quantity: Number(quantity), unitPrice: Number(unitPrice), total } });

      // Recarregar cart e retornar resumo
      const updated = await prisma.cart.findUnique({ where: { id: cart.id }, include: { items: true } });
      const items = updated?.items ?? [];
      const totalQuantity = items.reduce((s: number, it: any) => s + (it.quantity || 0), 0);
      const totalAmount = items.reduce((s: number, it: any) => s + (it.total || 0), 0);

      console.log('/api/cart/items/[id] PUT -> updated item', id);
      return res.status(200).json({ items, totalQuantity, totalAmount });
    } catch (error: any) {
      console.error('/api/cart/items/[id] PUT error:', error);
      return res.status(500).json({ error: 'Erro ao atualizar item' });
    }
  }

  if (req.method === 'DELETE') {
    try {
      const item = await prisma.cartItem.findUnique({ where: { id } });
      if (!item) return res.status(404).json({ error: 'Item não encontrado' });

      const cart = await prisma.cart.findUnique({ where: { id: item.cartId } });
      if (!cart || cart.userId !== user.id) return res.status(403).json({ error: 'Não autorizado' });

      await prisma.cartItem.delete({ where: { id } });

      // Recarregar cart e retornar resumo
      const updated = await prisma.cart.findUnique({ where: { id: cart.id }, include: { items: true } });
      const items = updated?.items ?? [];
      const totalQuantity = items.reduce((s: number, it: any) => s + (it.quantity || 0), 0);
      const totalAmount = items.reduce((s: number, it: any) => s + (it.total || 0), 0);

      console.log('/api/cart/items/[id] DELETE -> remaining items:', items.length);
      return res.status(200).json({ items, totalQuantity, totalAmount });
    } catch (error: any) {
      console.error('/api/cart/items/[id] DELETE error:', error);
      return res.status(500).json({ error: 'Erro ao deletar item' });
    }
  }

  res.setHeader('Allow', ['PUT', 'DELETE']);
  return res.status(405).end(`Method ${req.method} Not Allowed`);
}

export default requireAuth(handler);
