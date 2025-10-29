import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../lib/prisma';
import { getUserFromRequest, requireAuth } from '../_utils/auth';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = await getUserFromRequest(req);
  if (!user) return res.status(401).json({ message: 'Não autorizado' });

  console.log('/api/cart', req.method, 'user:', user.id);

  if (req.method === 'GET') {
    try {
      const cart = await prisma.cart.findUnique({ where: { userId: user.id }, include: { items: true } });

      if (!cart) {
        console.log('/api/cart GET -> empty cart for user', user.id);
        return res.status(200).json({ items: [], totalQuantity: 0, totalAmount: 0 });
      }

      // Map items to frontend shape: include product info
      const mappedItems = await Promise.all(
        cart.items.map(async (it) => {
          const product = await prisma.product.findUnique({ where: { id: it.productId } });
          const productMap = product
            ? {
                id: product.id,
                image: Array.isArray(product.images) ? product.images.map((img: any) => img.url || img) : [],
                name: product.name,
                slug: { _type: 'slug', current: product.id },
                price: product.price,
                discount: null,
                brand: product.brandId ? '' : '',
                category: product.categoryId ? [product.categoryId] : [],
                starRating: product.rating || 0,
                isOffer: product.isOffer || false,
                details: [],
                registerDate: product.createdAt ? new Date(product.createdAt).toISOString() : null,
              }
            : {
                id: it.productId,
                image: [],
                name: 'Produto removido',
                slug: { _type: 'slug', current: it.productId },
                price: it.unitPrice,
                discount: null,
                brand: '',
                category: [],
                starRating: 0,
                isOffer: false,
                details: [],
                registerDate: null,
              };

          return {
            ...productMap,
            quantity: it.quantity,
            totalPrice: it.total,
          };
        })
      );

      const totalQuantity = mappedItems.reduce((s, i) => s + (i.quantity || 0), 0);
      const totalAmount = mappedItems.reduce((s, i) => s + (i.totalPrice || 0), 0);

      console.log('/api/cart GET ->', { totalQuantity, totalAmount, itemsCount: mappedItems.length });
      return res.status(200).json({ items: mappedItems, totalQuantity, totalAmount });
    } catch (error) {
      console.error('/api/cart GET error:', error);
      return res.status(500).json({ message: 'Erro ao buscar carrinho' });
    }
  }

  if (req.method === 'DELETE') {
    try {
      console.log('/api/cart DELETE -> clearing cart for user', user.id);
      const cart = await prisma.cart.findUnique({ where: { userId: user.id } });
      if (cart) {
        await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
        await prisma.cart.delete({ where: { id: cart.id } });
      }
      return res.status(200).json({ items: [], totalQuantity: 0, totalAmount: 0 });
    } catch (error) {
      console.error('/api/cart DELETE error:', error);
      return res.status(500).json({ message: 'Erro ao limpar carrinho' });
    }
  }

  res.setHeader('Allow', ['GET', 'DELETE']);
  return res.status(405).end(`Method ${req.method} Not Allowed`);
}

export default requireAuth(handler);
