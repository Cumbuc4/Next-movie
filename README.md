# Time2Watch

Aplicacao SaaS construida com Next.js 15 para criar listas de filmes e series, integrar com TMDB e realizar sorteios individuais ou em dupla.

## Requisitos

- Node.js 18+
- PostgreSQL (Vercel Postgres recomendado)

## Configuracao

1. Copie `.env.example` para `.env.local` e preencha as variaveis.
2. Execute as migracoes do Prisma:

```bash
npx prisma migrate dev --name init
```

3. Inicie o servidor de desenvolvimento:

```bash
npm run dev
```

## Scripts principais

- `npm run dev`: inicia o servidor Next.js
- `npm run build`: gera build de producao
- `npm run start`: inicia em modo producao
- `npm run lint`: executa ESLint
- `npm run prisma:migrate`: executa `prisma migrate dev`
- `npm run prisma:generate`: gera o cliente Prisma

## Estrutura

- `src/app`: rotas (marketing, login, dashboard, listagem) e APIs (Auth.js, TMDB, lista, sorteios)
- `src/lib`: utilitarios compartilhados (`db`, `auth`, `tmdb`)
- `prisma/schema.prisma`: modelo de dados com listas, amizades e historico de sorteios

## Seguranca

- Hash de senha com Argon2 via Auth.js
- Sorteios em dupla restritos a amizades aprovadas
- Sessoes persistidas em banco com NextAuth

## Creditos

Baseado no plano de produto Time2Watch com foco em experiencias de assistir em dupla.
