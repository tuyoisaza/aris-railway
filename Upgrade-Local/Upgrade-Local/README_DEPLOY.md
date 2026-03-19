# Upgrade MVP Deployment Guide (Supabase + Google Cloud Run)

This document outlines the steps to set up, configure, and deploy the Upgrade platform MVP using **Supabase** (PostgreSQL + Auth) and **Google Cloud Run** (Backend).

## Prerequisites

1.  **Node.js**: Ensure Node.js (v18+) is installed.
2.  **Google Cloud SDK**: For deploying to Cloud Run.
3.  **Supabase Account**: For Database and Authentication.

## 1. Installation

Run the following command to install backend dependencies:

```bash
npm install
```

## 2. Supabase Configuration

### 2.1. Create a Supabase Project
Go to [Supabase](https://supabase.com) and create a new project.

### 2.2. Get Credentials
Go to Project Settings > API.
*   Copy `Project URL`.
*   Copy `anon public` key.
*   Copy `service_role` key (keep this secret!).

### 2.3. Setup Database Schema
1.  Go to the **SQL Editor** in your Supabase Dashboard.
2.  Open `server/schema.sql` from this repository.
3.  Copy the content and run it in the SQL Editor to create the tables.

## 3. Configuration Files

### 3.1. Update `.env` (Backend)
Open `.env` and fill in your Supabase credentials:

```env
PORT=8080
SUPABASE_URL="YOUR_PROJECT_URL"
SUPABASE_SERVICE_ROLE_KEY="YOUR_SERVICE_ROLE_KEY"
```

### 3.2. Update `js/config.js` (Frontend)
Open `js/config.js` and replace the placeholder `SUPABASE` object:

```javascript
const Config = {
    // ...
    SUPABASE: {
        url: "YOUR_PROJECT_URL",
        anonKey: "YOUR_ANON_PUBLIC_KEY"
    }
};
```

## 4. Database Seeding

Populate the database with the initial content (Mentors, Pensum, Translations).

```bash
npm run seed
```

This script (`scripts/seed_supabase.js`) connects to Supabase using the credentials in `.env` and inserts the data.

## 5. Local Testing

Start the server locally:

```bash
npm start
```

Visit `http://localhost:8080` in your browser.

## 6. Deployment to Google Cloud Run

1.  Ensure you have the Google Cloud SDK installed and authenticated (`gcloud auth login`).
2.  Make sure your project has billing enabled.
3.  Run the deployment script:

```bash
# Windows (Git Bash) or Linux/Mac
./deploy.sh YOUR_GOOGLE_CLOUD_PROJECT_ID
```

This script will:
1.  Build the Docker image using Cloud Build.
2.  Deploy the image to Cloud Run.

### Environment Variables in Cloud Run
The deployment script sets `NODE_ENV=production`.
You MUST also set the Supabase credentials in Cloud Run:

1.  Go to [Google Cloud Console](https://console.cloud.google.com/run).
2.  Select your service (`upgrade-platform`).
3.  Click **Edit & Deploy New Revision**.
4.  Go to **Security** or **Variables**.
5.  Add the Environment Variables:
    *   `SUPABASE_URL`: Your Supabase URL.
    *   `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase Service Role Key.
6.  Click **Deploy**.

Alternatively, you can modify `deploy.sh` to include these variables (less secure if committed) or use Secret Manager.

## 7. Docker Deployment (Recommended)

You can also run the application as a single Docker container.

### 7.1. Build
```bash
docker build -t upgrade-app .
```

### 7.2. Run
```bash
docker run -p 8080:8080 \
  -e SUPABASE_URL="your_url" \
  -e SUPABASE_SERVICE_ROLE_KEY="your_key" \
  -e OPENAI_API_KEY="your_key" \
  upgrade-app
```
