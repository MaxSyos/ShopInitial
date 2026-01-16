const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function clearDatabase() {
  console.log('🧹 Iniciando limpeza do banco de dados...');

  try {
    // Limpar dados em ordem reversa das dependências (filhas primeiro)
    console.log('🗑️  Limpando emails...');
    await prisma.email.deleteMany();

    console.log('🗑️  Limpando configurações...');
    await prisma.setting.deleteMany();

    console.log('🗑️  Limpando CategoryGrid...');
    await prisma.categoryGrid.deleteMany();

    console.log('🗑️  Limpando ofertas...');
    await prisma.offer.deleteMany();

    console.log('🗑️  Limpando imagens do carrossel...');
    await prisma.carouselImage.deleteMany();

    console.log('🗑️  Limpando banners...');
    await prisma.banner.deleteMany();

    console.log('🗑️  Limpando favoritos...');
    await prisma.favorite.deleteMany();

    console.log('🗑️  Limpando itens do carrinho...');
    await prisma.cartItem.deleteMany();

    console.log('🗑️  Limpando carrinhos...');
    await prisma.cart.deleteMany();

    console.log('🗑️  Limpando listas de itens de pedidos...');
    await prisma.orderItemListRow.deleteMany();
    await prisma.orderItemList.deleteMany();

    console.log('🗑️  Limpando itens de pedidos...');
    await prisma.orderItem.deleteMany();

    console.log('🗑️  Limpando pedidos...');
    await prisma.order.deleteMany();

    console.log('🗑️  Limpando endereços...');
    await prisma.address.deleteMany();

    console.log('🗑️  Limpando reviews...');
    await prisma.review.deleteMany();

    console.log('🗑️  Limpando imagens de produtos...');
    await prisma.image.deleteMany();

    console.log('🗑️  Limpando produtos...');
    await prisma.product.deleteMany();

    console.log('🗑️  Limpando marcas...');
    await prisma.brand.deleteMany();

    console.log('🗑️  Limpando categorias filhas primeiro...');
    // Deletar categorias filhas primeiro (que referenciam parentId)
    await prisma.category.deleteMany({
      where: {
        parentId: {
          not: null
        }
      }
    });

    console.log('🗑️  Limpando categorias pai...');
    // Depois deletar categorias pai (que não têm parentId)
    await prisma.category.deleteMany({
      where: {
        parentId: null
      }
    });

    console.log('🗑️  Limpando tokens de refresh...');
    await prisma.refreshToken.deleteMany();

    console.log('🗑️  Limpando usuários...');
    await prisma.user.deleteMany();

    console.log('✅ Banco de dados limpo com sucesso!');

  } catch (error) {
    console.error('❌ Erro ao limpar banco de dados:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar apenas se chamado diretamente
if (require.main === module) {
  clearDatabase();
}

module.exports = { clearDatabase };