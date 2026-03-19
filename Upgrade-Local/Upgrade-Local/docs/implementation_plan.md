# Phase 3: Business Logic Execution Plan

**Status:** ACTIVE
**Mode:** EXECUTION (Autonomous)

## Goal
Wire the "UI Truth" to the new "Schema Truth". Transform specific "Missing Features" into working code.

---

## Execution Queue

### 1. Database Seeding & Verification (The "Reality" Layer)
*   [ ] **Create Seeder Script**: `scripts/seed_full.js`.
    *   Clear existing data (optional/safe mode).
    *   Insert `axes` (Human, Leadership, Co-creation).
    *   Insert `categories` & `courses` (from `js/data.js` or inferred Pensum).
    *   Insert `mentors` (Tuyo, Juan, Camilo, Andres).
    *   Insert `questions` (The "Leveling Test" questions).
*   [ ] **Execute Seeder**: Run `node scripts/seed_full.js`.
*   [ ] **Verify**: Check `GET /api/pensum` and `GET /api/mentors` return data.

### 2. Backend API Implementation (The "Wiring" Layer)
*   [ ] **Fix `GET /api/tests`**:
    *   Update `server/routes/api.js`.
    *   Logic: Fetch `questions` joined with `axes`. Return structured test object.
*   [ ] **Fix `dashboard.js`**:
    *   Implement `renderProgress()`: Fetch `user_tests`, calculate % per axis.
    *   Implement `renderCoursesList()`: Fetch `courses` + status.
*   [ ] **Fix Journal**:
    *   Ensure `GET /api/user` returns journal entries correctly.
    *   Verify `POST /api/user/journal` works with RLS.

### 3. Monetization & Subscriptions
*   [ ] **Stripe Webhook**:
    *   Update `server/index.js` (or `stripe.js`) webhook handler.
    *   Ensure `checkout.session.completed` updates `public.subscriptions` AND `public.profiles.subscription_status`.
*   [ ] **Frontend Gating**:
    *   Update `course.js`: reading `is_premium` from course data.
    *   Redirect to `#pricing` if user is `free` and course is `premium`.

### 4. Security & DevOps
*   [ ] **Environment Audit**: Final check of keys in `server/config.js` or `process.env`.
*   [ ] **RLS Verification**: Run `scripts/verify_backend.js` (updated) to ensure one user cannot read another's journal.

---

## Auto-Execution Protocol
I will now proceed to **Step 1: Database Seeding**.
No further permission will be requested until a critical failure or completion.
