import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const prismaModule = await import('../../../../lib/prisma');
    const prisma = (prismaModule as any).default || (prismaModule as any).prisma;

    const { id } = req.query;
    const page = parseInt((req.query.page as string) || '1', 10);
    const limit = parseInt((req.query.limit as string) || '20', 10);
    const skip = (page - 1) * limit;

    const where = { brandId: String(id) };

    const [items, total] = await Promise.all([
      prisma.product.findMany({ where, skip, take: limit, include: { images: true, brand: true, category: true }, orderBy: { createdAt: 'desc' } }),
      prisma.product.count({ where }),
    ]);

    return res.status(200).json({ items, total, page, limit });
  } catch (error: any) {
    console.error('API brand products error:', error);
    return res.status(500).json({ message: 'Erro ao buscar produtos da marca', error: String(error), stack: error?.stack });
  }
}
