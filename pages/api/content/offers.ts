import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { verifyToken } from '../_utils/auth';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Verificar token apenas para POST, PUT, DELETE
  if (['POST', 'PUT', 'DELETE'].includes(req.method || '')) {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'Token não fornecido' });
    }

    try {
      const decoded: any = verifyToken(token);
      if (decoded.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Acesso negado. Apenas ADMINs podem gerenciar offers' });
      }
    } catch (error) {
      return res.status(401).json({ error: 'Token inválido' });
    }
  }

  try {
    if (req.method === 'GET') {
      // GET: Retorna todas as ofertas
      const offers = await prisma.offer.findMany({
        orderBy: { createdAt: 'desc' },
      });
      return res.status(200).json({ items: offers });
    }

    if (req.method === 'POST') {
      // POST: Criar nova oferta
      const { productId, discount, isActive, startDate, endDate } = req.body;

      if (!productId || discount === undefined) {
        return res.status(400).json({ error: 'ProductID e desconto são obrigatórios' });
      }

      if (discount < 0 || discount > 100) {
        return res.status(400).json({ error: 'Desconto deve estar entre 0 e 100' });
      }

      const newOffer = await prisma.offer.create({
        data: {
          productId,
          discount,
          isActive: isActive !== undefined ? isActive : true,
          startDate: startDate ? new Date(startDate) : null,
          endDate: endDate ? new Date(endDate) : null,
        },
      });

      return res.status(201).json(newOffer);
    }

    if (req.method === 'PUT') {
      // PUT: Atualizar oferta
      const { id, discount, isActive, startDate, endDate } = req.body;

      if (!id) {
        return res.status(400).json({ error: 'ID da oferta é obrigatório' });
      }

      if (discount !== undefined && (discount < 0 || discount > 100)) {
        return res.status(400).json({ error: 'Desconto deve estar entre 0 e 100' });
      }

      const updatedOffer = await prisma.offer.update({
        where: { id },
        data: {
          discount: discount !== undefined ? discount : undefined,
          isActive: isActive !== undefined ? isActive : undefined,
          startDate: startDate !== undefined ? (startDate ? new Date(startDate) : null) : undefined,
          endDate: endDate !== undefined ? (endDate ? new Date(endDate) : null) : undefined,
        },
      });

      return res.status(200).json(updatedOffer);
    }

    if (req.method === 'DELETE') {
      // DELETE: Deletar oferta
      const { id } = req.body;

      if (!id) {
        return res.status(400).json({ error: 'ID da oferta é obrigatório' });
      }

      await prisma.offer.delete({
        where: { id },
      });

      return res.status(200).json({ message: 'Oferta deletada com sucesso' });
    }

    return res.status(405).json({ error: 'Método não permitido' });
  } catch (error: any) {
    console.error('Erro:', error);
    return res.status(500).json({ error: 'Erro ao processar requisição' });
  } finally {
    await prisma.$disconnect();
  }
}
