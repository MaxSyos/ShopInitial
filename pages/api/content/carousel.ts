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
        return res.status(403).json({ error: 'Acesso negado. Apenas ADMINs podem gerenciar carousel' });
      }
    } catch (error) {
      return res.status(401).json({ error: 'Token inválido' });
    }
  }

  try {
    if (req.method === 'GET') {
      // GET: Retorna todas as imagens do carousel
      const carouselImages = await prisma.carouselImage.findMany({
        orderBy: { order: 'asc' },
      });
      return res.status(200).json({ items: carouselImages });
    }

    if (req.method === 'POST') {
      // POST: Criar nova imagem do carousel
      const { title, description, imageUrl, linkUrl, isActive } = req.body;

      if (!title || !imageUrl) {
        return res.status(400).json({ error: 'Título e URL da imagem são obrigatórios' });
      }

      // Encontrar o maior order existente
      const lastCarousel = await prisma.carouselImage.findFirst({
        orderBy: { order: 'desc' },
      });

      const newCarouselImage = await prisma.carouselImage.create({
        data: {
          title,
          description: description || null,
          imageUrl,
          linkUrl: linkUrl || null,
          isActive: isActive !== undefined ? isActive : true,
          order: (lastCarousel?.order || 0) + 1,
        },
      });

      return res.status(201).json(newCarouselImage);
    }

    if (req.method === 'PUT') {
      // PUT: Atualizar imagem do carousel
      const { id, title, description, imageUrl, linkUrl, isActive, order } = req.body;

      if (!id) {
        return res.status(400).json({ error: 'ID da imagem é obrigatório' });
      }

      const updatedCarouselImage = await prisma.carouselImage.update({
        where: { id },
        data: {
          title: title !== undefined ? title : undefined,
          description: description !== undefined ? description : undefined,
          imageUrl: imageUrl !== undefined ? imageUrl : undefined,
          linkUrl: linkUrl !== undefined ? linkUrl : undefined,
          isActive: isActive !== undefined ? isActive : undefined,
          order: order !== undefined ? order : undefined,
        },
      });

      return res.status(200).json(updatedCarouselImage);
    }

    if (req.method === 'DELETE') {
      // DELETE: Deletar imagem do carousel
      const { id } = req.body;

      if (!id) {
        return res.status(400).json({ error: 'ID da imagem é obrigatório' });
      }

      await prisma.carouselImage.delete({
        where: { id },
      });

      return res.status(200).json({ message: 'Imagem deletada com sucesso' });
    }

    return res.status(405).json({ error: 'Método não permitido' });
  } catch (error: any) {
    console.error('Erro:', error);
    return res.status(500).json({ error: 'Erro ao processar requisição' });
  } finally {
    await prisma.$disconnect();
  }
}
