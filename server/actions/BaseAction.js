/**
 * Base Action Class
 * Defines the standard interface for all Agora Actions.
 */
class BaseAction {
    constructor() {
        if (this.constructor === BaseAction) {
            throw new Error("Abstract class 'BaseAction' cannot be instantiated directly.");
        }
    }

    /**
     * Execute the action.
     * @param {string} userId - The ID of the user triggering the action.
     * @param {any} payload - The context or data for the action.
     * @param {string} intent - The user's intent or goal.
     * @returns {Promise<{url: string, message?: string}>} - The result URL to navigate to.
     */
    async execute(userId, payload, intent) {
        throw new Error("Method 'execute()' must be implemented.");
    }

    /**
     * Validate the payload.
     * @param {any} payload 
     * @returns {boolean}
     */
    validate(payload) {
        return true;
    }
}

export default BaseAction;
