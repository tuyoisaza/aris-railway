
const STORAGE_KEY = 'aris_state_v2'; // Keeping v2 to ensure we load the clean data we just set up

export const StorageService = {
    /**
     * Load state from local storage
     * @param {Object} defaultState - Fallback state if nothing is saved
     * @returns {Object} The loaded or default state
     */
    loadState: (defaultState) => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            return saved ? JSON.parse(saved) : defaultState;
        } catch (e) {
            console.error('Failed to load state:', e);
            return defaultState;
        }
    },

    /**
     * Save state to local storage
     * @param {Object} state - The state object to save
     */
    saveState: (state) => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        } catch (e) {
            console.error('Failed to save state:', e);
        }
    },

    /**
     * Clear all app data
     */
    clearState: () => {
        localStorage.removeItem(STORAGE_KEY);
    }
};
