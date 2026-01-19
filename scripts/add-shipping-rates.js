const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('🚚 Adicionando tabelas de frete...');
  
  try {
    // Limpar tabelas antigas
    await prisma.shippingRate.deleteMany();
    
    // Criar dados padrão
    const shippingRates = await prisma.shippingRate.createMany({
      data: [
        // Até 5 peças
        {
          quantityUpTo: 5,
          height: 10,
          width: 15,
          length: 20,
          weight: 0.5,
          sedexValue: 40.00,
          pacValue: 25.00,
        },
        // Até 10 peças
        {
          quantityUpTo: 10,
          height: 15,
          width: 20,
          length: 25,
          weight: 1.0,
          sedexValue: 65.00,
          pacValue: 35.00,
        },
        // Até 20 peças
        {
          quantityUpTo: 20,
          height: 20,
          width: 25,
          length: 30,
          weight: 2.0,
          sedexValue: 115.00,
          pacValue: 60.00,
        },
        // Até 50 peças
        {
          quantityUpTo: 50,
          height: 25,
          width: 30,
          length: 40,
          weight: 5.0,
          sedexValue: 265.00,
          pacValue: 135.00,
        },
        // Acima de 50 peças
        {
          quantityUpTo: 1000,
          height: 30,
          width: 40,
          length: 50,
          weight: 10.0,
          sedexValue: 515.00,
          pacValue: 260.00,
        },
      ],
    });
    
    console.log(`✅ ${shippingRates.count} tabelas de frete criadas com sucesso!`);
  } catch (error) {
    console.error('❌ Erro:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
