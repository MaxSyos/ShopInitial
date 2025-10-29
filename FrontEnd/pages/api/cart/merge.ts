import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../lib/prisma';
import { requireAuth, getUserFromRequest } from '../_utils/auth';

// Expected payload: { items: [{ productId, quantity, unitPrice }] }
async function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = await getUserFromRequest(req);
  if (!user) return res.status(401).json({ message: 'Não autorizado' });

  console.log('/api/cart/merge', 'user:', user.id, 'body:', req.body);

  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    const payload = req.body;
    if (!payload || !Array.isArray(payload.items)) return res.status(400).json({ message: 'Payload inválido' });

    // Ensure cart exists
    let cart = await prisma.cart.findUnique({ where: { userId: user.id }, include: { items: true } });
    if (!cart) cart = await prisma.cart.create({ data: { user: { connect: { id: user.id } } }, include: { items: true } });

    for (const it of payload.items) {
      const productId = String(it.productId);
      const qty = Number(it.quantity || 0);
      const unit = Number(it.unitPrice || 0);
      if (!productId || qty <= 0) continue;

      const existing = cart.items.find((ci: any) => ci.productId === productId);
      if (existing) {
        const newQty = existing.quantity + qty;
        await prisma.cartItem.update({ where: { id: existing.id }, data: { quantity: newQty, total: newQty * existing.unitPrice } });
      } else {
        await prisma.cartItem.create({ data: { cart: { connect: { id: cart.id } }, productId, quantity: qty, unitPrice: unit, total: unit * qty } });
      }
      // reload cart items for next iteration
      cart = await prisma.cart.findUnique({ where: { id: cart.id }, include: { items: true } }) as any;
    }

    const updated = await prisma.cart.findUnique({ where: { id: cart.id }, include: { items: true } });
    console.log('/api/cart/merge -> merged items count:', updated?.items?.length ?? 0);
    return res.status(200).json({ success: true, cart: updated });
  } catch (error) {
    console.error('/api/cart/merge error:', error);
    return res.status(500).json({ message: 'Erro ao mesclar carrinho' });
  }
}

export default requireAuth(handler);
