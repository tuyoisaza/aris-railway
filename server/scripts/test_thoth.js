import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '../.env' });

// Import ThothAgent
import ThothAgent from '../services/ai/agents/ThothAgent.js';

async function testThoth() {
    console.log('Testing Thoth Agent...\n');

    const testCases = [
        'How to make muffins',
        'Quantum entanglement',
        'The French Revolution',
        'Writing Python code',
        'Oil painting techniques'
    ];

    for (const testCase of testCases) {
        console.log(`Input: "${testCase}"`);
        const domain = await ThothAgent.classifyDomain(testCase);
        console.log(`Domain: ${domain}\n`);
    }

    process.exit(0);
}

testThoth();
