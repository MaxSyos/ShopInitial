import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const prismaModule = await import('../../../lib/prisma');
    const prisma = (prismaModule as any).default || (prismaModule as any).prisma;

    const limit = parseInt((req.query.limit as string) || '10', 10);

    const items = await prisma.product.findMany({
      include: { images: true, brand: true, category: true },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return res.status(200).json(items);
  } catch (error: any) {
    console.error('API products newest error:', error);
    return res.status(500).json({ message: 'Erro ao buscar novos produtos', error: String(error), stack: error?.stack });
  }
}
