import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../lib/prisma';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Método não permitido' });
  }

  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: 'asc' },
      include: {
        children: true,
      },
    });

    return res.status(200).json({
      items: categories,
      total: categories.length,
    });
  } catch (error) {
    console.error('Erro ao buscar categorias:', error);
    return res.status(500).json({ message: 'Erro ao buscar categorias' });
  }
}
