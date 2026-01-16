const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');
(async () => {
  const prisma = new PrismaClient();
  try {
    const secret = process.env.JWT_SECRET || 'troque_esta_chave_por_uma_senha_forte';
    const email = 'testuser@example.com';
    let user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      user = await prisma.user.create({ data: { email, name: 'Test User', password: 'hashed', role: 'USER' } });
      console.log('Usuário test criado:', user.id);
    } else {
      console.log('Usuário test existente:', user.id);
    }

    const token = jwt.sign({ id: user.id, email: user.email }, secret, { expiresIn: '7d' });
    console.log('TOKEN:', token);
  } catch (e) {
    console.error(e);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
})();
