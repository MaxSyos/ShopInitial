import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../lib/prisma';

interface CreateBrandRequest {
  name: string;
  logo?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Apenas POST é permitido
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    const { name, logo } = req.body as CreateBrandRequest;

    // Validação
    if (!name || name.trim() === '') {
      return res.status(400).json({ error: 'Nome da marca é obrigatório' });
    }

    // Criar marca
    const brand = await prisma.brand.create({
      data: {
        name: name.trim(),
        logo: logo?.trim() || null,
      },
    });

    return res.status(201).json({
      message: 'Marca criada com sucesso',
      data: brand,
    });
  } catch (error) {
    console.error('Erro ao criar marca:', error);
    return res.status(500).json({ error: 'Erro ao criar marca' });
  }
}
