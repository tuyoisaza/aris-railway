# Phase 2: Idea to Business Master Plan

**Goal**: Transform "Upgrade" from a static demo into a monetizable, secure-by-default SaaS.

## 1. Core Functionality (Supabase)

### A. Database Migration (The "Truth")
The huge `js/data.js` file is technical debt. It simulates a database.
*   **Action**: Migrate all data to PostgreSQL.
    *   `translations` -> table `translations` (lang, key, value)
    *   `mentorsData` -> table `mentors`
    *   `pensum` -> tables `axes`, `categories`, `courses`
    *   `levelingTest` -> table `questions`, `options`
*   **Security**: Enable RLS on ALL tables.
    *   Public Content (`mentors`, `pensum`, `translations`): `SELECT` for everyone (anon).
    *   User Data (`profiles`, `progress`, `subscriptions`): `SELECT/UPDATE` only for `auth.uid()`.

### B. Authentication & Identity
*   **Current State**: Basic email/password implemented in Phase 0.
*   **Upgrade**:
    *   Enforce Email Verification (Production default).
    *   Profile Creation Trigger: Use Supabase Database Trigger to automatically create a row in `public.profiles` upon `auth.users` insertion. This prevents race conditions.

### C. The "Deep Link" Invite System (Viral Loop)
User requirement mentions "Invites and Deep Linking".
*   **Implementation**:
    *   Table `invites`: `code` (PK), `inviter_id` (FK), `uses_remaining`, `expires_at`.
    *   Functionality: When a user signs up with a code, track the referral.

## 2. Monetization (Stripe)

### A. Product Model
*   **Builder Plan**: $49/month.
*   **Explorer Plan**: Free.

### B. Checkout Integration
1.  **Frontend**: "Upgrade" button triggers `POST /api/create-checkout-session`.
2.  **Backend**:
    *   Creates Stripe Session with `client_reference_id = user.id`.
    *   Returns `url` to redirect.
3.  **Webhook (`checkout.session.completed` & `invoice.payment_succeeded`)**:
    *   Verify signature with `STRIPE_WEBHOOK_SECRET`.
    *   Upsert into `subscriptions` table: `user_id`, `stripe_sub_id`, `status` ('active'), `current_period_end`.

### C. Access Control (Gating)
*   **Middleware**: Check `subscriptions` table for `status = 'active'` before serving premium content routes (e.g., individual course details beyond the first one).
*   **Frontend**: Show/Hide "Locked" UI based on subscription status.

## 3. Cybersecurity & Abuse Prevention

### A. Threat Model & Defenses
1.  **Billing Abuse**: User paying $0 or using fake cards. -> **Defense**: Rely strictly on Stripe Webhooks execution (Server-to-Server), never frontend success signals.
2.  **IDOR (Insecure Direct Object References)**: User accessing another's progress. -> **Defense**: RLS `WHERE user_id = auth.uid()`.
3.  **Injection**: -> **Defense**: Use Supabase/Postgres parameterized queries (default in JS SDK) and standard ORM patterns.

### B. Input Validation
*   Use `zod` or manual validation for all API inputs (e.g., test scores must be numbers, journal entries must be strings).

## 4. User Support & UX

*   **Onboarding**: First login -> "Welcome to Upgrade" modal -> "Take the Leveling Test".
*   **Help**: A simple FAQ page explaining "How to cancel", "How to contact mentors".

## 5. Deployment & Operations

### A. Docker Production Build
*   **Multi-stage**:
    1.  `build` stage: `npm run build` (Vite) -> `dist/` folder.
    2.  `production` stage: Node 18 Alpine. Serves `dist/` static files and runs API on `/api`.
*   **Security**: Non-root user in Docker.

### B. Cloud Run
*   **Env Vars**: Injected at runtime.
*   **Scaling**: Min instances 0 (cost saving) or 1 (performance), Max 10.

---

## Execution Application (Phase 3 Plan)

1.  **Database**: Run `schema.sql` (enhanced) and seeds.
2.  **Backend Logic**: Implement `create-checkout-session` and `webhook` handler.
3.  **Frontend Logic**: Replace `data.js` imports with `API.get...`. Build "Locked" views.
4.  **Verification**: Test full flow (Sign up -> Pay -> Unlock).
