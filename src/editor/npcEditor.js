// NPC Editor - Minimal version
// Basic NPC template configuration only. Instance placement handled by Btools later.

export class NPCEditor {
    constructor(gameRuntime) {
        this.game = gameRuntime;
        this.currentTemplate = null;
        this.currentTemplateId = null;
        this.isNewTemplate = false;
        this.templates = {};
        this.availableDialogue = ['test_conversation', 'cutscene_test', 'kill_mission_start'];
        
        this.initUI();
        this.loadTemplates();
    }
    
    async loadTemplates() {
        try {
            const response = await fetch('data/npcs/npc_templates.json');
            if (response.ok) {
                this.templates = await response.json();
                this.populateTemplateList();
            }
        } catch (error) {
            console.warn('Could not load NPC templates:', error);
        }
    }
    
    initUI() {
        const panel = document.createElement('div');
        panel.id = 'npc-editor-panel';
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
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                <h2 style="color: #4caf50; margin: 0;">👤 NPC Editor</h2>
                <div style="display: flex; gap: 8px;">
                    <button id="npc-new-btn" style="background: #2196f3; color: #fff; border: none; padding: 6px 16px; cursor: pointer; font-family: inherit; border-radius: 3px;">+ New Template</button>
                    <button id="npc-load-btn" style="background: #ff9800; color: #fff; border: none; padding: 6px 16px; cursor: pointer; font-family: inherit; border-radius: 3px;">📂 Load</button>
                </div>
            </div>
            
            <div id="npc-list-container" style="margin-bottom: 16px; display: none;">
                <div style="color: #888; font-size: 12px; margin-bottom: 6px;">Select an NPC template:</div>
                <select id="npc-select" style="width: 100%; background: #2a2a2a; color: #c0c0c0; border: 1px solid #444; padding: 8px 12px; font-family: inherit; font-size: 13px;"></select>
                <div style="margin-top: 8px; display: flex; gap: 8px;">
                    <button id="npc-load-selected-btn" style="background: #4caf50; color: #fff; border: none; padding: 6px 16px; cursor: pointer; font-family: inherit; border-radius: 3px;">Load Selected</button>
                    <button id="npc-cancel-load-btn" style="background: #666; color: #fff; border: none; padding: 6px 16px; cursor: pointer; font-family: inherit; border-radius: 3px;">Cancel</button>
                </div>
            </div>
            
            <div id="npc-editor-content" style="display: none;">
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px;">
                    <div>
                        <label style="color: #888; font-size: 11px; display: block; margin-bottom: 4px;">Template ID</label>
                        <input id="npc-id-input" type="text" style="width: 100%; background: #2a2a2a; color: #c0c0c0; border: 1px solid #444; padding: 6px 10px; font-family: inherit; font-size: 13px; border-radius: 3px;">
                    </div>
                    <div>
                        <label style="color: #888; font-size: 11px; display: block; margin-bottom: 4px;">Name</label>
                        <input id="npc-name-input" type="text" style="width: 100%; background: #2a2a2a; color: #c0c0c0; border: 1px solid #444; padding: 6px 10px; font-family: inherit; font-size: 13px; border-radius: 3px;">
                    </div>
                    <div>
                        <label style="color: #888; font-size: 11px; display: block; margin-bottom: 4px;">Faction</label>
                        <select id="npc-faction-select" style="width: 100%; background: #2a2a2a; color: #c0c0c0; border: 1px solid #444; padding: 6px 10px; font-family: inherit; font-size: 13px; border-radius: 3px;">
                            <option value="neutral">Neutral</option>
                            <option value="friendly">Friendly</option>
                            <option value="hostile">Hostile</option>
                        </select>
                    </div>
                    <div>
                        <label style="color: #888; font-size: 11px; display: block; margin-bottom: 4px;">Dialogue</label>
                        <select id="npc-dialogue-select" style="width: 100%; background: #2a2a2a; color: #c0c0c0; border: 1px solid #444; padding: 6px 10px; font-family: inherit; font-size: 13px; border-radius: 3px;">
                            <option value="">(none)</option>
                            ${this.availableDialogue.map(d => `<option value="${d}">${d}</option>`).join('')}
                        </select>
                    </div>
                </div>
                
                <div style="display: flex; gap: 8px; border-top: 1px solid #333; padding-top: 12px;">
                    <button id="npc-save-btn" style="background: #4caf50; color: #fff; border: none; padding: 8px 20px; cursor: pointer; font-family: inherit; font-size: 13px; border-radius: 3px;">💾 Save Template</button>
                    <button id="npc-export-btn" style="background: #ff9800; color: #fff; border: none; padding: 8px 20px; cursor: pointer; font-family: inherit; font-size: 13px; border-radius: 3px;">📤 Export JSON</button>
                    <button id="npc-close-btn" style="background: #666; color: #fff; border: none; padding: 8px 20px; cursor: pointer; font-family: inherit; font-size: 13px; border-radius: 3px; margin-left: auto;">Close</button>
                </div>
            </div>
        `;
        
        const editorContainer = document.getElementById('editor-container');
        if (editorContainer) {
            editorContainer.appendChild(panel);
        }
        
        this.setupEvents();
    }
    
    populateTemplateList() {
        const select = document.getElementById('npc-select');
        if (!select) return;
        
        select.innerHTML = '';
        const keys = Object.keys(this.templates);
        
        if (keys.length === 0) {
            const option = document.createElement('option');
            option.value = '';
            option.textContent = 'No templates found';
            select.appendChild(option);
            return;
        }
        
        for (const key of keys) {
            const option = document.createElement('option');
            option.value = key;
            const template = this.templates[key];
            option.textContent = `${template.name || key} (${key})`;
            select.appendChild(option);
        }
    }
    
    setupEvents() {
        document.getElementById('npc-new-btn')?.addEventListener('click', () => {
            this.newTemplate();
        });
        
        document.getElementById('npc-load-btn')?.addEventListener('click', () => {
            document.getElementById('npc-list-container').style.display = 'block';
        });
        
        document.getElementById('npc-cancel-load-btn')?.addEventListener('click', () => {
            document.getElementById('npc-list-container').style.display = 'none';
        });
        
        document.getElementById('npc-load-selected-btn')?.addEventListener('click', () => {
            const select = document.getElementById('npc-select');
            if (select && select.value) {
                this.loadTemplate(select.value);
                document.getElementById('npc-list-container').style.display = 'none';
            }
        });
        
        document.getElementById('npc-save-btn')?.addEventListener('click', () => {
            this.saveTemplate();
        });
        
        document.getElementById('npc-export-btn')?.addEventListener('click', () => {
            this.exportTemplate();
        });
        
        document.getElementById('npc-close-btn')?.addEventListener('click', () => {
            this.close();
        });
    }
    
    newTemplate() {
        this.currentTemplate = {
            name: 'New NPC',
            type: 'npc',
            template: 'new_npc',
            components: {
                transform: { width: 32, height: 48 },
                sprite: { asset: 'player.png', width: 32, height: 48 },
                health: { maxHealth: 50, currentHealth: 50 },
                npc: {
                    name: 'New NPC',
                    faction: 'neutral',
                    dialogue: 'test_conversation',
                    interactionRadius: 50
                }
            }
        };
        this.currentTemplateId = 'new_npc';
        this.isNewTemplate = true;
        
        this.loadTemplateIntoUI(this.currentTemplate);
        document.getElementById('npc-editor-content').style.display = 'block';
    }
    
    loadTemplate(templateId) {
        if (!this.templates[templateId]) {
            alert(`Template "${templateId}" not found`);
            return;
        }
        
        this.currentTemplate = JSON.parse(JSON.stringify(this.templates[templateId]));
        this.currentTemplateId = templateId;
        this.isNewTemplate = false;
        
        this.loadTemplateIntoUI(this.currentTemplate);
        document.getElementById('npc-editor-content').style.display = 'block';
        
        console.log(`NPC template loaded: ${this.currentTemplate.name}`);
    }
    
    loadTemplateIntoUI(data) {
        const npc = data.components?.npc || {};
        
        document.getElementById('npc-id-input').value = data.template || data.id || '';
        document.getElementById('npc-name-input').value = npc.name || data.name || '';
        document.getElementById('npc-faction-select').value = npc.faction || 'neutral';
        document.getElementById('npc-dialogue-select').value = npc.dialogue || '';
    }
    
    getTemplateData() {
        const id = document.getElementById('npc-id-input').value || 'new_npc';
        const name = document.getElementById('npc-name-input').value || 'NPC';
        const faction = document.getElementById('npc-faction-select').value;
        const dialogue = document.getElementById('npc-dialogue-select').value || null;
        
        return {
            name: name,
            type: 'npc',
            template: id,
            components: {
                transform: { width: 32, height: 48 },
                sprite: { asset: 'player.png', width: 32, height: 48 },
                health: { maxHealth: 50, currentHealth: 50 },
                npc: {
                    name: name,
                    faction: faction,
                    dialogue: dialogue,
                    interactionRadius: 50
                }
            }
        };
    }
    
    async saveTemplate() {
        const data = this.getTemplateData();
        const id = data.template;
        
        if (!id) {
            alert('Template ID is required');
            return;
        }
        
        this.templates[id] = data;
        
        try {
            const json = JSON.stringify(this.templates, null, 2);
            
            if (window.__TAURI__) {
                const { writeTextFile } = window.__TAURI__.fs;
                await writeTextFile('data/npcs/npc_templates.json', json);
                alert(`Template saved: ${data.name}`);
            } else {
                const blob = new Blob([json], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.download = 'npc_templates.json';
                link.href = url;
                link.click();
                URL.revokeObjectURL(url);
                alert('Template downloaded. To save, replace the file manually.');
            }
            
            this.populateTemplateList();
        } catch (error) {
            console.error('Save error:', error);
            alert(`Save failed: ${error.message}`);
        }
    }
    
    exportTemplate() {
        const data = this.getTemplateData();
        const json = JSON.stringify(data, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.download = `${data.template || 'npc'}.json`;
        link.href = url;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }
    
close() {
    if (this.game && this.game.app) {
        this.game.app.lastOpenedEditor = null;
    }

    const panel = document.getElementById('npc-editor-panel');
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
        this.game.app.lastOpenedEditor = 'npc-editor-panel';
    }

    // --- FIX: Hide cards grid ---
    const editorContent = document.getElementById('editor-content');
    if (editorContent) {
        editorContent.style.display = 'none';
        editorContent.style.visibility = 'hidden';
    }

    const panel = document.getElementById('npc-editor-panel');
        if (panel) {
            panel.style.display = 'block';
        }
        if (!this.currentTemplate) {
            this.newTemplate();
        }
        this.populateTemplateList();
}


}