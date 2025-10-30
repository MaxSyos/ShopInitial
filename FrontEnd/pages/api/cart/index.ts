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

      // Map items to frontend shape: include product info.
      // Se o produto não existir mais no banco, removemos o cartItem (limpeza) e não o incluímos na resposta.
      const mappedItemsRaw = await Promise.all(
        cart.items.map(async (it) => {
          const product = await prisma.product.findUnique({ where: { id: it.productId } });
          if (!product) {
            // cleanup stale cartItem pointing to removed product
            try {
              await prisma.cartItem.delete({ where: { id: it.id } });
            } catch (e) {
              // ignore errors during cleanup
              console.warn('/api/cart cleanup failed for cartItem', it.id, e);
            }
            return null;
          }

          const productMap = {
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
          };

          return {
            ...productMap,
            // expor o id do cartItem para que o frontend consiga atualizar/remover diretamente
            cartItemId: it.id,
            quantity: it.quantity,
            totalPrice: it.total,
          };
        })
      );

      const mappedItems = mappedItemsRaw.filter((i) => i != null) as any[];

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
