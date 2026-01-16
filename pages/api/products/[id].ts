import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query as { id: string };

  if (req.method === 'GET') {
    try {
      const product = await prisma.product.findUnique({
        where: { id },
        include: { images: true, brand: true, category: true, reviews: true },
      });

      if (!product) return res.status(404).json({ message: 'Produto não encontrado' });

      return res.status(200).json({ product });
    } catch (error) {
      console.error('Erro ao buscar produto:', error);
      return res.status(500).json({ message: 'Erro interno' });
    }
  }

  if (req.method === 'PUT') {
    try {
      const body = req.body;

      const updated = await prisma.product.update({
        where: { id },
        data: {
          name: body.name,
          description: body.description ?? null,
          price: body.price,
          stock: body.stock,
          sku: body.sku ?? null,
          brandId: body.brandId ?? null,
          categoryId: body.categoryId ?? null,
          // atualizar imagens: simples abordagem — deletar e recriar
          images: {
            deleteMany: {},
            create: Array.isArray(body.images)
              ? body.images.map((img: any) => ({ url: img.url, alt: img.alt }))
              : [],
          },
        },
        include: { images: true, brand: true, category: true },
      });

      return res.status(200).json({ message: 'Produto atualizado', product: updated });
    } catch (error) {
      console.error('Erro ao atualizar produto:', error);
      return res.status(500).json({ message: 'Erro interno' });
    }
  }

  return res.status(405).json({ message: 'Método não permitido' });
}
