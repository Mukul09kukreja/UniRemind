# UniRemind

A student productivity workspace that syncs Google Classroom, Calendar, and Gmail into one unified deadline and reminder feed.

## Tech Stack

- **Frontend:** Next.js 14, TypeScript
- **Backend:** Express.js, TypeScript, Prisma
- **Database:** PostgreSQL
- **Auth:** Google OAuth 2.0 + JWT

## Prerequisites

- Node.js 18+
- Docker Desktop
- Google Cloud Console account

## Setup Instructions

### 1. Clone the repo

```bash
git clone https://github.com/Mukul09kukreja/UniRemind.git
cd UniRemind
npm install
```

### 2. Set up Google OAuth credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project (or use existing)
3. Go to **APIs & Services** → **OAuth consent screen** → configure it
4. Go to **APIs & Services** → **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**
5. Set **Authorized redirect URI** to `http://localhost:8080/api/auth/google/callback`
6. Copy your **Client ID** and **Client Secret**
7. Go to **Audience** → add your Gmail as a **Test User**

### 3. Enable required Google APIs

In Google Cloud Console → **APIs & Services** → **Enabled APIs**, enable:

- Google Classroom API
- Google Calendar API
- Gmail API

### 4. Create your `.env` file

```bash
cp apps/backend/.env.example apps/backend/.env
```

Then fill in your values in `apps/backend/.env`:

```
NODE_ENV=development
PORT=8080
DATABASE_URL=postgresql://uniremind:uniremind@localhost:5432/uniremind?schema=public
ALLOWED_ORIGIN=http://localhost:3000

GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:8080/api/auth/google/callback

OPENAI_API_KEY=your-openai-api-key

JWT_SECRET=any-random-string-minimum-32-characters
JWT_EXPIRES_IN=7d
```

### 5. Start the database

```bash
docker run --name uniremind-db \
  -e POSTGRES_USER=uniremind \
  -e POSTGRES_PASSWORD=uniremind \
  -e POSTGRES_DB=uniremind \
  -p 5432:5432 -d postgres:16
```

### 6. Run database migrations

```bash
cd apps/backend
npx prisma generate
npx prisma migrate dev --name init
```

### 7. Start the backend

```bash
cd apps/backend
npm run dev
```

Backend runs on `http://localhost:8080`

### 8. Start the frontend

Open a new terminal:

```bash
cd apps/frontend
npm run dev
```

Frontend runs on `http://localhost:3000`

## Verify it's working

- Health check: `http://localhost:8080/api/health`
- Auth URL: `http://localhost:8080/api/auth/google`
- After login: `http://localhost:8080/api/auth/me`

## Daily Development Workflow

```bash
# Start database
docker start uniremind-db

# Terminal 1 - Backend
cd apps/backend && npm run dev

# Terminal 2 - Frontend
cd apps/frontend && npm run dev

# Stop database when done
docker stop uniremind-db
```

## Project Structure

```
UniRemind/
├── apps/
│   ├── backend/          # Express + Prisma API
│   │   ├── src/
│   │   │   ├── config/   # Environment config
│   │   │   ├── lib/      # Prisma, JWT, Google OAuth
│   │   │   ├── middleware/
│   │   │   └── routes/   # auth, users, health
│   │   └── prisma/
│   │       └── schema.prisma
│   └── frontend/         # Next.js app
│       └── src/app/
│           ├── page.tsx       # Home
│           ├── dashboard/
│           └── settings/
```

## Phase 3 (in progress)

Manual sync endpoints are now available to bootstrap the Phase 3 pipeline:

- `POST /api/sync/classroom/poll` — pull Classroom coursework and cache source mappings
- `POST /api/sync/calendar/classroom` — create Google Calendar events for pending Classroom items
- `POST /api/sync/gmail/classify` — classify recent Gmail messages into productivity labels

All sync endpoints require auth (`Authorization: Bearer <token>` or `uniremind_session` cookie).

## Phases

- ✅ **Phase 1** — Project scaffold, schema, folder structure
- ✅ **Phase 2** — Google OAuth, JWT auth, protected routes, user settings
- 🔜 **Phase 3** — Classroom poller, Calendar sync, Gmail classifier
