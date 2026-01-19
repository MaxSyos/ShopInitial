# Online Shop — Documentação Unificada

Este README unifica a documentação do projeto (conteúdo consolidado a partir dos vários arquivos .md presentes no repositório). Ele agrupa e resume as informações dos documentos originais para facilitar entendimento e manutenção.

---

**Índice**

- Visão Geral
- Estrutura do Projeto
- Frontend — Guia Rápido
- Gerenciamento de Produtos
- Imagens e Upload (ImgBB)
- Gerenciamento de Pedidos
- Autenticação e Token Refresh
- Endpoints principais (API)
- Scripts e Utilitários (seed, testes, deploy)
- Deploy e Push para GitHub/Vercel
- Checklist e Operações Manuais
- Referências e arquivos de suporte

---

## Visão Geral

Este repositório contém uma aplicação de e-commerce (Online Shop) com frontend em Next.js (pasta `FrontEnd`) e APIs implementadas como rotas de API do Next. O projeto inclui:

- Frontend com páginas para listagem de produtos, detalhe de produto, carrinho, pedidos e administração.
- APIs internas (`/pages/api`) para produtos, cart, orders, addresses, auth, conteúdo (banners, carousel), etc.
- Integração com banco via Prisma e scripts de seed.
- Documentação dispersa em múltiplos arquivos `.md` que agora foram consolidados aqui.

## Estrutura do Projeto

- `/FrontEnd` — Aplicação Next.js (páginas, componentes, hooks, lib, store, styles).
- `/pages/api` — Rotas de API do Next (products, cart, orders, auth, content, addresses, etc.).
- `/lib` — Helpers como `axiosClient`, `tokenStore`, `prisma` client.
- `/store` — Redux slices e thunks para cart, orders e outros estados.
- `/scripts` e `/prisma` — scripts de manutenção e seed do banco.

## Frontend — Guia Rápido

- Iniciar em desenvolvimento:

```bash
cd FrontEnd
yarn install
yarn dev
```

- Principais páginas:
  - `/products` — listagem de produtos com paginação e filtros.
  - `/[category]/[subCategory]/[title]/[slug]` — detalhe do produto.
  - `/cart` — carrinho e resumo do pedido.
  - `/orders` — lista de pedidos do usuário.
  - `/manage-orders` — página administrativa para pedidos (requer role ADMIN).
  - `/manage-shipping-rates` — gerenciar tabelas de valor de envio (requer role ADMIN).

- Hooks úteis:
  - `useProducts` — gerenciamento de carregamento/paginação de produtos.
  - `useAuth` — checagem de autenticação/redirect.
  - `useExchangeRateGBPToIRR` — conversão de preços (com fallback hard-coded).

## Gerenciamento de Produtos

- Criação/edição de produtos possui guias de criação, exemplos de API e páginas auxiliares.
- Existem arquivos que descrevem criação de produtos e pipeline de imagens (thumbnails, uploads).
- Recomenda-se usar as rotas de API em `pages/api/products` e seguir o formato esperado pelo frontend (incluir `images`, `brand`, `category`).

## Gerenciamento de Valor de Envio (Frete)

- Página: `/manage-shipping-rates` (apenas ADMIN)
- Funcionalidade: Gerenciar tabelas de valor de envio baseadas em dimensões de caixa
- Recursos:
  - Adicionar, editar e deletar tabelas de frete
  - Calcular automaticamente valores SEDEX e PAC via Correios
  - Suporte para CEP específico ou CEP padrão
  - Armazenamento de histórico de cálculos
- Documentação detalhada: Ver [docs/SHIPPING_RATES.md](./docs/SHIPPING_RATES.md)

## Imagens e Upload (ImgBB)

- O projeto inclui suporte a upload externo (ImgBB) com documentação e tratamento de erros (ex: erro 400). Há guias para usar o endpoint ImgBB e exemplos de como montar requests.

## Gerenciamento de Pedidos

- API `/api/orders` e `/api/orders/list` fornecem endpoints para criar pedidos e listar pedidos do usuário.
- Existe lógica no backend para mapear order items para produtos, incluindo URLs de imagens e mapeamentos necessários.
- Implementado ETag + cache in-memory na API de listagem de pedidos para reduzir chamadas repetidas.
- Frontend consome `/api/orders/list` e implementa polling / dedupe; recomendamos migrar para SWR/React-Query com `dedupingInterval`.

## Autenticação e Token Refresh

- Fluxo de tokens: access token em memória/localStorage via `tokenStore`, refresh token mantido em HttpOnly cookie.
- `lib/axiosClient` configura interceptors para anexar Authorization header e tenta refresh quando recebe 401, enfileirando requests enquanto refresh ocorre.
- Há endpoints `/api/auth/refresh` para rotacionar tokens.

## Endpoints principais (Resumo)

- `GET /api/products` — lista de produtos (suporte a search, page, limit).
- `GET /api/products/:slug` — detalhe de produto.
- `GET /api/cart` — obter carrinho do usuário.
- `DELETE /api/cart` — limpar carrinho.
- `POST /api/orders` — criar pedido.
- `GET /api/orders/list` — listar pedidos (paginado) — implementa ETag/cache.
- `GET/POST/PUT/DELETE /api/content/banners` — gerenciar banners (admin).
- `GET/POST/PUT/DELETE /api/content/carousel` — gerenciar carousel (admin).
- `GET/POST /api/addresses` — gerenciar endereços do usuário (auth required).

> Para detalhes de payloads e exemplos, consulte as seções de API nas docs originais (agregadas abaixo).

## Scripts e Utilitários

- Scripts de seed e limpeza presentes em `/prisma` e `/FrontEnd/scripts` (ex.: `clear-orders.js`, `generate-test-token.js`, `test-fetch-products.js`).
- Scripts de push e deploy auxiliares (`push-changes.sh`, `upload-to-github.sh`, `push_changes.py`).

## Deploy e Push para GitHub/Vercel

- Existem instruções específicas para commit/push e configuração de categoria grid no GitHub. Use as instruções em `GIT_COMMIT_INSTRUCTIONS.md` e `GITHUB_PUSH_GUIDE.md` (agregados aqui) para fluxo correto de push.
- Para Vercel: certifique-se de configurar variáveis de ambiente necessárias (NEXT_PUBLIC_API_URL, JWT secrets, etc.) e que as rotas de API têm headers/Cache-Control apropriados.

## Checklist e Operações Manuais

- Há vários checklists e guias rápidos no repositório original: uso de `FILES_CHECKLIST.md`, `CHECKLIST_FINAL.md`, e guias de upload manual.
- Antes de publicar, confirme:
  - Seed do banco executado (se aplicável).
  - Variáveis de ambiente configuradas.
  - Arquivos estáticos e imagens acessíveis.

## Observações Técnicas e Recomendadas

- Caching: Para reduzir chamadas na Vercel free tier, usar ETag + Cache-Control + per-instance in-memory cache. Para páginas públicas, prefira ISR (`getStaticProps` + `revalidate`).
- Client-side: migrar consumidores de endpoints com alta frequência para SWR/React-Query com deduping.
- Sanitização de dados: o backend aplica mapeamentos; manter validações em payloads de criação/edição.

## Referências e Conteúdo Agregado

A documentação original incluía arquivos com títulos como:

- PRODUCT_CREATION_GUIDE.md, PRODUCT_CREATION_SUMMARY.md, PRODUCT_CREATION_COMPLETION.md, README_PRODUCT_CREATION.md
- ORDER_MANAGEMENT_SYSTEM.md, ORDER_MANAGEMENT_SUMMARY.md, ORDER_MANAGEMENT_COMPLETE.md, ORDER_MANAGEMENT_TESTING.md
- IMGBB_GUIDE.md, IMGBB_ERROR_400_FIX.md
- CONTENT_MANAGEMENT_IMPLEMENTATION.md, CONTENT_MANAGEMENT_SUMMARY.md, CONTENT_MANAGEMENT_TESTS.md
- PROFILE_CPF_WHATSAPP_* (implementação, testes, resumo)
- scripts de seed e testes em `prisma` e `FrontEnd/scripts`.

---

## Histórico

Este README foi gerado automaticamente a partir da consolidação dos vários arquivos `.md` presentes no repositório, com o objetivo de simplificar a documentação e evitar duplicidade. Os arquivos `.md` individuais serão removidos a pedido.

---

*Fim da documentação unificada.*
