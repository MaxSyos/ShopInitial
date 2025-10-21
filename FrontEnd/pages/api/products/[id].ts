import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  try {
    const product = await prisma.product.findUnique({
      where: { id: String(id) },
      include: { images: true, brand: true, category: true, reviews: true },
    });

    if (!product) return res.status(404).json({ message: 'Produto não encontrado' });

    return res.status(200).json(product);
  } catch (error) {
    console.error('API product by id error:', error);
    return res.status(500).json({ message: 'Erro ao buscar produto' });
  }
}
