import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../../lib/prisma';
import { requireAuth, getUserFromRequest } from '../../_utils/auth';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = await getUserFromRequest(req);
  if (!user) return res.status(401).json({ message: 'Não autorizado' });

  const { id } = req.query;
  if (!id || Array.isArray(id)) return res.status(400).json({ message: 'Item inválido' });

  console.log('/api/cart/items/[id]', req.method, 'user:', user.id, 'itemId:', id);

  if (req.method === 'PUT') {
    try {
      const { quantity } = req.body;
      if (typeof quantity !== 'number' || quantity < 1) return res.status(400).json({ message: 'Quantidade inválida' });

      // Ensure item belongs to user's cart
      const item = await prisma.cartItem.findUnique({ where: { id } });
      if (!item) return res.status(404).json({ message: 'Item não encontrado' });

      const cart = await prisma.cart.findUnique({ where: { id: item.cartId } });
      if (!cart || cart.userId !== user.id) return res.status(403).json({ message: 'Não autorizado' });

      const updated = await prisma.cartItem.update({ where: { id }, data: { quantity: Number(quantity), total: Number(quantity) * item.unitPrice } });
      console.log('/api/cart/items/[id] PUT -> updated item', updated.id);
      return res.status(200).json({ success: true, item: updated });
    } catch (error) {
      console.error('/api/cart/items/[id] PUT error:', error);
      return res.status(500).json({ message: 'Erro ao atualizar item' });
    }
  }

  if (req.method === 'DELETE') {
    try {
      const item = await prisma.cartItem.findUnique({ where: { id } });
      if (!item) return res.status(404).json({ message: 'Item não encontrado' });
      const cart = await prisma.cart.findUnique({ where: { id: item.cartId } });
      if (!cart || cart.userId !== user.id) return res.status(403).json({ message: 'Não autorizado' });

      await prisma.cartItem.delete({ where: { id } });
      // return updated cart
      const updatedCart = await prisma.cart.findUnique({ where: { id: cart.id }, include: { items: true } });
      console.log('/api/cart/items/[id] DELETE -> remaining items:', updatedCart?.items?.length ?? 0);
      return res.status(200).json({ success: true, cart: updatedCart });
    } catch (error) {
      console.error('/api/cart/items/[id] DELETE error:', error);
      return res.status(500).json({ message: 'Erro ao remover item' });
    }
  }

  res.setHeader('Allow', ['PUT', 'DELETE']);
  return res.status(405).end(`Method ${req.method} Not Allowed`);
}

export default requireAuth(handler);
import type { NextApiRequest, NextApiResponse } from 'next';
// @ts-ignore - Prisma Client types precisam ser gerados com `npx prisma generate`
import prisma from '../../../lib/prisma';
import { getUserFromRequest, requireAuth } from '../../_utils/auth';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  // @ts-ignore
  const user = await getUserFromRequest(req);
  if (!user) return res.status(401).json({ error: 'Não autorizado' });

  const { id } = req.query;
  if (!id || typeof id !== 'string') return res.status(400).json({ error: 'Id inválido' });

  if (req.method === 'PUT') {
    const { quantity } = req.body || {};
    if (quantity == null) return res.status(400).json({ error: 'Payload inválido' });

    try {
      // @ts-ignore
      const item = await prisma.cartItem.findUnique({ where: { id } });
      if (!item) return res.status(404).json({ error: 'Item não encontrado' });
      // verificar propriedade via cartId -> cart.userId
      // @ts-ignore
      const cart = await prisma.cart.findUnique({ where: { id: item.cartId } });
      if (!cart || cart.userId !== user.id) return res.status(403).json({ error: 'Não autorizado' });

      const unitPrice = item.unitPrice || 0;
      const total = unitPrice * Number(quantity);
      // @ts-ignore
      await prisma.cartItem.update({ where: { id }, data: { quantity: Number(quantity), total } });

      // Recarregar cart
      // @ts-ignore
      const updated = await prisma.cart.findUnique({ where: { id: cart.id }, include: { items: true } });
      const totalQuantity = updated!.items.reduce((s: number, it: any) => s + (it.quantity || 0), 0);
      const totalAmount = updated!.items.reduce((s: number, it: any) => s + (it.total || 0), 0);
      return res.status(200).json({ items: updated!.items, totalQuantity, totalAmount });
    } catch (error: any) {
      console.error('Erro ao atualizar item', error);
      return res.status(500).json({ error: 'Erro interno' });
    }
  }

  if (req.method === 'DELETE') {
    try {
      // @ts-ignore
      const item = await prisma.cartItem.findUnique({ where: { id } });
      if (!item) return res.status(404).json({ error: 'Item não encontrado' });
      // @ts-ignore
      const cart = await prisma.cart.findUnique({ where: { id: item.cartId } });
      if (!cart || cart.userId !== user.id) return res.status(403).json({ error: 'Não autorizado' });

      // @ts-ignore
      await prisma.cartItem.delete({ where: { id } });
      // Recarregar cart
      // @ts-ignore
      const updated = await prisma.cart.findUnique({ where: { id: cart.id }, include: { items: true } });
      const totalQuantity = updated!.items.reduce((s: number, it: any) => s + (it.quantity || 0), 0);
      const totalAmount = updated!.items.reduce((s: number, it: any) => s + (it.total || 0), 0);
      return res.status(200).json({ items: updated!.items, totalQuantity, totalAmount });
    } catch (error: any) {
      console.error('Erro ao deletar item', error);
      return res.status(500).json({ error: 'Erro interno' });
    }
  }

  res.setHeader('Allow', ['PUT', 'DELETE']);
  return res.status(405).end(`Method ${req.method} Not Allowed`);
}

export default requireAuth(handler);
