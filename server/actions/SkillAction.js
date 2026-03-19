import BaseAction from './BaseAction.js';
import SkillService from '../services/SkillService.js';

class SkillAction extends BaseAction {

    async execute(userId, payload, intent) {
        // Validation (Optional logging or checks)
        if (!payload) {
            console.warn('[SkillAction] Payload (context) is empty or missing.');
        }

        // Delegate to SkillService
        // Intent is used as title (initially), Payload as context/description
        const result = await SkillService.createGuidedSkill(userId, intent, payload);

        return {
            url: `/skills/${result.skillId}`,
            message: 'Skill created and architecting started.'
        };
    }
}

export default new SkillAction();
