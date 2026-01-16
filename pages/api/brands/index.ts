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
    const brands = await prisma.brand.findMany({
      orderBy: { name: 'asc' },
    });

    return res.status(200).json({
      items: brands,
      total: brands.length,
    });
  } catch (error) {
    console.error('Erro ao buscar marcas:', error);
    return res.status(500).json({ message: 'Erro ao buscar marcas' });
  }
}
