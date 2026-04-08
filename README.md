# UniRemind

Phase 1 foundation for a full-stack student productivity platform.

## What Is Included (Phase 1)
- Monorepo setup with npm workspaces.
- `apps/backend`: Express + TypeScript API skeleton.
- `apps/frontend`: Next.js + TypeScript dashboard/settings skeleton.
- `apps/backend/prisma/schema.prisma`: Initial PostgreSQL schema for:
  - users
  - user settings
  - email rules
  - event mappings
  - activity logs
- Secure environment templates (`.env.example` files).
- PostgreSQL local runtime via `docker-compose.yml`.

## Repository Layout
```text
UniRemind/
  apps/
    backend/
    frontend/
  packages/
    types/
  docker-compose.yml
  package.json
```

## Quick Start
1. Install dependencies:
```bash
npm install
```

2. Copy env templates:
```bash
copy apps\\backend\\.env.example apps\\backend\\.env
copy apps\\frontend\\.env.local.example apps\\frontend\\.env.local
```

3. Start PostgreSQL:
```bash
docker compose up -d postgres
```

4. Generate Prisma client and run migrations:
```bash
npm run db:generate
npm run db:migrate
```

5. Start apps in separate terminals:
```bash
npm run dev:backend
npm run dev:frontend
```

## Current API
- `GET /` root status
- `GET /api/health` service health

## Notes
- OAuth routes, Google API clients, and WhatsApp/LLM workers are intentionally left for later phases.
- Do not commit real secrets in `.env` files.
