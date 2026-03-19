
import LughAgent from './services/ai/agents/LughAgent.js';
import SkillService from './services/SkillService.js';
import { supabaseAdmin } from './db.js';

const SKILL_ID = '0e4437db-dfe0-4e0a-bce0-0d9679508de8';

async function testGeneration() {
    console.log('--- Testing Lugh Generation ---');

    // 1. Get Skill
    const { data: skill } = await supabaseAdmin.from('skills').select('*').eq('id', SKILL_ID).single();
    console.log(`Generating for: ${skill.title}`);

    // 2. Generate
    console.time('Lugh Generation');
    try {
        const content = await LughAgent.generateCurriculum(skill.title);
        console.timeEnd('Lugh Generation');
        console.log('Generated Content Keys:', Object.keys(content));

        if (content.levels && content.levels.length === 10) {
            console.log('✅ Success: 10 Levels Generated');
            // Optimistically update DB so user sees it
            await SkillService.updateSkillContent(SKILL_ID, content);
            console.log('✅ DB Updated');
        } else {
            console.error('❌ Failed: Invalid content structure', content);
        }

    } catch (e) {
        console.timeEnd('Lugh Generation');
        console.error('❌ Generation Error:', e);
    }
}

testGeneration();
