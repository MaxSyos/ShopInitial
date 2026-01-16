import type { NextApiRequest, NextApiResponse } from 'next';
import { getUserFromRequest } from '../_utils/auth';
import jwt from 'jsonwebtoken';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('\n=== AUTH DEBUG ===');
  
  // 1. Verificar header
  const auth = req.headers.authorization || '';
  console.log('1. Authorization header:', auth ? `Present (${auth.length} chars)` : 'Missing');
  
  // 2. Extrair token
  const token = auth.startsWith('Bearer ') ? auth.substring(7) : null;
  console.log('2. Bearer token:', token ? `Present (${token.length} chars)` : 'Missing');
  
  // 3. Verificar JWT_SECRET
  const JWT_SECRET = process.env.JWT_SECRET || 'change_this_in_prod';
  console.log('3. JWT_SECRET:', process.env.JWT_SECRET ? 'Configured' : 'Using default (INSECURE)');
  
  // 4. Tentar decodificar token sem validar
  if (token) {
    try {
      const decoded = jwt.decode(token);
      console.log('4. Token decoded (no validation):', decoded);
    } catch (e) {
      console.log('4. Failed to decode token:', (e as any).message);
    }
  }
  
  // 5. Tentar validar token
  if (token) {
    try {
      const verified = jwt.verify(token, JWT_SECRET);
      console.log('5. Token verified:', verified);
    } catch (e: any) {
      console.log('5. Token verification failed:', e.message);
    }
  }
  
  // 6. Tentar usar getUserFromRequest
  const user = await getUserFromRequest(req);
  console.log('6. getUserFromRequest result:', user ? `User: ${(user as any).email}` : 'null');
  
  console.log('=== END DEBUG ===\n');
  
  return res.status(200).json({
    authHeaderPresent: !!auth,
    tokenPresent: !!token,
    jwtSecretConfigured: !!process.env.JWT_SECRET,
    userFound: !!user,
    user: user ? { id: (user as any).id, email: (user as any).email } : null,
  });
}
