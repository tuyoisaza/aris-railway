# ARIS System Specification

**Version**: 1.1.0  
**Last Updated**: 2026-03-22  
**Status**: Active Development

---

## 1. Architecture Overview

ARIS is a monolithic full-stack application:
- **Frontend**: React 19 SPA served by Express
- **Backend**: Express API + WebSocket on same server
- **Database**: SQLite via Prisma ORM
- **Hosting**: Railway with GitHub integration (auto-deploy on push)

---

## 2. Frontend Architecture

### 2.1 Canonical API Client

**ALL frontend API calls MUST use `src/services/api.ts`** (functional modular API).

```
src/services/
├── api.ts              # Barrel export - USE THIS
├── api/
│   ├── base-client.ts # HTTP helpers, auth headers
│   ├── auth.ts        # signup, login, logout, onAuthStateChange, getSession
│   ├── chat.ts        # conversations, messages, folders
│   ├── family.ts      # family management
│   ├── projects.ts    # user projects
│   ├── topics.ts      # learning topics, resources
│   ├── skills.ts      # skills tracking
│   ├── user.ts        # user preferences
│   ├── billing.ts     # stripe checkout
│   ├── admin.ts       # admin operations
│   └── agora.ts       # video integration
```

**DO NOT use**: `src/services/supabase.ts` (DELETED - was legacy pattern that didn't work)

### 2.2 API Response Pattern

All API methods return `{ error: ... }` on failure, data on success:

```typescript
// Success
return { data: result };

// Error
return { error: 'Something went wrong' };
```

### 2.3 State Management

Global state via `GlobalContext.tsx`. Access via `useGlobal()` hook:

```typescript
const { user, family, topics, projects, sendMessage, logout } = useGlobal();
```

### 2.4 Auth Methods (from api.ts)

```typescript
api.login(email, password)              // Returns { session, user } or { error }
api.signup(email, password, name)      // Returns { session, user } or { error }
api.logout()                          // Clears localStorage
api.onAuthStateChange(callback)        // Listen for auth state changes
api.getSession()                       // Get current session { data: { session, user } }
```

### 2.5 Frontend Auth Storage

```javascript
localStorage.setItem('aris_token', access_token);
localStorage.setItem('aris_user', JSON.stringify(user));
```

---

## 3. Backend Architecture

### 3.1 Route Structure

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
| resources | `/api/resources/:topicId` | Learning resources |
| admin | `/api/admin` | Admin operations |
| billing | `/api/billing` | Stripe (stubbed) |

### 3.2 Response Format

```javascript
// Success
sendSuccess(res, data)          // { data: ... }
sendSuccess(res, data, 201)    // { data: ... } with status code

// Error
sendError(res, message)               // { error: message }
sendError(res, message, 400)         // { error: message }
sendError(res, message, 403, details) // { error: message, details: ... }
```

### 3.3 Middleware Chain

```
Request → Rate Limiter → Auth Middleware → Validation (Zod) → Route Handler → Response
                ↓              ↓                ↓
            429 Too Many    401 Unauthorized   400 Bad Request
```

### 3.4 Zod Validation Schemas

Defined in `server/middleware.js`:

```javascript
schemas = {
    conversation: z.object({
        userId: z.string().uuid(),
        title: z.string().optional(),
        topicId: z.string().uuid().optional().nullable(),
        language: z.string().default('en')
    }),
    message: z.object({
        conversationId: z.string().uuid(),
        role: z.enum(['user', 'assistant', 'system', 'ai']),
        content: z.string()
    }),
    summarize: z.object({
        conversationIds: z.array(z.string().uuid())
    }),
    moveChat: z.object({
        folderId: z.string().uuid().nullable()
    })
}
```

### 3.5 Authentication Flow

1. User logs in → receives JWT with `userId` claim
2. JWT stored in `localStorage.aris_token`
3. All API calls include `Authorization: Bearer <token>`
4. `requireAuth` middleware verifies token and attaches `req.user`
5. 401 response triggers logout

---

## 4. Database Schema (Prisma)

**Location**: `server/prisma/schema.prisma`  
**Provider**: SQLite  
**ORM**: Prisma 5.22.0

### 4.1 Core Models

#### User
```prisma
model User {
  id          String  @id @default(uuid())
  email       String  @unique
  name        String
  password    String?
  avatar      String?
  age         Int?
  plan        String  @default("free")
  role        String  @default("user")
  description String?
  pin         String?
  createdAt   DateTime @default(now())
  lastSeen    DateTime @default(now())
}
```

#### Family
```prisma
model Family {
  id        String   @id @default(uuid())
  name      String
  pin       String?
  createdAt DateTime @default(now())
}
```

#### FamilyMember
```prisma
model FamilyMember {
  id       String   @id @default(uuid())
  familyId String
  userId   String
  role     String   @default("Child")  // "Admin" | "Child"
  active   Boolean  @default(true)
  joinedAt DateTime @default(now())
}
```

### 4.2 Conversation Models

#### Conversation
```prisma
model Conversation {
  id       String   @id @default(uuid())
  userId   String
  topicId  String?
  title    String?
  language String   @default("en")
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

#### Message
```prisma
model Message {
  id             String   @id @default(uuid())
  conversationId String
  role           String   // "user" | "ai" | "system"
  content        String
  authorId       String?  // Optional author reference
  createdAt      DateTime @default(now())
}
```

### 4.3 Learning Models

#### Topic
```prisma
model Topic {
  id          String  @id @default(uuid())
  title       String
  category    String?
  description String?
  content     String?
  depth       Int     @default(1)
  maxDepth    Int     @default(7)
  engagement  Int     @default(0)
  connections Int     @default(0)
  archived    Boolean @default(false)
}
```

#### Resource
```prisma
model Resource {
  id        String @id @default(uuid())
  topicId  String
  title     String
  type      String
  url       String?
  viewStatus String @default("Locked")
}
```

#### UserTopicProgress
```prisma
model UserTopicProgress {
  userId          String
  topicId         String
  currentDepth    Int @default(1)
  engagementScore Int @default(0)
  lastActive      DateTime @default(now())
}
```

### 4.4 Project Models

#### Project
```prisma
model Project {
  id              String   @id @default(uuid())
  userId          String
  title           String
  status          String   @default("active")  // "active" | "completed" | "idea"
  whyText         String?
  scopeText       String?
  nextStep        String?
  blockers        String?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}
```

#### ProjectArtifact
```prisma
model ProjectArtifact {
  id        String   @id @default(uuid())
  projectId String
  name      String
  type      String
  content   String?
  createdAt DateTime @default(now())
}
```

#### ProjectReflection
```prisma
model ProjectReflection {
  id        String   @id @default(uuid())
  projectId String
  content   String
  isPrivate Boolean  @default(true)
  createdAt DateTime @default(now())
}
```

### 4.5 Skill Models

#### Skill
```prisma
model Skill {
  id          String @id @default(uuid())
  title       String @unique
  category    String?
  description String?
}
```

#### UserSkillProgress
```prisma
model UserSkillProgress {
  id               String   @id @default(uuid())
  userId           String
  skillId          String
  level            Int      @default(1)
  xp               Int      @default(0)
  lastPracticedAt  DateTime @default(now())
}
```

---

## 5. API Endpoints Reference

### 5.1 Chat Endpoints

| Method | Endpoint | Body | Auth | Purpose |
|--------|----------|------|------|---------|
| GET | `/api/chat/folders/:userId` | - | Yes | Get user's conversations |
| POST | `/api/chat/conversation` | `{userId, title?, topicId?, language?}` | Yes | Create conversation |
| PUT | `/api/chat/conversation/:id` | `{title?, language?, is_archived?}` | Yes | Update conversation |
| DELETE | `/api/chat/conversation/:id` | - | Yes | Delete conversation |
| POST | `/api/chat/message` | `{conversationId, role, content}` | Yes | Send message + get AI response |
| POST | `/api/chat/summary` | `{conversationIds: []}` | Yes | Generate summary |
| PUT | `/api/chat/conversation/:id/move` | `{folderId}` | Yes | Move to folder |

### 5.2 Skills Endpoints

| Method | Endpoint | Body | Auth | Purpose |
|--------|----------|------|------|---------|
| GET | `/api/skills` | - | Yes | Get user's skill progress |
| GET | `/api/skills/all` | - | Yes | Get all available skills |
| POST | `/api/skills` | `{title, category?, description?}` | Yes | Create/track skill |
| DELETE | `/api/skills/:id` | - | Yes | Untrack skill |
| DELETE | `/api/skills` | `{ids: []}` | Yes | Batch untrack |
| GET | `/api/skills/notifications` | - | Yes | Get XP notifications |

### 5.3 Projects Endpoints

| Method | Endpoint | Body | Auth | Purpose |
|--------|----------|------|------|---------|
| GET | `/api/projects/:userId` | - | Yes | Get user's projects |
| POST | `/api/projects` | `{title, ...}` | Yes | Create project |
| PUT | `/api/projects/:id` | `{...updates}` | Yes | Update project |
| DELETE | `/api/projects/:id` | - | Yes | Delete project |

### 5.4 Resources Endpoints

| Method | Endpoint | Body | Auth | Purpose |
|--------|----------|------|------|---------|
| GET | `/api/resources/:topicId` | - | Yes | Get topic resources |

---

## 6. Deployment

### 6.1 Railway GitHub Integration

- Push to `master` branch → Railway auto-builds and deploys
- **NO GitHub Actions needed** - Railway handles deployment

### 6.2 Configuration Files

| File | Purpose |
|------|---------|
| `Dockerfile` | Multi-stage container build (builder → prisma → runtime) |
| `railway.json` | Railway build/deploy config |
| `Railway.toml` | Railway service name |
| `VERSION` | Current version (updated before commit) |

### 6.3 Environment Variables

Required for production:
```
DATABASE_URL=file:/app/server/data/aris.db
JWT_SECRET=<64-char-random>
OPENAI_API_KEY=sk-...
PORT=8080
NODE_ENV=production
```

Optional:
```
GOOGLE_CLIENT_ID=<Google OAuth>
GOOGLE_CLIENT_SECRET=<Google OAuth>
GOOGLE_REDIRECT_URI=https://aris.tuyoisaza.com/api/auth/google/callback
FRONTEND_URL=https://aris.tuyoisaza.com
```

### 6.4 Dockerfile Entrypoint

```dockerfile
CMD ["sh", "-c", "npx prisma migrate deploy && node index.js"]
```

Railway runs migrations on each deploy.

---

## 7. Development Workflow

### 7.1 Commit Convention

**ALL commits MUST include version number:**

```
v0.0.X: <description>
```

Examples:
```
v0.0.40: Canonicalize API client - use api.ts, delete supabase.ts
v0.0.42: Fix 500 error - add language field to Conversation model
```

### 7.2 Version File

- Location: `VERSION` (root directory)
- Format: `0.0.X` (semver)
- Updated BEFORE each commit
- Displayed in UI (bottom-left badge)

### 7.3 Local Development

```bash
# 1. Install dependencies
npm install
cd server && npm install && cd ..

# 2. Setup environment
cp .env.example .env
# Edit .env with your values

# 3. Setup database
cd server && npx prisma migrate dev && cd ..

# 4. Start development
npm run dev
```

### 7.4 Making Schema Changes

When you need to modify the database schema:

```bash
# 1. Edit server/prisma/schema.prisma

# 2. Create migration (in server/prisma/migrations/)
cd server && npx prisma migrate dev --name describe_change

# 3. Test locally

# 4. Commit schema + migration files
git add server/prisma/schema.prisma server/prisma/migrations/
git commit -m "v0.0.X: Add/fix field to Model"

# 5. Push to deploy
git push
```

**Migration files in `server/prisma/migrations/` MUST be committed.**

---

## 8. Troubleshooting

### 8.1 HTTP Status Codes

| Code | Meaning | Common Causes |
|------|---------|---------------|
| 200 | Success | Normal response |
| 201 | Created | Resource created successfully |
| 400 | Bad Request | Validation failed (Zod schema) |
| 401 | Unauthorized | Token missing, expired, or invalid |
| 403 | Forbidden | ID mismatch (e.g., `userId !== req.user.id`) |
| 404 | Not Found | Resource doesn't exist |
| 500 | Server Error | Schema mismatch (missing DB field), unhandled exception |

### 8.2 Common Issues

| Issue | Cause | Fix |
|-------|-------|-----|
| `createConversation is not a function` | Using wrong API client | Use `api` from `src/services/api.ts` |
| `Request failed: 500` | Schema mismatch | Check Prisma schema matches API request |
| `Validation failed: UUID invalid` | Invalid UUID format | Ensure IDs are valid UUIDs |
| Version shows old number | Railway hasn't deployed | Push a commit or check Railway dashboard |
| 401 errors loop | Token corruption | Clear localStorage, logout/login |
| `Cannot read property of undefined` | Schema field missing | Add field to Prisma schema + migrate |

### 8.3 Debugging API Errors

Frontend console shows:
```
[API] createConversation error: {error: "Request failed: 500"}
```

Check Railway logs for server-side error details.

---

## 9. AI Agents Framework

### 9.1 Overview

ARIS uses a multi-agent orchestration framework where AI agents work together to provide a comprehensive learning experience. All agents are powered by OpenAI and managed through a unified system.

### 9.2 Agent System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    AGENT ORCHESTRATION                    │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌─────────────┐     ┌─────────────┐                   │
│  │ BaseAgent  │────▶│ Teacher     │  ← Main Chat     │
│  │ (abstract) │     │ Cartographer │    Conversations   │
│  └─────────────┘     │ Librarian   │                   │
│         │             │ Scout       │                   │
│         │             │ Thoth       │                   │
│         │             │ Ogma        │                   │
│         │             └─────────────┘                   │
│         │                                               │
│  ┌─────────────┐     ┌─────────────┐                   │
│  │ AgentService│────▶│ JobQueue    │  ← Event System │
│  │ (loading)  │     └─────────────┘                   │
│  └─────────────┘                                       │
│                                                          │
│  ┌─────────────────────────────────────────────────┐   │
│  │                    AGORA (Memory)                   │   │
│  │  Layer A: Stable State (user profile)           │   │
│  │  Layer B: User Memory (inferred traits)         │   │
│  │  Layer C: Session Context (short-term)          │   │
│  └─────────────────────────────────────────────────┘   │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### 9.3 Agents

| Agent | ID | Purpose | Trigger |
|-------|-----|---------|---------|
| **Teacher** | `teacher` | Main conversation agent, generates responses with 3 options | `POST /api/chat/message` |
| **Cartographer** | `cartographer` | Analyzes conversations, extracts topics | Every 4 messages |
| **Cartographer (Map)** | `cartographer_rel` | Maps topic relationships | On topic creation |
| **Librarian** | `librarian` | Enriches topics with content | After Cartographer |
| **Scout** | `scout` | Researches external resources | After Librarian |
| **Thoth** | `thoth` | Classifies topics into domains (KOS) | On topic detection |
| **Ogma** | `ogma` | Processes memory signals, infers traits | On milestone |

### 9.4 BaseAgent Class

Location: `server/services/ai/agents/BaseAgent.js`

All agents extend BaseAgent which provides:
- Prompt loading from database (cached)
- OpenAI integration
- JSON response parsing

```javascript
class BaseAgent {
    agentId: string
    model: string
    temperature: number
    
    async loadPrompt()    // Loads from SystemPrompt table
    async chat(messages) // Calls OpenAI
    async parse(raw)    // Parses JSON response
}
```

### 9.5 AgentService

Location: `server/services/ai/AgentService.js`

Central service for managing prompts:
- Loads prompts from `SystemPrompt` table
- Caches prompts for performance
- Provides update method for Admin dashboard

### 9.6 SystemPrompt Schema

Location: `server/prisma/schema.prisma`

```prisma
model SystemPrompt {
  id           String   @id @default(uuid())
  agentId     String   @unique  // 'teacher', 'cartographer', etc.
  name        String
  promptText  String   // Full system prompt
  model       String   @default("gpt-4o")
  temperature Float    @default(0.7)
  active      Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

### 9.7 TeacherAgent Response Format

The Teacher agent returns structured JSON:

```json
{
  "response": "Main conversational response text",
  "options": ["Option 1", "Option 2", "Option 3"],
  "action": {
    "type": "milestone|proposal|null",
    "payload": { ... }
  }
}
```

### 9.8 JobQueue Events

| Event | Trigger | Agents Called |
|-------|---------|---------------|
| `conversation_updated` | Every 4 messages | Cartographer |
| `topic_created` | On topic creation | Cartographer, Librarian |
| `content_enriched` | After enrichment | Scout |
| `milestone_triggered` | On milestone detection | Cartographer, Ogma |
| `ogma_checkpoint` | After milestones | Ogma |

### 9.9 Agora Memory System

Location: `server/services/cognition/`

Three-layer memory architecture:

| Layer | Table | Purpose |
|-------|-------|---------|
| **A: Stable State** | `agoraStableState` | Immutable user profile |
| **B: User Memory** | `agoraUserMemory` | Inferred traits |
| **C: Session Context** | `agoraSessionContext` | Short-term state |

### 9.10 Admin Dashboard Agents List

```typescript
const AGENTS = [
    { id: 'teacher', name: 'The Teacher' },
    { id: 'cartographer', name: 'The Cartographer (Chat)' },
    { id: 'cartographer_rel', name: 'The Cartographer (Map)' },
    { id: 'librarian', name: 'The Librarian' },
    { id: 'scout', name: 'The Scout' },
    { id: 'thoth', name: 'Thoth: The Organizer' },
    { id: 'daedalus', name: 'Daedalus: Project Architect' },
    { id: 'ogma', name: 'Ogma: Memory Keeper' },
    { id: 'lugh', name: 'Lugh: Skill Curriculum' },
    { id: 'skill', name: 'Skill Classifier' }
];
```

---

## 10. File Structure

```
C:\ARIS\
├── VERSION                    # Current version (e.g., 0.0.42)
├── Dockerfile                 # Multi-stage container build
├── railway.json              # Railway build config
├── Railway.toml              # Railway service name
├── .env.example             # Environment template
├── .gitignore               # Git ignore patterns
│
├── src/                     # Frontend
│   ├── main.tsx            # React bootstrap
│   ├── App.tsx             # Root component
│   ├── AppRoutes.tsx       # Route definitions
│   ├── context/
│   │   └── GlobalContext.tsx  # State management
│   ├── services/
│   │   ├── api.ts          # CANONICAL API CLIENT
│   │   └── api/            # API modules (auth, chat, skills, etc.)
│   ├── features/           # Page components
│   ├── components/         # Shared components
│   ├── hooks/              # Custom hooks
│   ├── utils/              # Utilities
│   ├── design-system.ts    # Design tokens
│   └── i18n.ts            # Internationalization
│
├── server/                  # Backend
│   ├── index.js           # Express entry point
│   ├── middleware.js       # Auth, validation (Zod), rate limiting
│   ├── db.js              # Prisma client
│   ├── routes/            # API route modules
│   │   ├── auth.js        # Authentication
│   │   ├── chat.js        # Conversations & messages
│   │   ├── skills.js      # Skills tracking
│   │   ├── projects.js    # User projects
│   │   ├── topics.js      # Learning topics
│   │   ├── families.js    # Family groups
│   │   ├── folders.js     # Chat folders
│   │   ├── resources.js   # Learning resources
│   │   ├── users.js       # User profile
│   │   ├── admin.js       # Admin operations
│   │   ├── billing.js     # Stripe (stubbed)
│   │   └── collaboration.js
│   ├── services/           # Business logic services
│   ├── websocket/
│   │   └── socketServer.js  # WebSocket singleton
│   ├── prisma/
│   │   ├── schema.prisma  # Database schema (SOURCE OF TRUTH)
│   │   ├── migrations/    # Migration files (COMMIT THESE)
│   │   │   └── YYYYMMDDHHMMSS_*/migration.sql
│   │   ├── auth.js       # JWT & password utilities
│   │   └── seed.js       # Database seeding
│   └── public/            # Built frontend (served statically)
│
└── docs/specs/
    └── SPEC.md            # This document
```

---

## 10. Key Conventions

### 10.1 Naming

| Type | Convention | Example |
|------|------------|---------|
| Files | kebab-case | `conversation-page.tsx` |
| Components | PascalCase | `ConversationPage.tsx` |
| Functions | camelCase | `createConversation()` |
| Constants | UPPER_SNAKE | `MAX_RETRIES` |
| Database | snake_case | `created_at`, `user_id` |
| API Fields | snake_case | `conversation_id` |
| Prisma | PascalCase | `Conversation`, `userId` |

### 10.2 API Conventions

1. **UUIDs for IDs**: All entity IDs are UUIDs (`@default(uuid())`)
2. **Timestamps**: Use `@default(now())` for `createdAt`
3. **Soft deletes**: Use `archived` boolean field, not hard deletes
4. **Error handling**: Use `try/catch` + `next(err)` pattern
5. **Authorization**: Always verify `userId === req.user.id`

### 10.3 Frontend Conventions

1. **API calls**: Always use `api` from `src/services/api.ts`
2. **State updates**: Use functional updates `setState(prev => ({...prev, key: value}))`
3. **Async operations**: Handle errors with `{ error: ... }` checks
4. **Imports**: Use absolute paths from `src/` when possible

---

## 11. Testing Checklist

Before deploying, verify:

- [ ] All API endpoints respond correctly (200/201)
- [ ] Authentication works (signup, login, logout)
- [ ] Chat creates conversations and persists messages
- [ ] Version badge shows correct number
- [ ] No console errors on page load
- [ ] Database migrations run successfully
- [ ] No 500 errors in Railway logs
