import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // Criar categorias
  const categories = await Promise.all([
    prisma.category.create({
      data: {
        name: 'Eletrônicos',
        description: 'Produtos eletrônicos em geral',
      },
    }),
    prisma.category.create({
      data: {
        name: 'Vestuário',
        description: 'Roupas e acessórios',
      },
    }),
    prisma.category.create({
      data: {
        name: 'Livros',
        description: 'Livros físicos e digitais',
      },
    }),
  ]);

  // Criar marcas
  const brands = await Promise.all([
    prisma.brand.create({
      data: {
        name: 'TechPro',
        logo: 'https://example.com/techpro-logo.png',
      },
    }),
    prisma.brand.create({
      data: {
        name: 'FashionStyle',
        logo: 'https://example.com/fashionstyle-logo.png',
      },
    }),
    prisma.brand.create({
      data: {
        name: 'BookWorld',
        logo: 'https://example.com/bookworld-logo.png',
      },
    }),
  ]);

  // Criar produtos
  const products = await Promise.all([
    prisma.product.create({
      data: {
        name: 'Smartphone X1',
        description: 'Smartphone último modelo',
        price: 1999.99,
        stock: 50,
        sku: 'TECH-001',
        images: ['https://example.com/smartphone-x1.jpg'],
        categoryId: categories[0].id,
        brandId: brands[0].id,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Camiseta Básica',
        description: 'Camiseta 100% algodão',
        price: 49.99,
        stock: 100,
        sku: 'FSH-001',
        images: ['https://example.com/camiseta-basica.jpg'],
        categoryId: categories[1].id,
        brandId: brands[1].id,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Clean Code',
        description: 'Livro sobre boas práticas de programação',
        price: 89.99,
        stock: 30,
        sku: 'BK-001',
        images: ['https://example.com/clean-code.jpg'],
        categoryId: categories[2].id,
        brandId: brands[2].id,
      },
    }),
  ]);

  // Criar usuário administrador
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.create({
    data: {
      email: 'admin@example.com',
      password: adminPassword,
      name: 'Administrador',
      role: 'ADMIN',
    },
  });

  console.log('Seed concluído com sucesso!');
  console.log('Categorias criadas:', categories.length);
  console.log('Marcas criadas:', brands.length);
  console.log('Produtos criados:', products.length);
  console.log('Usuário admin criado:', admin.email);
}

main()
  .catch((e) => {
    console.error('Erro durante o seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
