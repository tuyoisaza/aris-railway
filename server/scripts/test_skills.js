import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import TeacherAgent from '../services/ai/agents/TeacherAgent.js';
import SkillService from '../services/SkillService.js';
import { supabaseAdmin } from '../db.js';

// Load .env
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const TEST_USER_ID = '00000000-0000-0000-0000-000000000000'; // Mock or fetch real

async function runTest() {
    console.log("🧪 Testing Skills System...");

    // 1. Get a real user or create one
    const { data: user } = await supabaseAdmin.from('users').select('id').limit(1).single();
    if (!user) {
        console.error("No users found to test with.");
        return;
    }
    const userId = user.id;
    console.log(`👤 Testing with User: ${userId}`);

    // 2. Simulate User Message
    const userMessage = "I went skydiving for the first time today. I learned how to stabilize in freefall.";
    console.log(`💬 Simulated Message: "${userMessage}"`);

    // A) Test SkillAgent Direct
    console.log("\n--- Testing SkillAgent Classification ---");
    const { default: SkillAgent } = await import('../services/ai/agents/SkillAgent.js');
    const classification = await SkillAgent.classifySkill(userMessage);
    console.log("Classification Result:", classification);

    if (!classification) {
        console.error("❌ Classification failed.");
        return;
    }

    // B) Test SkillService Recording
    console.log("\n--- Testing SkillService Persistence ---");
    await SkillService.recordSkill(userId, classification);

    console.log("⏳ Waiting for background Lugh generation (20s)...");
    await new Promise(resolve => setTimeout(resolve, 20000));

    // C) Verify DB
    const { data: progress } = await supabaseAdmin
        .from('user_skill_progress')
        .select('*, skills(title, content)')
        .eq('user_id', userId)
        .order('last_practiced_at', { ascending: false })
        .limit(1)
        .single();

    console.log("✅ DB verification using User Progress:", progress);

    // Verify content exists
    if (progress.skills.content && progress.skills.content.levels) {
        console.log("✨ Lugh Content Validated: Has levels!");
    } else {
        console.error("❌ Lugh Content Missing or Empty.");
    }

    console.log("🎉 Test Complete!");
}

runTest();
