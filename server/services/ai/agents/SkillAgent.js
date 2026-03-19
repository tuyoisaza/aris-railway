import BaseAgent from './BaseAgent.js';

/**
 * SkillAgent: The Mentor (TOT Implementation)
 * Deconstructs user actions into a hierarchy of Skills and Sub-Skills.
 * 
 * Logic:
 * 1. ACTION: What is the user actually doing?
 * 2. PARENT SKILL: What is the broad domain? (e.g. Cooking)
 * 3. SUB-SKILL: What is the specific technique? (e.g. Knife Skills)
 * 4. LEVEL: What is the complexity? (1-10)
 */
class SkillAgent extends BaseAgent {
    constructor() {
        super('skill'); // Requires 'skill' in agents config or generic handling
    }

    /**
     * Classify an action into a Skill Hierarchy (TOT).
     * @param {string} input - The user's action or statement (e.g. "I made a soufle").
     * @returns {Promise<{parentSkill: string, subSkill: string, level: number, xp: number}>}
     */
    async classifySkill(input) {
        console.log(`[SkillAgent] 🛠️ Analyzing Skill TOT for: "${input}"`);

        const systemPrompt = `You are the Skill Mentor. Your job is to "Unravel" (Desramificar) a user's action into a structured Skill Tree.

Input: "${input}"

Steps (Tree of Thoughts):
1. Identify the granular ACTION.
2. Abscract to the PARENT SKILL (The "Root" - e.g. Cooking, Programming, Carpentry).
3. Identify the SUB-SKILL (The "Branch" - e.g. Knife Skills, Debugging, Joinery).
4. Estimate the LEVEL of this specific action (1-10, where 1=Beginner, 10=Master).

Return JSON ONLY:
{
  "parentSkill": "String (The Root)",
  "subSkill": "String (The Branch)",
  "level": Number (1-10),
  "xp": Number (Suggested XP reward, 10-100 based on difficulty),
  "confidence": Number (1-10, how sure are you?)
}`;

        const messages = [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: input }
        ];

        // Use standard config, force JSON if possible (or rely on prompt)
        const config = { ...this.config, jsonMode: true };

        try {
            const responseJson = await this.provider.chat(messages, config);
            const result = JSON.parse(responseJson);

            console.log(`[SkillAgent] 🌳 TOT Result: ${result.parentSkill} > ${result.subSkill} (Lvl ${result.level})`);
            return {
                parentSkill: result.parentSkill || 'General',
                subSkill: result.subSkill || 'General',
                level: result.level || 1,
                xp: result.xp || 10,
                confidence: result.confidence || 5
            };
        } catch (error) {
            console.error('[SkillAgent] Error classifying skill:', error);
            // Fallback
            return null;
        }
    }
}

export default new SkillAgent();
