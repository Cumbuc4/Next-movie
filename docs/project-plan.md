# Time2Watch SaaS - Plano Inicial

## 1. Visao Geral
- **Nome do projeto:** Time2Watch
- **Objetivo:** Permitir que cada usuario monte listas de filmes e series e realize sorteios combinando a propria lista com a de outro usuario previamente autorizado.

## 2. Dados de entrada dos usuarios
- **Fontes/formatos:** Importacao via busca direta na API do TMDB (sem upload inicial de arquivos). Possivel suporte futuro a CSV/JSON exportados de outros servicos.
- **Limite sugerido por item:** Restringir a 5 MB apenas se aceitarmos uploads externos (nao necessario na fase atual).
- **Volume estimado:** Ate 5.000 itens por usuario em planos gratuitos; limites maiores podem ser oferecidos em planos pagos.

## 3. Modelo de usuario
Campos previstos alem de email/senha:
- `id` (cuid)
- `name`
- `email`
- `hash` (Argon2)
- `image` (avatar OAuth ou upload futuro)
- `createdAt`
- Contadores auxiliares (numero de itens, ultima atividade) - definir se necessario.

## 4. Fluxo de autenticacao
- Suporte a OAuth (GitHub, Google) + credenciais proprias (email/senha com Argon2).
- Sessoes persistidas no banco (estrategia `database`).
- Enforce 2FA opcional em roadmap.

## 5. Requisitos de privacidade e LGPD
- Recolher consentimento e disponibilizar termos de uso e politica de privacidade.
- Permitir exclusao completa da conta e exportacao das listas.
- Registrar auditoria minima de sorteios (historico) com retencao de 12 meses.
- Processamento de dados limitado ao necessario para recomendacao e sorteios.

## 6. Regras de acesso e billing
- **Free:** ate 5.000 itens, 10 sorteios compartilhados por mes.
- **Pro (a definir):** limites ampliados (ex.: 20.000 itens, sorteios ilimitados, compartilhamento com multiplos parceiros simultaneos).
- Implementar `Friendship` para controlar parceiros autorizados.

## 7. Infraestrutura e regiao do banco
- Vercel Postgres em regiao `iad1` (US-East) enquanto aguardamos disponibilidade em regioes sul-americanas. Avaliar replicacao futura.

## 8. Branding inicial
- **Nome:** Time2Watch
- **Paleta:**
  - Primaria: `#1E40AF` (azul intenso)
  - Secundaria: `#F97316` (laranja)
  - Neutra: `#0F172A` (cinza escuro), `#E2E8F0` (cinza claro)
- **Logo:** ainda nao definido (usar wordmark temporario).

## 9. Stack tecnica consolidada
- Next.js 15 (App Router, TypeScript)
- Tailwind CSS + shadcn/ui
- Auth.js (NextAuth) com Prisma Adapter
- Prisma ORM com Vercel Postgres
- Vercel Blob para futuros uploads (posters personalizados)
- TMDB API (REST) para busca e metadados

## 10. Backlog inicial
1. Configurar projeto Next.js com dependencias listadas.
2. Definir schema Prisma conforme modelos `User`, `ListItem`, `Friendship`, `PickHistory`, `SharedPickHistory`.
3. Implementar fluxo de autenticacao (OAuth + credenciais) e paginas de login/logout.
4. Criar integracao com TMDB (helpers + rotas de busca).
5. Implementar CRUD das listas pessoais (`/api/list/*`).
6. Implementar sorteio solo e compartilhado (`/api/list/pick` e `/api/list/pick-with`).
7. Construir UI do dashboard, incluindo seletor de parceiro.
8. Implementar rate limiting basico nas rotas de API.
9. Preparar rotinas de exportacao/exclusao de dados para LGPD.
10. Automatizar deploy (Vercel) e migracoes Prisma.

## 11. Checklist de seguranca
- [ ] Hash de senha com Argon2
- [ ] Cookies HTTPOnly + Secure + SameSite=Lax
- [ ] Rate limit em rotas sensiveis
- [ ] Revisao de permissoes em sorteios compartilhados
- [ ] Logs auditaveis de amizade/sorteio
- [ ] Politica de retencao e exclusao de dados documentada

## 12. Proximos dados necessarios
- Confirmar limites definitivos de planos e pricing.
- Definir se havera importacao em massa (CSV/JSON) ja na fase inicial.
- Escolher provedores OAuth prioritarios (Google, GitHub, outros?).
- Indicar responsavel por branding/logo definitivo.

## 13. Referencias uteis
- [TMDB API Docs](https://developer.themoviedb.org/docs)
- [Auth.js Credentials Provider](https://authjs.dev/reference/core/providers_credentials)
- [Vercel Postgres Docs](https://vercel.com/docs/storage/vercel-postgres)
