import type { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

type ResponseData = {
  success?: boolean;
  data?: any;
  error?: string;
  total?: number;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  const { method } = req;

  if (method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { q, limit = '6', page = '1' } = req.query;

  if (!q || typeof q !== 'string') {
    return res.status(400).json({ error: 'Query parameter "q" is required' });
  }

  const searchQuery = q.toLowerCase().trim();
  const pageNum = parseInt(page as string) || 1;
  const pageSize = parseInt(limit as string) || 6;
  const skip = (pageNum - 1) * pageSize;

  try {
    // Busca por nome ou descrição (case-insensitive com MongoDB)
    const products = await prisma.product.findMany({
      where: {
        OR: [
          { name: { contains: searchQuery, mode: 'insensitive' } },
          { description: { contains: searchQuery, mode: 'insensitive' } },
        ],
      },
      include: {
        images: true,
        brand: true,
        category: true,
      },
      take: pageSize,
      skip: skip,
    });

    // Contar total de resultados
    const total = await prisma.product.count({
      where: {
        OR: [
          { name: { contains: searchQuery, mode: 'insensitive' } },
          { description: { contains: searchQuery, mode: 'insensitive' } },
        ],
      },
    });

    res.status(200).json({
      success: true,
      data: products,
      total,
    });
  } catch (error) {
    console.error('Error searching products:', error);
    res.status(500).json({ error: 'Failed to search products' });
  }
}
