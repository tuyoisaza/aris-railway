# ARIS Project Context

**Last Updated**: 2026-04-05
**Current Version**: 0.0.121
**Status**: Guided Actions system implemented

## Commit Message Convention

ALL commit messages MUST include the version number in the format:
```
v0.0.X: <description>
```

Example:
```
v0.0.121: Add frontend GuidedActionCard and WebSocket listener
```

## Deployment

| Environment | URL |
|-------------|-----|
| Production | https://aris.tuyoisaza.com |
| Railway | https://aris-railway-production.up.railway.app |
| GitHub | https://github.com/tuyoisaza/aris-railway |

## Guided Actions System

The Guided Actions system enables AI agents to proactively suggest topics, projects, skills, and conversations during chat.

### Flow
1. User sends message → TeacherAgent responds with JSON including `action` field
2. CognitionListener detects `action.type` in `['topic', 'project', 'skill', 'conversation']`
3. `GUIDED_ACTION_SUGGESTED` event emitted via EventManager
4. Frontend receives via WebSocket, displays GuidedActionCard
5. User accepts → POST `/api/agora/action` → handler creates entity

### Files
- `server/routes/agora-actions.js` - Action handlers (topic/project/skill/conversation)
- `server/routes/agora.js` - `/agora/action` and `/agora/actions` routes
- `server/services/cognition/listeners/CognitionListener.js` - Detects guided actions
- `server/services/cognition/EventManager.js` - GUIDED_ACTION_SUGGESTED event
- `src/features/guided-actions/GuidedActionCard.tsx` - UI card component
- `src/features/conversation/ConversationPage.tsx` - WebSocket listener

### Update Prompt
Run `node server/scripts/update-teacher-prompt.js` to update the teacher prompt in the database.

## Event System

The Cognition/Gamification event system is now fully operational:
- **EventManager**: Central event emitter in `server/services/cognition/EventManager.js`
- **CognitionListener**: Handles milestones, proposals, and guided actions
- **GamificationListener**: Evaluates and awards badges
- **ExperienceListener**: Handles XP awards

## Recent Changes

### v0.0.121 (2026-04-05)
- Add frontend GuidedActionCard and WebSocket listener

### v0.0.120 (2026-04-05)
- Implement Guided Actions system - Agora actions, topic/project/skill/conversation handlers

### v0.0.119 (2026-04-04)
- Add research action to ActionRegistry and CognitionListener

## Known Issues

1. **Google OAuth**: Disabled on login page ("coming soon")
2. **Stripe**: Disabled (stubbed)

## Tech Stack

- **Frontend**: React 19, Vite, TypeScript, Framer Motion
- **Backend**: Express.js, Prisma 5.22.0, SQLite
- **AI**: OpenAI API (GPT-4o, GPT-4o-mini)
- **Deployment**: Railway (monocontainer with volume)
- **Auth**: JWT (custom implementation)
- **Real-time**: WebSocket (ws library)

## AI Agents

1. **TeacherAgent** - Main conversation agent (supports guided actions)
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
