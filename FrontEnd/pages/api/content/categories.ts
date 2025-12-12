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
        return res.status(403).json({ error: 'Acesso negado. Apenas ADMINs podem gerenciar categorias' });
      }
    } catch (error) {
      return res.status(401).json({ error: 'Token inválido' });
    }
  }

  try {
    if (req.method === 'GET') {
      // GET: Retorna todas as categorias ativas
      const categories = await prisma.categoryGrid.findMany({
        where: { isActive: true },
        orderBy: { order: 'asc' },
      });
      return res.status(200).json({ items: categories });
    }

    if (req.method === 'POST') {
      // POST: Criar nova categoria
      const {
        name,
        title,
        description,
        href,
        imgSrc,
        imgWidth,
        imgHeight,
        backgroundColor,
        flexDirection,
        paddingBlock,
        paddingInline,
        gridColumn,
        isCentered,
        isSmall,
        isActive,
      } = req.body;

      if (!name || !title) {
        return res.status(400).json({ error: 'Nome e título são obrigatórios' });
      }

      // Encontrar o maior order existente
      const lastCategory = await prisma.categoryGrid.findFirst({
        orderBy: { order: 'desc' },
      });

      const newCategory = await prisma.categoryGrid.create({
        data: {
          name,
          title,
          description: description || null,
          href: href || null,
          imgSrc: imgSrc || null,
          imgWidth: imgWidth || 190,
          imgHeight: imgHeight || 240,
          backgroundColor: backgroundColor || null,
          flexDirection: flexDirection || 'row',
          paddingBlock: paddingBlock || '1rem',
          paddingInline: paddingInline || '1rem',
          gridColumn: gridColumn || 'span 3 / span 3',
          isCentered: isCentered || false,
          isSmall: isSmall || false,
          isActive: isActive !== undefined ? isActive : true,
          order: (lastCategory?.order || 0) + 1,
        },
      });

      return res.status(201).json(newCategory);
    }

    if (req.method === 'PUT') {
      // PUT: Atualizar categoria
      const {
        id,
        name,
        title,
        description,
        href,
        imgSrc,
        imgWidth,
        imgHeight,
        backgroundColor,
        flexDirection,
        paddingBlock,
        paddingInline,
        gridColumn,
        isCentered,
        isSmall,
        isActive,
        order,
      } = req.body;

      if (!id) {
        return res.status(400).json({ error: 'ID da categoria é obrigatório' });
      }

      const updatedCategory = await prisma.categoryGrid.update({
        where: { id },
        data: {
          name: name !== undefined ? name : undefined,
          title: title !== undefined ? title : undefined,
          description: description !== undefined ? description : undefined,
          href: href !== undefined ? href : undefined,
          imgSrc: imgSrc !== undefined ? imgSrc : undefined,
          imgWidth: imgWidth !== undefined ? imgWidth : undefined,
          imgHeight: imgHeight !== undefined ? imgHeight : undefined,
          backgroundColor: backgroundColor !== undefined ? backgroundColor : undefined,
          flexDirection: flexDirection !== undefined ? flexDirection : undefined,
          paddingBlock: paddingBlock !== undefined ? paddingBlock : undefined,
          paddingInline: paddingInline !== undefined ? paddingInline : undefined,
          gridColumn: gridColumn !== undefined ? gridColumn : undefined,
          isCentered: isCentered !== undefined ? isCentered : undefined,
          isSmall: isSmall !== undefined ? isSmall : undefined,
          isActive: isActive !== undefined ? isActive : undefined,
          order: order !== undefined ? order : undefined,
        },
      });

      return res.status(200).json(updatedCategory);
    }

    if (req.method === 'DELETE') {
      // DELETE: Deletar categoria
      const { id } = req.body;

      if (!id) {
        return res.status(400).json({ error: 'ID da categoria é obrigatório' });
      }

      await prisma.categoryGrid.delete({
        where: { id },
      });

      return res.status(200).json({ message: 'Categoria deletada com sucesso' });
    }

    return res.status(405).json({ error: 'Método não permitido' });
  } catch (error: any) {
    console.error('Erro:', error);
    return res.status(500).json({ error: 'Erro ao processar requisição' });
  } finally {
    await prisma.$disconnect();
  }
}
