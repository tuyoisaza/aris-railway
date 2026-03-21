# ARIS Project Context

**Last Updated**: 2026-03-21
**Current Version**: 0.0.11
**Status**: Active development - Supabase to Prisma migration complete

## Deployment

| Environment | URL |
|-------------|-----|
| Production | https://aris.tuyoisaza.com |
| Railway | https://aris-railway-production.up.railway.app |
| GitHub | https://github.com/tuyoisaza/aris-railway |

## Current Goal

Deploy ARIS to Railway as a monocontainer, migrating from Google Cloud Run + Supabase to self-hosted Prisma + SQLite backend.

## Recent Changes (v0.0.6 - v0.0.11)

### v0.0.11
- Fixed skills API imports from base-client
- Skills page now uses api module

### v0.0.10
- Migrated remaining services from Supabase to Prisma:
  - middleware.js (auth)
  - ConversationService.js
  - ActionRegistry.js (collaboration actions)
  - PresenceService.js
  - ExperienceListener.js
- SkillsPage.tsx uses api module
- Cleaned up .env files

### v0.0.9
- Fixed catch-all route registration order
- Routes now load before server starts listening

### v0.0.8
- Fixed logger import path

### v0.0.7
- Fixed route loading before server starts

### v0.0.6
- Full backend migration to Prisma/SQLite
- Created all route files using Prisma

## Known Issues

1. **Custom domain routing**: Some API routes may fall through to frontend on custom domain
2. **Google OAuth**: Disabled on login page ("coming soon")
3. **Stripe**: Disabled (stubbed)
4. **Legacy scripts**: server/scripts/ still contain Supabase references (not deployed)

## Environment Variables (Railway)

```
DATABASE_URL=file:/app/server/data/aris.db
JWT_SECRET=<64-char secret>
OPENAI_API_KEY=<new key after rotation>
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
- **AI**: OpenAI API
- **Deployment**: Railway (monocontainer)
- **Auth**: JWT (custom implementation)

## Next Steps

1. Test full authentication flow
2. Complete Google OAuth integration
3. Test frontend features with new API
4. Verify all Supabase references removed from deployed code

## Support Copy Feature

The version badge in top-left corner has a copy button that captures:
- Version number
- Domain and URL
- Console logs
- Timestamp

Used for bug reporting and support.
