
import { supabaseAdmin } from './db.js';
import ConversationService from './services/ConversationService.js';

const USER_ID = '49c236ef-9088-437a-ae24-118bd0c444bf';
const COOKING_SKILL_ID = '4a50e4dd-660a-4871-bf3b-aefb5518db58'; // From previous steps

async function testCookingRouting() {
    console.log('--- Testing Cooking Skill Routing ---');

    // 1. Get Skill Data
    const { data: skill } = await supabaseAdmin.from('skills').select('*').eq('id', COOKING_SKILL_ID).single();
    if (!skill) throw new Error('Cooking skill not found');
    console.log(`Skill: ${skill.title}`);

    // 2. Simulate Level 1 Request
    const l1Data = skill.content.levels.find(l => l.level === 1);
    const title1 = `Level 1: ${l1Data.name} (${skill.title})`;
    console.log(`Generated Title L1: "${title1}"`);

    const res1 = await ConversationService.startGuidedConversation({
        userId: USER_ID,
        title: title1,
        topicId: skill.topic_id,
        brief: "Testing Cooking L1",
        initialContext: "Ctx",
        initialXp: 10,
        skillId: COOKING_SKILL_ID,
        level: 1
    });
    console.log(`Result L1: ${res1.conversationId} (isNew: ${res1.isNew})`);

    // 3. Simulate Level 2 Request
    const l2Data = skill.content.levels.find(l => l.level === 2);
    const title2 = `Level 2: ${l2Data.name} (${skill.title})`;
    console.log(`Generated Title L2: "${title2}"`);

    const res2 = await ConversationService.startGuidedConversation({
        userId: USER_ID,
        title: title2,
        topicId: skill.topic_id,
        brief: "Testing Cooking L2",
        initialContext: "Ctx",
        initialXp: 10,
        skillId: COOKING_SKILL_ID,
        level: 2
    });
    console.log(`Result L2: ${res2.conversationId} (isNew: ${res2.isNew})`);

    // 4. Check against specific ID user reported
    const BAD_ID = 'd3daab12-dab0-414c-a46c-c19a2a9ddb5f';
    if (res1.conversationId === BAD_ID) console.error(`❌ ERROR: Level 1 matched the Test Script ID!`);
    else console.log(`✅ Passed: Level 1 ID != Test Script ID`);

    if (res1.conversationId === res2.conversationId) console.error(`❌ ERROR: Level 1 and Level 2 are SAME ID!`);
    else console.log(`✅ Passed: Level 1 and Level 2 are DISTINCT`);
}

testCookingRouting();
