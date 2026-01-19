import { NextApiRequest, NextApiResponse } from 'next';
import { getUserFromRequest } from '../_utils/auth';
import prisma from '../../../lib/prisma';

/**
 * Endpoint para limpar ShippingRates inválidas do banco de dados
 * POST /api/admin/cleanup-shipping-rates
 * 
 * Apenas ADMIN pode acessar
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = await getUserFromRequest(req);

  if (!user || user.role !== 'ADMIN') {
    return res.status(401).json({ error: 'Não autorizado. Apenas ADMIN' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido. Use POST' });
  }

  try {
    console.log('🧹 Iniciando limpeza de ShippingRates...');

    // 1. Contar registros antes
    const countBefore = await prisma.shippingRate.count();
    console.log(`📊 Total de registros antes: ${countBefore}`);

    // 2. Encontrar registros inválidos
    const invalidRates = await prisma.shippingRate.findMany({
      where: {
        OR: [
          { quantityUpTo: null },
          { quantityUpTo: { lte: 0 } },
          { weight: null },
          { weight: { lte: 0 } },
          { height: null },
          { width: null },
          { length: null },
        ],
      },
    });

    console.log(`⚠️  Registros inválidos encontrados: ${invalidRates.length}`);

    // 3. Deletar registros inválidos
    let deletedCount = 0;
    if (invalidRates.length > 0) {
      const result = await prisma.shippingRate.deleteMany({
        where: {
          OR: [
            { quantityUpTo: null },
            { quantityUpTo: { lte: 0 } },
            { weight: null },
            { weight: { lte: 0 } },
            { height: null },
            { width: null },
            { length: null },
          ],
        },
      });
      deletedCount = result.count;
      console.log(`✅ ${deletedCount} registros deletados`);
    }

    // 4. Contar registros depois
    const countAfter = await prisma.shippingRate.count();
    console.log(`📊 Total de registros depois: ${countAfter}`);

    // 5. Listar registros válidos
    const validRates = await prisma.shippingRate.findMany({
      orderBy: { quantityUpTo: 'asc' },
    });

    console.log(`✅ ${validRates.length} registro(s) válido(s)`);

    return res.status(200).json({
      message: 'Limpeza concluída com sucesso',
      countBefore,
      countAfter,
      deletedCount,
      validRates: validRates.map((rate) => ({
        id: rate.id,
        quantityUpTo: rate.quantityUpTo,
        dimensions: `${rate.height}×${rate.width}×${rate.length}cm`,
        weight: `${rate.weight}kg`,
        sedex: `R$${rate.sedexValue.toFixed(2)}`,
        pac: `R$${rate.pacValue.toFixed(2)}`,
      })),
    });
  } catch (error: any) {
    console.error('❌ Erro durante limpeza:', error);
    return res.status(500).json({
      error: 'Erro ao limpar dados',
      message: error.message,
    });
  }
}
