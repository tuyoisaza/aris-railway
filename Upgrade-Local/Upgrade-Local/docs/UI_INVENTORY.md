# Phase 1: UI Inventory & Reality Check

**Date:** 2025-12-28
**Status:** In Progress
**Mode:** ANALYSIS (Read-Only)

---

## 1. UI Inventory Table

| Component | Location | Visual State | Implied Business Intent | Backend Reality | Gap / Risk |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Hero CTA** | `index.html` | "Explorar el Upgrade" | Check Auth -> Go to Pensum or Login | `js/app.js` Logic exists | ✅ Wired |
| **Mentors** | `index.html` | Grid of 4 Mentors (Images + roles) | Dynamic list of mentors from DB | `GET /api/mentors` calls `supabase.from('mentors')` | Schema needed for `mentors` table (imgs, names) |
| **Pricing** | `index.html` | 3 Tiers (Builder, Practitioner, Teams) | Create Stripe Checkout Session | `POST /api/create-checkout-session` exists | ✅ Wired to Stripe (Env vars checked) |
| **Auth** | `index.html` | Login/Register Modals (Email/Google) | Supabase Auth (Email + OAuth) | `js/auth.js` uses Supabase Client | ✅ Functional |
| **Dashboard** | `dashboard.html` | "Bienvenido [User]" | Personalized User Home | `GET /api/user` fetches Profile | ✅ Wired |
| **Tests** | `dashboard.html` | 3 Cards (Human, Leadership, Co-creation) | User takes diagnostic test, gets score/level | **BROKEN:** `GET /api/tests` returns `[]`. `dashboard.js` crashes on empty test. | 🔴 **CRITICAL FAIL** (No content) |
| **Progress** | `dashboard.html` | "Mi Progreso" Tab | Visual bars of course completion | **MISSING:** `renderProgress` function not found in `js/dashboard.js`. | 🔴 **FEATURE MISSING** |
| **Courses** | `dashboard.html` | "Mis Cursos" Tab | List of enrolled/accessed courses | **MISSING:** `renderCoursesList` function not found. | 🔴 **FEATURE MISSING** |
| **Journal** | `dashboard.html` | Decision Journal (List + Form) | CRUD for decision tracking | `POST /api/user/journal` exists. `GET` via `/api/user`. | ✅ Functional (No Delete) |
| **Course Details** | `course.html` | Syllabus Structure (10 steps) | Deep dive into specific course content | `GET /api/pensum` returns structure. | ✅ Wired |
| **Video Gallery** | `index.html` | Placeholders | Video content delivery | Static placeholders only. | 🟡 Low Priority (Content) |

---

## 2. Implied Functionality Resolution (Backend Decomposition)

### A. Core Schema Requirements (Supabase)

To support the above UI, we need the following Tables & RLS:

1.  **`profiles`** (Public/Private split)
    *   `id` (FK auth.users)
    *   `email`
    *   `full_name`
    *   `avatar_url`
    *   `subscription_status` (free, active, past_due)
    *   `stripe_customer_id`

2.  **`mentors`** (Public Read)
    *   `id`, `name`, `role`, `description`, `image_url`, `order`

3.  **`translations`** (Public Read)
    *   `key`, `lang`, `value`

4.  **`axes`**, **`categories`**, **`courses`** (Public Read - Pensum Structure)
    *   Standard relational hierarchy.
    *   `courses` needs `syllabus` (JSONB) or child table `syllabus_items`.

5.  **`questions`** (or `tests`) (Public Read)
    *   Currently implied as one "Master Test" or per-axis tests.
    *   Need table `test_questions`: `id`, `axis_id`, `question_text`, `options` (JSONB: text, points).

6.  **`user_tests`** (Private RLS: owner only)
    *   `user_id`, `axis_id`, `score`, `level_title`, `completed_at`

7.  **`journal_entries`** (Private RLS: owner only)
    *   `user_id`, `decision`, `context`, `outcome`, `review_date`, `status`, `created_at`

8.  **`subscriptions`** (Service Role managed)
    *   `user_id`, `stripe_subscription_id`, `status`

### B. Missing APIs / Logic

1.  **Tests API (`GET /tests`)**: Must be implemented to return actual questions from DB.
2.  **Dashboard Progress**: Need logic to calculate and render progress (from `user_tests` or course completion).
3.  **Course Enrollment**: Logic to "start" a course? Or is it open access for subscribers? UI implies "Mis Cursos" list.

---

## 3. Build Queue (Phase 2 & 3)

1.  **Schema Enforcement:** Create `migrations/001_initial_schema.sql` covering all above tables.
2.  **Seed Data:** `mentors`, `translations`, `pensum` (axes/cat/courses), `test_questions`.
3.  **Fix API:** Update `server/routes/api.js` to fetch real questions.
4.  **Fix Dashboard JS:** Implement `renderProgress` and `renderCoursesList`.
5.  **Stripe Sync:** Ensure webhook correctly updates `profiles.subscription_status`.

