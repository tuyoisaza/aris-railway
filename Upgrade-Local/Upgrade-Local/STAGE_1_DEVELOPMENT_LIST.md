# Stage 1 Development List

## 1. System Unification
- [x] **Objective**: Unify the generic Node.js server with the Vite React frontend.
- [ ] **Action**: Configure `server/index.js` to serve static files from `client/dist` (production mode) and ensuring `client/vite.config.js` proxies correctly in dev.
- [ ] **Verification**: Build the client (`npm run build --prefix client`), start the server, and verify root URL loads the React app (not the legacy `index.html`).

## 2. Authentication Flow Verification
- [x] **Objective**: Ensure Supabase Auth works end-to-end in the React app.
- [ ] **Action**: Verify `AuthContext.jsx` and `login/signup` logic. ensure `profiles` table syncing is active (triggers).
- [ ] **Verification**: Register a new user via React UI, confirm entry in Supabase `auth.users` and `public.profiles`.

## 3. Dashboard Functionality
- [x] **Objective**: Connect Dashboard UI to Backend API.
- [ ] **Action**: Ensure `Dashboard.jsx` fetches real data from `./api/` endpoints (or Supabase direct if using RLS).
- [ ] **Verification**: Create a journal entry in Dashboard, verify in `journal_entries` table.

## 4. Admin Interface & Data Management
- [x] **Objective**: Enable Admin features for Course/Question management.
- [ ] **Action**: Verify `Admin.jsx` allows viewing/editing courses and questions.
- [ ] **Verification**: Add a dummy question via Admin UI, verify in `questions` table.

## 5. Stripe Integration
- [ ] **Objective**: Verify Pricing and Checkout flow.
- [ ] **Action**: Ensure `Pricing.jsx` triggers the backend checkout session creation.
- [ ] **Verification**: Initiate a checkout (test mode), verify redirection to Stripe.

## 6. Legacy Cleanup
- [ ] **Objective**: Remove confusion artifacts.
- [ ] **Action**: Move legacy root HTML/JS/CSS files to `_legacy/` or delete them.
- [ ] **Verification**: File system check.

## 7. Critical Observability (Auto-Dev Check)
- [ ] **Objective**: Implement mandatory Debugging Switch and Log Panel.
- [ ] **Action (Admin)**: Add `Debugging = ON | OFF` switch in Admin UI.
- [ ] **Action (Global)**: Implement `DebugContext` to broadcast state.
- [ ] **Action (Logs)**: Create "Admin Log Panel" to stream debug events.
- [ ] **Action (Login)**: Implement "Debug Login Bypass" visible only when Debugging=ON.
- [ ] **Verification**: Toggle switch, verify logs appear/disappear, verify login bypass.
