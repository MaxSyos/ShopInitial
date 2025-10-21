import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const prismaModule = await import('../../../lib/prisma');
    const prisma = (prismaModule as any).default || (prismaModule as any).prisma;

    if (!prisma || typeof prisma !== 'object' || !('product' in prisma)) {
      return res.status(500).json({ message: 'Prisma client not initialized or missing `product` model' });
    }

    const items = await prisma.product.findMany({ include: { images: true, brand: true, category: true }, orderBy: { createdAt: 'desc' }, take: 100 });
    const total = await prisma.product.count();

    return res.status(200).json({ items, total, page: 1, limit: items.length });
  } catch (error: any) {
    console.error('Debug products error:', error);
    return res.status(500).json({ message: 'Erro debug produtos', error: String(error), stack: error?.stack });
  }
}
