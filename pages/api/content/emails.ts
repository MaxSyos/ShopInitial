import type { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

type ResponseData = {
  success?: boolean;
  message?: string;
  data?: any;
  error?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  const { method } = req;

  if (method === 'GET') {
    try {
      const emails = await prisma.email.findMany({
        orderBy: { createdAt: 'desc' },
      });
      res.status(200).json({ success: true, data: emails });
    } catch (error) {
      console.error('Error fetching emails:', error);
      res.status(500).json({ error: 'Failed to fetch emails' });
    }
  } else if (method === 'POST') {
    const { email } = req.body;

    if (!email || typeof email !== 'string') {
      return res.status(400).json({ error: 'Invalid email' });
    }

    // Validar formato do email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    try {
      // Verificar se já existe
      const existing = await prisma.email.findUnique({
        where: { email },
      });

      if (existing) {
        return res.status(400).json({ error: 'Email already registered' });
      }

      // Criar novo email
      const newEmail = await prisma.email.create({
        data: { email },
      });

      res.status(201).json({ success: true, message: 'Email registered successfully', data: newEmail });
    } catch (error) {
      console.error('Error registering email:', error);
      res.status(500).json({ error: 'Failed to register email' });
    }
  } else if (method === 'DELETE') {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    try {
      const deleted = await prisma.email.deleteMany({
        where: { email },
      });

      if (deleted.count === 0) {
        return res.status(404).json({ error: 'Email not found' });
      }

      res.status(200).json({ success: true, message: 'Email deleted successfully' });
    } catch (error) {
      console.error('Error deleting email:', error);
      res.status(500).json({ error: 'Failed to delete email' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
