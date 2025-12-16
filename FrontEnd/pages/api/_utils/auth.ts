import type { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';
import prisma from '../../../lib/prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'change_this_in_prod';

// Log para debug (remover em produção se necessário)
if (!process.env.JWT_SECRET) {
  console.warn('⚠️ JWT_SECRET não configurado no .env, usando valor padrão (inseguro!)');
}

export function signToken(payload: object, expiresIn = '1h') {
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
}

export function verifyToken(token: string) {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded;
  } catch (err: any) {
    console.error('verifyToken error:', err.message);
    return null;
  }
}

export async function getUserFromRequest(req: NextApiRequest) {
  const auth = req.headers.authorization || '';
  console.log('getUserFromRequest -> Authorization header present:', !!auth);
  console.log('getUserFromRequest -> Authorization header value:', auth ? auth.substring(0, 20) + '...' : 'VAZIO');
  console.log('getUserFromRequest -> All headers:', Object.keys(req.headers));
  
  const token = auth.startsWith('Bearer ') ? auth.substring(7) : null;
  if (!token) {
    console.log('getUserFromRequest -> no Bearer token found');
    console.log('getUserFromRequest -> auth value:', auth);
    console.log('getUserFromRequest -> auth.startsWith("Bearer "):', auth.startsWith('Bearer '));
    return null;
  }

  console.log('getUserFromRequest -> token received (first 50 chars):', token.substring(0, 50));

  const decoded: any = verifyToken(token);
  
  if (!decoded) {
    console.log('getUserFromRequest -> token verification failed (returned null)');
    return null;
  }

  if (!decoded?.id) {
    console.log('getUserFromRequest -> token valid but missing id field:', decoded);
    return null;
  }

  console.log('getUserFromRequest -> token valid, user id:', decoded.id);

  const user = await prisma.user.findUnique({
    where: { id: decoded.id },
  });

  if (!user) {
    console.log('getUserFromRequest -> user not found in database with id:', decoded.id);
    return null;
  }

  console.log('getUserFromRequest -> found user id:', user?.id ?? 'none');

  return user;
}

export function requireAuth(handler: any) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const user = await getUserFromRequest(req);
    if (!user) {
      return res.status(401).json({ message: 'Não autorizado' });
    }

    // @ts-ignore
    req.user = user;
    return handler(req, res);
  };
}
