import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../lib/prisma';
import { getUserFromRequest, requireAuth } from '../_utils/auth';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  // @ts-ignore
  const user = await getUserFromRequest(req);
  if (!user) {
    return res.status(401).json({ error: 'Não autorizado' });
  }

  if (req.method === 'GET') {
    try {
      // @ts-ignore
      const favorites = await prisma.favorite.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
      });
      console.log(`/api/favorites GET - userId=${user.id} returned ${favorites?.length || 0} favorites`);
      return res.status(200).json(favorites);
    } catch (error: any) {
      console.error('Erro ao listar favoritos', error);
      return res.status(500).json({ error: 'Erro interno' });
    }
  }

  if (req.method === 'POST') {
    try {
      const { productId, productData } = req.body;
      if (!productId) {
        return res.status(400).json({ error: 'productId é obrigatório' });
      }

      // Verificar se já existe
      // @ts-ignore
      const existing = await prisma.favorite.findUnique({
        where: { userId_productId: { userId: user.id, productId } },
      });
      if (existing) {
        return res.status(400).json({ error: 'Produto já está nos favoritos' });
      }

      // @ts-ignore
      const newFavorite = await prisma.favorite.create({
        data: {
          userId: user.id,
          productId,
          productData: productData || null,
        },
      });
      console.log(`/api/favorites POST - novo favorito criado id=${newFavorite?.id}`);
      return res.status(201).json(newFavorite);
    } catch (error: any) {
      console.error('Erro ao adicionar favorito', error);
      return res.status(500).json({ error: 'Erro interno' });
    }
  }

  res.setHeader('Allow', ['GET', 'POST']);
  return res.status(405).end(`Method ${req.method} Not Allowed`);
}

export default requireAuth(handler);
