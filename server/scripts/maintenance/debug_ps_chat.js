
import { supabaseAdmin } from './db.js';
import ConversationService from './services/ConversationService.js';

const USER_ID = '49c236ef-9088-437a-ae24-118bd0c444bf';
const SKILL_ID = '0e4437db-dfe0-4e0a-bce0-0d9679508de8'; // Public Speaking

async function verifyPSChat() {
    console.log('--- Testing Public Speaking Conversation ---');

    // 1. Get Skill Data (to ensure it has levels now)
    const { data: skill } = await supabaseAdmin.from('skills').select('*').eq('id', SKILL_ID).single();
    console.log(`Skill: ${skill.title}, Levels: ${skill.content?.levels?.length}`);

    if (!skill.content?.levels) {
        throw new Error("Skill content missing!");
    }

    const level = 1;
    const levelData = skill.content.levels.find(l => l.level === level);
    const title = `Level ${level}: ${levelData.name} (${skill.title})`;

    // 2. Start Conversation
    console.time('StartConv');
    const res = await ConversationService.startGuidedConversation({
        userId: USER_ID,
        title: title,
        topicId: skill.topic_id,
        brief: "Testing PS L1",
        initialContext: "Ctx",
        initialXp: 10,
        skillId: SKILL_ID,
        level: level
    });
    console.timeEnd('StartConv');
    console.log('Result:', res);

    // 3. Check Messages
    const { count, data: msgs } = await supabaseAdmin
        .from('messages')
        .select('*', { count: 'exact' })
        .eq('conversation_id', res.conversationId);

    console.log(`Messages Count: ${count}`);
    msgs.forEach(m => console.log(`[${m.role}] ${m.text.substring(0, 30)}...`));

    if (count === 0) {
        console.error("❌ FAILED: Conversation is empty!");
    } else {
        console.log("✅ SUCCESS: Messages persisted.");
    }
}

verifyPSChat();
