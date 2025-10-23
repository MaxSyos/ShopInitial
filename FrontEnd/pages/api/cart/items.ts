import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../lib/prisma';
import { getUserFromRequest, requireAuth } from '../_utils/auth';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  // @ts-ignore
  const user = await getUserFromRequest(req);
  if (!user) return res.status(401).json({ error: 'Não autorizado' });

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const { productId, quantity } = req.body || {};
  if (!productId || !quantity) return res.status(400).json({ error: 'Payload inválido' });

  try {
    // @ts-ignore
    let cart = await prisma.cart.findUnique({ where: { userId: user.id }, include: { items: true } });
    if (!cart) {
      // @ts-ignore
      cart = await prisma.cart.create({ data: { user: { connect: { id: user.id } } } });
    }

    // Verificar se item existe
    // @ts-ignore
    const existing = await prisma.cartItem.findFirst({ where: { cartId: cart.id, productId } });
    if (existing) {
      const newQty = existing.quantity + Number(quantity);
      const newTotal = (existing.unitPrice || 0) * newQty;
      // @ts-ignore
      await prisma.cartItem.update({ where: { id: existing.id }, data: { quantity: newQty, total: newTotal } });
    } else {
      // tentar buscar price do product
      // @ts-ignore
      const product = await prisma.product.findUnique({ where: { id: productId } });
      const unitPrice = product?.price || 0;
      // @ts-ignore
      await prisma.cartItem.create({ data: { cart: { connect: { id: cart.id } }, productId, quantity: Number(quantity), unitPrice, total: unitPrice * Number(quantity) } });
    }

    // Recalcular e retornar cart
    // @ts-ignore
    const updated = await prisma.cart.findUnique({ where: { id: cart.id }, include: { items: true } });
    const totalQuantity = updated!.items.reduce((s: number, it: any) => s + (it.quantity || 0), 0);
    const totalAmount = updated!.items.reduce((s: number, it: any) => s + (it.total || 0), 0);
    return res.status(200).json({ items: updated!.items, totalQuantity, totalAmount });
  } catch (error: any) {
    console.error('Erro ao adicionar item ao carrinho', error);
    return res.status(500).json({ error: 'Erro interno' });
  }
}

export default requireAuth(handler);
