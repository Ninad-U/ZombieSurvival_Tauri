// Project State
// Central tracking for project dirty/clean state

let _dirty = false;
let _listeners = [];

export const ProjectState = {
    /**
     * Check if the project has unsaved changes
     */
    isDirty() {
        return _dirty;
    },
    
    /**
     * Mark the project as dirty (has unsaved changes)
     */
    markDirty() {
        if (!_dirty) {
            _dirty = true;
            notifyListeners('dirty');
            updateStatusUI();
        }
    },
    
    /**
     * Mark the project as clean (all changes saved)
     */
    markClean() {
        if (_dirty) {
            _dirty = false;
            notifyListeners('clean');
            updateStatusUI();
        }
    },
    
    /**
     * Add a listener for state changes
     */
    addListener(callback) {
        _listeners.push(callback);
    },
    
    /**
     * Remove a listener
     */
    removeListener(callback) {
        const index = _listeners.indexOf(callback);
        if (index !== -1) {
            _listeners.splice(index, 1);
        }
    },
    
    /**
     * Reset state (for testing)
     */
    reset() {
        _dirty = false;
        _listeners = [];
        updateStatusUI();
    }
};

function notifyListeners(state) {
    for (const listener of _listeners) {
        try {
            listener(state);
        } catch (e) {
            console.error('Error in project state listener:', e);
        }
    }
}

function updateStatusUI() {
    const statusEl = document.getElementById('project-status');
    if (statusEl) {
        if (_dirty) {
            statusEl.textContent = '⚠️ Unsaved Changes';
            statusEl.style.color = '#ff9800';
        } else {
            statusEl.textContent = '✓ Saved';
            statusEl.style.color = '#4caf50';
        }
    }
}