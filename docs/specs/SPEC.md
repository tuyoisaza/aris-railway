# ARIS System Specification

**Version**: 1.0.0  
**Last Updated**: 2026-03-22  
**Status**: Active Development

---

## 1. Architecture Overview

ARIS is a monolithic full-stack application:
- **Frontend**: React 19 SPA served by Express
- **Backend**: Express API + WebSocket on same server
- **Database**: SQLite via Prisma ORM
- **Hosting**: Railway with GitHub integration (auto-deploy on push)

### 1.1 Canonical API Client

**ALL frontend API calls MUST use `src/services/api.ts`** (functional modular API).

```
src/services/
├── api.ts              # Barrel export - USE THIS
├── api/
│   ├── base-client.ts # HTTP helpers, auth headers
│   ├── auth.ts        # signup, login, logout, onAuthStateChange
│   ├── chat.ts        # conversations, messages, folders
│   ├── family.ts      # family management
│   ├── projects.ts    # user projects
│   ├── topics.ts      # learning topics
│   ├── skills.ts      # skills tracking
│   ├── user.ts        # user preferences
│   ├── billing.ts     # stripe checkout
│   ├── admin.ts       # admin operations
│   └── agora.ts       # video integration
```

**DO NOT use**: `src/services/supabase.ts` (DELETED - was legacy Supabase client pattern that didn't work)

### 1.2 API Response Pattern

All API methods return `{ error: ... }` on failure, data on success:

```typescript
// Success
return { data: result };

// Error
return { error: 'Something went wrong' };
```

---

## 2. Backend Architecture

### 2.1 Route Structure

| Module | Path | Purpose |
|--------|------|---------|
| auth | `/api/auth` | Signup, login, OAuth |
| chat | `/api/chat` | Conversations, messages |
| topics | `/api/topics` | Learning topics |
| skills | `/api/skills` | Skills & XP |
| projects | `/api/projects` | User projects |
| families | `/api/families` | Family groups |
| folders | `/api/folders` | Chat organization |
| users | `/api/users` | User profile |
| resources | `/api/resources` | Learning resources |
| admin | `/api/admin` | Admin operations |
| billing | `/api/billing` | Stripe (stubbed) |

### 2.2 Response Format

```javascript
// Success
sendSuccess(res, data)  // { data: ... }

// Error
sendError(res, message)  // { error: message }
```

---

## 3. Authentication

### 3.1 Frontend Auth Storage

```javascript
localStorage.setItem('aris_token', access_token);
localStorage.setItem('aris_user', JSON.stringify(user));
```

### 3.2 Auth Methods (from api.ts)

```typescript
api.login(email, password)           // Returns { session, user } or { error }
api.signup(email, password, name)     // Returns { session, user } or { error }
api.logout()                         // Clears localStorage
api.onAuthStateChange(callback)       // Listen for auth state changes
api.getSession()                      // Get current session
```

---

## 4. Deployment

### 4.1 Railway GitHub Integration

- Push to `master` branch → Railway auto-builds and deploys
- **NO GitHub Actions needed** - Railway handles deployment

### 4.2 Configuration Files

| File | Purpose |
|------|---------|
| `Dockerfile` | Multi-stage container build |
| `railway.json` | Railway build config |
| `Railway.toml` | Railway service name |
| `VERSION` | Current version (updated before commit) |

### 4.3 Environment Variables

Required for production:
- `DATABASE_URL=file:/app/server/data/aris.db`
- `JWT_SECRET=<64-char-random>`
- `OPENAI_API_KEY=sk-...`
- `PORT=8080`
- `NODE_ENV=production`

---

## 5. Development Workflow

### 5.1 Commit Convention

**ALL commits MUST include version number:**

```
v0.0.X: <description>
```

### 5.2 Version File

- Location: `VERSION` (root directory)
- Format: `0.0.X`
- Updated BEFORE each commit

### 5.3 Local Development

```bash
npm install
cd server && npm install && cd ..
npm run dev
```

---

## 6. Troubleshooting

| Issue | Cause | Fix |
|-------|-------|-----|
| `createConversation is not a function` | Using wrong API client | Use `api` from `services/api.ts` |
| Version shows old number | Railway hasn't deployed | Push a commit to trigger Railway |
| 401 errors | Token expired | Logout and login again |

---

## 7. File Structure Reference

```
C:\ARIS\
├── VERSION                    # Current version (e.g., 0.0.38)
├── Dockerfile                 # Container build
├── railway.json              # Railway config
├── Railway.toml             # Railway service
│
├── src/                     # Frontend
│   ├── main.tsx            # React bootstrap
│   ├── App.tsx             # Root component
│   ├── context/
│   │   └── GlobalContext.tsx  # State management
│   ├── services/
│   │   ├── api.ts          # CANONICAL API CLIENT
│   │   └── api/            # API modules
│   ├── features/           # Page components
│   └── hooks/              # Custom hooks
│
├── server/                  # Backend
│   ├── index.js           # Express entry
│   ├── middleware.js      # Auth, validation
│   ├── routes/            # API routes
│   ├── services/           # Business logic
│   ├── websocket/          # WebSocket server
│   └── prisma/            # Database schema
│
└── docs/specs/
    └── SPEC.md            # This document
```
