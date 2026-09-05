// Dialogue Editor
// Lightweight editor for dialogue cutscene data (focus + black bars)

export class DialogueEditor {
    constructor(gameRuntime) {
        this.game = gameRuntime;
        this.dialogueData = null;
        this.dialogueId = '';
        this.lines = [];
        this.cutscene = [];
        this.focus = [];
        this.participants = [];
        this.currentLineIndex = 0;
        
        this.initUI();
    }
    
    initUI() {
        const panel = document.createElement('div');
        panel.id = 'dialogue-editor-panel';
        panel.style.cssText = `
            display: none;
            padding: 20px;
            background: #1a1a1a;
            color: #c0c0c0;
            font-family: 'Courier New', monospace;
            height: 100%;
            overflow-y: auto;
        `;
        
        panel.innerHTML = `
            <h2 style="color: #4caf50; margin-bottom: 16px;">🎬 Dialogue Editor</h2>
            
            <div style="display: flex; gap: 16px; flex-wrap: wrap; margin-bottom: 16px;">
                <div>
                    <label style="color: #888; font-size: 12px; display: block;">Dialogue ID</label>
                    <input id="cutscene-dialogue-id" type="text" placeholder="test_conversation" style="background: #2a2a2a; color: #c0c0c0; border: 1px solid #444; padding: 6px 12px; font-family: inherit; width: 200px;">
                </div>
                <div style="display: flex; align-items: flex-end; gap: 8px;">
                    <button id="cutscene-load-btn" style="background: #4caf50; color: #fff; border: none; padding: 6px 16px; cursor: pointer; font-family: inherit;">Load Dialogue</button>
                    <button id="cutscene-save-btn" style="background: #2196f3; color: #fff; border: none; padding: 6px 16px; cursor: pointer; font-family: inherit;">Save Dialogue</button>
                </div>
            </div>
            
            <div style="border-top: 1px solid #333; padding-top: 12px; margin-bottom: 12px;">
                <div style="color: #888; font-size: 11px; display: flex; gap: 20px; flex-wrap: wrap;">
                    <span><span style="color: #4caf50;">●</span> Focus: single target = Snap</span>
                    <span><span style="color: #ff9800;">●</span> Focus: [from, to] = Slide</span>
                    <span><span style="color: #ffcc00;">●</span> Cutscene: 0=None, 1=Squeeze In, 2=Static, 3=Squeeze Out</span>
                </div>
            </div>
            
            <div id="cutscene-lines-container" style="max-height: 400px; overflow-y: auto; border: 1px solid #333; border-radius: 4px; padding: 8px; background: #111;">
                <div style="color: #666; font-size: 13px; text-align: center; padding: 40px 0;">
                    Load a dialogue to edit cutscene data.
                </div>
            </div>
            
            <div style="margin-top: 16px; border-top: 1px solid #333; padding-top: 12px; display: flex; gap: 8px; flex-wrap: wrap;">
                <button id="cutscene-close-btn" style="background: #f44336; color: #fff; border: none; padding: 6px 16px; cursor: pointer; font-family: inherit;">Close Editor</button>
                <span id="cutscene-status" style="color: #888; font-size: 12px; margin-left: 12px; align-self: center;"></span>
            </div>
        `;
        
        const editorContainer = document.getElementById('editor-container');
        if (editorContainer) {
            editorContainer.appendChild(panel);
        }
        
        this.setupEvents();
    }
    
    setupEvents() {
        document.getElementById('cutscene-load-btn')?.addEventListener('click', () => {
            this.loadDialogue();
        });
        
        document.getElementById('cutscene-save-btn')?.addEventListener('click', () => {
            this.saveDialogue();
        });
        
        document.getElementById('cutscene-close-btn')?.addEventListener('click', () => {
            this.close();
        });
        
        document.getElementById('cutscene-dialogue-id')?.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                this.loadDialogue();
            }
        });
    }
    
    async loadDialogue() {
        const input = document.getElementById('cutscene-dialogue-id');
        const dialogueId = input.value.trim();
        
        if (!dialogueId) {
            this.setStatus('Please enter a dialogue ID.', 'error');
            return;
        }
        
        this.dialogueId = dialogueId;
        this.setStatus(`Loading ${dialogueId}...`, 'info');
        
        try {
            const response = await fetch(`data/dialogue/${dialogueId}.json`);
            if (!response.ok) {
                throw new Error(`Failed to load dialogue: ${dialogueId}`);
            }
            
            const data = await response.json();
            this.dialogueData = data;
            this.lines = data.lines || [];
            this.participants = data.participants || [];
            this.cutscene = data.cutscene || new Array(this.lines.length).fill(0);
            this.focus = data.focus || new Array(this.lines.length).fill('');
            
            while (this.cutscene.length < this.lines.length) this.cutscene.push(0);
            while (this.focus.length < this.lines.length) this.focus.push('');
            
            this.renderLines();
            this.setStatus(`Loaded ${this.lines.length} lines from ${dialogueId}`, 'success');
            
        } catch (error) {
            this.setStatus(`Error: ${error.message}`, 'error');
            console.error('Error loading dialogue:', error);
        }
    }
    
    renderLines() {
        const container = document.getElementById('cutscene-lines-container');
        if (!container) return;
        
        if (this.lines.length === 0) {
            container.innerHTML = `
                <div style="color: #666; font-size: 13px; text-align: center; padding: 40px 0;">
                    No lines found in this dialogue.
                </div>
            `;
            return;
        }
        
        let html = '';
        for (let i = 0; i < this.lines.length; i++) {
            const line = this.lines[i];
            const speaker = this.getSpeakerName(line.speaker);
            const text = line.text || '';
            const cutsceneVal = this.cutscene[i] || 0;
            const focusVal = this.focus[i] || '';
            
            const isActive = i === this.currentLineIndex ? 'border-left: 3px solid #4caf50;' : '';
            
            html += `
                <div style="margin-bottom: 8px; padding: 8px 12px; background: #1a1a1a; border-radius: 4px; ${isActive}">
                    <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 4px;">
                        <div style="display: flex; align-items: center; gap: 8px; flex: 1; min-width: 150px;">
                            <span style="color: #666; font-size: 10px; min-width: 24px;">#${i+1}</span>
                            <span style="color: #4caf50; font-weight: bold; font-size: 12px; min-width: 60px;">${speaker}:</span>
                            <span style="color: #ccc; font-size: 12px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${text.substring(0, 50)}${text.length > 50 ? '...' : ''}</span>
                        </div>
                        <div style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap;">
                            <input type="number" id="cutscene-input-${i}" value="${cutsceneVal}" min="0" max="3" style="width: 50px; background: #2a2a2a; color: #c0c0c0; border: 1px solid #444; padding: 2px 6px; font-family: inherit; font-size: 12px;">
                            <input type="text" id="focus-input-${i}" value="${focusVal}" placeholder='e.g. "player" or ["player","survivor"]' style="width: 200px; background: #2a2a2a; color: #c0c0c0; border: 1px solid #444; padding: 2px 6px; font-family: inherit; font-size: 11px;">
                        </div>
                    </div>
                </div>
            `;
        }
        
        container.innerHTML = html;
        
        for (let i = 0; i < this.lines.length; i++) {
            const cutsceneInput = document.getElementById(`cutscene-input-${i}`);
            if (cutsceneInput) {
                cutsceneInput.addEventListener('change', () => {
                    const val = parseInt(cutsceneInput.value) || 0;
                    this.cutscene[i] = Math.max(0, Math.min(3, val));
                    this.setStatus(`Line ${i+1} cutscene set to ${this.cutscene[i]}`, 'info');
                });
            }
            
            const focusInput = document.getElementById(`focus-input-${i}`);
            if (focusInput) {
                focusInput.addEventListener('change', () => {
                    let val = focusInput.value.trim();
                    if (val.startsWith('[') && val.endsWith(']')) {
                        try {
                            const parsed = JSON.parse(val);
                            if (Array.isArray(parsed) && parsed.length === 2) {
                                this.focus[i] = parsed;
                                this.setStatus(`Line ${i+1} focus set to slide: ${parsed.join(' → ')}`, 'success');
                                return;
                            }
                        } catch (e) {}
                    }
                    this.focus[i] = val;
                    this.setStatus(`Line ${i+1} focus set to: ${val || '(none)'}`, 'info');
                });
            }
        }
        
        if (this.currentLineIndex > 0) {
            const activeEl = container.querySelector(`[style*="border-left: 3px solid #4caf50;"]`);
            if (activeEl) {
                activeEl.scrollIntoView({ block: 'center', behavior: 'smooth' });
            }
        }
    }
    
    getSpeakerName(speakerId) {
        const participant = this.participants.find(p => p.id === speakerId);
        return participant ? participant.name : speakerId;
    }
    
async saveDialogue() {
    if (!this.dialogueData) {
        this.setStatus('No dialogue loaded.', 'error');
        return;
    }
    
    // Collect data from UI
    for (let i = 0; i < this.lines.length; i++) {
        const cutsceneInput = document.getElementById(`cutscene-input-${i}`);
        if (cutsceneInput) {
            this.cutscene[i] = parseInt(cutsceneInput.value) || 0;
        }
        
        const focusInput = document.getElementById(`focus-input-${i}`);
        if (focusInput) {
            let val = focusInput.value.trim();
            if (val.startsWith('[') && val.endsWith(']')) {
                try {
                    const parsed = JSON.parse(val);
                    if (Array.isArray(parsed) && parsed.length === 2) {
                        this.focus[i] = parsed;
                        continue;
                    }
                } catch (e) {}
            }
            this.focus[i] = val;
        }
    }
    
    const updatedData = {
        ...this.dialogueData,
        cutscene: this.cutscene,
        focus: this.focus
    };
    
    // --- FIX 4: Use Tauri FS instead of Blob download ---
    try {
        // Check if Tauri is available
        if (typeof window.__TAURI__ === 'undefined') {
            // Fallback to download
            this.downloadDialogue(updatedData);
            return;
        }
        
        // Import Tauri FS
        const { writeTextFile } = await import('@tauri-apps/plugin-fs');
        const path = `data/dialogue/${this.dialogueId}.json`;
        
        await writeTextFile(path, JSON.stringify(updatedData, null, 2));
        
        this.setStatus(`✅ Saved ${this.dialogueId}.json - ${this.lines.length} lines`, 'success');
        this.app.console.log('info', `Cutscene data saved for ${this.dialogueId}`);
        
        // Mark project dirty
        if (this.game && this.game.app) {
            this.game.app.markDirty();
            this.game.app.updateSaveStatus();
        }
        
    } catch (error) {
        console.error('Error saving dialogue:', error);
        this.setStatus(`Error saving: ${error.message}`, 'error');
        // Fallback to download if Tauri fails
        this.downloadDialogue(updatedData);
    }
}

// Helper method for fallback download
downloadDialogue(data) {
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.download = `${this.dialogueId}.json`;
    link.href = url;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    this.setStatus(`Downloaded ${this.dialogueId}.json - ${this.lines.length} lines (Tauri not available)`, 'warning');
}
    
    setStatus(message, type = 'info') {
        const el = document.getElementById('cutscene-status');
        if (!el) return;
        
        const colors = {
            info: '#888',
            success: '#4caf50',
            error: '#f44336',
            warning: '#ff9800'
        };
        el.style.color = colors[type] || '#888';
        el.textContent = message;
    }
    
close() {
    if (this.game && this.game.app) {
        this.game.app.lastOpenedEditor = null;
    }

    const panel = document.getElementById('dialogue-editor-panel');
    if (panel) {
        panel.style.display = 'none';
    }

    // --- FIX: Show cards grid ---
    const editorContent = document.getElementById('editor-content');
    if (editorContent) {
        editorContent.style.display = 'block';
        editorContent.style.visibility = 'visible';
    }

    // --- FIX: Switch to Editor tab (index 1), NOT Admin Shell ---
    const tabs = document.querySelectorAll('.tab');
    const editorTab = tabs[1];
    if (editorTab) {
        tabs.forEach(t => t.classList.remove('active'));
        editorTab.classList.add('active');
        editorTab.click();
    }
}
    
show() {
    // Store which editor is opened
    if (this.game && this.game.app) {
        this.game.app.lastOpenedEditor = 'dialogue-editor-panel';
    }

    // --- FIX: Hide cards grid ---
    const editorContent = document.getElementById('editor-content');
    if (editorContent) {
        editorContent.style.display = 'none';
        editorContent.style.visibility = 'hidden';
    }

    const panel = document.getElementById('dialogue-editor-panel');
    if (panel) {
        panel.style.display = 'block';
    }
    this.setStatus('Ready', 'info');
}

}