# ARIS Project Context

**Last Updated**: 2026-03-23
**Current Version**: 0.0.33
**Status**: Active development complete - All IA Standards features implemented

## Commit Message Convention

ALL commit messages MUST include the version number in the format:
```
v0.0.X: <description>
```

Example:
```
v0.0.30: Fix WebSocket import - use singleton instance instead of class
```

## Deployment

| Environment | URL |
|-------------|-----|
| Production | https://aris.tuyoisaza.com |
| Railway | https://aris-railway-production.up.railway.app |
| GitHub | https://github.com/tuyoisaza/aris-railway |

## Recent Changes

### v0.0.33
- Audit trail system: LOGIN_SUCCESS, LOGIN_FAILURE, SIGNUP events tracked

### v0.0.32
- Debug report copy function in admin panel

### v0.0.31
- Enable audit trail system

### v0.0.30
- Fix WebSocket import - use singleton instance instead of class

### v0.0.29
- Enable WebSocket server for real-time collaboration

### v0.0.28
- Add missing API methods to ApiClient class
- Fixes 'createConversation is not a function' error

### v0.0.27
- API method fixes

## Known Issues

1. **Custom domain routing**: Some API routes may fall through to frontend on custom domain
2. **Google OAuth**: Disabled on login page ("coming soon")
3. **Stripe**: Disabled (stubbed)

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
- **AI**: OpenAI API
- **Deployment**: Railway (monocontainer)
- **Auth**: JWT (custom implementation)
- **Real-time**: WebSocket (ws library)

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
