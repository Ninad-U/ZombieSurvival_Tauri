// Animation Editor
// Lightweight animation creation and management

import { writeTextFile, writeFile, exists, mkdir } from '@tauri-apps/plugin-fs';

export class AnimationEditor {
    constructor(gameRuntime) {
        this.game = gameRuntime;
        this.workflow = 'existing'; // 'existing' or 'new'
        this.animationName = '';
        this.frames = [];
        this.currentFrameIndex = 0;
        this.fps = 12;
        this.loop = true;
        this.previewPlaying = false;
        this.previewInterval = null;
        this.canvas = null;
        this.ctx = null;
        this.customWidth = 32;
        this.customHeight = 32;
        this.targetCategory = 'character'; // 'character', 'item', 'object'
        this.targetSubType = 'player'; // 'player', 'npc', 'enemy', 'medicine', etc.
        this._updateInterval = null;
        
        this.initUI();
    }
    
    initUI() {
        const panel = document.createElement('div');
        panel.id = 'animation-editor-panel';
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
            <h2 style="color: #4caf50; margin-bottom: 16px;">🎬 Animation Editor</h2>
            
            <!-- Workflow Selection -->
            <div style="display: flex; gap: 16px; margin-bottom: 16px; align-items: center;">
                <label style="color: #888; font-size: 12px;">Target:</label>
                <button id="anim-workflow-existing" style="background: #4caf50; color: #fff; border: none; padding: 4px 12px; cursor: pointer; font-family: inherit; font-size: 12px; border-radius: 3px;">Existing</button>
                <button id="anim-workflow-new" style="background: #2a2a2a; color: #aaa; border: 1px solid #444; padding: 4px 12px; cursor: pointer; font-family: inherit; font-size: 12px; border-radius: 3px;">New</button>
                <span id="anim-workflow-label" style="color: #888; font-size: 11px; margin-left: 8px;">Edit existing entity's visual</span>
            </div>
            
            <!-- Category Selection (New mode only) -->
            <div id="anim-new-controls" style="display: none; gap: 16px; flex-wrap: wrap; margin-bottom: 16px;">
                <div>
                    <label style="color: #888; font-size: 12px; display: block;">Category</label>
                    <select id="anim-category-select" style="background: #2a2a2a; color: #c0c0c0; border: 1px solid #444; padding: 6px 12px; font-family: inherit; width: 150px;">
                        <option value="character">Character</option>
                        <option value="item">Item</option>
                        <option value="object">Object / Environment</option>
                    </select>
                </div>
                <div>
                    <label style="color: #888; font-size: 12px; display: block;">Sub-Type</label>
                    <select id="anim-subtype-select" style="background: #2a2a2a; color: #c0c0c0; border: 1px solid #444; padding: 6px 12px; font-family: inherit; width: 150px;">
                        <option value="player">Player</option>
                        <option value="npc">NPC</option>
                        <option value="enemy">Enemy</option>
                    </select>
                </div>
                <div id="anim-size-section" style="display: none;">
                    <label style="color: #888; font-size: 12px; display: block;">Object Size</label>
                    <select id="anim-size-select" style="background: #2a2a2a; color: #c0c0c0; border: 1px solid #444; padding: 6px 12px; font-family: inherit; width: 120px;">
                        <option value="16x16">1×1 (16×16)</option>
                        <option value="32x32" selected>2×2 (32×32)</option>
                        <option value="48x48">3×3 (48×48)</option>
                        <option value="64x64">4×4 (64×64)</option>
                        <option value="80x80">5×5 (80×80)</option>
                        <option value="custom">Custom</option>
                    </select>
                </div>
                <div id="anim-custom-size-section" style="display: none;">
                    <label style="color: #888; font-size: 12px; display: block;">Custom Size</label>
                    <div style="display: flex; gap: 4px;">
                        <input id="anim-custom-width" type="number" value="32" style="width: 50px; background: #2a2a2a; color: #c0c0c0; border: 1px solid #444; padding: 4px 6px; font-family: inherit;"> ×
                        <input id="anim-custom-height" type="number" value="32" style="width: 50px; background: #2a2a2a; color: #c0c0c0; border: 1px solid #444; padding: 4px 6px; font-family: inherit;">
                    </div>
                </div>
            </div>
            
            <!-- Existing Entity Info (Existing mode only) -->
            <div id="anim-existing-controls" style="display: block; margin-bottom: 16px;">
                <div style="display: flex; gap: 16px; flex-wrap: wrap; align-items: flex-end;">
                    <div style="flex: 1; min-width: 200px;">
                        <label style="color: #888; font-size: 12px; display: block;">Selected Entity</label>
                        <div id="anim-entity-info" style="background: #0a1a0a; border: 1px solid #2a4a2a; border-radius: 4px; padding: 10px 14px;">
                            <div style="color: #4caf50; font-weight: bold; font-size: 14px;" id="anim-entity-name">No entity selected</div>
                            <div style="color: #888; font-size: 11px; margin-top: 4px;">
                                <span id="anim-entity-id">ID: ---</span>
                                <span style="margin-left: 16px;" id="anim-entity-type">Type: ---</span>
                            </div>
                            <div style="color: #888; font-size: 11px; margin-top: 4px; border-top: 1px solid #1a3a1a; padding-top: 4px;">
                                Dimensions: <span id="anim-existing-dimensions" style="color: #4caf50;">---</span>
                            </div>
                        </div>
                    </div>
                    <div>
                        <label style="color: #888; font-size: 12px; display: block;">Animation Name</label>
                        <input id="anim-name-input" type="text" placeholder="idle" style="background: #2a2a2a; color: #c0c0c0; border: 1px solid #444; padding: 6px 12px; font-family: inherit; width: 150px;">
                    </div>
                    <div style="display: flex; gap: 8px; align-items: flex-end;">
                        <button id="anim-create-btn" style="background: #4caf50; color: #fff; border: none; padding: 6px 16px; cursor: pointer; font-family: inherit;">Create Animation</button>
                        <button id="anim-add-frame-btn" style="background: #2196f3; color: #fff; border: none; padding: 6px 16px; cursor: pointer; font-family: inherit;">Add Frame</button>
                        <button id="anim-import-frame-btn" style="background: #ff9800; color: #fff; border: none; padding: 6px 16px; cursor: pointer; font-family: inherit;">Import Frame</button>
                    </div>
                </div>
            </div>
            
            <div style="display: flex; gap: 20px; flex-wrap: wrap;">
                <!-- Preview Area -->
                <div style="border: 1px solid #444; border-radius: 4px; padding: 12px; background: #111;">
                    <div style="color: #888; font-size: 12px; margin-bottom: 8px;">Preview</div>
                    <canvas id="anim-preview-canvas" width="128" height="192" style="background: #0a0a0a; image-rendering: pixelated; width: 128px; height: 192px; display: block;"></canvas>
                    <div style="margin-top: 8px; display: flex; gap: 8px; align-items: center; flex-wrap: wrap;">
                        <button id="anim-play-btn" style="background: #ff9800; color: #fff; border: none; padding: 4px 12px; cursor: pointer; font-family: inherit;">▶ Play</button>
                        <button id="anim-delete-frame-btn" style="background: #f44336; color: #fff; border: none; padding: 4px 12px; cursor: pointer; font-family: inherit;">Delete Frame</button>
                        <span id="anim-frame-info" style="color: #888; font-size: 12px;">Frame: 0/0</span>
                        <label style="color: #888; font-size: 12px;">FPS: <input id="anim-fps-input" type="number" value="12" min="1" max="60" style="width: 50px; background: #2a2a2a; color: #c0c0c0; border: 1px solid #444; padding: 2px 6px; font-family: inherit;"></label>
                        <label style="color: #888; font-size: 12px;"><input id="anim-loop-check" type="checkbox" checked> Loop</label>
                    </div>
                </div>
                
                <!-- Frame List -->
                <div style="flex: 1; border: 1px solid #444; border-radius: 4px; padding: 12px; background: #111; min-width: 200px;">
                    <div style="color: #888; font-size: 12px; margin-bottom: 8px;">Frames</div>
                    <div id="anim-frame-list" style="display: flex; flex-wrap: wrap; gap: 8px; min-height: 60px; padding: 4px;">
                        <div style="color: #666; font-size: 12px; padding: 8px;">No frames. Click "Add Frame" to start.</div>
                    </div>
                </div>
            </div>
            
            <div style="margin-top: 16px; border-top: 1px solid #333; padding-top: 12px; display: flex; gap: 8px; flex-wrap: wrap;">
                <button id="anim-export-btn" style="background: #4caf50; color: #fff; border: none; padding: 6px 16px; cursor: pointer; font-family: inherit;">Export Animation Data</button>
                <button id="anim-save-btn" style="background: #2196f3; color: #fff; border: none; padding: 6px 16px; cursor: pointer; font-family: inherit;">💾 Save to Project</button>
                <button id="anim-close-btn" style="background: #f44336; color: #fff; border: none; padding: 6px 16px; cursor: pointer; font-family: inherit;">Close Editor</button>
                <span id="anim-status" style="color: #888; font-size: 12px; margin-left: 12px; align-self: center;"></span>
            </div>
        `;
        
        const editorContainer = document.getElementById('editor-container');
        if (editorContainer) {
            editorContainer.appendChild(panel);
        }
        
        this.setupEvents();
        this.updateSubtypeOptions();
        this.updateWorkflowUI();
        this.updateEntityInfo();
        
        // Start periodic update to catch selection changes
        this._updateInterval = setInterval(() => {
            this.updateEntityInfo();
        }, 250);
    }
    
    updateSubtypeOptions() {
        const category = document.getElementById('anim-category-select')?.value || 'character';
        const select = document.getElementById('anim-subtype-select');
        if (!select) return;
        
        const options = {
            'character': [
                { value: 'player', label: 'Player' },
                { value: 'npc', label: 'NPC' },
                { value: 'enemy', label: 'Enemy' },
                { value: 'survivor', label: 'Survivor' },
                { value: 'zombie', label: 'Zombie' },
                { value: 'bandit', label: 'Bandit' }
            ],
            'item': [
                { value: 'food', label: 'Food' },
                { value: 'water', label: 'Water' },
                { value: 'medicine', label: 'Medicine' },
                { value: 'weapon', label: 'Weapon' },
                { value: 'tool', label: 'Tool' }
            ],
            'object': [
                { value: 'campfire', label: 'Campfire' },
                { value: 'torch', label: 'Torch' },
                { value: 'barrel', label: 'Barrel' },
                { value: 'sign', label: 'Sign' },
                { value: 'chest', label: 'Chest' },
                { value: 'door', label: 'Door' },
                { value: 'machine', label: 'Machine' },
                { value: 'waterfall', label: 'Waterfall' },
                { value: 'smoke', label: 'Smoke' }
            ]
        };
        
        const currentValue = select.value;
        select.innerHTML = '';
        const cats = options[category] || options['character'];
        for (const opt of cats) {
            const option = document.createElement('option');
            option.value = opt.value;
            option.textContent = opt.label;
            select.appendChild(option);
        }
        if (currentValue) {
            const exists = Array.from(select.options).some(o => o.value === currentValue);
            if (exists) select.value = currentValue;
        }
    }
    
    updateWorkflowUI() {
        const isNew = this.workflow === 'new';
        const newControls = document.getElementById('anim-new-controls');
        const existingControls = document.getElementById('anim-existing-controls');
        const label = document.getElementById('anim-workflow-label');
        const categorySelect = document.getElementById('anim-category-select');
        const subtypeSelect = document.getElementById('anim-subtype-select');
        
        if (isNew) {
            // New mode: show category/subtype, hide entity info
            if (newControls) newControls.style.display = 'flex';
            if (existingControls) existingControls.style.display = 'none';
            if (categorySelect) categorySelect.disabled = false;
            if (subtypeSelect) subtypeSelect.disabled = false;
            if (label) label.textContent = 'Create new visual asset';
            
            // Show size options for objects
            const category = document.getElementById('anim-category-select')?.value || 'character';
            const sizeSection = document.getElementById('anim-size-section');
            const customSizeSection = document.getElementById('anim-custom-size-section');
            if (category === 'object') {
                if (sizeSection) sizeSection.style.display = 'block';
                if (customSizeSection) {
                    customSizeSection.style.display = document.getElementById('anim-size-select')?.value === 'custom' ? 'block' : 'none';
                }
            } else {
                if (sizeSection) sizeSection.style.display = 'none';
                if (customSizeSection) customSizeSection.style.display = 'none';
            }
        } else {
            // Existing mode: hide category/subtype, show entity info
            if (newControls) newControls.style.display = 'none';
            if (existingControls) existingControls.style.display = 'block';
            if (categorySelect) categorySelect.disabled = true;
            if (subtypeSelect) subtypeSelect.disabled = true;
            if (label) label.textContent = 'Edit existing entity\'s visual';
            
            // Update entity info
            this.updateEntityInfo();
        }
    }
    
    updateEntityInfo() {
        // Get the selected entity from the game's selection state
        const entity = this.game.selectedEntity;
        const nameEl = document.getElementById('anim-entity-name');
        const idEl = document.getElementById('anim-entity-id');
        const typeEl = document.getElementById('anim-entity-type');
        const dimsEl = document.getElementById('anim-existing-dimensions');
        
        if (entity) {
            // Update name
            if (nameEl) {
                nameEl.textContent = entity.name || 'Unnamed Entity';
                nameEl.style.color = '#4caf50';
            }
            
            // Update ID
            if (idEl) {
                idEl.textContent = `ID: ${entity.id || '---'}`;
                idEl.style.color = '#aaa';
            }
            
            // Update type
            if (typeEl) {
                typeEl.textContent = `Type: ${entity.type || 'unknown'}`;
                typeEl.style.color = '#aaa';
            }
            
            // Update dimensions from sprite component
            if (dimsEl) {
                const sprite = entity.components?.sprite;
                if (sprite && sprite.width && sprite.height) {
                    dimsEl.textContent = `${sprite.width} × ${sprite.height}`;
                    dimsEl.style.color = '#4caf50';
                } else {
                    dimsEl.textContent = 'No sprite dimensions';
                    dimsEl.style.color = '#888';
                }
            }
        } else {
            // No entity selected
            if (nameEl) {
                nameEl.textContent = 'No entity selected';
                nameEl.style.color = '#888';
            }
            if (idEl) {
                idEl.textContent = 'ID: ---';
                idEl.style.color = '#666';
            }
            if (typeEl) {
                typeEl.textContent = 'Type: ---';
                typeEl.style.color = '#666';
            }
            if (dimsEl) {
                dimsEl.textContent = '---';
                dimsEl.style.color = '#666';
            }
        }
    }
    
    setupEvents() {
        document.getElementById('anim-workflow-existing')?.addEventListener('click', () => {
            this.workflow = 'existing';
            document.getElementById('anim-workflow-existing').style.background = '#4caf50';
            document.getElementById('anim-workflow-existing').style.color = '#fff';
            document.getElementById('anim-workflow-new').style.background = '#2a2a2a';
            document.getElementById('anim-workflow-new').style.color = '#aaa';
            this.updateWorkflowUI();
        });
        
        document.getElementById('anim-workflow-new')?.addEventListener('click', () => {
            this.workflow = 'new';
            document.getElementById('anim-workflow-new').style.background = '#4caf50';
            document.getElementById('anim-workflow-new').style.color = '#fff';
            document.getElementById('anim-workflow-existing').style.background = '#2a2a2a';
            document.getElementById('anim-workflow-existing').style.color = '#aaa';
            this.updateWorkflowUI();
        });
        
        document.getElementById('anim-category-select')?.addEventListener('change', () => {
            this.updateSubtypeOptions();
            this.updateWorkflowUI();
        });
        
        document.getElementById('anim-size-select')?.addEventListener('change', (e) => {
            const customSection = document.getElementById('anim-custom-size-section');
            if (e.target.value === 'custom') {
                customSection.style.display = 'block';
            } else {
                customSection.style.display = 'none';
            }
        });
        
        document.getElementById('anim-create-btn')?.addEventListener('click', () => {
            this.createAnimation();
        });
        
        document.getElementById('anim-add-frame-btn')?.addEventListener('click', () => {
            this.addFrame();
        });
        
        document.getElementById('anim-import-frame-btn')?.addEventListener('click', () => {
            this.importFrame();
        });
        
        document.getElementById('anim-delete-frame-btn')?.addEventListener('click', () => {
            this.deleteCurrentFrame();
        });
        
        document.getElementById('anim-play-btn')?.addEventListener('click', () => {
            this.togglePreview();
        });
        
        document.getElementById('anim-fps-input')?.addEventListener('change', (e) => {
            this.fps = parseInt(e.target.value) || 12;
            if (this.previewPlaying) {
                this.stopPreview();
                this.startPreview();
            }
        });
        
        document.getElementById('anim-loop-check')?.addEventListener('change', (e) => {
            this.loop = e.target.checked;
        });
        
        document.getElementById('anim-export-btn')?.addEventListener('click', () => {
            this.exportAnimation();
        });
        
        document.getElementById('anim-save-btn')?.addEventListener('click', () => {
            this.saveAnimationToProject();
        });
        
        document.getElementById('anim-close-btn')?.addEventListener('click', () => {
            this.close();
        });
    }
    
    getCanvasDimensions() {
        if (this.workflow === 'existing') {
            const entity = this.game.selectedEntity;
            if (entity && entity.components && entity.components.sprite) {
                return { width: entity.components.sprite.width || 32, height: entity.components.sprite.height || 48 };
            }
            return { width: 32, height: 48 };
        } else {
            const category = document.getElementById('anim-category-select')?.value || 'character';
            if (category === 'object') {
                const sizeSelect = document.getElementById('anim-size-select');
                const val = sizeSelect?.value || '32x32';
                if (val === 'custom') {
                    const w = parseInt(document.getElementById('anim-custom-width')?.value) || 32;
                    const h = parseInt(document.getElementById('anim-custom-height')?.value) || 32;
                    return { width: w, height: h };
                }
                const parts = val.split('x');
                return { width: parseInt(parts[0]) || 32, height: parseInt(parts[1]) || 32 };
            } else {
                return { width: 32, height: 48 };
            }
        }
    }
    
    createAnimation() {
        const name = document.getElementById('anim-name-input')?.value || 'unnamed';
        this.animationName = name;
        this.frames = [];
        this.currentFrameIndex = 0;
        
        const dims = this.getCanvasDimensions();
        const width = dims.width;
        const height = dims.height;
        
        const preview = document.getElementById('anim-preview-canvas');
        if (preview) {
            preview.width = width * 2;
            preview.height = height * 2;
            preview.style.width = (width * 2) + 'px';
            preview.style.height = (height * 2) + 'px';
        }
        
        this.updateFrameList();
        this.updatePreview();
        
        console.log(`Animation "${name}" created with dimensions ${width}x${height} (${this.workflow} workflow)`);
        this.setStatus(`Animation "${name}" created (${this.frames.length} frames)`, 'success');
    }
    
    addFrame() {
        const dims = this.getCanvasDimensions();
        const width = dims.width;
        const height = dims.height;
        
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        
        ctx.clearRect(0, 0, width, height);
        
        ctx.strokeStyle = 'rgba(255,255,255,0.1)';
        ctx.lineWidth = 0.5;
        for (let x = 0; x < width; x += 8) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
            ctx.stroke();
        }
        for (let y = 0; y < height; y += 8) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            ctx.stroke();
        }
        
        ctx.strokeStyle = 'rgba(255,255,255,0.3)';
        ctx.lineWidth = 1;
        ctx.strokeRect(0, 0, width, height);
        
        const dataUrl = canvas.toDataURL('image/png');
        
        this.frames.push({
            id: this.frames.length + 1,
            dataUrl: dataUrl,
            width: width,
            height: height
        });
        
        this.currentFrameIndex = this.frames.length - 1;
        this.updateFrameList();
        this.updatePreview();
        
        
        console.log(`Frame ${this.frames.length} added`);
        this.setStatus(`Frame ${this.frames.length} added`, 'info');
    }
    
    importFrame() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/png,image/jpeg,image/gif';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (ev) => {
                const img = new Image();
                img.onload = () => {
                    const dims = this.getCanvasDimensions();
                    const width = dims.width;
                    const height = dims.height;
                    
                    const canvas = document.createElement('canvas');
                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.clearRect(0, 0, width, height);
                    ctx.imageSmoothingEnabled = false;
                    ctx.drawImage(img, 0, 0, width, height);
                    
                    const dataUrl = canvas.toDataURL('image/png');
                    this.frames.push({
                        id: this.frames.length + 1,
                        dataUrl: dataUrl,
                        width: width,
                        height: height,
                        imported: true
                    });
                    
                    this.currentFrameIndex = this.frames.length - 1;
                    this.updateFrameList();
                    this.updatePreview();
                    console.log(`Imported frame ${this.frames.length}`);
                    this.setStatus(`Imported frame ${this.frames.length}`, 'info');
                };
                img.src = ev.target.result;
            };
            reader.readAsDataURL(file);
        };
        input.click();
    }
    
    deleteCurrentFrame() {
        if (this.frames.length === 0) return;
        if (!confirm(`Delete frame ${this.currentFrameIndex + 1}?`)) return;
        
        this.frames.splice(this.currentFrameIndex, 1);
        if (this.currentFrameIndex >= this.frames.length) {
            this.currentFrameIndex = this.frames.length - 1;
        }
        if (this.currentFrameIndex < 0) this.currentFrameIndex = 0;
        
        this.updateFrameList();
        this.updatePreview();
        console.log(`Frame deleted`);
        this.setStatus(`Frame deleted`, 'info');
    }
    
    
    updateFrameList() {
        const container = document.getElementById('anim-frame-list');
        if (!container) return;
        
        if (this.frames.length === 0) {
            container.innerHTML = '<div style="color: #666; font-size: 12px; padding: 8px;">No frames. Click "Add Frame" to start.</div>';
            return;
        }
        
        let html = '';
        for (let i = 0; i < this.frames.length; i++) {
            const frame = this.frames[i];
            const active = i === this.currentFrameIndex ? 'border-color: #4caf50;' : 'border-color: #444;';
            const imported = frame.imported ? '🔹' : '⬜';
            html += `
                <div style="border: 2px solid ${active ? '#4caf50' : '#444'}; border-radius: 4px; padding: 4px; cursor: pointer; background: #0a0a0a; position: relative;" data-index="${i}">
                    <img src="${frame.dataUrl}" style="width: 48px; height: ${(48 / frame.width) * frame.height}px; image-rendering: pixelated; display: block;">
                    <div style="color: #888; font-size: 9px; text-align: center; margin-top: 2px;">#${i + 1} ${imported}</div>
                </div>
            `;
        }
        container.innerHTML = html;
        
        container.querySelectorAll('[data-index]').forEach(el => {
            el.addEventListener('click', () => {
                this.currentFrameIndex = parseInt(el.dataset.index);
                this.updateFrameList();
                this.updatePreview();
            });
        });
    }
    
    updatePreview() {
        const preview = document.getElementById('anim-preview-canvas');
        if (!preview) return;
        
        const ctx = preview.getContext('2d');
        ctx.clearRect(0, 0, preview.width, preview.height);
        
        if (this.frames.length === 0) {
            ctx.fillStyle = '#333';
            ctx.font = '12px monospace';
            ctx.textAlign = 'center';
            ctx.fillText('No frames', preview.width/2, preview.height/2);
            return;
        }
        
        const frame = this.frames[this.currentFrameIndex];
        if (!frame) return;
        
        const img = new Image();
        img.onload = () => {
            ctx.clearRect(0, 0, preview.width, preview.height);
            const scale = Math.min(preview.width / frame.width, preview.height / frame.height) * 0.9;
            const dw = frame.width * scale;
            const dh = frame.height * scale;
            const dx = (preview.width - dw) / 2;
            const dy = (preview.height - dh) / 2;
            ctx.imageSmoothingEnabled = false;
            ctx.drawImage(img, dx, dy, dw, dh);
        };
        img.src = frame.dataUrl;
        
        document.getElementById('anim-frame-info').textContent = 
            `Frame: ${this.currentFrameIndex + 1}/${this.frames.length}`;
    }
    
    togglePreview() {
        if (this.previewPlaying) {
            this.stopPreview();
        } else {
            this.startPreview();
        }
    }
    
    startPreview() {
        if (this.frames.length < 2) {
            alert('Add at least 2 frames to preview.');
            return;
        }
        
        this.previewPlaying = true;
        document.getElementById('anim-play-btn').textContent = '⏹ Stop';
        this.currentFrameIndex = 0;
        this.updatePreview();
        
        const interval = 1000 / this.fps;
        this.previewInterval = setInterval(() => {
            this.currentFrameIndex++;
            if (this.currentFrameIndex >= this.frames.length) {
                if (this.loop) {
                    this.currentFrameIndex = 0;
                } else {
                    this.stopPreview();
                    this.currentFrameIndex = this.frames.length - 1;
                    return;
                }
            }
            this.updateFrameList();
            this.updatePreview();
        }, interval);
    }
    
    stopPreview() {
        this.previewPlaying = false;
        if (this.previewInterval) {
            clearInterval(this.previewInterval);
            this.previewInterval = null;
        }
        document.getElementById('anim-play-btn').textContent = '▶ Play';
    }
    
    exportAnimation() {
        if (this.frames.length === 0) {
            alert('No frames to export.');
            return;
        }
        
        const category = document.getElementById('anim-category-select')?.value || 'character';
        const subtype = document.getElementById('anim-subtype-select')?.value || 'player';
        
        const data = {
            name: this.animationName || 'unnamed',
            workflow: this.workflow,
            category: category,
            subType: subtype,
            fps: this.fps,
            loop: this.loop,
            frames: this.frames.map((f, i) => ({
                index: i + 1,
                width: f.width,
                height: f.height,
                filename: `${this.animationName || 'animation'}_frame_${String(i + 1).padStart(2, '0')}.png`
            }))
        };
        
        const json = JSON.stringify(data, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.download = `${this.animationName || 'animation'}.json`;
        link.href = url;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        console.log('Animation exported:', data);
        this.setStatus(`Animation data exported`, 'success');
    }
    
    async saveAnimationToProject() {
        // Check if we have frames to save
        if (this.frames.length === 0) {
            this.setStatus('No frames to save. Add frames first.', 'error');
            return;
        }
        
        // Get animation name
        const name = document.getElementById('anim-name-input')?.value || 'unnamed';
        if (!name || name === 'unnamed') {
            this.setStatus('Please enter a name for the animation.', 'error');
            return;
        }
        this.animationName = name;
        
        // Check if Tauri is available
        if (typeof window.__TAURI__ === 'undefined') {
            this.setStatus('Tauri not available. Use "Export Animation Data" instead.', 'error');
            return;
        }
        
        try {
            this.setStatus('Saving animation to project...', 'info');
            
            // Define paths - use project root relative path
            const basePath = 'assets/animations';
            const animationFolder = `${basePath}/${name}`;
            
            // Check if folder exists, create if not
            const folderExists = await exists(animationFolder);
            if (!folderExists) {
                await mkdir(animationFolder, { recursive: true });
                console.log(`Created folder: ${animationFolder}`);
            }
            
            // Save each frame as PNG
            for (let i = 0; i < this.frames.length; i++) {
                const frame = this.frames[i];
                const frameName = `frame_${String(i + 1).padStart(2, '0')}.png`;
                const framePath = `${animationFolder}/${frameName}`;
                
                // Convert data URL to Uint8Array
                const base64Data = frame.dataUrl.split(',')[1];
                const binaryData = atob(base64Data);
                const bytes = new Uint8Array(binaryData.length);
                for (let j = 0; j < binaryData.length; j++) {
                    bytes[j] = binaryData.charCodeAt(j);
                }
                
                await writeFile(framePath, bytes);
                console.log(`Saved frame: ${framePath}`);
            }
            
            // Save animation metadata as JSON
            const category = document.getElementById('anim-category-select')?.value || 'character';
            const subtype = document.getElementById('anim-subtype-select')?.value || 'player';
            
            const jsonData = {
                name: name,
                workflow: this.workflow,
                category: category,
                subType: subtype,
                fps: this.fps,
                loop: this.loop,
                frameCount: this.frames.length,
                frames: this.frames.map((f, i) => ({
                    index: i + 1,
                    width: f.width,
                    height: f.height,
                    filename: `frame_${String(i + 1).padStart(2, '0')}.png`
                }))
            };
            
            const jsonPath = `${animationFolder}/animation.json`;
            await writeTextFile(jsonPath, JSON.stringify(jsonData, null, 2));
            console.log(`Saved metadata: ${jsonPath}`);
            
            this.setStatus(`✅ Animation "${name}" saved successfully to ${animationFolder}`, 'success');
            
        } catch (error) {
            console.error('Error saving animation:', error);
            this.setStatus(`Error saving: ${error.message}`, 'error');
        }
    }
    
    setStatus(message, type = 'info') {
        const el = document.getElementById('anim-status');
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

        // Stop the update interval
        if (this._updateInterval) {
            clearInterval(this._updateInterval);
            this._updateInterval = null;
        }

        this.stopPreview();
        const panel = document.getElementById('animation-editor-panel');
        if (panel) {
            panel.style.display = 'none';
        }

        const editorContent = document.getElementById('editor-content');
        if (editorContent) {
            editorContent.style.display = 'block';
            editorContent.style.visibility = 'visible';
        }

        const editorTab = document.querySelector('.tab:last-child');
        if (editorTab) {
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            editorTab.classList.add('active');
            editorTab.click();
        }
    }

    show() {
        // Store which editor is opened
        if (this.game && this.game.app) {
            this.game.app.lastOpenedEditor = 'animation-editor-panel';
        }

        const editorContent = document.getElementById('editor-content');
        if (editorContent) {
            editorContent.style.display = 'none';
            editorContent.style.visibility = 'hidden';
        }

        const panel = document.getElementById('animation-editor-panel');
        if (panel) {
            panel.style.display = 'block';
        }
        
        // Restart update interval if needed
        if (!this._updateInterval) {
            this._updateInterval = setInterval(() => {
                this.updateEntityInfo();
            }, 250);
        }
        
        // Update entity info when showing
        this.updateEntityInfo();
        this.updateWorkflowUI();
        this.setStatus('Ready', 'info');
    }
}