import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../lib/prisma';
import { getUserFromRequest, requireAuth } from '../_utils/auth';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  // @ts-ignore
  const user = await getUserFromRequest(req);
  if (!user) {
    console.warn('Unauthorized request to /api/addresses/[id] - missing user. Authorization header:', req.headers.authorization);
    return res.status(401).json({ error: 'Não autorizado' });
  }

  const { id } = req.query;
  if (!id || typeof id !== 'string') return res.status(400).json({ error: 'Id inválido' });

  if (req.method === 'PUT') {
    try {
      const payload = req.body;
        // if setting this address as default, unset other defaults
        if (payload && payload.isDefault) {
          try {
            await prisma.address.updateMany({ where: { userId: user.id, isDefault: true }, data: { isDefault: false } });
          } catch (e) {
            console.warn('Falha ao limpar isDefault anteriores ao atualizar', e);
          }
        }
      console.log(`/api/addresses/${id} PUT payload:`, payload);
      // @ts-ignore
      const existing = await prisma.address.findUnique({ where: { id } });
      if (!existing || existing.userId !== user.id) return res.status(404).json({ error: 'Endereço não encontrado' });

      const updated = await prisma.address.update({ where: { id }, data: payload });
      console.log(`/api/addresses/${id} updated`);
      return res.status(200).json(updated);
    } catch (error: any) {
      console.error('Erro ao atualizar endereço', error);
      return res.status(500).json({ error: 'Erro interno' });
    }
  }

  if (req.method === 'DELETE') {
    try {
      console.log(`/api/addresses/${id} DELETE requested`);
      // @ts-ignore
      const existing = await prisma.address.findUnique({ where: { id } });
      if (!existing || existing.userId !== user.id) return res.status(404).json({ error: 'Endereço não encontrado' });

      await prisma.address.delete({ where: { id } });
      console.log(`/api/addresses/${id} deleted`);
      return res.status(204).end();
    } catch (error: any) {
      console.error('Erro ao deletar endereço', error);
      return res.status(500).json({ error: 'Erro interno' });
    }
  }

  res.setHeader('Allow', ['PUT', 'DELETE']);
  return res.status(405).end(`Method ${req.method} Not Allowed`);
}

export default requireAuth(handler);
