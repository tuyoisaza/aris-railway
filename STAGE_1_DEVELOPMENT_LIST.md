# ARIS - Stage 1 Development List

> **Generated:** 2026-01-16
> **Execution Mode:** Mode A — Tool-Enabled (real execution possible)

---

## Detected Stack Summary

| Layer | Technology | Version/Details |
|-------|-----------|-----------------|
| **Frontend Framework** | React | v19.2.0 |
| **Frontend Language** | TypeScript | v5.9.3 |
| **Build Tool** | Vite | v7.2.4 |
| **Routing** | react-router-dom | v7.11.0 |
| **UI Libraries** | lucide-react, framer-motion | Icons + Animations |
| **Backend Runtime** | Node.js | ESM modules |
| **Backend Framework** | Express | v4.18.2 |
| **Database** | Supabase (PostgreSQL) | @supabase/supabase-js v2.89.0 |
| **AI Provider** | OpenAI | v6.15.0 |
| **Payments** | Stripe | v14.14.0 |
| **Email** | Resend | v6.6.0 |
| **Mobile** | Capacitor | v8.0.0 (Android) |
| **i18n** | i18next | v25.7.3 |
| **Markdown** | react-markdown + remark-gfm | v10.1.0 |
| **Visualization** | D3 | v7.9.0 |

### Stack Continuity Declaration
This stack is **LOCKED**. All development must use these technologies without introducing alternatives.

---

## System Intent Analysis

**ARIS** is an AI-powered educational platform for families, featuring:

1. **Conversational AI Interface** - Multi-agent system with specialized agents (Teacher, Cartographer, Librarian, Daedalus, Scout, etc.)
2. **Learning Map** - Visual knowledge graph for topic discovery and progression
3. **Skills System** - Structured learning paths with milestones
4. **Project Management** - User projects with AI assistance
5. **Family Dashboard** - Parent oversight with activity feeds
6. **Admin Console** - Badge management, user management, system logs
7. **Multi-language Support** - i18next integration
8. **Theme Support** - Dark/Light themes with centralized design system

---

## Infrastructure Analysis

### Frontend Architecture
```
src/
├── App.tsx              # Root component with providers
├── AppRoutes.tsx        # Route definitions
├── context/             # GlobalContext (state management)
├── features/            # Feature modules (conversation, projects, admin, etc.)
├── services/            # API, AI, Supabase, Voice, Storage
├── styles/              # Theme CSS files
├── design-system.ts     # Centralized design tokens
└── i18n.ts              # Internationalization
```

### Backend Architecture
```
server/
├── index.js             # Express server entry
├── db.js                # Supabase clients (admin, anon, user)
├── middleware.js        # Auth, rate limiting
├── routes/              # 15 route files (auth, chat, projects, etc.)
├── services/            # Business logic + AI agents
│   └── ai/agents/       # 10 specialized AI agents
├── utils/logger.js      # Centralized logging utility
└── migrations/          # SQL migration files
```

### Existing Design System Compliance ✓
- Centralized tokens in `design-system.ts`
- CSS variables in `index.css`
- Theme files in `styles/theme-dark.css` and `styles/theme-light.css`

### Existing Logging System Compliance ✓
- Centralized logger in `server/utils/logger.js`
- Levels: NONE, ALERTS, LOG, VERBOSE
- All server logging uses `log()` function

---

## Feature Audit & Development Requirements

### 1. Core Conversation System
**Status:** Functional with recent fixes
**Files:** 
- `src/features/conversation/ConversationPage.tsx` (44KB)
- `server/routes/chat.js`
- `server/services/ConversationService.js`
- `server/services/ai/agents/TeacherAgent.js`

**Issues Identified:**
- [x] Raw JSON appearing in chat (FIXED - ConversationService.js now parses V2 JSON)
- [x] Loading spinner not appearing for guided conversations (VERIFIED WORKING)
- [x] V2 JSON parsing duplication (FIXED - extracted to messageParser.ts)

---

### 2. Learning Map
**Status:** Implemented
**Files:**
- `src/features/learning-map/LearningMap.tsx` (uses D3)
- `server/routes/topics.js`

**Requirements:**
- [ ] Verify graph node/edge data flow
- [ ] Validate user progress visualization

---

### 3. Skills System
**Status:** Implemented
**Files:**
- `src/features/skills/SkillsPage.tsx`
- `src/features/skills/SkillDetailPage.tsx`
- `server/routes/skills.js`
- `server/services/SkillService.js`

**Requirements:**
- [ ] Verify milestone tracking
- [ ] Validate content generation triggers

---

### 4. Projects Dashboard
**Status:** Implemented
**Files:**
- `src/features/projects/ProjectDashboard.tsx`
- `src/features/projects/ProjectDetail.tsx`
- `src/features/projects/ProjectProposalCard.tsx`
- `server/routes/projects.js`

**Requirements:**
- [ ] Verify project creation via AI proposal
- [ ] Validate project-conversation linking
- [ ] Test project deletion

---

### 5. Parent Dashboard
**Status:** Implemented
**Files:**
- `src/features/parent/ParentDashboard.tsx` (41KB)
- `src/features/parent/ActivityFeed.tsx`
- `server/routes/families.js`

**Requirements:**
- [ ] Verify family creation flow
- [ ] Validate PIN protection
- [ ] Test member management
- [ ] Test activity feed

---

### 6. Admin Console
**Status:** Implemented
**Files:**
- `src/features/admin/AdminDashboard.tsx` (30KB)
- `src/features/admin/BadgeManager.tsx`
- `server/routes/admin.js`

**Requirements:**
- [ ] Verify badge CRUD operations
- [ ] Validate topic management
- [ ] Test user management

---

### 7. Authentication System
**Status:** Implemented
**Files:**
- `src/features/auth/`
- `server/routes/auth.js`
- `server/middleware.js`

**Requirements:**
- [ ] Verify signup flow
- [ ] Validate session refresh
- [ ] Test password reset

---

### 8. Voice Integration
**Status:** Implemented
**Files:**
- `src/services/voice.ts`

**Requirements:**
- [ ] Verify speech recognition
- [ ] Test text-to-speech output
- [ ] Validate echo prevention

---

### 9. Billing (Stripe)
**Status:** Implemented
**Files:**
- `server/routes/billing.js`

**Requirements:**
- [ ] Verify subscription creation
- [ ] Test webhook handling
- [ ] Validate plan enforcement

---

### 10. AI Agent System
**Status:** Core implemented
**Files:**
- `server/services/ai/agents/BaseAgent.js`
- `server/services/ai/agents/TeacherAgent.js` (main conversational)
- `server/services/ai/agents/CartographerAgent.js` (topic discovery)
- `server/services/ai/agents/LibrarianAgent.js` (content generation)
- `server/services/ai/agents/DaedalusAgent.js` (project creation)
- `server/services/ai/agents/OgmaAgent.js`
- `server/services/ai/agents/ScoutAgent.js`
- `server/services/ai/agents/SkillAgent.js`
- `server/services/ai/agents/LughAgent.js`
- `server/services/ai/agents/ThothAgent.js`

**Requirements:**
- [ ] Verify agent orchestration
- [ ] Test tool calling and response parsing
- [ ] Validate milestone generation

---

## Prioritized Development Queue

Based on conversation history and system analysis, the following issues require immediate attention:

### HIGH PRIORITY ✅ COMPLETED
1. **Fix JSON Parsing in Guided Conversations** ✓
   - Fixed in `ConversationService._seedConversation()` - now parses V2 JSON before saving

2. **Fix Loading Spinner for Guided Conversations** ✓
   - Verified working - spinner shows on button during API call

3. **File Size Refactoring** ✓
   - `GlobalContext.tsx` (701 → 618 lines)
   - `ConversationPage.tsx` (854 → 728 lines)  
   - `ParentDashboard.tsx` (771 → 680 lines)
   - **Total: -300 lines removed**

### MEDIUM PRIORITY
4. **Verify All UI Elements Have Real Functionality**
   - Audit all buttons, forms, and interactive elements
   - Implement missing backend connections

5. **Test Family Invitation Flow**
   - Verify email sending
   - Test token validation
   - Confirm member addition

6. **Validate Topic Content Generation**
   - Test LibrarianAgent triggers
   - Verify content population

### LOW PRIORITY
7. **Mobile Build Verification**
   - Test Capacitor sync
   - Verify Android build

8. **Production Deployment**
   - Test Docker build
   - Verify Cloud Build pipeline

---

## Execution Checkpoints

| Phase | Status | Description |
|-------|--------|-------------|
| Stack Detection | ✅ Complete | Technology stack documented |
| System Analysis | ✅ Complete | Feature inventory complete |
| Issue Identification | ✅ Complete | Priority bugs identified |
| Development Queue | ✅ Complete | Ordered task list created |
| HIGH PRIORITY | ✅ Complete | JSON parsing, spinner, file refactoring |
| MEDIUM PRIORITY | 🔄 In Progress | Starting next items |

---

## Next Actions

1. Begin with HIGH PRIORITY items
2. Fix JSON parsing issue in ConversationService.js
3. Fix loading spinner state management
4. Refactor oversized files to comply with 600-line limit

---

*This artifact serves as the persistent development roadmap. Update status as items are completed.*
