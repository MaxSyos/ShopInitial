Autenticação (Prisma + MongoDB Atlas)

Passos rápidos:

1. Instale dependências no diretório `FrontEnd`:

   ```bash
   cd FrontEnd
   npm install
   # ou
   pnpm install
   ```

2. Inicialize Prisma e aplique o schema (apontando `DATABASE_URL` para o MongoDB Atlas):

   ```bash
   npx prisma generate
   npx prisma db push
   ```

3. Crie um arquivo `.env` com as variáveis do `.env.example` e rode a aplicação:

   ```bash
   cp .env.example .env
   # editar .env
   npm run dev
   ```

Endpoints adicionados:
- POST /api/auth/register
- POST /api/auth/login
- GET  /api/auth/me (requer Authorization: Bearer <token>)

Observações:
- Tokens de refresh são guardados no modelo `RefreshToken` no banco.
- Troque `JWT_SECRET` por um segredo seguro em produção.
