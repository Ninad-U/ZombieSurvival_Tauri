// Admin State
// Stores admin/developer preferences separately from project data
// These are runtime preferences, NOT project content

const ADMIN_STORAGE_KEY = 'zombie_survival_admin_prefs';

let _prefs = {
    lockDiet: false
};

// Load preferences from localStorage on initialization
try {
    const stored = localStorage.getItem(ADMIN_STORAGE_KEY);
    if (stored) {
        const parsed = JSON.parse(stored);
        _prefs = { ..._prefs, ...parsed };
        console.log('[Admin] Loaded preferences:', _prefs);
    }
} catch (e) {
    console.warn('[Admin] Failed to load preferences:', e);
}

export const AdminState = {
    /**
     * Get the current admin preferences
     */
    getPrefs() {
        return { ..._prefs };
    },
    
    /**
     * Get a specific preference value
     */
    get(key, defaultValue = false) {
        return _prefs[key] !== undefined ? _prefs[key] : defaultValue;
    },
    
    /**
     * Set a preference value and persist it
     */
    set(key, value) {
        _prefs[key] = value;
        this.save();
    },
    
    /**
     * Save preferences to localStorage
     */
    save() {
        try {
            localStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(_prefs));
            console.log('[Admin] Saved preferences:', _prefs);
        } catch (e) {
            console.warn('[Admin] Failed to save preferences:', e);
        }
    },
    
    /**
     * Reset all admin preferences (for testing)
     */
    reset() {
        _prefs = {
            lockDiet: false
        };
        this.save();
    },
    
    /**
     * Check if diet is locked
     */
    isDietLocked() {
        return this.get('lockDiet', false);
    },
    
    /**
     * Set diet lock state
     */
    setDietLocked(locked) {
        this.set('lockDiet', locked);
    }
};