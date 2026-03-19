import BadgeService from '../services/BadgeService.js';
import ThothAgent from '../services/ai/agents/ThothAgent.js';
import { supabaseAdmin } from '../db.js';

// Configuration
const TEST_USER_ID = '00000000-0000-0000-0000-000000000000'; // Replace with a valid user ID if needed, or rely on mock if DB allows
const TOPIC_INPUT = "Making perfect blueberry muffins";

async function verifyFlow() {
    console.log("🚀 Starting Knowledge Accretion Verification...");

    try {
        // 1. Test Thoth Classification
        console.log("\n1️⃣ Testing Thoth Classification...");
        const topology = await ThothAgent.classifyTopology(TOPIC_INPUT);
        console.log("   Result:", topology);
        if (topology.domain === 'General') console.warn("   ⚠️ Warning: Classified as General (expected Cooking/Baking)");

        // 2. Test XP Awarding (Simulating Cartographer)
        console.log("\n2️⃣ Testing BadgeService XP Award...");
        // Use a real user ID if possible. If not, this might fail on foreign key constraint.
        // We will assume the user has a valid ID or we need to fetch one.
        const { data: user } = await supabaseAdmin.from('users').select('id').limit(1).single();
        if (!user) {
            console.error("   ❌ No users found in DB. Cannot test XP award.");
            return;
        }
        const userId = user.id;
        console.log(`   Using User ID: ${userId}`);

        await BadgeService.awardRegionXP(userId, topology.domain, topology.region, TOPIC_INPUT, topology.weight);
        console.log("   XP Awarded (Check DB for topic_events and user_badges)");

        // 3. Verify DB State
        console.log("\n3️⃣ Verifying DB State...");
        const { data: events } = await supabaseAdmin
            .from('topic_events')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(1);

        if (events && events.length > 0) {
            console.log("   ✅ Topic Event found:", events[0].topic_name, `(${events[0].region})`);
        } else {
            console.error("   ❌ No Topic Event found!");
        }

        const badges = await BadgeService.getBadgesByDomain(userId, topology.domain);
        console.log(`   Found ${badges.length} badges in domain ${topology.domain}:`);
        badges.forEach(b => console.log(`   - ${b.name}: Level ${b.level} (${b.xp} XP)`));

        if (badges.some(b => b.name === topology.region)) {
            console.log("   ✅ Region Badge exists and has XP!");
        } else {
            console.error("   ❌ Region Badge not found!");
        }

        // 4. Test Teacher Context
        console.log("\n4️⃣ Testing Teacher Context Injection...");
        // Mock prompt construction logic
        if (badges.length > 0) {
            const badgeList = badges.map(b => `${b.name} (Lvl ${b.level})`).join(', ');
            const context = `[DOMAIN CONTEXT: ${topology.domain}]\nUser History: ${badgeList}.\nTEACHING STRATEGY: Use Contrastive Teaching.`;
            console.log("   Generated Context Prompt segment:\n" + context);
        } else {
            console.log("   No badges, so no context would be injected.");
        }

    } catch (err) {
        console.error("🚨 Verification Failed:", err);
    }

    console.log("\n🏁 Verification Complete.");
}

verifyFlow();
