import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../lib/prisma';
import { verifyToken } from '../_utils/auth';
import { parse, serialize } from 'cookie';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  // Read refresh token from HttpOnly cookie
  const cookies = req.headers.cookie ? parse(req.headers.cookie) : {};
  const refreshToken = cookies.refreshToken;
  if (!refreshToken) {
    // Clear cookie anyway
  res.setHeader('Set-Cookie', serialize('refreshToken', '', { httpOnly: true, path: '/', maxAge: 0 }));
    return res.status(200).json({ message: 'Desconectado' });
  }

  try {
    const decoded: any = verifyToken(refreshToken);
    if (!decoded?.id) {
      // remove anyway
      await prisma.refreshToken.deleteMany({ where: { token: refreshToken } });
      return res.status(200).json({ message: 'Desconectado' });
    }

  // Remove refresh token(s) para o usuário
  await prisma.refreshToken.deleteMany({ where: { userId: decoded.id } });

  // Clear refresh token cookie
  res.setHeader('Set-Cookie', serialize('refreshToken', '', { httpOnly: true, path: '/', maxAge: 0 }));

  return res.status(200).json({ message: 'Desconectado' });
  } catch (error) {
    console.error('Logout error:', error);
    return res.status(500).json({ message: 'Erro interno' });
  }
}
