import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../lib/prisma';

interface CreateCategoryRequest {
  name: string;
  description?: string;
  parentId?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Apenas POST é permitido
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    const { name, description, parentId } = req.body as CreateCategoryRequest;

    // Validação
    if (!name || name.trim() === '') {
      return res.status(400).json({ error: 'Nome da categoria é obrigatório' });
    }

    // Se parentId foi fornecido, validar se existe
    if (parentId) {
      const parentCategory = await prisma.category.findUnique({
        where: { id: parentId },
      });

      if (!parentCategory) {
        return res.status(400).json({ error: 'Categoria pai não encontrada' });
      }
    }

    // Criar categoria
    const category = await prisma.category.create({
      data: {
        name: name.trim(),
        description: description?.trim(),
        parentId: parentId || null,
      },
      include: {
        parent: true,
        children: true,
      },
    });

    return res.status(201).json({
      message: 'Categoria criada com sucesso',
      data: category,
    });
  } catch (error) {
    console.error('Erro ao criar categoria:', error);
    return res.status(500).json({ error: 'Erro ao criar categoria' });
  }
}
