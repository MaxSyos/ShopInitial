const path = require('path');
const fs = require('fs');

// Carregar variáveis do .env (se existir) sem depender de dotenv
const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  const env = fs.readFileSync(envPath, 'utf8');
  const dbUrlLines = [];
  
  env.split(/\n/).forEach((line) => {
    const m = line.match(/^\s*([^#=]+)=\s*(.*)\s*$/);
    if (m) {
      let key = m[1].trim();
      let val = m[2].trim();
      if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
      
      // Armazenar todas as entradas de DATABASE_URL
      if (key === 'DATABASE_URL') {
        dbUrlLines.push(val);
      }
      
      // Não sobrescrever variáveis já definidas
      if (!process.env[key] && key !== 'DATABASE_URL') {
        process.env[key] = val;
      }
    }
  });
  
  // Usar a última DATABASE_URL (que é o MongoDB)
  if (dbUrlLines.length > 0) {
    process.env.DATABASE_URL = dbUrlLines[dbUrlLines.length - 1];
    console.log(`✓ DATABASE_URL carregado do .env (MongoDB)\n`);
  }
}

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const categories = [
  {
    name: 'digital',
    title: 'digitalCategoryTitle',
    description: 'digitalCategoryDescription',
    styles: {
      backgroundColor: 'var(--digital-category-bgc)',
      flexDirection: 'row',
      paddingBlock: '0.75rem',
      paddingInline: '1rem',
      gridColumn: 'span 3 / span 12',
    },
    href: '/digital',
    imgSrc: '/images/category-img/digital-category.webp',
    imgWidth: 190,
    imgHeight: 240,
  },
  {
    name: 'fashion',
    title: 'fashionCategoryTitle',
    description: 'fashionCategoryDescription',
    styles: {
      backgroundColor: 'var(--fashion-category-bgc)',
      flexDirection: 'row',
      paddingInline: '1rem',
      paddingBlock: '1rem',
      gridColumn: 'span 3 / span 3',
    },
    href: '/fashion',
    imgSrc: '/images/category-img/fashion-category.webp',
    imgWidth: 240,
    imgHeight: 250,
  },
  {
    name: 'beauty',
    title: 'beautyCategoryTitle',
    description: 'beautyCategoryDescription',
    styles: {
      backgroundColor: 'var(--beauty-category-bgc)',
      flexDirection: 'row',
      paddingInline: '1rem',
      paddingBlock: '1rem',
      gridColumn: 'span 3 / span 3',
    },
    href: '/beauty',
    imgSrc: '/images/category-img/beauty-category.webp',
    imgWidth: 170,
    imgHeight: 150,
  },
  {
    name: 'sport',
    title: 'sportCategoryTitle',
    description: 'sportCategoryDescription',
    styles: {
      backgroundColor: 'var(--sport-category-bgc)',
      flexDirection: 'row-reverse',
      paddingInline: '1rem',
      paddingBlock: '1rem',
      gridColumn: 'span 3 / span 3',
    },
    href: '/sport',
    imgSrc: '/images/category-img/sport-category.webp',
    imgWidth: 130,
    imgHeight: 150,
  },
  {
    name: 'house',
    title: 'houseCategoryTitle',
    description: 'houseCategoryDescription',
    styles: {
      backgroundColor: 'var(--house-category-bgc)',
      flexDirection: 'row',
      paddingInline: '1rem',
      paddingBlock: '1rem',
      gridColumn: 'span 3 / span 6',
    },
    href: '/house',
    imgSrc: '/images/category-img/house-category.webp',
    imgWidth: 320,
    imgHeight: 240,
  },
  {
    name: 'toy',
    title: 'toyCategoryTitle',
    description: 'toyCategoryDescription',
    styles: {
      backgroundColor: 'var(--toy-category-bgc)',
      flexDirection: 'column',
      paddingInline: '1rem',
      paddingBlock: '1rem',
      textAlign: 'center',
      gridColumn: 'span 3 / span 6',
    },
    href: '/toy',
    imgSrc: '/images/category-img/toy-category.webp',
    imgWidth: 130,
    imgHeight: 110,
  },
  {
    name: 'stationery',
    title: 'stationeryCategoryTitle',
    description: 'stationeryCategoryDescription',
    styles: {
      backgroundColor: 'var(--stationery-category-bgc)',
      flexDirection: 'row',
      paddingInline: '1rem',
      paddingBlock: '1rem',
      gridColumn: 'span 6 / span 6',
    },
    isCentered: true,
    href: '/stationery',
    imgSrc: '/images/category-img/stationery-category.webp',
    imgWidth: 130,
    imgHeight: 250,
    imgCustomStyles: { alignSelf: 'center' },
  },
];

async function main() {
  console.log('Iniciando seed de CategoryGrid...\n');
  
  for (let i = 0; i < categories.length; i++) {
    const item = categories[i];
    
    // Extrair propriedades do objeto 'styles'
    const backgroundColor = item.styles?.backgroundColor || null;
    const flexDirection = item.styles?.flexDirection || 'row';
    const paddingBlock = item.styles?.paddingBlock || '1rem';
    const paddingInline = item.styles?.paddingInline || '1rem';
    const gridColumn = item.styles?.gridColumn || 'span 3 / span 3';
    
    const data = {
      name: item.name,
      title: item.title,
      description: item.description || null,
      href: item.href || null,
      imgSrc: item.imgSrc || null,
      imgWidth: item.imgWidth || 190,
      imgHeight: item.imgHeight || 240,
      backgroundColor: backgroundColor,
      flexDirection: flexDirection,
      paddingBlock: paddingBlock,
      paddingInline: paddingInline,
      gridColumn: gridColumn,
      isCentered: item.isCentered === true ? true : false,
      isSmall: item.isSmall === true ? true : false,
      order: i + 1,
      isActive: true,
    };

    try {
      const upserted = await prisma.categoryGrid.upsert({
        where: { name: item.name },
        update: data,
        create: data,
      });
      console.log(`✓ Upsert com sucesso: ${upserted.name} (ID: ${upserted.id})`);
    } catch (err) {
      console.error(`✗ Erro ao fazer upsert de "${item.name}":`, err.message);
    }
  }
  
  console.log('\n✓ Seed finalizado!');
}

main()
  .catch((e) => {
    console.error(e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
