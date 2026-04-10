# UniRemind

Phase 1 foundation plus Phase 2 authentication for a full-stack student productivity platform.

## What Is Included (Current)
- Monorepo setup with npm workspaces.
- `apps/backend`: Express + TypeScript API with:
  - health routes
  - Google OAuth start/callback routes
  - JWT session issuance and auth middleware
  - protected user settings update endpoint
- `apps/frontend`: Next.js + TypeScript dashboard/settings skeleton with Google connect link.
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

3. Fill auth secrets in `apps/backend/.env`:
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_REDIRECT_URI`
- `JWT_SECRET`

4. Start PostgreSQL:
```bash
docker compose up -d postgres
```

5. Generate Prisma client and run migrations:
```bash
npm run db:generate
npm run db:migrate
```

6. Start apps in separate terminals:
```bash
npm run dev:backend
npm run dev:frontend
```

## Current API
- `GET /` root status
- `GET /api/health` service health
- `GET /api/auth/google` returns OAuth consent URL
- `GET /api/auth/google/redirect` redirects directly to OAuth consent screen
- `GET /api/auth/google/callback` creates/updates user, issues session token
- `GET /api/auth/me` returns current user + settings (protected)
- `PATCH /api/users/me/settings` updates sync settings (protected)
- `POST /api/auth/logout` clears session cookie

## Notes
- OAuth is now enabled as part of Phase 2. Google API service integrations are next in Phase 3.
- Do not commit real secrets in `.env` files.
