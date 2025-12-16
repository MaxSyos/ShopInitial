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
  const anyReq: any = req;

  // Retornar user já resolvido nesta mesma requisição (evita múltiplas verificações)
  if (anyReq._cachedUser) {
    if (process.env.DEBUG_AUTH) console.log('getUserFromRequest -> returning cached user id:', anyReq._cachedUser.id);
    return anyReq._cachedUser;
  }

  const auth = req.headers.authorization || '';
  const debug = !!process.env.DEBUG_AUTH;
  if (debug) {
    console.log('getUserFromRequest -> Authorization header present:', !!auth);
    console.log('getUserFromRequest -> Authorization header value:', auth ? auth.substring(0, 20) + '...' : 'VAZIO');
    console.log('getUserFromRequest -> All headers:', Object.keys(req.headers));
  } else {
    console.log('getUserFromRequest -> Authorization header present:', !!auth);
  }

  const token = auth.startsWith('Bearer ') ? auth.substring(7) : null;
  if (!token) {
    if (debug) {
      console.log('getUserFromRequest -> no Bearer token found');
      console.log('getUserFromRequest -> auth value:', auth);
      console.log('getUserFromRequest -> auth.startsWith("Bearer "):', auth.startsWith('Bearer '));
    }
    return null;
  }
  if (debug) console.log('getUserFromRequest -> token received (first 50 chars):', token.substring(0, 50));

  const decoded: any = verifyToken(token);
  if (!decoded) {
    if (debug) console.log('getUserFromRequest -> token verification failed (returned null)');
    return null;
  }

  if (!decoded?.id) {
    if (debug) console.log('getUserFromRequest -> token valid but missing id field:', decoded);
    return null;
  }

  if (debug) console.log('getUserFromRequest -> token valid, user id:', decoded.id);

  const user = await prisma.user.findUnique({ where: { id: decoded.id } });
  if (!user) {
    if (debug) console.log('getUserFromRequest -> user not found in database with id:', decoded.id);
    return null;
  }

  if (debug) console.log('getUserFromRequest -> found user id:', user?.id ?? 'none');

  // cache no objeto req para reuso durante o mesmo ciclo da requisição
  anyReq._cachedUser = user;
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
