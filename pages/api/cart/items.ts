import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../lib/prisma';
import { requireAuth, getUserFromRequest } from '../_utils/auth';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = await getUserFromRequest(req);
  if (!user) return res.status(401).json({ message: 'Não autorizado' });

  console.log('/api/cart/items', req.method, 'user:', user.id, 'body:', req.body);

  if (req.method === 'POST') {
    try {
      const { productId, quantity = 1, unitPrice } = req.body;
      if (!productId || quantity <= 0) return res.status(400).json({ message: 'Dados inválidos' });

      // Ensure cart exists
      let cart = await prisma.cart.findUnique({ where: { userId: user.id }, include: { items: true } });
      if (!cart) {
        cart = await prisma.cart.create({ data: { user: { connect: { id: user.id } } }, include: { items: true } });
      }

      // Check existing item
      const existing = cart.items.find((it: any) => it.productId === String(productId));
      // try to get product price from DB to guarantee correct unitPrice
      const product = await prisma.product.findUnique({ where: { id: String(productId) } });
      const productPrice = (product && (product as any).price) || 0;

      if (existing) {
        const newQuantity = existing.quantity + Number(quantity);
        // prefer unitPrice supplied by client, else existing.unitPrice, else product price
        const unit = unitPrice ?? existing.unitPrice ?? productPrice;
        const newTotal = Number(unit) * newQuantity;
        await prisma.cartItem.update({ where: { id: existing.id }, data: { quantity: newQuantity, unitPrice: Number(unit), total: newTotal } });
      } else {
        // create new item — prefer product price over client-supplied value
        const unit = unitPrice ?? productPrice ?? 0;
        await prisma.cartItem.create({ data: { cart: { connect: { id: cart.id } }, productId: String(productId), quantity: Number(quantity), unitPrice: Number(unit), total: Number(unit) * Number(quantity) } });
      }

      // reload cart
      const updated = await prisma.cart.findUnique({ where: { id: cart.id }, include: { items: true } });

      console.log('/api/cart/items POST -> updated cart items:', updated?.items?.length ?? 0);

      return res.status(200).json({ success: true, cart: updated });
    } catch (error) {
      console.error('/api/cart/items POST error:', error);
      return res.status(500).json({ message: 'Erro ao adicionar item ao carrinho' });
    }
  }

  res.setHeader('Allow', ['POST']);
  return res.status(405).end(`Method ${req.method} Not Allowed`);
}

export default requireAuth(handler);
