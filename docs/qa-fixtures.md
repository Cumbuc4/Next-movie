# QA Fixture Guide (Test Environment)

The script below creates a deterministic set of records that is useful for manual QA, visual checks, and automated smoke tests.

## 1. Configure environment

1. Ensure the `.env` (or `.env.local`) file points `DATABASE_URL` to an empty Postgres schema.
2. Run pending migrations (ou `npx prisma migrate reset` se estiver reaplicando tudo):
   ```bash
   npx prisma migrate deploy
   ```

## 2. Seed demo data

Run the seed command:

```bash
npm run seed:test
```

This will create:

- Two users (`tester@example.com`, `cinema@example.com`) with uma amizade confirmada.
- A shared movie list with 10 items (mix of movies and series) for the first user.
- Pending and accepted friend requests to exercise the dashboard widgets.
- Solo and shared pick history items.
- Cada usuário recebe um `login code` impresso no console após o seed. Guarde os códigos exibidos, pois eles são necessários para acessar as contas de teste.

All passwords are set to `password123`. Use them for manual login when testing auth flows.

## 3. Clean up

To reset the database, drop and recreate the schema, then rerun the seed command.

```bash
npx prisma migrate reset --force --skip-seed
npm run seed:test
```
