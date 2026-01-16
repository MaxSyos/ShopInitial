import type { NextApiRequest, NextApiResponse } from 'next';
import bcrypt from 'bcrypt';
import prisma from '../../../lib/prisma';
import { signToken } from '../_utils/auth';
import { serialize } from 'cookie';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'Email e senha são obrigatórios' });
  }

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(401).json({ message: 'Credenciais inválidas' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ message: 'Credenciais inválidas' });

    const accessToken = signToken({ id: user.id, email: user.email, role: user.role }, '1h');
    const refreshToken = signToken({ id: user.id }, '7d');

    await prisma.refreshToken.create({ data: { token: refreshToken, userId: user.id } });

    // Set refresh token as HttpOnly cookie (Option A)
    res.setHeader('Set-Cookie', serialize('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60, // 7 days
    }));

    return res.status(200).json({ user: { id: user.id, name: user.name, email: user.email, role: user.role }, accessToken });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Erro interno' });
  }
}
