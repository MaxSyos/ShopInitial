import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../lib/prisma';
import { getUserFromRequest, requireAuth } from '../_utils/auth';

/**
 * Body esperado: { items: [{ productId: string, quantity: number, unitPrice?: number }] }
 */
async function handler(req: NextApiRequest, res: NextApiResponse) {
  // @ts-ignore
  const user = await getUserFromRequest(req);
  if (!user) return res.status(401).json({ error: 'Não autorizado' });

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const { items } = req.body || {};
  if (!Array.isArray(items)) return res.status(400).json({ error: 'Payload inválido' });

  try {
    // Verificar se já existe cart para o usuário
    // @ts-ignore
    let cart = await prisma.cart.findUnique({ where: { userId: user.id }, include: { items: true } });

    if (!cart) {
      // Criar novo carrinho
      // @ts-ignore
      cart = await prisma.cart.create({ data: { user: { connect: { id: user.id } } } });
    }

    // Mapear itens recebidos: somar quantidades se produto já existir
    for (const it of items) {
      const { productId, quantity, unitPrice } = it;
      // Procurar item existente
      // @ts-ignore
      const existing = await prisma.cartItem.findFirst({ where: { cartId: cart.id, productId } });
      if (existing) {
        const newQty = existing.quantity + Number(quantity || 0);
        const newTotal = (unitPrice || existing.unitPrice || 0) * newQty;
        // @ts-ignore
        await prisma.cartItem.update({ where: { id: existing.id }, data: { quantity: newQty, unitPrice: unitPrice || existing.unitPrice, total: newTotal } });
      } else {
        const up = Number(unitPrice || 0);
        // @ts-ignore
        await prisma.cartItem.create({ data: { cart: { connect: { id: cart.id } }, productId, quantity: Number(quantity || 0), unitPrice: up, total: up * Number(quantity || 0) } });
      }
    }

    // Recarregar cart
    // @ts-ignore
    const updated = await prisma.cart.findUnique({ where: { id: cart.id }, include: { items: true } });
    return res.status(200).json(updated);
  } catch (error: any) {
    console.error('Erro ao mesclar carrinho', error);
    return res.status(500).json({ error: 'Erro interno' });
  }
}

export default requireAuth(handler);
