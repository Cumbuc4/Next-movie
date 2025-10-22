# Next Movie SaaS – Plano Inicial

## 1. Visão Geral
- **Nome do projeto:** Next Movie
- **Objetivo:** Permitir que cada usuário monte listas de filmes e séries e realize sorteios combinando a própria lista com a de outro usuário previamente autorizado.

## 2. Dados de entrada dos usuários
- **Fontes/formatos:** Importação via busca direta na API do TMDB (sem upload inicial de arquivos). Possível suporte futuro a CSV/JSON exportados de outros serviços.
- **Limite sugerido por item:** Restringir a 5 MB apenas se aceitarmos uploads externos (não necessário na fase atual).
- **Volume estimado:** Até 5.000 itens por usuário em planos gratuitos; limites maiores podem ser oferecidos em planos pagos.

## 3. Modelo de usuário
Campos previstos além de email/senha:
- `id` (cuid)
- `name`
- `email`
- `hash` (Argon2)
- `image` (avatar OAuth ou upload futuro)
- `createdAt`
- Contadores auxiliares (número de itens, última atividade) – definir se necessário.

## 4. Fluxo de autenticação
- Suporte a OAuth (GitHub, Google) + credenciais próprias (email/senha com Argon2).
- Sessões persistidas no banco (estratégia `database`).
- Enforce 2FA opcional em roadmap.

## 5. Requisitos de privacidade e LGPD
- Recolher consentimento e disponibilizar termos de uso e política de privacidade.
- Permitir exclusão completa da conta e exportação das listas.
- Registrar auditoria mínima de sorteios (histórico) com retenção de 12 meses.
- Processamento de dados limitado ao necessário para recomendação e sorteios.

## 6. Regras de acesso e billing
- **Free:** até 5.000 itens, 10 sorteios compartilhados por mês.
- **Pro (a definir):** limites ampliados (ex.: 20.000 itens, sorteios ilimitados, compartilhamento com múltiplos parceiros simultâneos).
- Implementar `Friendship` para controlar parceiros autorizados.

## 7. Infraestrutura e região do banco
- Vercel Postgres em região `iad1` (US-East) enquanto aguardamos disponibilidade em regiões sul-americanas. Avaliar replicação futura.

## 8. Branding inicial
- **Nome:** Next Movie
- **Paleta:**
  - Primária: `#1E40AF` (azul intenso)
  - Secundária: `#F97316` (laranja)
  - Neutra: `#0F172A` (cinza escuro), `#E2E8F0` (cinza claro)
- **Logo:** ainda não definido (usar wordmark temporário).

## 9. Stack técnica consolidada
- Next.js 15 (App Router, TypeScript)
- Tailwind CSS + shadcn/ui
- Auth.js (NextAuth) com Prisma Adapter
- Prisma ORM com Vercel Postgres
- Vercel Blob para futuros uploads (posters personalizados)
- TMDB API (REST) para busca e metadados

## 10. Backlog inicial
1. Configurar projeto Next.js com dependências listadas.
2. Definir schema Prisma conforme modelos `User`, `ListItem`, `Friendship`, `PickHistory`, `SharedPickHistory`.
3. Implementar fluxo de autenticação (OAuth + credenciais) e páginas de login/logout.
4. Criar integração com TMDB (helpers + rotas de busca).
5. Implementar CRUD das listas pessoais (`/api/list/*`).
6. Implementar sorteio solo e compartilhado (`/api/list/pick` e `/api/list/pick-with`).
7. Construir UI do dashboard, incluindo seletor de parceiro.
8. Implementar rate limiting básico nas rotas de API.
9. Preparar rotinas de exportação/exclusão de dados para LGPD.
10. Automatizar deploy (Vercel) e migrações Prisma.

## 11. Checklist de segurança
- [ ] Hash de senha com Argon2
- [ ] Cookies HTTPOnly + Secure + SameSite=Lax
- [ ] Rate limit em rotas sensíveis
- [ ] Revisão de permissões em sorteios compartilhados
- [ ] Logs auditáveis de amizade/sorteio
- [ ] Política de retenção e exclusão de dados documentada

## 12. Próximos dados necessários
- Confirmar limites definitivos de planos e pricing.
- Definir se haverá importação em massa (CSV/JSON) já na fase inicial.
- Escolher provedores OAuth prioritários (Google, GitHub, outros?).
- Indicar responsável por branding/logo definitivo.

## 13. Referências úteis
- [TMDB API Docs](https://developer.themoviedb.org/docs)
- [Auth.js Credentials Provider](https://authjs.dev/reference/core/providers_credentials)
- [Vercel Postgres Docs](https://vercel.com/docs/storage/vercel-postgres)

