import { NextApiRequest, NextApiResponse } from 'next';
import { getUserFromRequest } from '../../_utils/auth';
import prisma from '../../../../lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = await getUserFromRequest(req);
  
  if (!user || user.role !== 'ADMIN') {
    return res.status(401).json({ error: 'Não autorizado' });
  }

  const { id } = req.query;

  if (req.method === 'PATCH') {
    try {
      const { quantityUpTo, height, width, length, weight, sedexValue, pacValue } = req.body;

      const rate = await prisma.shippingRate.update({
        where: { id: id as string },
        data: {
          ...(quantityUpTo !== undefined && { quantityUpTo: parseInt(quantityUpTo) }),
          ...(height !== undefined && { height: parseFloat(height) }),
          ...(width !== undefined && { width: parseFloat(width) }),
          ...(length !== undefined && { length: parseFloat(length) }),
          ...(weight !== undefined && { weight: parseFloat(weight) }),
          ...(sedexValue !== undefined && { sedexValue: parseFloat(sedexValue) }),
          ...(pacValue !== undefined && { pacValue: parseFloat(pacValue) }),
        }
      });

      return res.status(200).json({ rate });
    } catch (error: any) {
      console.error('Erro ao atualizar taxa de envio:', error);
      return res.status(500).json({ error: 'Erro ao atualizar taxa de envio' });
    }
  }

  if (req.method === 'DELETE') {
    try {
      await prisma.shippingRate.delete({
        where: { id: id as string }
      });

      return res.status(200).json({ message: 'Taxa de envio deletada com sucesso' });
    } catch (error: any) {
      console.error('Erro ao deletar taxa de envio:', error);
      return res.status(500).json({ error: 'Erro ao deletar taxa de envio' });
    }
  }

  return res.status(405).json({ error: 'Método não permitido' });
}
