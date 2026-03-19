# Stage 2 Development List

## 1. Access Control (Gating)
- [x] **Objective**: Restrict premium content to active subscribers.
- [x] **Action (Backend)**: Add Trigger to sync `subscriptions.status` -> `profiles.subscription_status`.
- [x] **Action (Frontend)**: Update `AuthContext` to expose `subscription_status`.
- [x] **Action (Frontend)**: Create `LockedContent` component.
- [x] **Verification**: Verify Free vs Active view.

## 2. Deep Link Invite System
- [x] **Objective**: Viral growth loop.
- [x] **Action (DB)**: Create `invites` table.
- [x] **Action (Backend)**: Add invite API.
- [x] **Action (Frontend)**: Handle invite code on Signup.
- [x] **Verification**: Signup with code works.

## 3. Cybersecurity & Abuse Prevention
- [x] **Objective**: Secure API against invalid inputs and brute-force.
- [x] **Action (Validation)**: Implement `zod` schemas for `invites`, `progress`, `journal`.
- [x] **Action (Rate Limit)**: Implement strict limiter for `/api/invites` and auth routes.
- [x] **Verification**: Verify 400 for invalid input and 429 for rate limit.
