import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../lib/prisma';
import { requireAuth, getUserFromRequest } from '../_utils/auth';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  // @ts-ignore
  const user = await getUserFromRequest(req);
  if (!user) return res.status(401).json({ message: 'Não autorizado' });

  if (req.method !== 'PUT' && req.method !== 'PATCH') {
    res.setHeader('Allow', ['PUT', 'PATCH']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const { name } = req.body;
  if (!name) return res.status(400).json({ message: 'Nome é obrigatório' });

  try {
    // @ts-ignore
    const updated = await prisma.user.update({ where: { id: user.id }, data: { name } });
    return res.status(200).json({ user: { id: updated.id, name: updated.name, email: updated.email } });
  } catch (error) {
    console.error('Erro ao atualizar usuário', error);
    return res.status(500).json({ message: 'Erro interno' });
  }
}

export default requireAuth(handler);
