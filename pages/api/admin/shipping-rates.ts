import { NextApiRequest, NextApiResponse } from 'next';
import { getUserFromRequest } from '../_utils/auth';
import prisma from '../../../lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = await getUserFromRequest(req);
  
  if (!user || user.role !== 'ADMIN') {
    return res.status(401).json({ error: 'Não autorizado' });
  }

  if (req.method === 'GET') {
    try {
      const rates = await prisma.shippingRate.findMany({
        orderBy: { createdAt: 'desc' }
      });
      return res.status(200).json({ rates });
    } catch (error: any) {
      console.error('Erro ao buscar taxas de envio:', error);
      return res.status(500).json({ error: 'Erro ao buscar taxas de envio' });
    }
  }

  if (req.method === 'POST') {
    try {
      const { quantityUpTo, height, width, length, weight, sedexValue, pacValue } = req.body;

      if (!quantityUpTo || !height || !width || !length || !weight) {
        return res.status(400).json({ error: 'Campos obrigatórios não preenchidos' });
      }

      const rate = await prisma.shippingRate.create({
        data: {
          quantityUpTo: parseInt(quantityUpTo),
          height: parseFloat(height),
          width: parseFloat(width),
          length: parseFloat(length),
          weight: parseFloat(weight),
          sedexValue: sedexValue ? parseFloat(sedexValue) : 0,
          pacValue: pacValue ? parseFloat(pacValue) : 0,
        }
      });

      return res.status(201).json({ rate });
    } catch (error: any) {
      console.error('Erro ao criar taxa de envio:', error);
      return res.status(500).json({ error: 'Erro ao criar taxa de envio' });
    }
  }

  return res.status(405).json({ error: 'Método não permitido' });
}
