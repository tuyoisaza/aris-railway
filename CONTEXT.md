# ARIS Project Context

**Last Updated**: 2026-04-04
**Current Version**: 0.0.107
**Status**: All systems operational - Badge system working

## Commit Message Convention

ALL commit messages MUST include the version number in the format:
```
v0.0.X: <description>
```

Example:
```
v0.0.107: Remove debug logging from listeners
```

## Deployment

| Environment | URL |
|-------------|-----|
| Production | https://aris.tuyoisaza.com |
| Railway | https://aris-railway-production.up.railway.app |
| GitHub | https://github.com/tuyoisaza/aris-railway |

## Current Stats

- **Users**: 2
- **Conversations**: 12
- **Messages**: 74
- **Badges**: 4 total, 2 earned

## Recent Changes

### v0.0.107 (2026-04-04)
- Remove debug logging from listeners

### v0.0.106 (2026-04-04)
- Fix TableQuery - convert camelCase to snake_case for Prisma

### v0.0.105 (2026-04-04)
- Fix BadgeService Prisma field names (snake_case to camelCase)

### v0.0.104 (2026-04-04)
- Fix socketServer import path in ExperienceListener

### v0.0.102 (2026-04-04)
- Set authorId on user messages for badge tracking

### v0.0.101 (2026-04-04)
- Emit AI_RESPONSE_COMPLETED event from chat.js for badge/milestone processing

## Event System

The Cognition/Gamification event system is now fully operational:
- **EventManager**: Central event emitter in `server/services/cognition/EventManager.js`
- **CognitionListener**: Handles milestones and proposals from AI responses
- **GamificationListener**: Evaluates and awards badges
- **ExperienceListener**: Handles XP awards

Events flow:
1. User sends chat message → `chat.js`
2. AI responds → `TeacherAgent`
3. Message saved → `EventManager.emitEvent('AI_RESPONSE_COMPLETED')`
4. Listeners process → badges evaluated, milestones checked

## Known Issues

1. **Google OAuth**: Disabled on login page ("coming soon")
2. **Stripe**: Disabled (stubbed)
3. **GitHub Actions Railway deploy**: Failing (token issue) - Railway auto-deploys on push anyway

## Environment Variables (Railway)

```
DATABASE_URL=file:/app/server/data/aris.db
JWT_SECRET=<64-char secret>
OPENAI_API_KEY=<key>
GOOGLE_CLIENT_ID=<Google Cloud Console>
GOOGLE_CLIENT_SECRET=<Google Cloud Console>
GOOGLE_REDIRECT_URI=https://aris.tuyoisaza.com/api/auth/google/callback
FRONTEND_URL=https://aris.tuyoisaza.com
PORT=8080
NODE_ENV=production
```

## Tech Stack

- **Frontend**: React 19, Vite, TypeScript, Framer Motion
- **Backend**: Express.js, Prisma 5.22.0, SQLite
- **AI**: OpenAI API (GPT-4o, GPT-4o-mini)
- **Deployment**: Railway (monocontainer with volume)
- **Auth**: JWT (custom implementation)
- **Real-time**: WebSocket (ws library)

## AI Agents

1. **TeacherAgent** - Main conversation agent
2. **CartographerAgent** - Topic mapping/structuring
3. **CartographerRelationships** - Relationship mapping
4. **LibrarianAgent** - Content enrichment
5. **ScoutAgent** - Research agent
6. **ThothAgent** - Organization agent
7. **DaedalusAgent** - Project architecture
8. **OgmaAgent** - Memory keeper
9. **LughAgent** - Skill curriculum
10. **SkillAgent** - Skill classification

## Support Copy Feature

The version badge in top-left corner has a copy button that captures:
- Version number
- Domain and URL
- Console logs
- Timestamp

Admin Debug panel (`/admin/debug`) has "Copy Debug Report" button with:
- Project info, user context, locale/timezone
- Recent errors and logs (sanitized)
- JSON export for structured data

Used for bug reporting and support.
