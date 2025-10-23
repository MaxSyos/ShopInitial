import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../lib/prisma';
import { getUserFromRequest, requireAuth } from '../_utils/auth';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  // @ts-ignore
  const user = await getUserFromRequest(req);
  if (!user) {
    console.warn('Unauthorized request to /api/addresses - missing user. Authorization header:', req.headers.authorization);
    return res.status(401).json({ error: 'Não autorizado' });
  }

  if (req.method === 'GET') {
    try {
      // Buscar endereços do usuário
  // @ts-ignore - gerador do Prisma Client precisa ser executado para expor `address`
  const addresses = await prisma.address.findMany({ where: { userId: user.id } });
      console.log(`/api/addresses GET - userId=${user.id} returned ${addresses?.length || 0} addresses`);
      return res.status(200).json(addresses);
    } catch (error: any) {
      console.error('Erro ao listar endereços', error);
      return res.status(500).json({ error: 'Erro interno' });
    }
  }

  if (req.method === 'POST') {
    try {
      const payload = req.body;
      console.log('/api/addresses POST payload:', payload);

      // Validar alguns campos mínimos
      if (!payload || !payload.postalCode || !payload.street) {
        return res.status(400).json({ error: 'Dados de endereço incompletos' });
      }

      // @ts-ignore - gerador do Prisma Client precisa ser executado para expor `address`
      // If payload asks this to be default, unset other defaults for this user first
      if (payload.isDefault) {
        try {
          await prisma.address.updateMany({ where: { userId: user.id, isDefault: true }, data: { isDefault: false } });
        } catch (e) {
          console.warn('Falha ao limpar isDefault anteriores', e);
        }
      }

      // @ts-ignore - gerador do Prisma Client precisa ser executado para expor `address`
      const newAddress = await prisma.address.create({
        data: {
          user: { connect: { id: user.id } },
          street: payload.street,
          city: payload.city || '',
          state: payload.state || '',
          postalCode: payload.postalCode,
          country: payload.country || 'BR',
          number: payload.number || '',
          complement: payload.complement || '',
          isDefault: payload.isDefault || false
        }
      });
      console.log('/api/addresses created newAddress id=', newAddress?.id);

      return res.status(201).json(newAddress);
    } catch (error: any) {
      console.error('Erro ao criar endereço', error);
      return res.status(500).json({ error: 'Erro interno' });
    }
  }

  res.setHeader('Allow', ['GET', 'POST']);
  return res.status(405).end(`Method ${req.method} Not Allowed`);
}

export default requireAuth(handler);
