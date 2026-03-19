# Stage 5 Development List: Deployment & Operations

## 1. Docker Production Build
- [/] **Objective**: Containerize the application for production.
- [/] **Action**: Create/Refine `Dockerfile` for multi-stage build (Vite Build -> Node Serve).
    - [x] Fix SPA fallback path in `server/src/index.ts`.
    - [ ] Build image `docker build -t upgrade-os .`.
- [ ] **Verification**: Build image `docker build -t upgrade-os .` and run locally `docker run -p 8080:8080 upgrade-os`.

## 2. Cloud Run Preparation
- [ ] **Objective**: Configuration for Serverless deployment.
- [ ] **Action**: Ensure `server/index.js` listens on `PORT` env var. Create `deploy.sh` or `cloudbuild.yaml` (if applicable) or document manual steps.
- [ ] **Verification**: Review env var handling in code.

## 3. CI/CD Pipeline (Optional/Future)
- [ ] **Objective**: Automate testing and deployment.
- [ ] **Action**: GitHub Actions workflow.

## 4. Final Security Audit
- [ ] **Objective**: Ensure RLS and Headers are production-ready.
- [ ] **Action**: Review Supabase policies and Helmet config.
- [ ] **Verification**: Penetration testing (Auto-Dev).
