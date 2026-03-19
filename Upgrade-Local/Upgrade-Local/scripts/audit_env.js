const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const REQUIRED_KEYS = [
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'STRIPE_PUBLISHABLE_KEY', // Often passed to frontend build or config
    'STRIPE_SECRET_KEY',
    'STRIPE_WEBHOOK_SECRET'
];

console.log('🔍 Starting Phase 0 Infrastructure Audit...');

const missing = [];

REQUIRED_KEYS.forEach(key => {
    if (!process.env[key] || process.env[key].trim() === '') {
        missing.push(key);
    } else {
        // Basic format validation
        if (key.startsWith('SUPABASE_URL') && !process.env[key].startsWith('https://')) {
            missing.push(`${key} (Invalid Format: Must start with https://)`);
        }
        if (key.startsWith('STRIPE_SECRET_KEY') && !process.env[key].startsWith('sk_')) {
            missing.push(`${key} (Invalid Format: Must start with sk_)`);
        }
        if (key.startsWith('STRIPE_PUBLISHABLE_KEY') && !process.env[key].startsWith('pk_')) {
            missing.push(`${key} (Invalid Format: Must start with pk_)`);
        }
    }
});

if (missing.length > 0) {
    console.error('❌ FAILURE INVARIANT TRIGGERED');
    console.error('The following environment variables are missing or invalid:');
    missing.forEach(m => console.error(`   - ${m}`));
    console.error('\nPlease update the .env file immediately.');
    process.exit(1);
}

console.log('✅ Infrastructure Audit Passed: All validated keys are present.');
process.exit(0);
