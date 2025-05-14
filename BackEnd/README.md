# E-commerce Seguro - Backend NestJS

## Visão Geral
Sistema de e-commerce monolítico desenvolvido em NestJS com foco em segurança, escalabilidade e manutenibilidade.

## Arquitetura

### Módulos Principais

1. **AuthModule**
   - Autenticação JWT + OAuth2
   - MFA com TOTP
   - RBAC dinâmico
   - Refresh tokens
   - Proteção contra ataques de força bruta

2. **UserModule**
   - Gestão de usuários
   - Perfis
   - Endereços
   - Preferências
   - Auditoria de ações

3. **ProductModule**
   - Catálogo de produtos
   - Categorias
   - Marcas
   - Avaliações
   - Cache em Redis

4. **CartModule**
   - Carrinho de compras
   - Sessões temporárias
   - Integração com inventário
   - Validação em tempo real

5. **OrderModule**
   - Gestão de pedidos
   - Histórico
   - Rastreamento
   - Notificações
   - Transações ACID

6. **PaymentModule**
   - Processamento de pagamentos
   - Integração com gateways
   - Criptografia de dados sensíveis
   - Tokenização de cartões

7. **NotificationModule**
   - E-mails transacionais
   - Push notifications
   - Webhooks
   - Templates

### Banco de Dados

1. **PostgreSQL**
   - Usuários
   - Pedidos
   - Pagamentos
   - Logs de auditoria
   - Permissões

2. **MongoDB**
   - Catálogo de produtos
   - Inventário
   - Avaliações
   - Logs não-críticos

3. **Redis**
   - Cache de consultas
   - Sessões
   - Rate limiting
   - Dados temporários

### Segurança

1. **Proteções**
   - CORS restrito
   - Helmet + CSP
   - CSRF
   - Rate limiting
   - Circuit breaker
   - Sanitização de inputs
   - Validação de DTOs

2. **Criptografia**
   - Argon2id para senhas
   - AES-256-GCM para dados sensíveis
   - HashiCorp Vault para secrets

3. **Monitoramento**
   - Logs centralizados (ELK)
   - Métricas (Prometheus + Grafana)
   - Tracing distribuído (Jaeger)
   - Alertas automáticos

### Integração com Frontend

1. **API RESTful**
   - Endpoints seguros
   - Documentação OpenAPI
   - Validação de contratos
   - Versionamento

2. **WebSockets**
   - Atualizações em tempo real
   - Notificações push
   - Status de pedidos
   - Carrinho sincronizado

## Setup do Ambiente

### Requisitos
- Node.js 18+
- PostgreSQL 14+
- MongoDB 6+
- Redis 7+
- Docker & Docker Compose

### Variáveis de Ambiente
```env
# Servidor
PORT=3000
NODE_ENV=development

# Database
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_USER=admin
POSTGRES_PASSWORD=******
POSTGRES_DB=ecommerce

MONGODB_URI=mongodb://localhost:27017/ecommerce
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRATION=15m
REFRESH_TOKEN_SECRET=your-refresh-secret
REFRESH_TOKEN_EXPIRATION=7d

# Segurança
CORS_ORIGINS=https://seu-frontend.com
RATE_LIMIT_TTL=60
RATE_LIMIT_MAX=100

# Criptografia
ENCRYPTION_KEY=your-encryption-key
```

## Comandos

```bash
# Instalação
npm install

# Desenvolvimento
npm run start:dev

# Produção
npm run build
npm run start:prod

# Testes
npm run test
npm run test:e2e

# Migrations
npm run migration:generate
npm run migration:run
```

## CI/CD

1. **Pipeline**
   - Build
   - Testes unitários
   - Testes E2E
   - SAST (SonarQube)
   - DAST (OWASP ZAP)
   - Docker build
   - Deploy

2. **Qualidade**
   - Cobertura mínima: 80%
   - Zero vulnerabilidades críticas
   - Auditoria de dependências

## Documentação

A documentação completa da API está disponível em:
- Swagger UI: /api/docs
- OpenAPI JSON: /api-json

## Licença

MIT
