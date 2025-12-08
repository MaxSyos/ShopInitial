import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../lib/prisma';
import { getUserFromRequest, requireAuth } from '../_utils/auth';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  // @ts-ignore
  const user = await getUserFromRequest(req);
  if (!user) {
    return res.status(401).json({ error: 'Não autorizado' });
  }

  const { id } = req.query;
  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Id inválido' });
  }

  if (req.method === 'DELETE') {
    try {
      // @ts-ignore
      const favorite = await prisma.favorite.findUnique({ where: { id } });
      if (!favorite || favorite.userId !== user.id) {
        return res.status(404).json({ error: 'Favorito não encontrado' });
      }

      await prisma.favorite.delete({ where: { id } });
      console.log(`/api/favorites/${id} DELETE - favorito removido`);
      return res.status(204).end();
    } catch (error: any) {
      console.error('Erro ao deletar favorito', error);
      return res.status(500).json({ error: 'Erro interno' });
    }
  }

  res.setHeader('Allow', ['DELETE']);
  return res.status(405).end(`Method ${req.method} Not Allowed`);
}

export default requireAuth(handler);
