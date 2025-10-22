import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../lib/prisma';
import { verifyToken, signToken } from '../_utils/auth';
import { parse, serialize } from 'cookie';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  // Read refresh token from HttpOnly cookie (Option A)
  const cookies = req.headers.cookie ? parse(req.headers.cookie) : {};
  const refreshToken = cookies.refreshToken;
  if (!refreshToken) {
    return res.status(400).json({ message: 'Refresh token é obrigatório' });
  }

  try {
    const decoded: any = verifyToken(refreshToken);
    if (!decoded?.id) return res.status(401).json({ message: 'Token inválido' });

    // Verifica se o refresh token existe no DB
    const stored = await prisma.refreshToken.findFirst({ where: { token: refreshToken } });
    if (!stored || stored.userId !== decoded.id) {
      return res.status(401).json({ message: 'Refresh token não encontrado' });
    }

    const user = await prisma.user.findUnique({ where: { id: decoded.id } });
    if (!user) return res.status(404).json({ message: 'Usuário não encontrado' });

    // Rotaciona o refresh token: remove o antigo e cria um novo
    await prisma.refreshToken.deleteMany({ where: { token: refreshToken } });

    const newAccessToken = signToken({ id: user.id, email: user.email }, '1h');
    const newRefreshToken = signToken({ id: user.id }, '7d');

    await prisma.refreshToken.create({ data: { token: newRefreshToken, userId: user.id } });

    // Set new refresh token as HttpOnly cookie
    res.setHeader('Set-Cookie', serialize('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
    }));

    return res.status(200).json({ user: { id: user.id, name: user.name, email: user.email, role: user.role }, accessToken: newAccessToken });
  } catch (error) {
    console.error('Refresh error:', error);
    return res.status(500).json({ message: 'Erro interno' });
  }
}
