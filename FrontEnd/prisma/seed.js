const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database (JS)...');

  await prisma.review.deleteMany();
  await prisma.image.deleteMany();
  await prisma.product.deleteMany();
  await prisma.brand.deleteMany();
  await prisma.category.deleteMany();

  const brands = await Promise.all([
    prisma.brand.create({ data: { name: 'Brand A', logo: 'https://via.placeholder.com/100?text=Brand+A' } }),
    prisma.brand.create({ data: { name: 'Brand B', logo: 'https://via.placeholder.com/100?text=Brand+B' } }),
    prisma.brand.create({ data: { name: 'Brand C', logo: 'https://via.placeholder.com/100?text=Brand+C' } }),
  ]);

  const parentCategory = await prisma.category.create({ data: { name: 'Electronics', description: 'Eletrônicos e gadgets' } });
  const subCategory = await prisma.category.create({ data: { name: 'Laptops', description: 'Notebooks e laptops', parentId: parentCategory.id } });
  const phonesCategory = await prisma.category.create({ data: { name: 'Phones', description: 'Smartphones', parentId: parentCategory.id } });

  const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

  for (let i = 1; i <= 20; i++) {
    const brand = brands[i % brands.length];
    const category = i % 2 === 0 ? subCategory : phonesCategory;

    const product = await prisma.product.create({
      data: {
        name: `Produto Falso ${i}`,
        description: `Descrição do produto falso ${i}. Ótimo para testes.`,
        price: parseFloat((rand(100, 2000) + Math.random()).toFixed(2)),
        stock: rand(0, 100),
        sku: `SKU-${i}-${Date.now()}`,
        brand: { connect: { id: brand.id } },
        category: { connect: { id: category.id } },
        rating: parseFloat((Math.random() * 5).toFixed(1)),
        isOffer: i % 5 === 0,
      },
    });

    await prisma.image.create({ data: { url: `https://picsum.photos/seed/product${i}/640/480`, alt: `Imagem do produto ${i}`, productId: product.id } });

    const reviewCount = rand(0, 5);
    for (let r = 0; r < reviewCount; r++) {
      await prisma.review.create({
        data: {
          rating: rand(1, 5),
          comment: `Comentário ${r + 1} para produto ${i}`,
          userId: null,
          product: { connect: { id: product.id } },
        },
      });
    }
  }

  console.log('Seeding finished (JS).');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
