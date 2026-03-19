// Simple verification script for AI Agents
// Usage: node server/tests/ai_service_test.js

require('dotenv').config({ path: 'server/.env' });
const TeacherAgent = require('../services/ai/agents/TeacherAgent');
const CartographerAgent = require('../services/ai/agents/CartographerAgent');
const LibrarianAgent = require('../services/ai/agents/LibrarianAgent');
const ScoutAgent = require('../services/ai/agents/ScoutAgent');
const { OpenAIProvider } = require('../services/ai/provider');

async function testAgent(name, agent) {
    console.log(`\nTesting ${name}...`);
    try {
        console.log(`- ID: ${agent.agentId}`);
        // Mocking the prompt load so we don't hit DB execution error if table missing
        if (!agent.systemPrompt) {
            console.log(`- Fetching prompt (skipping DB for test if local)...`);
            // In a real test environment we'd mock supabaseAdmin. 
            // Here we just verify instantiation and provider connection config.
            agent.systemPrompt = "You are a test agent.";
        }

        console.log(`- Provider: ${agent.provider instanceof OpenAIProvider ? 'OpenAIProvider Linked' : 'Failed'}`);
        console.log(`- Config: ${JSON.stringify(agent.config)}`);

        // We won't make a real API call to save cost/time in this script, just verify structure.
        console.log(`✅ ${name} instantiated successfully.`);
    } catch (err) {
        console.error(`❌ ${name} failed:`, err);
    }
}

async function run() {
    console.log('=== AI AGENT ARCHITECTURE VERIFICATION ===');

    await testAgent('Teacher', TeacherAgent);
    await testAgent('Cartographer', CartographerAgent);
    await testAgent('Librarian', LibrarianAgent);
    await testAgent('Scout', ScoutAgent);

    console.log('\n=== VERIFICATION COMPLETE ===');
    console.log('Note: Full functional testing requires the system_prompts table to be created via SQL migration.');
}

run();
