// Mission Editor
// Lightweight editor for mission creation and editing

import { MissionLoader } from '../utils/missionLoader.js';

export class MissionEditor {
    constructor(gameRuntime) {
        this.game = gameRuntime;
        this.missionLoader = new MissionLoader();
        this.currentMission = null;
        this.currentMissionId = null;
        this.isNewMission = false;
        this.editingIndex = -1;
        this.availableNpcs = [];
        this.availableLocations = [];
        this.availableItems = [];
        this.availableEnemies = [];
        
        this.initUI();
        this.loadGameData();
    }
    
    async loadGameData() {
        try {
            const response = await fetch('data/npcs/npc_templates.json');
            if (response.ok) {
                const data = await response.json();
                this.availableNpcs = Object.keys(data);
            }
        } catch (e) {
            console.warn('Could not load NPC data:', e);
        }
        
        try {
            const locations = ['pine_ridge', 'test_outside', 'abandoned_house'];
            this.availableLocations = locations;
        } catch (e) {
            console.warn('Could not load location data:', e);
        }
        
        this.availableItems = ['food', 'water', 'medicine', 'weapon', 'tool'];
        this.availableEnemies = ['enemy', 'zombie', 'bandit'];
    }
    
    initUI() {
        const panel = document.createElement('div');
        panel.id = 'mission-editor-panel';
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
                <h2 style="color: #4caf50; margin: 0;">📋 Mission Editor</h2>
                <div style="display: flex; gap: 8px;">
                    <button id="mission-new-btn" style="background: #2196f3; color: #fff; border: none; padding: 6px 16px; cursor: pointer; font-family: inherit; border-radius: 3px;">+ New Mission</button>
                    <button id="mission-load-btn" style="background: #ff9800; color: #fff; border: none; padding: 6px 16px; cursor: pointer; font-family: inherit; border-radius: 3px;">📂 Load</button>
                </div>
            </div>
            
            <div id="mission-list-container" style="margin-bottom: 16px; display: none;">
                <div style="color: #888; font-size: 12px; margin-bottom: 6px;">Select a mission to edit:</div>
                <select id="mission-select" style="width: 100%; background: #2a2a2a; color: #c0c0c0; border: 1px solid #444; padding: 8px 12px; font-family: inherit; font-size: 13px;"></select>
                <div style="margin-top: 8px; display: flex; gap: 8px;">
                    <button id="mission-load-selected-btn" style="background: #4caf50; color: #fff; border: none; padding: 6px 16px; cursor: pointer; font-family: inherit; border-radius: 3px;">Load Selected</button>
                    <button id="mission-cancel-load-btn" style="background: #666; color: #fff; border: none; padding: 6px 16px; cursor: pointer; font-family: inherit; border-radius: 3px;">Cancel</button>
                </div>
            </div>
            
            <div id="mission-editor-content" style="display: none;">
                <div style="display: flex; gap: 0; border-bottom: 2px solid #333; margin-bottom: 16px;">
                    <button class="mission-tab active" data-tab="editor" style="background: none; border: none; padding: 8px 16px; color: #4caf50; cursor: pointer; font-family: inherit; font-size: 13px; border-bottom: 2px solid #4caf50;">✏️ Editor</button>
                    <button class="mission-tab" data-tab="json" style="background: none; border: none; padding: 8px 16px; color: #888; cursor: pointer; font-family: inherit; font-size: 13px; border-bottom: 2px solid transparent;">📄 JSON</button>
                </div>
                
                <div id="mission-editor-tab">
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px;">
                        <div>
                            <label style="color: #888; font-size: 11px; display: block; margin-bottom: 4px;">Mission ID</label>
                            <input id="mission-id-input" type="text" style="width: 100%; background: #2a2a2a; color: #c0c0c0; border: 1px solid #444; padding: 6px 10px; font-family: inherit; font-size: 13px; border-radius: 3px;">
                        </div>
                        <div>
                            <label style="color: #888; font-size: 11px; display: block; margin-bottom: 4px;">Mission Name</label>
                            <input id="mission-name-input" type="text" style="width: 100%; background: #2a2a2a; color: #c0c0c0; border: 1px solid #444; padding: 6px 10px; font-family: inherit; font-size: 13px; border-radius: 3px;">
                        </div>
                        <div style="grid-column: span 2;">
                            <label style="color: #888; font-size: 11px; display: block; margin-bottom: 4px;">Description</label>
                            <input id="mission-desc-input" type="text" style="width: 100%; background: #2a2a2a; color: #c0c0c0; border: 1px solid #444; padding: 6px 10px; font-family: inherit; font-size: 13px; border-radius: 3px;">
                        </div>
                        <div>
                            <label style="color: #888; font-size: 11px; display: block; margin-bottom: 4px;">Start NPC</label>
                            <select id="mission-start-npc" style="width: 100%; background: #2a2a2a; color: #c0c0c0; border: 1px solid #444; padding: 6px 10px; font-family: inherit; font-size: 13px; border-radius: 3px;">
                                <option value="">(none)</option>
                            </select>
                        </div>
                        <div>
                            <label style="color: #888; font-size: 11px; display: block; margin-bottom: 4px;">Start Location</label>
                            <select id="mission-start-location" style="width: 100%; background: #2a2a2a; color: #c0c0c0; border: 1px solid #444; padding: 6px 10px; font-family: inherit; font-size: 13px; border-radius: 3px;">
                                <option value="">(none)</option>
                            </select>
                        </div>
                    </div>
                    
                    <div style="margin-bottom: 16px;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                            <span style="color: #888; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Objectives</span>
                            <button id="mission-add-objective-btn" style="background: #4caf50; color: #fff; border: none; padding: 4px 12px; cursor: pointer; font-family: inherit; font-size: 12px; border-radius: 3px;">+ Add Objective</button>
                        </div>
                        <div id="mission-objectives-container" style="border: 1px solid #333; border-radius: 4px; padding: 8px; min-height: 80px; background: #111;">
                            <div style="color: #666; font-size: 12px; text-align: center; padding: 20px 0;">No objectives. Click "Add Objective" to start.</div>
                        </div>
                    </div>
                    
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px; padding: 12px; border: 1px solid #333; border-radius: 4px;">
                        <div style="grid-column: span 2;">
                            <span style="color: #888; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Rewards</span>
                        </div>
                        <div>
                            <label style="color: #888; font-size: 11px; display: block; margin-bottom: 4px;">XP</label>
                            <input id="mission-xp-input" type="number" min="0" value="0" style="width: 100%; background: #2a2a2a; color: #c0c0c0; border: 1px solid #444; padding: 6px 10px; font-family: inherit; font-size: 13px; border-radius: 3px;">
                        </div>
                        <div>
                            <label style="color: #888; font-size: 11px; display: block; margin-bottom: 4px;">Reward Items</label>
                            <div style="display: flex; gap: 4px;">
                                <select id="mission-reward-item-select" style="flex: 1; background: #2a2a2a; color: #c0c0c0; border: 1px solid #444; padding: 6px 10px; font-family: inherit; font-size: 13px; border-radius: 3px;">
                                    <option value="food">Food</option>
                                    <option value="water">Water</option>
                                    <option value="medicine">Medicine</option>
                                </select>
                                <input id="mission-reward-qty-input" type="number" min="1" value="1" style="width: 60px; background: #2a2a2a; color: #c0c0c0; border: 1px solid #444; padding: 6px 10px; font-family: inherit; font-size: 13px; border-radius: 3px;">
                                <button id="mission-add-reward-btn" style="background: #2196f3; color: #fff; border: none; padding: 6px 12px; cursor: pointer; font-family: inherit; font-size: 12px; border-radius: 3px;">Add</button>
                            </div>
                            <div id="mission-reward-items-list" style="margin-top: 4px; display: flex; flex-wrap: wrap; gap: 4px;"></div>
                        </div>
                    </div>
                    
                    <div style="display: flex; gap: 8px; border-top: 1px solid #333; padding-top: 12px;">
                        <button id="mission-save-btn" style="background: #4caf50; color: #fff; border: none; padding: 8px 20px; cursor: pointer; font-family: inherit; font-size: 13px; border-radius: 3px;">💾 Save Mission</button>
                        <button id="mission-export-btn" style="background: #ff9800; color: #fff; border: none; padding: 8px 20px; cursor: pointer; font-family: inherit; font-size: 13px; border-radius: 3px;">📤 Export JSON</button>
                        <button id="mission-close-btn" style="background: #666; color: #fff; border: none; padding: 8px 20px; cursor: pointer; font-family: inherit; font-size: 13px; border-radius: 3px; margin-left: auto;">Close</button>
                    </div>
                </div>
                
                <div id="mission-json-tab" style="display: none;">
                    <textarea id="mission-json-textarea" style="width: 100%; height: 400px; background: #0a0a0a; color: #4caf50; border: 1px solid #333; padding: 12px; font-family: 'Consolas', 'Courier New', monospace; font-size: 12px; resize: vertical; border-radius: 4px;"></textarea>
                    <div style="margin-top: 8px; display: flex; gap: 8px;">
                        <button id="mission-json-apply-btn" style="background: #4caf50; color: #fff; border: none; padding: 6px 16px; cursor: pointer; font-family: inherit; border-radius: 3px;">Apply Changes</button>
                        <button id="mission-json-refresh-btn" style="background: #666; color: #fff; border: none; padding: 6px 16px; cursor: pointer; font-family: inherit; border-radius: 3px;">Refresh</button>
                    </div>
                </div>
            </div>
        `;
        
        const editorContainer = document.getElementById('editor-container');
        if (editorContainer) {
            editorContainer.appendChild(panel);
        }
        
        this.setupEvents();
        this.populateDropdowns();
    }
    
    populateDropdowns() {
        const npcSelect = document.getElementById('mission-start-npc');
        if (npcSelect) {
            const defaults = ['survivor', 'hunter', 'merchant', 'quest_giver'];
            for (const npc of defaults) {
                const option = document.createElement('option');
                option.value = npc;
                option.textContent = npc.charAt(0).toUpperCase() + npc.slice(1);
                npcSelect.appendChild(option);
            }
        }
        
        const locSelect = document.getElementById('mission-start-location');
        if (locSelect) {
            const locations = ['pine_ridge', 'test_outside', 'abandoned_house'];
            for (const loc of locations) {
                const option = document.createElement('option');
                option.value = loc;
                option.textContent = loc.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                locSelect.appendChild(option);
            }
        }
    }
    
    setupEvents() {
        document.querySelectorAll('.mission-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                document.querySelectorAll('.mission-tab').forEach(t => {
                    t.classList.remove('active');
                    t.style.color = '#888';
                    t.style.borderBottom = '2px solid transparent';
                });
                tab.classList.add('active');
                tab.style.color = '#4caf50';
                tab.style.borderBottom = '2px solid #4caf50';
                
                const tabName = tab.dataset.tab;
                document.getElementById('mission-editor-tab').style.display = tabName === 'editor' ? 'block' : 'none';
                document.getElementById('mission-json-tab').style.display = tabName === 'json' ? 'block' : 'none';
                
                if (tabName === 'json') {
                    this.updateJsonView();
                }
            });
        });
        
        document.getElementById('mission-new-btn')?.addEventListener('click', () => {
            this.newMission();
        });
        
        document.getElementById('mission-load-btn')?.addEventListener('click', () => {
            this.showMissionList();
        });
        
        document.getElementById('mission-cancel-load-btn')?.addEventListener('click', () => {
            document.getElementById('mission-list-container').style.display = 'none';
        });
        
        document.getElementById('mission-load-selected-btn')?.addEventListener('click', () => {
            const select = document.getElementById('mission-select');
            if (select && select.value) {
                this.loadMission(select.value);
                document.getElementById('mission-list-container').style.display = 'none';
            }
        });
        
        document.getElementById('mission-add-objective-btn')?.addEventListener('click', () => {
            this.addObjective();
        });
        
        document.getElementById('mission-add-reward-btn')?.addEventListener('click', () => {
            this.addReward();
        });
        
        document.getElementById('mission-save-btn')?.addEventListener('click', () => {
            this.saveMission();
        });
        
        document.getElementById('mission-export-btn')?.addEventListener('click', () => {
            this.exportMission();
        });
        
        document.getElementById('mission-close-btn')?.addEventListener('click', () => {
            this.close();
        });
        
        document.getElementById('mission-json-apply-btn')?.addEventListener('click', () => {
            this.applyJsonChanges();
        });
        
        document.getElementById('mission-json-refresh-btn')?.addEventListener('click', () => {
            this.updateJsonView();
        });
    }
    
    async showMissionList() {
        const container = document.getElementById('mission-list-container');
        const select = document.getElementById('mission-select');
        container.style.display = 'block';
        select.innerHTML = '';
        
        const missions = ['first_steps', 'kill_test', 'example_test_mission'];
        
        for (const id of missions) {
            const option = document.createElement('option');
            option.value = id;
            try {
                const response = await fetch(`data/missions/${id}.json`);
                if (response.ok) {
                    const data = await response.json();
                    option.textContent = `${data.name || id} (${id})`;
                } else {
                    option.textContent = id;
                }
            } catch {
                option.textContent = id;
            }
            select.appendChild(option);
        }
        
        if (select.options.length > 0) {
            select.selectedIndex = 0;
        }
    }
    
    async loadMission(missionId) {
        try {
            const response = await fetch(`data/missions/${missionId}.json`);
            if (!response.ok) {
                throw new Error(`Failed to load mission: ${missionId}`);
            }
            const data = await response.json();
            
            this.currentMission = data;
            this.currentMissionId = missionId;
            this.isNewMission = false;
            
            this.loadMissionIntoUI(data);
            this.showEditor();
            
            console.log(`Mission loaded: ${data.name}`);
        } catch (error) {
            console.error('Error loading mission:', error);
            alert(`Failed to load mission: ${error.message}`);
        }
    }
    
    newMission() {
        this.currentMission = {
            id: `mission_${Date.now()}`,
            name: 'New Mission',
            description: 'Mission description',
            startNpc: '',
            startLocation: '',
            status: 'inactive',
            objectives: [],
            rewards: {
                items: [],
                xp: 0
            }
        };
        this.currentMissionId = this.currentMission.id;
        this.isNewMission = true;
        
        this.loadMissionIntoUI(this.currentMission);
        this.showEditor();
    }
    
    loadMissionIntoUI(data) {
        document.getElementById('mission-id-input').value = data.id || '';
        document.getElementById('mission-name-input').value = data.name || '';
        document.getElementById('mission-desc-input').value = data.description || '';
        document.getElementById('mission-start-npc').value = data.startNpc || '';
        document.getElementById('mission-start-location').value = data.startLocation || '';
        document.getElementById('mission-xp-input').value = data.rewards?.xp || 0;
        
        this.renderObjectives(data.objectives || []);
        this.renderRewards(data.rewards?.items || []);
    }
    
    renderObjectives(objectives) {
        const container = document.getElementById('mission-objectives-container');
        if (!container) return;
        
        if (!objectives || objectives.length === 0) {
            container.innerHTML = `<div style="color: #666; font-size: 12px; text-align: center; padding: 20px 0;">No objectives. Click "Add Objective" to start.</div>`;
            return;
        }
        
        let html = '';
        objectives.forEach((obj, index) => {
            const isCompleted = obj.completed ? '✓' : '□';
            html += `
                <div class="objective-card" data-index="${index}" style="background: #1a1a1a; border: 1px solid #333; border-radius: 4px; padding: 10px 12px; margin-bottom: 8px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                        <span style="color: #4caf50; font-weight: bold; font-size: 13px;">#${index + 1} ${isCompleted} ${obj.description || obj.type || 'Objective'}</span>
                        <div style="display: flex; gap: 4px;">
                            <button class="obj-move-up" data-index="${index}" style="background: #555; color: #fff; border: none; padding: 2px 8px; cursor: pointer; font-size: 11px; border-radius: 2px;">▲</button>
                            <button class="obj-move-down" data-index="${index}" style="background: #555; color: #fff; border: none; padding: 2px 8px; cursor: pointer; font-size: 11px; border-radius: 2px;">▼</button>
                            <button class="obj-remove" data-index="${index}" style="background: #f44336; color: #fff; border: none; padding: 2px 8px; cursor: pointer; font-size: 11px; border-radius: 2px;">✕</button>
                        </div>
                    </div>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
                        <div>
                            <label style="color: #888; font-size: 10px; display: block;">Type</label>
                            <select class="obj-type" data-index="${index}" style="width: 100%; background: #2a2a2a; color: #c0c0c0; border: 1px solid #444; padding: 4px 8px; font-family: inherit; font-size: 12px; border-radius: 2px;">
                                <option value="talk_to_npc" ${obj.type === 'talk_to_npc' ? 'selected' : ''}>Talk to NPC</option>
                                <option value="reach_location" ${obj.type === 'reach_location' ? 'selected' : ''}>Reach Location</option>
                                <option value="collect_item" ${obj.type === 'collect_item' ? 'selected' : ''}>Collect Item</option>
                                <option value="kill_enemy" ${obj.type === 'kill_enemy' ? 'selected' : ''}>Kill Enemy</option>
                                <option value="kill_specific_enemy" ${obj.type === 'kill_specific_enemy' ? 'selected' : ''}>Kill Specific Enemy</option>
                            </select>
                        </div>
                        <div>
                            <label style="color: #888; font-size: 10px; display: block;">Description</label>
                            <input class="obj-desc" data-index="${index}" type="text" value="${obj.description || ''}" style="width: 100%; background: #2a2a2a; color: #c0c0c0; border: 1px solid #444; padding: 4px 8px; font-family: inherit; font-size: 12px; border-radius: 2px;">
                        </div>
                    </div>
                    <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; margin-top: 4px;">
                        <div>
                            <label style="color: #888; font-size: 10px; display: block;">Target</label>
                            <input class="obj-target" data-index="${index}" type="text" value="${obj.target || ''}" placeholder="e.g. survivor" style="width: 100%; background: #2a2a2a; color: #c0c0c0; border: 1px solid #444; padding: 4px 8px; font-family: inherit; font-size: 12px; border-radius: 2px;">
                        </div>
                        <div>
                            <label style="color: #888; font-size: 10px; display: block;">Item</label>
                            <input class="obj-item" data-index="${index}" type="text" value="${obj.item || ''}" placeholder="e.g. medicine" style="width: 100%; background: #2a2a2a; color: #c0c0c0; border: 1px solid #444; padding: 4px 8px; font-family: inherit; font-size: 12px; border-radius: 2px;">
                        </div>
                        <div>
                            <label style="color: #888; font-size: 10px; display: block;">Quantity</label>
                            <input class="obj-quantity" data-index="${index}" type="number" min="1" value="${obj.quantity || obj.required || 1}" style="width: 100%; background: #2a2a2a; color: #c0c0c0; border: 1px solid #444; padding: 4px 8px; font-family: inherit; font-size: 12px; border-radius: 2px;">
                        </div>
                    </div>
                </div>
            `;
        });
        
        container.innerHTML = html;
        
        container.querySelectorAll('.obj-move-up').forEach(btn => {
            btn.addEventListener('click', () => this.moveObjective(parseInt(btn.dataset.index), -1));
        });
        container.querySelectorAll('.obj-move-down').forEach(btn => {
            btn.addEventListener('click', () => this.moveObjective(parseInt(btn.dataset.index), 1));
        });
        container.querySelectorAll('.obj-remove').forEach(btn => {
            btn.addEventListener('click', () => this.removeObjective(parseInt(btn.dataset.index)));
        });
        
        container.querySelectorAll('select, input').forEach(el => {
            el.addEventListener('change', () => this.syncObjectivesFromUI());
            el.addEventListener('input', () => this.syncObjectivesFromUI());
        });
    }
    
    syncObjectivesFromUI() {
        if (!this.currentMission) return;
        
        const container = document.getElementById('mission-objectives-container');
        if (!container) return;
        
        const cards = container.querySelectorAll('.objective-card');
        const objectives = [];
        
        cards.forEach(card => {
            const index = parseInt(card.dataset.index);
            const type = card.querySelector('.obj-type')?.value || '';
            const desc = card.querySelector('.obj-desc')?.value || '';
            const target = card.querySelector('.obj-target')?.value || '';
            const item = card.querySelector('.obj-item')?.value || '';
            const quantity = parseInt(card.querySelector('.obj-quantity')?.value) || 1;
            
            const obj = {
                id: `obj_${Date.now()}_${index}`,
                type: type,
                description: desc,
                completed: false
            };
            
            if (target) obj.target = target;
            if (item) obj.item = item;
            if (quantity > 1) obj.quantity = quantity;
            
            objectives.push(obj);
        });
        
        this.currentMission.objectives = objectives;
    }
    
    renderRewards(items) {
        const container = document.getElementById('mission-reward-items-list');
        if (!container) return;
        
        if (!items || items.length === 0) {
            container.innerHTML = '<span style="color: #666; font-size: 11px;">No reward items</span>';
            return;
        }
        
        let html = '';
        items.forEach((item, index) => {
            html += `
                <span style="background: #2a2a2a; padding: 2px 8px; border-radius: 3px; font-size: 11px; border: 1px solid #444;">
                    ${item.item} ×${item.quantity}
                    <button class="reward-remove" data-index="${index}" style="background: none; border: none; color: #f44336; cursor: pointer; margin-left: 4px;">✕</button>
                </span>
            `;
        });
        
        container.innerHTML = html;
        
        container.querySelectorAll('.reward-remove').forEach(btn => {
            btn.addEventListener('click', () => {
                const idx = parseInt(btn.dataset.index);
                if (this.currentMission && this.currentMission.rewards) {
                    this.currentMission.rewards.items.splice(idx, 1);
                    this.renderRewards(this.currentMission.rewards.items);
                }
            });
        });
    }
    
    addObjective() {
        if (!this.currentMission) {
            this.newMission();
        }
        
        if (!this.currentMission.objectives) {
            this.currentMission.objectives = [];
        }
        
        this.currentMission.objectives.push({
            id: `obj_${Date.now()}`,
            type: 'talk_to_npc',
            target: '',
            description: 'New objective',
            completed: false
        });
        
        this.renderObjectives(this.currentMission.objectives);
    }
    
    moveObjective(index, direction) {
        if (!this.currentMission || !this.currentMission.objectives) return;
        
        const newIndex = index + direction;
        if (newIndex < 0 || newIndex >= this.currentMission.objectives.length) return;
        
        const temp = this.currentMission.objectives[index];
        this.currentMission.objectives[index] = this.currentMission.objectives[newIndex];
        this.currentMission.objectives[newIndex] = temp;
        
        this.renderObjectives(this.currentMission.objectives);
    }
    
    removeObjective(index) {
        if (!this.currentMission || !this.currentMission.objectives) return;
        if (!confirm(`Remove objective #${index + 1}?`)) return;
        
        this.currentMission.objectives.splice(index, 1);
        this.renderObjectives(this.currentMission.objectives);
    }
    
    addReward() {
        const select = document.getElementById('mission-reward-item-select');
        const qtyInput = document.getElementById('mission-reward-qty-input');
        
        if (!select || !qtyInput) return;
        
        if (!this.currentMission) {
            this.newMission();
        }
        
        if (!this.currentMission.rewards) {
            this.currentMission.rewards = { items: [], xp: 0 };
        }
        
        this.currentMission.rewards.items.push({
            item: select.value,
            quantity: parseInt(qtyInput.value) || 1
        });
        
        this.renderRewards(this.currentMission.rewards.items);
    }
    
    updateJsonView() {
        const textarea = document.getElementById('mission-json-textarea');
        if (!textarea || !this.currentMission) return;
        
        try {
            const cleanData = JSON.parse(JSON.stringify(this.currentMission));
            textarea.value = JSON.stringify(cleanData, null, 2);
        } catch (e) {
            textarea.value = 'Error: Invalid mission data';
        }
    }
    
    applyJsonChanges() {
        const textarea = document.getElementById('mission-json-textarea');
        if (!textarea) return;
        
        try {
            const data = JSON.parse(textarea.value);
            this.currentMission = data;
            this.loadMissionIntoUI(data);
            alert('Mission updated from JSON');
        } catch (e) {
            alert(`Invalid JSON: ${e.message}`);
        }
    }
    
    showEditor() {
        document.getElementById('mission-editor-content').style.display = 'block';
    }
    
    getMissionData() {
        this.syncObjectivesFromUI();
        
        if (!this.currentMission) return null;
        
        return {
            id: document.getElementById('mission-id-input').value || this.currentMission.id,
            name: document.getElementById('mission-name-input').value || this.currentMission.name,
            description: document.getElementById('mission-desc-input').value || this.currentMission.description,
            startNpc: document.getElementById('mission-start-npc').value || this.currentMission.startNpc,
            startLocation: document.getElementById('mission-start-location').value || this.currentMission.startLocation,
            status: this.currentMission.status || 'inactive',
            objectives: this.currentMission.objectives || [],
            rewards: {
                items: this.currentMission.rewards?.items || [],
                xp: parseInt(document.getElementById('mission-xp-input').value) || 0
            }
        };
    }
    
    async saveMission() {
        const data = this.getMissionData();
        if (!data) return;
        
        if (!data.id) {
            alert('Mission ID is required');
            return;
        }
        if (!data.name) {
            alert('Mission name is required');
            return;
        }
        if (!data.objectives || data.objectives.length === 0) {
            alert('At least one objective is required');
            return;
        }
        
        try {
            if (window.__TAURI__) {
                const { writeTextFile } = window.__TAURI__.fs;
                const path = `data/missions/${data.id}.json`;
                await writeTextFile(path, JSON.stringify(data, null, 2));
                alert(`Mission saved: ${data.name}`);
            } else {
                this.exportMission();
            }
        } catch (error) {
            console.error('Save error:', error);
            alert(`Save failed: ${error.message}`);
        }
    }
    
    exportMission() {
        const data = this.getMissionData();
        if (!data) return;
        
        const json = JSON.stringify(data, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.download = `${data.id || 'mission'}.json`;
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

    const panel = document.getElementById('mission-editor-panel');
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
        this.game.app.lastOpenedEditor = 'mission-editor-panel';
    }

    // --- FIX: Hide cards grid ---
    const editorContent = document.getElementById('editor-content');
    if (editorContent) {
        editorContent.style.display = 'none';
        editorContent.style.visibility = 'hidden';
    }

    const panel = document.getElementById('mission-editor-panel');
    if (panel) {
        panel.style.display = 'block';
    }
    
    // --- FIX: Show the editor content inside the panel ---
    const editorContentDiv = document.getElementById('mission-editor-content');
    if (editorContentDiv) {
        editorContentDiv.style.display = 'block';
    }
    
    // --- FIX: If no mission exists, create a new one ---
    if (!this.currentMission) {
        this.newMission();
    }
    
    // --- FIX: Show the mission list container if we have missions ---
    // But default to showing the editor content
    const missionListContainer = document.getElementById('mission-list-container');
    if (missionListContainer) {
        missionListContainer.style.display = 'none';
    }
    
    // Make sure the editor tab is visible
    const editorTab = document.querySelector('.tab:nth-child(2)');
    if (editorTab && !editorTab.classList.contains('active')) {
        // Only switch if not already active
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        editorTab.classList.add('active');
    }
    
    this.setStatus('Ready', 'info');
}



}