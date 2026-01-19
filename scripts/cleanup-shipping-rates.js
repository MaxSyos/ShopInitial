// Script para limpar ShippingRates inválidas do banco de dados MongoDB
// Execute com: node scripts/cleanup-shipping-rates.js

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function cleanupShippingRates() {
  console.log('🧹 Iniciando limpeza de ShippingRates...\n');

  try {
    // 1. Contar registros antes
    const countBefore = await prisma.shippingRate.count();
    console.log(`📊 Total de registros antes: ${countBefore}`);

    // 2. Deletar registros inválidos (com quantityUpTo null ou <= 0)
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

    console.log(`\n⚠️  Registros inválidos encontrados: ${invalidRates.length}`);
    if (invalidRates.length > 0) {
      invalidRates.forEach((rate) => {
        console.log(`  - ID: ${rate.id}, quantityUpTo: ${rate.quantityUpTo}, weight: ${rate.weight}`);
      });

      const deleted = await prisma.shippingRate.deleteMany({
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

      console.log(`\n✅ ${deleted.count} registros deletados`);
    } else {
      console.log('✅ Nenhum registro inválido encontrado');
    }

    // 3. Contar registros depois
    const countAfter = await prisma.shippingRate.count();
    console.log(`\n📊 Total de registros depois: ${countAfter}`);

    // 4. Listar registros válidos
    const validRates = await prisma.shippingRate.findMany({
      orderBy: { quantityUpTo: 'asc' },
    });

    if (validRates.length > 0) {
      console.log(`\n✅ ${validRates.length} registro(s) válido(s):`);
      validRates.forEach((rate) => {
        console.log(
          `  - Até ${rate.quantityUpTo} peças: ${rate.height}×${rate.width}×${rate.length}cm, ${rate.weight}kg, SEDEX: R$${rate.sedexValue}, PAC: R$${rate.pacValue}`
        );
      });
    } else {
      console.log('\n⚠️  Nenhum registro válido encontrado. Crie novas faixas de frete!');
    }

    console.log('\n✅ Limpeza concluída com sucesso!\n');
  } catch (error) {
    console.error('❌ Erro durante limpeza:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

cleanupShippingRates();
