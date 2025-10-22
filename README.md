# Next Movie

Aplicação SaaS construída com Next.js 15 para criar listas de filmes e séries, integrar com TMDB e realizar sorteios individuais ou em dupla.

## Requisitos

- Node.js 18+
- PostgreSQL (Vercel Postgres recomendado)

## Configuração

1. Copie `.env.example` para `.env.local` e preencha as variáveis.
2. Execute as migrações do Prisma:

```bash
npx prisma migrate dev --name init
```

3. Inicie o servidor de desenvolvimento:

```bash
npm run dev
```

## Scripts principais

- `npm run dev`: inicia o servidor Next.js
- `npm run build`: gera build de produção
- `npm run start`: inicia em modo produção
- `npm run lint`: executa ESLint
- `npm run prisma:migrate`: executa `prisma migrate dev`
- `npm run prisma:generate`: gera o cliente Prisma

## Estrutura

- `src/app`: rotas (marketing, login, dashboard, listagem) e APIs (Auth.js, TMDB, lista, sorteios)
- `src/lib`: utilitários compartilhados (`db`, `auth`, `tmdb`)
- `prisma/schema.prisma`: modelo de dados com listas, amizades e histórico de sorteios

## Segurança

- Hash de senha com Argon2 via Auth.js
- Sorteios em dupla restritos a amizades aprovadas
- Sessões persistidas em banco com NextAuth

## Créditos

Baseado no plano de produto Next Movie com foco em experiências de assistir em dupla.
