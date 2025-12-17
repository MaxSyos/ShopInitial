import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../lib/prisma';
import { authenticateToken } from '../../../middleware/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (req.method === 'GET') {
    return handleGet(id, res);
  }

  if (req.method === 'PUT') {
    // Verificar autenticação e permissão ADMIN
    const authError = authenticateToken(req, res);
    if (authError) return;

    const user = (req as any).user;
    if (user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Acesso negado' });
    }

    return handleUpdate(id, req, res);
  }

  res.status(405).json({ message: 'Método não permitido' });
}

async function handleGet(id: any, res: NextApiResponse) {
  try {
    const product = await prisma.product.findUnique({
      where: { id: String(id) },
      include: {
        images: {
          orderBy: { order: 'asc' },
        },
        brand: true,
        category: true,
        reviews: true,
      },
    });

    if (!product) return res.status(404).json({ message: 'Produto não encontrado' });

    return res.status(200).json(product);
  } catch (error) {
    console.error('API product by id error:', error);
    return res.status(500).json({ message: 'Erro ao buscar produto' });
  }
}

async function handleUpdate(
  id: any,
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const { name, description, price, stock, sku, brandId, categoryId, primaryImageId, images } =
      req.body;

    if (!name || price === undefined || stock === undefined) {
      return res.status(400).json({
        message: 'Nome, preço e estoque são obrigatórios',
      });
    }

    // Buscar produto existente
    const existingProduct = await prisma.product.findUnique({
      where: { id: String(id) },
      include: { images: true },
    });

    if (!existingProduct) {
      return res.status(404).json({ message: 'Produto não encontrado' });
    }

    // Validar SKU único (se diferente do atual)
    if (sku && sku !== existingProduct.sku) {
      const skuExists = await prisma.product.findUnique({
        where: { sku },
      });
      if (skuExists) {
        return res.status(400).json({ message: 'Este SKU já está em uso' });
      }
    }

    // Deletar imagens antigas que não estão mais na lista
    const newImageUrls = (images || []).map((img: any) => img.url);
    const imagesToDelete = existingProduct.images.filter(
      (img) => !newImageUrls.includes(img.url)
    );

    if (imagesToDelete.length > 0) {
      await prisma.image.deleteMany({
        where: {
          id: { in: imagesToDelete.map((img) => img.id) },
        },
      });
    }

    // Atualizar ou criar imagens
    const updatedImages = await Promise.all(
      (images || []).map(async (image: any, index: number) => {
        if (image.id) {
          // Atualizar imagem existente
          return prisma.image.update({
            where: { id: image.id },
            data: {
              url: image.url,
              alt: image.alt || name,
              order: index,
            },
          });
        } else {
          // Criar nova imagem
          return prisma.image.create({
            data: {
              url: image.url,
              alt: image.alt || name,
              order: index,
              productId: String(id),
            },
          });
        }
      })
    );

    // Atualizar produto
    const updatedProduct = await prisma.product.update({
      where: { id: String(id) },
      data: {
        name,
        description: description || null,
        price: parseFloat(String(price)),
        stock: parseInt(String(stock)),
        sku: sku || null,
        brandId: brandId || null,
        categoryId: categoryId || null,
        primaryImageId: primaryImageId || null,
      },
      include: {
        images: {
          orderBy: { order: 'asc' },
        },
        brand: true,
        category: true,
      },
    });

    return res.status(200).json({
      message: 'Produto atualizado com sucesso',
      product: updatedProduct,
    });
  } catch (error) {
    console.error('Erro ao atualizar produto:', error);
    return res.status(500).json({ message: 'Erro interno do servidor' });
  }
}
