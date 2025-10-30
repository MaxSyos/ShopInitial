import type { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';
import prisma from '../../../lib/prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'change_this_in_prod';

export function signToken(payload: object, expiresIn = '1h') {
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
}

export function verifyToken(token: string) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return null;
  }
}

export async function getUserFromRequest(req: NextApiRequest) {
  const auth = req.headers.authorization || '';
  // debug: mostrar se header Authorization está presente (útil em ambiente de dev)
  console.log('getUserFromRequest -> Authorization header present:', !!auth);
  const token = auth.startsWith('Bearer ') ? auth.substring(7) : null;
  if (!token) {
    console.log('getUserFromRequest -> no Bearer token found');
    return null;
  }

  const decoded: any = verifyToken(token);
  if (!decoded?.id) {
    console.log('getUserFromRequest -> token invalid or missing id (decoded):', decoded);
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: decoded.id },
  });

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
