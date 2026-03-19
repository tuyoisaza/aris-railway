const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const projectId = process.argv[2];
const serviceName = "upgrade-platform";
const region = "us-central1";

if (!projectId) {
    console.error("Error: Project ID is required.");
    console.error("Usage: node scripts/deploy.js <PROJECT_ID>");
    process.exit(1);
}

// 1. Build
console.log(`\n1. Building container image for ${projectId}...`);
try {
    execSync(`gcloud builds submit --tag gcr.io/${projectId}/${serviceName} . --project ${projectId}`, { stdio: 'inherit' });
} catch (e) {
    console.error("Build failed.");
    process.exit(1);
}

// 2. Prepare Env Vars
console.log(`\n2. Preparing Environment Variables...`);
const requiredKeys = [
    'SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
    'STRIPE_SECRET_KEY',
    'STRIPE_WEBHOOK_SECRET',
    'STRIPE_PRICE_BUILDER',
    'STRIPE_PRICE_PRACTITIONER',
    'STRIPE_PRICE_TEAMS',
    'SUPABASE_ANON_KEY' // Usually client-side but good to have if server needs it
];

let envVars = `NODE_ENV=production`;
for (const key of requiredKeys) {
    const val = process.env[key];
    if (val) {
        envVars += `,${key}=${val}`;
    } else {
        console.warn(`Warning: ${key} is missing in .env`);
    }
}

// 3. Deploy
console.log(`\n3. Deploying to Cloud Run...`);
try {
    const cmd = `gcloud run deploy ${serviceName} --image gcr.io/${projectId}/${serviceName} --platform managed --region ${region} --project ${projectId} --allow-unauthenticated --set-env-vars="${envVars}"`;
    // console.log("Executing:", cmd); // Careful printing secrets
    execSync(cmd, { stdio: 'inherit' });
    console.log("\n✅ Deployment Success!");
} catch (e) {
    console.error("Deployment failed.");
    process.exit(1);
}
