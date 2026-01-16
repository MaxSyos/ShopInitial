import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../lib/prisma';
import { verifyToken, signToken } from '../_utils/auth';
import { parse, serialize } from 'cookie';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('\n===== [Refresh Token API] Request received =====');
  console.log('[Refresh Token API] Method:', req.method);
  console.log('[Refresh Token API] Timestamp:', new Date().toISOString());
  
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  // Read refresh token from HttpOnly cookie (Option A)
  const cookies = req.headers.cookie ? parse(req.headers.cookie) : {};
  const refreshToken = cookies.refreshToken;
  
  console.log('[Refresh Token API] Refresh token from cookie:', refreshToken ? 'present' : '❌ MISSING');
  
  if (!refreshToken) {
    console.error('[Refresh Token API] ❌ No refresh token in cookie');
    return res.status(400).json({ message: 'Refresh token é obrigatório' });
  }

  try {
    console.log('[Refresh Token API] Verifying refresh token...');
    const decoded: any = verifyToken(refreshToken);
    if (!decoded?.id) {
      console.error('[Refresh Token API] ❌ Token verification failed');
      return res.status(401).json({ message: 'Token inválido' });
    }
    console.log('[Refresh Token API] ✅ Token verified for user:', decoded.id);

    // Verifica se o refresh token existe no DB
    console.log('[Refresh Token API] Checking if token exists in DB...');
    const stored = await prisma.refreshToken.findFirst({ where: { token: refreshToken } });
    if (!stored || stored.userId !== decoded.id) {
      console.error('[Refresh Token API] ❌ Token not found in database or user mismatch');
      return res.status(401).json({ message: 'Refresh token não encontrado' });
    }
    console.log('[Refresh Token API] ✅ Token found in database');

    const user = await prisma.user.findUnique({ where: { id: decoded.id } });
    if (!user) {
      console.error('[Refresh Token API] ❌ User not found');
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }
    console.log('[Refresh Token API] ✅ User found:', user.email);

    // Rotaciona o refresh token: remove o antigo e cria um novo
    console.log('[Refresh Token API] Rotating tokens...');
    await prisma.refreshToken.deleteMany({ where: { token: refreshToken } });
    console.log('[Refresh Token API] ✅ Old refresh token deleted');

    const newAccessToken = signToken({ id: user.id, email: user.email, role: user.role }, '1h');
    const newRefreshToken = signToken({ id: user.id }, '7d');
    console.log('[Refresh Token API] ✅ New tokens generated (role:', user.role, ')');

    await prisma.refreshToken.create({ data: { token: newRefreshToken, userId: user.id } });
    console.log('[Refresh Token API] ✅ New refresh token saved to DB');

    // Set new refresh token as HttpOnly cookie
    res.setHeader('Set-Cookie', serialize('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
    }));
    console.log('[Refresh Token API] ✅ New refresh token set in HttpOnly cookie');
    console.log('[Refresh Token API] ✅ New token expires:', new Date(Date.now() + 60*60*1000).toISOString());
    console.log('===== [Refresh Token API] ✅ SUCCESS =====\n');

    return res.status(200).json({ user: { id: user.id, name: user.name, email: user.email, role: user.role }, accessToken: newAccessToken });
  } catch (error) {
    console.error('===== [Refresh Token API] ❌ ERROR:', error);
    return res.status(500).json({ message: 'Erro interno' });
  }
}
