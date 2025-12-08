import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../lib/prisma';

interface CreateProductRequest {
  name: string;
  description?: string;
  price: number;
  stock: number;
  sku?: string;
  brandId?: string;
  categoryId?: string;
  images: {
    url: string;
    alt?: string;
  }[];
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Apenas aceita POST
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Método não permitido' });
  }

  try {
    const body: CreateProductRequest = req.body;

    // Validações básicas
    if (!body.name || !body.price || body.stock === undefined) {
      return res.status(400).json({
        message: 'Nome, preço e estoque são obrigatórios',
      });
    }

    if (body.price < 0) {
      return res.status(400).json({
        message: 'O preço não pode ser negativo',
      });
    }

    if (body.stock < 0) {
      return res.status(400).json({
        message: 'O estoque não pode ser negativo',
      });
    }

    if (!Array.isArray(body.images) || body.images.length === 0) {
      return res.status(400).json({
        message: 'Pelo menos uma imagem é obrigatória',
      });
    }

    // Criar o produto
    const product = await prisma.product.create({
      data: {
        name: body.name,
        description: body.description || null,
        price: body.price,
        stock: body.stock,
        sku: body.sku || null,
        brandId: body.brandId || null,
        categoryId: body.categoryId || null,
        images: {
          create: body.images.map((img) => ({
            url: img.url,
            alt: img.alt || body.name,
          })),
        },
      },
      include: {
        images: true,
        brand: true,
        category: true,
      },
    });

    return res.status(201).json({
      message: 'Produto criado com sucesso',
      product,
    });
  } catch (error) {
    console.error('Erro ao criar produto:', error);
    return res.status(500).json({
      message: 'Erro ao criar produto',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
}
