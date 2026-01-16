import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { verifyToken } from '../_utils/auth';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Somente PUT/POST/DELETE requerem token
  if (['PUT', 'POST', 'DELETE'].includes(req.method || '')) {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Token não fornecido' });

    try {
      const decoded: any = verifyToken(token);
      if (decoded.role !== 'ADMIN') return res.status(403).json({ error: 'Acesso negado. Apenas ADMINs.' });
    } catch (err) {
      return res.status(401).json({ error: 'Token inválido' });
    }
  }

  try {
    if (req.method === 'GET') {
      const item = await prisma.setting.findUnique({ where: { key: 'whatsapp_number' } });
      return res.status(200).json({ item });
    }

    if (req.method === 'PUT' || req.method === 'POST') {
      const { number } = req.body;
      if (!number || typeof number !== 'string') {
        return res.status(400).json({ error: 'Número inválido' });
      }

      const upserted = await prisma.setting.upsert({
        where: { key: 'whatsapp_number' },
        update: { value: number },
        create: { key: 'whatsapp_number', value: number },
      });

      return res.status(200).json({ item: upserted });
    }

    if (req.method === 'DELETE') {
      await prisma.setting.deleteMany({ where: { key: 'whatsapp_number' } });
      return res.status(200).json({ message: 'WhatsApp removido' });
    }

    return res.status(405).json({ error: 'Método não permitido' });
  } catch (error: any) {
    console.error('whatsapp api error', error);
    return res.status(500).json({ error: 'Erro ao processar requisição' });
  } finally {
    await prisma.$disconnect();
  }
}
