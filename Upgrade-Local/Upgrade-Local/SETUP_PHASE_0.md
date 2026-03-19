# Phase 0: Critical Environment Setup

**Status**: 🛑 STOPPED. Missing API Keys.

To proceed with the production build, you must provide the real credentials for Supabase and Stripe. The application cannot run without them.

## 1. Supabase Setup (Database & Auth)

1.  **Go to**: [Supabase Dashboard > Project Settings > API](https://supabase.com/dashboard/project/api)
2.  **Copy** the following values:
    *   **Project URL**
    *   **anon public** key
    *   **service_role** key (Click "Reveal" - **CAUTION**: This is your admin key, keep it secret)

## 2. Stripe Setup (Payments)

1.  **Go to**: [Stripe Dashboard > Developers > API keys](https://dashboard.stripe.com/apikeys)
2.  **Copy**:
    *   **Publishable key** (`pk_live_...` or `pk_test_...`)
    *   **Secret key** (`sk_live_...` or `sk_test_...`)
3.  **Go to**: [Stripe Dashboard > Developers > Webhooks](https://dashboard.stripe.com/webhooks)
    *   Create a webhook endpoint for your URL (or use Local Listener for dev).
    *   **Copy** the **Signing secret** (`whsec_...`).

## 3. Action Required: Fill in Credentials

### A. Edit `.env` (Backend Secrets)
Open `g:\Meu Drive\3 - Entrenar IA\Antigravity\Upgrade\.env` and replace the placeholders:

```env
PORT=8080
SUPABASE_URL="https://your-project.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI..."
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
```

### B. Edit `js/config.js` (Frontend Public Keys)
Open `g:\Meu Drive\3 - Entrenar IA\Antigravity\Upgrade\js\config.js` and replace the placeholders:

```javascript
const Config = {
    // ...
    SUPABASE: {
        url: "https://your-project.supabase.co",
        anonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI..."
    },
    STRIPE: {
        publicKey: "pk_test_..."
    }
};
```

## 4. Verification

Once you have saved these files with the real keys, reply with **"Environment Ready"** and I will verify the connection and proceed to Phase 1.
