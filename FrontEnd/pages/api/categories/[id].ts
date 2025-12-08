import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../../lib/prisma';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { id } = req.query;

  // Validar ID
  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'ID inválido' });
  }

  // Apenas DELETE é permitido
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    // Verificar se categoria existe
    const category = await prisma.category.findUnique({
      where: { id },
      include: { children: true, products: true },
    });

    if (!category) {
      return res.status(404).json({ error: 'Categoria não encontrada' });
    }

    // Verificar se tem subcategorias ou produtos
    if (category.children.length > 0 || category.products.length > 0) {
      return res.status(400).json({
        error: 'Não é possível deletar uma categoria com subcategorias ou produtos',
      });
    }

    // Deletar categoria
    await prisma.category.delete({
      where: { id },
    });

    return res.status(200).json({
      message: 'Categoria deletada com sucesso',
    });
  } catch (error) {
    console.error('Erro ao deletar categoria:', error);
    return res.status(500).json({ error: 'Erro ao deletar categoria' });
  }
}
