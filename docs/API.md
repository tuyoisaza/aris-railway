# ARIS API Documentation

**Version**: 1.0.0  
**Base URL**: `https://aris.tuyoisaza.com`

---

## Table of Contents

1. [Health & Stats](#health--stats)
2. [Authentication](#authentication)
3. [Users](#users)
4. [Families](#families)
5. [Invitations](#invitations)
6. [Conversations & Chat](#conversations--chat)
7. [Folders](#folders)
8. [Topics](#topics)
9. [Resources](#resources)
10. [Projects](#projects)
11. [Skills](#skills)
12. [Collaboration](#collaboration)
13. [Admin - Badges](#admin---badges)
14. [Admin - Users](#admin---users)
15. [Admin - Feature Flags](#admin---feature-flags)
16. [Admin - Actions](#admin---actions)
17. [Admin - Audit Logs](#admin---audit-logs)

---

## Health & Stats

### GET /health

Get comprehensive system statistics.

**Authentication**: None required

**Response**:
```json
{
  "status": "ok",
  "timestamp": "2026-04-04T12:00:00.000Z",
  "uptime": 3600,
  "responseTime": 15,
  "database": "connected",
  "stats": {
    "users": {
      "total": 10,
      "admins": 2,
      "regular": 8,
      "withFamily": 5,
      "newToday": 1
    },
    "families": {
      "total": 3,
      "totalMembers": 8,
      "avgMembersPerFamily": 2.7
    },
    "conversations": {
      "total": 50,
      "archived": 10,
      "active": 40,
      "messages": 500,
      "messagesByRole": {
        "user": 250,
        "ai": 250
      },
      "avgMessagesPerConversation": 10,
      "newToday": 5
    },
    "folders": { "total": 15 },
    "topics": {
      "total": 30,
      "withResources": 15,
      "avgEngagement": 12.5,
      "progress": 45
    },
    "resources": { "total": 50 },
    "projects": {
      "total": 20,
      "active": 10,
      "completed": 5,
      "paused": 3,
      "idea": 2,
      "withArtifacts": 8
    },
    "skills": {
      "total": 25,
      "trackedByUsers": 40,
      "avgLevel": 2.5,
      "avgXp": 150
    },
    "badges": {
      "total": 10,
      "earned": 50,
      "uniqueUsersWithBadges": 20
    },
    "xpNotifications": {
      "total": 100,
      "unread": 15,
      "totalXpEarned": 5000
    },
    "collaborativeSessions": {
      "total": 10,
      "active": 2,
      "totalParticipants": 25
    },
    "sharedEntities": { "total": 15 },
    "invitations": {
      "total": 20,
      "pending": 5,
      "accepted": 15
    },
    "actions": {
      "total": 100,
      "byType": {
        "recommendation": 30,
        "project:propose": 20,
        "badge:award": 10,
        "collaboration:invite": 40
      }
    },
    "auditLogs": {
      "total": 200,
      "byAction": {
        "SIGNUP": 50,
        "LOGIN_SUCCESS": 100,
        "LOGIN_FAILURE": 50
      }
    },
    "activityLogs": { "total": 150 },
    "featureFlags": {
      "total": 5,
      "enabled": 3,
      "disabled": 2
    },
    "presence": {
      "online": 5,
      "offline": 5,
      "away": 2
    }
  }
}
```

---

## Authentication

### POST /api/auth/signup

Register a new user.

**Authentication**: None

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "securepassword",
  "name": "User Name"
}
```

**Response** (201):
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "User Name",
    "role": "user",
    "plan": "free"
  },
  "session": {
    "access_token": "jwt-token",
    "user": { "id": "uuid", "email": "...", "name": "..." }
  }
}
```

---

### POST /api/auth/login

Login with email and password.

**Authentication**: None

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "securepassword"
}
```

**Response** (200):
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "User Name",
    "role": "user",
    "plan": "free",
    "avatar": null
  },
  "session": {
    "access_token": "jwt-token",
    "user": { "id": "uuid", "email": "...", "name": "..." }
  }
}
```

---

### GET /api/auth/google

Get Google OAuth URL.

**Response** (200):
```json
{
  "url": "https://accounts.google.com/o/oauth2/v2/auth?..."
}
```

---

## Users

### GET /api/users/profile

Get current user profile.

**Authentication**: Required (Bearer token)

---

## Families

### POST /api/families

Create a new family.

**Authentication**: Required

**Request Body**:
```json
{
  "name": "Family Name"
}
```

**Response** (200):
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Family Name",
    "createdAt": "2026-04-04T12:00:00.000Z"
  }
}
```

---

### GET /api/families/:userId

Get user's family.

**Authentication**: Required

---

### PUT /api/families/:id

Update family.

**Authentication**: Required

**Request Body**:
```json
{
  "name": "New Family Name",
  "pin": "1234"
}
```

---

### GET /api/families/:familyId/activity

Get family activity.

**Authentication**: Required

**Response**:
```json
{
  "success": true,
  "data": {
    "family": { "id": "uuid", "name": "...", "members": [...] },
    "members": [...],
    "recentEvents": [...],
    "stats": {
      "totalMembers": 5,
      "activeMembers": 3,
      "totalSessions": 10
    }
  }
}
```

---

### GET /api/families/:familyId/members

Get family members.

**Authentication**: Required

---

### DELETE /api/families/members/:memberId

Remove a family member.

**Authentication**: Required

---

## Invitations

### POST /api/invites

Create an invitation.

**Authentication**: Required

**Request Body**:
```json
{
  "familyId": "uuid",
  "email": "invitee@example.com"
}
```

---

### GET /api/invites/:familyId

Get family invitations.

**Authentication**: Required

---

### POST /api/invites/:token/accept

Accept an invitation.

**Authentication**: Required

**Response**:
```json
{
  "success": true,
  "familyName": "Family Name"
}
```

---

### DELETE /api/invites/:id

Delete an invitation.

**Authentication**: Required

---

## Conversations & Chat

### GET /api/chat/folders/:userId

Get user's conversations.

**Authentication**: Required

---

### POST /api/chat/conversation

Create a new conversation.

**Authentication**: Required

**Request Body**:
```json
{
  "userId": "uuid",
  "title": "Conversation Title",
  "topicId": "uuid (optional)",
  "language": "en"
}
```

---

### PUT /api/chat/conversation/:id

Update conversation.

**Authentication**: Required

**Request Body**:
```json
{
  "title": "New Title",
  "language": "es",
  "is_archived": true
}
```

---

### DELETE /api/chat/conversation/:id

Delete conversation.

**Authentication**: Required

---

### POST /api/chat/message

Send a message (triggers AI response).

**Authentication**: Required

**Request Body**:
```json
{
  "conversationId": "uuid",
  "role": "user",
  "content": "User message"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "userMessage": { "id": "uuid", "role": "user", "content": "..." },
    "aiMessage": { "id": "uuid", "role": "ai", "content": "..." },
    "messages": [...]
  }
}
```

---

### POST /api/chat/summary

Summarize conversations.

**Authentication**: Required

**Request Body**:
```json
{
  "conversationIds": ["uuid1", "uuid2"]
}
```

---

### PUT /api/chat/conversation/:id/move

Move conversation to folder.

**Authentication**: Required

**Request Body**:
```json
{
  "folderId": "uuid"
}
```

---

## Folders

### GET /api/folders

Get user's folders.

**Authentication**: Required

---

### POST /api/folders

Create a folder.

**Authentication**: Required

**Request Body**:
```json
{
  "title": "Folder Name",
  "parentId": "uuid (optional)"
}
```

---

### PUT /api/folders/:id

Update folder.

**Authentication**: Required

**Request Body**:
```json
{
  "title": "New Folder Name"
}
```

---

### DELETE /api/folders/:id

Delete folder.

**Authentication**: Required

---

## Topics

### GET /api/topics

Get all topics.

**Authentication**: Required

---

### GET /api/topics/graph

Get topics graph (nodes + edges).

**Authentication**: Required

---

### GET /api/topics/:id

Get topic details.

**Authentication**: Required

---

### POST /api/topics

Create a topic.

**Authentication**: Required

**Request Body**:
```json
{
  "title": "Topic Title",
  "category": "Programming",
  "description": "Topic description",
  "content": "Topic content",
  "instruction": "Topic instruction",
  "depth": 1,
  "maxDepth": 7
}
```

---

### DELETE /api/topics/:id

Delete topic.

**Authentication**: Required

---

### GET /api/topics/progress/:userId

Get user's topic progress.

**Authentication**: Required

---

## Resources

### GET /api/resources/:topicId

Get resources for a topic.

**Authentication**: Required

---

## Projects

### GET /api/projects/:userId

Get user's projects.

**Authentication**: Required

---

### POST /api/projects

Create a project.

**Authentication**: Required

**Request Body**:
```json
{
  "title": "Project Title",
  "whyText": "Why this project?",
  "scopeText": "Scope description",
  "originTopicId": "uuid (optional)"
}
```

---

### PUT /api/projects/:id

Update project.

**Authentication**: Required

**Request Body**:
```json
{
  "title": "New Title",
  "status": "completed",
  "whyText": "...",
  "scopeText": "..."
}
```

---

### DELETE /api/projects/:id

Delete project.

**Authentication**: Required

---

## Skills

### GET /api/skills/notifications

Get XP notifications.

**Authentication**: Required

---

### GET /api/skills

Get user's skill progress.

**Authentication**: Required

---

### GET /api/skills/all

Get all available skills.

**Authentication**: Required

---

### POST /api/skills

Track a new skill.

**Authentication**: Required

**Request Body**:
```json
{
  "title": "JavaScript",
  "category": "Programming",
  "description": "Skill description"
}
```

---

### DELETE /api/skills/:id

Delete skill progress.

**Authentication**: Required

---

### DELETE /api/skills

Delete multiple skill progress.

**Authentication**: Required

**Request Body**:
```json
{
  "ids": ["uuid1", "uuid2"]
}
```

---

## Collaboration

### GET /api/collaboration/sessions

Get collaborative sessions.

**Authentication**: Required

---

## Admin - Badges

### GET /api/admin/badges

Get all badges.

**Authentication**: Required (Admin)

---

### POST /api/admin/badges

Create a badge.

**Authentication**: Required (Admin)

**Request Body**:
```json
{
  "name": "Badge Name",
  "description": "Badge description",
  "icon": "🏆",
  "xpReward": 100,
  "category": "milestone",
  "criteria": "criteria expression",
  "active": true
}
```

---

### PUT /api/admin/badges/:id

Update a badge.

**Authentication**: Required (Admin)

---

### DELETE /api/admin/badges/:id

Delete a badge.

**Authentication**: Required (Admin)

---

## Admin - Users

### GET /api/admin/users

Get all users.

**Authentication**: Required (Admin)

---

### POST /api/admin/users

Create a user.

**Authentication**: Required (Admin)

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "password",
  "name": "User Name",
  "plan": "free",
  "role": "user"
}
```

---

### PUT /api/admin/users/:id

Update a user.

**Authentication**: Required (Admin)

**Request Body**:
```json
{
  "name": "New Name",
  "plan": "pro",
  "role": "admin",
  "password": "newpassword"
}
```

---

### DELETE /api/admin/users/:id

Delete a user.

**Authentication**: Required (Admin)

---

### POST /api/admin/users/:id/reset-password

Reset user password.

**Authentication**: Required (Admin)

---

## Admin - Feature Flags

### GET /api/admin/featureflags

Get all feature flags.

**Authentication**: Required (Admin)

---

### GET /api/admin/featureflags/check/:name

Check if a feature flag is enabled.

**Authentication**: Required

**Response**:
```json
{
  "success": true,
  "data": {
    "enabled": true,
    "flag": { "name": "new_dashboard", "enabled": true }
  }
}
```

---

### POST /api/admin/featureflags

Create a feature flag.

**Authentication**: Required (Admin)

**Request Body**:
```json
{
  "name": "new_feature",
  "description": "Description",
  "scope": "GLOBAL",
  "enabled": false,
  "tenantId": "uuid (optional)",
  "userId": "uuid (optional)",
  "expiresAt": "2026-12-31T23:59:59.000Z",
  "reviewDate": "2026-06-01T00:00:00.000Z",
  "metadata": "{}"
}
```

---

### PUT /api/admin/featureflags/:id

Update a feature flag.

**Authentication**: Required (Admin)

---

### DELETE /api/admin/featureflags/:id

Delete a feature flag.

**Authentication**: Required (Admin)

---

## Admin - Actions

### GET /api/admin/actions

Get recent actions.

**Authentication**: Required (Admin)

---

### GET /api/admin/actions/activity

Get activity logs.

**Authentication**: Required (Admin)

---

## Admin - Audit Logs

### GET /api/admin/audit

Get audit logs with pagination.

**Authentication**: Required (Admin)

**Query Parameters**:
- `page` (default: 1)
- `limit` (default: 50)
- `userId` (filter by user)
- `action` (filter by action type)
- `startDate` (filter by date range)
- `endDate` (filter by date range)

**Response**:
```json
{
  "success": true,
  "data": {
    "data": [...],
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 200,
      "pages": 4
    }
  }
}
```

---

### GET /api/admin/audit/actions

Get distinct action types.

**Authentication**: Required (Admin)

---

### GET /api/admin/audit/:id

Get a specific audit log entry.

**Authentication**: Required (Admin)

---

## Action Types

The following action types are tracked:

| Action Type | Category | Description |
|------------|----------|-------------|
| `recommendation` | light | AI recommendations |
| `project:propose` | heavy | Project proposals |
| `badge:award` | heavy | Badge awards |
| `collaboration:invite` | medium | Family invites |
| `collaboration:session_start` | heavy | Session starts |
| `family:goal_set` | medium | Family goals |
| `shared_entity:create` | light | Entity sharing |
| `family:challenge_create` | medium | Family challenges |
| `skill:family_progress` | light | Skill progress |

---

## Audit Log Action Types

| Action | Description |
|--------|-------------|
| `SIGNUP` | User registration |
| `LOGIN_SUCCESS` | Successful login |
| `LOGIN_FAILURE` | Failed login |

---

## Error Responses

All endpoints may return:

**401 Unauthorized**:
```json
{
  "success": false,
  "error": "Unauthorized"
}
```

**403 Forbidden**:
```json
{
  "success": false,
  "error": "Admin access required"
}
```

**404 Not Found**:
```json
{
  "success": false,
  "error": "Resource not found"
}
```

**500 Internal Server Error**:
```json
{
  "success": false,
  "error": "Internal server error"
}
```

---

## Authentication

Most endpoints require authentication via Bearer token:

```
Authorization: Bearer <access_token>
```

The token is obtained from `/api/auth/login` or `/api/auth/signup`.

Admin endpoints require either:
- `role: "admin"` OR
- `plan: "pro"`

---

## Web Research

### POST /api/research/research

Perform web research on a topic and get a summarized response with sources.

**Authentication**: Required

**Request Body**:
```json
{
  "query": "quantum computing basics"
}
```

**Response** (200):
```json
{
  "success": true,
  "data": {
    "query": "quantum computing basics",
    "summary": "Quantum computing is an advanced computational paradigm...",
    "sources": [
      {
        "title": "Quantum computing",
        "url": "https://en.wikipedia.org/wiki/Quantum_computing",
        "snippet": "A quantum computer is a computer that exploits..."
      }
    ]
  }
}
```

### GET /api/research/search?q=query

Same as POST, but uses query parameter.

**Authentication**: Required

**Query Parameters**:
- `q` (required): Search query
