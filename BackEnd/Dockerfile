# Estágio de build
FROM node:20-alpine AS builder

# Define o diretório de trabalho
WORKDIR /app

# Copia os arquivos de configuração
COPY package*.json ./
COPY prisma ./prisma/
COPY tsconfig.json ./

# Instala as dependências
RUN yarn install 

# Copia o código fonte
COPY . .

# Gera o Prisma Client
RUN npx prisma generate

# Compila o TypeScript
RUN yarn build

# Estágio de produção
FROM node:20-alpine

# Define o diretório de trabalho
WORKDIR /app

# Copia os arquivos necessários do estágio de build
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/prisma ./prisma

# Expõe a porta da aplicação
EXPOSE 3000

# Comando para iniciar a aplicação
CMD ["yarn", "start"]
