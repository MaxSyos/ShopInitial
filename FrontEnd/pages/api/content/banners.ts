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
        return res.status(403).json({ error: 'Acesso negado. Apenas ADMINs podem gerenciar banners' });
      }
    } catch (error) {
      return res.status(401).json({ error: 'Token inválido' });
    }
  }

  try {
    if (req.method === 'GET') {
      // GET: Retorna todos os banners ativos ou todos (para admin)
      const banners = await prisma.banner.findMany({
        orderBy: { order: 'asc' },
      });
      return res.status(200).json({ items: banners });
    }

    if (req.method === 'POST') {
      // POST: Criar novo banner
      const { title, description, imageUrl, buttonText, linkUrl, isActive } = req.body;

      if (!title || !imageUrl) {
        return res.status(400).json({ error: 'Título e URL da imagem são obrigatórios' });
      }

      // Encontrar o maior order existente
      const lastBanner = await prisma.banner.findFirst({
        orderBy: { order: 'desc' },
      });

      const newBanner = await prisma.banner.create({
        data: {
          title,
          description: description || null,
          imageUrl,
          buttonText: buttonText || null,
          linkUrl: linkUrl || null,
          isActive: isActive !== undefined ? isActive : true,
          order: (lastBanner?.order || 0) + 1,
        },
      });

      return res.status(201).json(newBanner);
    }

    if (req.method === 'PUT') {
      // PUT: Atualizar banner
      const { id, title, description, imageUrl, buttonText, linkUrl, isActive, order } = req.body;

      if (!id) {
        return res.status(400).json({ error: 'ID do banner é obrigatório' });
      }

      const updatedBanner = await prisma.banner.update({
        where: { id },
        data: {
          title: title !== undefined ? title : undefined,
          description: description !== undefined ? description : undefined,
          imageUrl: imageUrl !== undefined ? imageUrl : undefined,
          buttonText: buttonText !== undefined ? buttonText : undefined,
          linkUrl: linkUrl !== undefined ? linkUrl : undefined,
          isActive: isActive !== undefined ? isActive : undefined,
          order: order !== undefined ? order : undefined,
        },
      });

      return res.status(200).json(updatedBanner);
    }

    if (req.method === 'DELETE') {
      // DELETE: Deletar banner
      const { id } = req.body;

      if (!id) {
        return res.status(400).json({ error: 'ID do banner é obrigatório' });
      }

      await prisma.banner.delete({
        where: { id },
      });

      return res.status(200).json({ message: 'Banner deletado com sucesso' });
    }

    return res.status(405).json({ error: 'Método não permitido' });
  } catch (error: any) {
    console.error('Erro:', error);
    return res.status(500).json({ error: 'Erro ao processar requisição' });
  } finally {
    await prisma.$disconnect();
  }
}
