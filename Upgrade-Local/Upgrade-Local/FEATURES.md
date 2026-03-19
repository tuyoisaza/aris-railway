# Features Registry

## 1. Core Systems
### Authentication
- **Status**: Stable
- **Description**: Secure access using Supabase Auth (Google OAuth) + Custom Dev Mocks.
- **Components**: `AuthContext.tsx`, `Login.tsx`, `verifyAuth` (middleware).
- **Test**: Login as "Free User" (Debug) or Google Account.

### System Settings
- **Status**: Stable
- **Description**: Global configuration including Debug Mode context.
- **Components**: `GlobalContext.tsx`, `/api/settings`.
- **Test**: Toggle "Debug Mode" in Admin, verify UI indicators appear.

### Dashboard
- **Status**: Verified
- **Description**: Central user hub displaying diagnostic progress and quick stats.
- **Components**: `Dashboard.tsx`, `/api/user` (Profile/Progress).
- **Test**: Verify "Self Diagnostics" cards populate with real data/scores.

## 2. Learning Experience
### Pensum (Curriculum Map)
- **Status**: Stable
- **Description**: Interactive visualization of the 3 Axes (Human, Leadership, Co-creation).
- **Components**: `Pensum.tsx`, `/api/pensum`.
- **Test**: Navigate to `/pensum`, expand categories, click a course to view details.

### Course Player & AI Synthesis
- **Status**: Beta
- **Description**: Dynamic content delivery system. If a lesson is missing, the "Architect" AI synthesizes it on-the-fly.
- **Components**: `CoursePlayer.tsx`, `/api/user/course/:id/step/:index`.
- **Features**: Markdown rendering, Micro-Practice extraction, Project kickoff.
- **Test**: Open a course step. If empty, click "Generate". Verify content streams in.

### Decision Journal
- **Status**: Stable
- **Description**: Tool for users to log decisions, context, and expected outcomes for later review.
- **Components**: `Journal.tsx`, `/api/user/journal`.
- **Test**: Create a new journal entry. Verify it appears in history.

## 3. Public & Marketing
### Landing Page
- **Status**: Stable
- **Description**: Public home page with value proposition.
- **Components**: `Landing.tsx`.

### Pricing & Subscriptions
- **Status**: Connected
- **Description**: Tiered access (Explorer, Builder, Teams) integrated with Stripe.
- **Components**: `Pricing.jsx`, `/api/create-checkout-session`.
- **Test**: Click "Subscribe" on Builder plan (triggers Stripe Checkout).

## 4. Admin Command Center
### Overview
- **Status**: Verified
- **Description**: Hub for all management tools.
- **Components**: `Admin.tsx`, `AdminNav.tsx`.
- **Access**: Requires `is_super_admin` or specific email whitelist.

### Content Management
- **Course Manager**: Create/Edit courses, syllabi, and use AI to generate drafts. (`AdminCourses.tsx`)
- **Question Manager**: Manage diagnostic questions (CRUD) for the 3 Axes. (`AdminQuestions.tsx`)
- **Mentor Manager**: Configure AI mentor personas displayed in courses. (`AdminMentors.tsx`)

### System Intelligence
- **Agent Manager**: Configure system prompts and models (GPT-4o) for different AI agents. (`AdminAgents.tsx`)
- **Test Console**: Chat directly with configured agents to validate prompts.

### User Management
- **Users List**: View users, roles, and subscription status. (`AdminUsers.tsx`)
