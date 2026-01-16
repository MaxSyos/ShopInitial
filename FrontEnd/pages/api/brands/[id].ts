import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../lib/prisma';

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
    // Verificar se marca existe
    const brand = await prisma.brand.findUnique({
      where: { id },
      include: { products: true },
    });

    if (!brand) {
      return res.status(404).json({ error: 'Marca não encontrada' });
    }

    // Verificar se tem produtos
    if (brand.products.length > 0) {
      return res.status(400).json({
        error: 'Não é possível deletar uma marca com produtos associados',
      });
    }

    // Deletar marca
    await prisma.brand.delete({
      where: { id },
    });

    return res.status(200).json({
      message: 'Marca deletada com sucesso',
    });
  } catch (error) {
    console.error('Erro ao deletar marca:', error);
    return res.status(500).json({ error: 'Erro ao deletar marca' });
  }
}
