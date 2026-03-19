# Backend: how dev works (detailed)

This document explains how the backend is structured and how to run it safely in development.

## Stack and architecture
- Runtime: Node.js (ESM modules), Express, and Supabase.
- Auth: Supabase Auth (email/password + OAuth). Requests are validated with JWTs.
- Data: Supabase Postgres with Row Level Security (RLS).
- Services: domain logic under `server/services/` and `server/actions/`.
- API: REST-style routes in `server/routes/`.
- Ops: SQL and maintenance scripts in `server/sql/` and `server/scripts/`.

## Important files and folders
- API routes: `server/routes/`
- Services (business logic): `server/services/`
- Actions (behavior modules): `server/actions/`
- Utilities (logging, errors): `server/utils/`
- Database schema and SQL: `server/schema.sql`, `server/sql/`
- Test scripts: `server/tests/`
- Seed/reset scripts: `server/scripts/`
- Environment variables: `server/.env`, `server/.env.example`

## Running the backend in dev
The server package config is in `server/package.json`.

Commands:
```bash
cd server
npm install
npm run dev
```

Notes:
- `server/package.json` points to `server/index.js`, which imports and starts `server/scripts/maintenance/index.js`.
- The Express app entry is `server/scripts/maintenance/index.js`.

## Dev ports
- Backend: `http://localhost:3000` (from `server/.env.example`, `server/scripts/maintenance/index.js`, and `dev.bat`/`run_dev.bat`).
- Frontend (Vite): `http://localhost:5173` (default Vite dev port; referenced in `dev.bat`/`run_dev.bat`).
- Frontend API proxy: `/api` -> `http://localhost:3000` (see `vite.config.ts`).

## What the dev setup does
- Starts the backend Express API on `http://localhost:3000`.
- Starts the frontend Vite dev server on `http://localhost:5173`.
- Proxies frontend `/api` calls to the backend via Vite.
- Enforces Supabase JWT auth and RLS-scoped DB access for protected routes.
- Exposes REST APIs for auth, users, families, chat, projects, topics, skills, resources, billing, admin, and Agora.
- Runs cognition listeners for chat side effects (gamification, experience, topic updates).
- Applies dev middleware (CORS, compression, helmet, rate limiting, request logging).
- Serves static assets and SPA fallback from `server/public` when using the backend server.

## Request flow (high level)
1. Client sends requests to `/api/*` on the backend.
2. `requireAuth` middleware validates the Supabase JWT.
3. The backend creates a user-scoped Supabase client with the JWT.
4. Route handlers call services to read/write data.
5. Responses are normalized with response helpers and error middleware.

## Auth and security model
- Auth is handled by Supabase. The backend verifies the token on every protected route.
- `requireAuth` sets `req.user` and `req.userClient`.
- `req.userClient` uses the access token to enforce RLS policies in Postgres.
- Admin operations use the service key via `supabaseAdmin`.
- Rate limiting is applied to `/api/*` and a higher limit for auth endpoints.

## Key middleware behavior
- CORS allows a localhost origin list in development.
- `helmet` and `compression` are enabled.
- A raw body parser is used for webhooks (`/api/webhook`) so signatures can be verified.
- Errors are logged and sanitized in production.

## API surface overview
Routes are mounted under `/api` (or a sub-path) and use Zod schemas for validation.

Core routes:
- `server/routes/auth.js`: signup, login, password reset, OAuth.
- `server/routes/users.js`: user profile and account data.
- `server/routes/families.js`: family membership and relationships.
- `server/routes/invites.js`: invite flows for family joining.
- `server/routes/chat.js`: conversations, messages, summaries, folders.
- `server/routes/projects.js`: projects, artifacts, reflections, comments, project conversations.
- `server/routes/topics.js`: learning topics and related data.
- `server/routes/skills.js`: skills list and detail handling.
- `server/routes/resources.js`: resource entities.
- `server/routes/folders.js`: conversation folder management.
- `server/routes/settings.js`: user settings and preferences.
- `server/routes/billing.js`: billing endpoints (Stripe).
- `server/routes/agora.js`: Agora integration endpoints.
- `server/routes/admin.js`: admin-only actions.

## AI and cognition services
- AI agents live under `server/services/ai/agents/`.
- The chat flow uses agents (e.g., TeacherAgent) to generate responses.
- Background cognitive events are dispatched via `EventManager` and `jobQueue`.
- Listeners under `server/services/cognition/listeners/` respond to events (gamification, experience, topic updates).

## Database and migrations
- Schema is documented in `server/schema.sql` and supporting SQL files.
- Migrations and data fixes live under `server/scripts/` and `server/sql/`.
- Use the scripts carefully; many are one-off migrations intended for specific datasets.

## Quick start env vars
The example file is minimal. These are the variables the backend references:

From `server/.env.example`:
- `PORT`
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`

From `server/scripts/maintenance/db.js` (required at runtime):
- `SUPABASE_SERVICE_KEY` (required)

Recommended minimum local `.env` for dev:
```
PORT=3000
SUPABASE_URL=...
SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_KEY=...
```

## Safe development checklist
- Never commit `server/.env` or any secrets (Supabase service key, Stripe secrets).
- Use `server/.env.example` as a template and keep real keys local.
- Rely on user-scoped clients (`req.userClient`) for normal data access.
- Keep admin access restricted to service key usage only.
- Validate request payloads with Zod to avoid unsafe writes.

## Troubleshooting
- If auth fails, check the Authorization header uses `Bearer <token>`.
- If RLS blocks data, confirm the user session token is passed through.
- If CORS blocks requests, confirm your frontend origin is in the dev list.
- If server does not start, verify the entry file and update `server/package.json` accordingly.
