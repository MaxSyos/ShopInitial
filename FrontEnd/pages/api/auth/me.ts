import type { NextApiRequest, NextApiResponse } from 'next';
import { requireAuth } from '../_utils/auth';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  // @ts-ignore
  const user = req.user;
  return res.status(200).json({ user: { id: user.id, name: user.name, email: user.email, role: user.role } });
}

export default requireAuth(handler);
