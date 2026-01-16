import type { NextApiRequest, NextApiResponse } from 'next';
import bcrypt from 'bcrypt';
import prisma from '../../../lib/prisma';
import { requireAuth, getUserFromRequest } from '../_utils/auth';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  // @ts-ignore
  const user = await getUserFromRequest(req);
  if (!user) return res.status(401).json({ message: 'Não autorizado' });

  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) return res.status(400).json({ message: 'Senhas obrigatórias' });

  try {
    // @ts-ignore
    const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
    if (!dbUser) return res.status(404).json({ message: 'Usuário não encontrado' });

    const match = await bcrypt.compare(currentPassword, dbUser.password);
    if (!match) return res.status(401).json({ message: 'Senha atual incorreta' });

    const hashed = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({ where: { id: user.id }, data: { password: hashed } });
    return res.status(200).json({ message: 'Senha alterada' });
  } catch (error) {
    console.error('Erro ao alterar senha', error);
    return res.status(500).json({ message: 'Erro interno' });
  }
}

export default requireAuth(handler);
