# Guia de execução local

Este documento descreve os passos para instalar as dependências, validar o projeto e iniciar o servidor de desenvolvimento do Next Movie na sua máquina.

## 1. Preparar variáveis de ambiente

1. Copie o arquivo `.env.example` para `.env.local`.
2. Preencha as variáveis obrigatórias:
   - `DATABASE_URL` e `DIRECT_URL` do PostgreSQL (ou Vercel Postgres).
   - Segredos do Auth.js (`AUTH_SECRET`, provedores OAuth) e chave da API do TMDB (`TMDB_API_KEY`).

> Dica: use `openssl rand -base64 32` para gerar `AUTH_SECRET`.

## 2. Instalar dependências

Certifique-se de ter o Node.js 18+ instalado. Em seguida execute:

```bash
npm install
```

Se o seu ambiente exigir proxy ou registro alternativo, ajuste as configurações de rede antes de instalar os pacotes.

## 3. Gerar o cliente Prisma e aplicar migrações

Com o banco configurado, gere o cliente e aplique as migrações iniciais:

```bash
npm run prisma:generate
npm run prisma:migrate
```

## 4. Executar validações iniciais

Rode o lint para garantir que o código segue as regras do projeto:

```bash
npm run lint
```

## 5. Iniciar o servidor de desenvolvimento

Com as dependências instaladas e migrações aplicadas, inicie o projeto:

```bash
npm run dev
```

A aplicação ficará disponível em http://localhost:3000.

## 6. Encerrar o servidor

Pressione `Ctrl + C` para parar o servidor de desenvolvimento quando terminar.

---

> Caso algum comando falhe por ausência de dependências, verifique se `npm install` foi executado com sucesso e se as variáveis de ambiente estão corretas.
