// Animation Editor
// Lightweight animation creation and management

export class AnimationEditor {
    constructor(gameRuntime) {
        this.game = gameRuntime;
        this.workflow = 'existing'; // 'existing' or 'new'
        this.selectedEntity = null;
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
            
            <!-- Category Selection -->
            <div style="display: flex; gap: 16px; flex-wrap: wrap; margin-bottom: 16px;">
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
                <div>
                    <label style="color: #888; font-size: 12px; display: block;">Animation Name</label>
                    <input id="anim-name-input" type="text" placeholder="idle" style="background: #2a2a2a; color: #c0c0c0; border: 1px solid #444; padding: 6px 12px; font-family: inherit; width: 150px;">
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
                <div id="anim-existing-info" style="display: none;">
                    <label style="color: #888; font-size: 12px; display: block;">Existing Dimensions</label>
                    <span id="anim-existing-dimensions" style="color: #4caf50; font-size: 13px;">32 × 48</span>
                </div>
                <div style="display: flex; align-items: flex-end; gap: 8px;">
                    <button id="anim-create-btn" style="background: #4caf50; color: #fff; border: none; padding: 6px 16px; cursor: pointer; font-family: inherit;">Create Animation</button>
                    <button id="anim-add-frame-btn" style="background: #2196f3; color: #fff; border: none; padding: 6px 16px; cursor: pointer; font-family: inherit;">Add Frame</button>
                    <button id="anim-import-frame-btn" style="background: #ff9800; color: #fff; border: none; padding: 6px 16px; cursor: pointer; font-family: inherit;">Import Frame</button>
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
                <button id="anim-download-frames-btn" style="background: #2196f3; color: #fff; border: none; padding: 6px 16px; cursor: pointer; font-family: inherit;">Download All Frames</button>
                <button id="anim-close-btn" style="background: #f44336; color: #fff; border: none; padding: 6px 16px; cursor: pointer; font-family: inherit;">Close Editor</button>
            </div>
        `;
        
        const editorContainer = document.getElementById('editor-container');
        if (editorContainer) {
            editorContainer.appendChild(panel);
        }
        
        this.setupEvents();
        this.updateSubtypeOptions();
        this.updateWorkflowUI();
        this.populateEntityList();
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
        const category = document.getElementById('anim-category-select')?.value || 'character';
        const isObject = category === 'object';
        
        const sizeSection = document.getElementById('anim-size-section');
        const customSizeSection = document.getElementById('anim-custom-size-section');
        const existingInfo = document.getElementById('anim-existing-info');
        const categorySelect = document.getElementById('anim-category-select');
        const subtypeSelect = document.getElementById('anim-subtype-select');
        const label = document.getElementById('anim-workflow-label');
        
        if (isNew && isObject) {
            sizeSection.style.display = 'block';
            customSizeSection.style.display = document.getElementById('anim-size-select')?.value === 'custom' ? 'block' : 'none';
            existingInfo.style.display = 'none';
            categorySelect.disabled = false;
            subtypeSelect.disabled = false;
            if (label) label.textContent = 'Create new environmental object';
        } else if (isNew) {
            sizeSection.style.display = 'none';
            customSizeSection.style.display = 'none';
            existingInfo.style.display = 'none';
            categorySelect.disabled = false;
            subtypeSelect.disabled = false;
            if (label) label.textContent = 'Create new visual asset';
        } else {
            sizeSection.style.display = 'none';
            customSizeSection.style.display = 'none';
            existingInfo.style.display = 'block';
            categorySelect.disabled = true;
            subtypeSelect.disabled = true;
            if (label) label.textContent = 'Edit existing entity\'s visual';
            this.updateExistingDimensions();
        }
    }
    
    updateExistingDimensions() {
        const entity = this.game.entities.find(e => e.type === this.selectedEntity);
        const dimsEl = document.getElementById('anim-existing-dimensions');
        if (entity && entity.components.sprite) {
            const w = entity.components.sprite.width || 32;
            const h = entity.components.sprite.height || 48;
            dimsEl.textContent = `${w} × ${h}`;
        } else {
            dimsEl.textContent = 'No entity selected';
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
            this.populateEntityList();
            this.updateExistingDimensions();
        });
        
        document.getElementById('anim-workflow-new')?.addEventListener('click', () => {
            this.workflow = 'new';
            document.getElementById('anim-workflow-new').style.background = '#4caf50';
            document.getElementById('anim-workflow-new').style.color = '#fff';
            document.getElementById('anim-workflow-existing').style.background = '#2a2a2a';
            document.getElementById('anim-workflow-existing').style.color = '#aaa';
            this.updateWorkflowUI();
            this.populateEntityList();
        });
        
        document.getElementById('anim-category-select')?.addEventListener('change', () => {
            this.updateSubtypeOptions();
            this.updateWorkflowUI();
            if (this.workflow === 'new') {
                this.updateSizeOptions();
            }
        });
        
        document.getElementById('anim-size-select')?.addEventListener('change', (e) => {
            const customSection = document.getElementById('anim-custom-size-section');
            if (e.target.value === 'custom') {
                customSection.style.display = 'block';
            } else {
                customSection.style.display = 'none';
            }
        });
        
        document.getElementById('anim-entity-select')?.addEventListener('change', (e) => {
            this.selectedEntity = e.target.value;
            if (this.workflow === 'existing') {
                this.updateExistingDimensions();
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
        
        document.getElementById('anim-download-frames-btn')?.addEventListener('click', () => {
            this.downloadAllFrames();
        });
        
        document.getElementById('anim-close-btn')?.addEventListener('click', () => {
            this.close();
        });
    }
    
    updateSizeOptions() {
        const category = document.getElementById('anim-category-select')?.value || 'character';
        const select = document.getElementById('anim-size-select');
        if (!select) return;
        
        if (category !== 'object') {
            select.style.display = 'none';
            document.getElementById('anim-size-section').style.display = 'none';
            return;
        }
        
        select.style.display = 'block';
        const presets = [
            { value: '16x16', label: '1×1 (16×16)' },
            { value: '32x32', label: '2×2 (32×32)' },
            { value: '48x48', label: '3×3 (48×48)' },
            { value: '64x64', label: '4×4 (64×64)' },
            { value: '80x80', label: '5×5 (80×80)' },
            { value: 'custom', label: 'Custom' }
        ];
        
        const currentValue = select.value;
        select.innerHTML = '';
        for (const opt of presets) {
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
    
    populateEntityList() {
        const select = document.getElementById('anim-entity-select');
        if (!select) return;
        
        while (select.options.length > 1) {
            select.remove(1);
        }
        
        if (this.workflow === 'existing') {
            const types = new Set();
            for (const entity of this.game.entities) {
                if (entity.type) {
                    types.add(entity.type);
                }
            }
            types.add('player');
            
            for (const type of types) {
                const option = document.createElement('option');
                option.value = type;
                option.textContent = type.charAt(0).toUpperCase() + type.slice(1);
                select.appendChild(option);
            }
        } else {
            const category = document.getElementById('anim-category-select')?.value || 'character';
            const subtype = document.getElementById('anim-subtype-select')?.value || 'player';
            const option = document.createElement('option');
            option.value = `${category}_${subtype}`;
            option.textContent = `New ${subtype.charAt(0).toUpperCase() + subtype.slice(1)} (${category})`;
            select.appendChild(option);
        }
    }
    
    getCanvasDimensions() {
        if (this.workflow === 'existing') {
            const entity = this.game.entities.find(e => e.type === this.selectedEntity);
            if (entity && entity.components.sprite) {
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
        this.downloadFrame(this.frames.length - 1);
        
        console.log(`Frame ${this.frames.length} added`);
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
    }
    
    downloadFrame(index) {
        const frame = this.frames[index];
        if (!frame) return;
        
        const link = document.createElement('a');
        link.download = `${this.animationName || 'animation'}_frame_${String(index + 1).padStart(2, '0')}.png`;
        link.href = frame.dataUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
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
    }
    
    async downloadAllFrames() {
        if (this.frames.length === 0) {
            alert('No frames to download.');
            return;
        }
        
        if (typeof JSZip === 'undefined') {
            await this.loadJSZip();
        }
        
        const zip = new JSZip();
        const folderName = this.animationName || 'animation';
        const folder = zip.folder(folderName);
        
        for (let i = 0; i < this.frames.length; i++) {
            const frame = this.frames[i];
            const base64Data = frame.dataUrl.split(',')[1];
            const fileName = `frame_${String(i + 1).padStart(2, '0')}.png`;
            folder.file(fileName, base64Data, { base64: true });
        }
        
        const category = document.getElementById('anim-category-select')?.value || 'character';
        const subtype = document.getElementById('anim-subtype-select')?.value || 'player';
        
        const jsonData = {
            name: this.animationName || 'unnamed',
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
        
        folder.file(`${folderName}.json`, JSON.stringify(jsonData, null, 2));
        
        const zipBlob = await zip.generateAsync({ type: 'blob' });
        const url = URL.createObjectURL(zipBlob);
        
        const link = document.createElement('a');
        link.download = `${folderName}.zip`;
        link.href = url;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        const instruction = document.createElement('div');
        instruction.style.cssText = `
            position: fixed;
            bottom: 100px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0, 0, 0, 0.9);
            color: #4caf50;
            padding: 12px 24px;
            border-radius: 8px;
            border: 1px solid #4caf50;
            font-family: 'Courier New', monospace;
            font-size: 13px;
            z-index: 10000;
            text-align: center;
            max-width: 500px;
        `;
        instruction.textContent = '📁 Extract this ZIP into your project\'s animations/ folder';
        document.body.appendChild(instruction);
        setTimeout(() => {
            instruction.style.opacity = '0';
            instruction.style.transition = 'opacity 0.5s';
            setTimeout(() => instruction.remove(), 500);
        }, 4000);
        
        console.log(`ZIP exported: ${folderName}.zip with ${this.frames.length} frames`);
    }
    
    loadJSZip() {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }
    
close() {
    if (this.game && this.game.app) {
        this.game.app.lastOpenedEditor = null;
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
        this.populateEntityList();
        this.updateWorkflowUI();
        this.updateSizeOptions();
        this.updateSubtypeOptions();
        if (this.workflow === 'existing') {
            this.updateExistingDimensions();
        }
    }
}