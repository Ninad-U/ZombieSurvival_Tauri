// Main application entry point
import { GameRuntime } from '../runtime/game.js';
import { Console } from '../utils/console.js';
import { EntityManager } from '../entities/entity.js';
import { TemplateLoader } from '../utils/templateLoader.js';
import { ProjectState } from '../utils/projectState.js';
import { AdminShell } from '../admin/adminShell.js';   
import { BtoolsPanel } from '../components/btoolsPanel.js';


class App {
    constructor() {
        this.console = new Console();
        this.entityManager = new EntityManager();
        this.templateLoader = new TemplateLoader();
        this.game = new GameRuntime(this);
        this.lastOpenedEditor = null;
        this.adminShell = null;
        this.btools = null;

        // Expose ProjectState globally for editors to use
        window.ProjectState = ProjectState;
        
        this.initUI();
        this.initGame();
        this.setupConsole();
    }
    
    markDirty() {
        ProjectState.markDirty();
    }
    
    markClean() {
        ProjectState.markClean();
    }
    
    isDirty() {
        return ProjectState.isDirty();
    }

    initUI() {
        // Tool navigation

document.querySelectorAll('.tool-item').forEach(item => {
    item.addEventListener('click', () => {
        document.querySelectorAll('.tool-item').forEach(el => el.classList.remove('active'));
        item.classList.add('active');
        const tool = item.dataset.tool;
        
        document.getElementById('templates-panel').style.display = 'none';
        document.getElementById('guide-panel').style.display = 'none';
        
        if (tool === 'guide') {
            document.getElementById('guide-panel').style.display = 'block';
            this.console.log('info', 'Showing Project Guide');
        } else if (tool === 'templates') {
            document.getElementById('templates-panel').style.display = 'block';
            this.console.log('info', 'Showing Templates');
        } else if (tool === 'maps') {
            this.console.log('info', 'Opening Map Editor');
            this.switchToEditorTab(false);  // Don't show cards grid
            this.game.openMapEditor();  // No timeout needed
        } else if (tool === 'missions') {
            this.console.log('info', 'Opening Mission Editor');
            this.switchToEditorTab(false);
            this.game.openMissionEditor();
        } else if (tool === 'dialogue') {
            this.console.log('info', 'Opening Cutscene/Dialogue Editor');
            this.switchToEditorTab(false);
            this.game.openCutsceneEditor();
        } else if (tool === 'npcs') {
            this.console.log('info', 'Opening NPC Editor');
            this.switchToEditorTab(false);
            this.game.openNpcEditor();
        } else {
            document.getElementById('templates-panel').style.display = 'block';
        }
    });
});
        
        // Menu bar items with dropdowns
        this.setupMenuBar();
        
        // Create buttons
        document.querySelectorAll('.create-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const template = btn.dataset.template;
                this.console.log('info', `Creating ${template} from template`);
                this.createFromTemplate(template);
            });
        });
        
        // Reset Mission button
        document.getElementById('reset-mission-btn')?.addEventListener('click', () => {
            if (confirm('Reset all mission progress?\n\nThis will:\n- Clear all active missions\n- Clear all completed missions\n- Reset all objective progress\n\nThis does NOT affect player stats, enemies, or location.\n\nContinue?')) {
                this.game.resetMissionProgress();
                this.console.log('info', '🔄 Mission progress reset by user');
            }
        });

        // Tab switching (Game Preview / Editor / Admin Shell)
        document.querySelectorAll('.tab').forEach(tab => {
            tab.addEventListener('click', () => {
                document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                
                const gameContainer = document.getElementById('game-container');
                const editorContainer = document.getElementById('editor-container');
                const text = tab.textContent.trim();
                
                // --- STEP 1: Hide ALL panels ---
                // Hide game container
                gameContainer.style.display = 'none';
                gameContainer.style.visibility = 'hidden';
                
                // Hide editor container
                editorContainer.style.display = 'none';
                editorContainer.style.visibility = 'hidden';
                
                // Hide all editor panels
                const editorPanels = editorContainer.querySelectorAll(
                    '#animation-editor-panel, #cutscene-editor-panel, #mission-editor-panel, #map-editor-panel, #npc-editor-panel, #btools-panel, #admin-shell-panel'
                );
                editorPanels.forEach(panel => {
                    panel.style.display = 'none';
                });
                
                // Hide the card grid
                const editorContent = document.getElementById('editor-content');
                if (editorContent) {
                    editorContent.style.display = 'none';
                    editorContent.style.visibility = 'hidden';
                }
                
                // --- STEP 2: Show only the selected tab ---
                if (text === 'Game Preview') {
                    // Show game container
                    gameContainer.style.display = 'flex';
                    gameContainer.style.visibility = 'visible';
                    if (this.adminShell) this.adminShell.hide();
                    this.console.log('info', 'Switched to Game Preview');
                    setTimeout(() => {
                        this.game.resize();
                    }, 50);
                    
                } else if (text === 'Editor') {
                    // Show editor container
                    editorContainer.style.display = 'block';
                    editorContainer.style.visibility = 'visible';
                    
                    // If there was a previously opened editor, restore it
                    if (this.lastOpenedEditor) {
                        const panel = document.getElementById(this.lastOpenedEditor);
                        if (panel) {
                            panel.style.display = 'block';
                            this.console.log('info', `Restored last editor: ${this.lastOpenedEditor}`);
                            return;
                        }
                    }
                    
                    // No last editor, show the card grid with ALL 5 editors
                    if (editorContent) {
                        editorContent.style.display = 'block';
                        editorContent.style.visibility = 'visible';
                        
                        // Only set content once if empty
                        if (!editorContent.querySelector('.editor-card')) {
                            editorContent.innerHTML = `
                                <h2 style="color: #4caf50; margin-bottom: 16px;">🎨 Editor Workspace</h2>
                                
                                <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 12px; margin-top: 16px;">
                                    <div class="editor-card" id="anim-editor-card" style="background: #4caf50; border: 1px solid #4caf50; border-radius: 8px; padding: 16px; cursor: pointer; transition: all 0.2s;">
                                        <div style="font-size: 32px; text-align: center;">🎬</div>
                                        <h3 style="color: #fff; text-align: center; margin: 8px 0;">Animation Editor</h3>
                                        <p style="color: #ddd; font-size: 12px; text-align: center;">Create sprite animations</p>
                                        <p style="color: #4caf50; font-size: 10px; text-align: center; margin-top: 4px;">✓ Click to Open</p>
                                    </div>
                                    
                                    <div class="editor-card" id="cutscene-editor-card" style="background: #ff9800; border: 1px solid #ff9800; border-radius: 8px; padding: 16px; cursor: pointer; transition: all 0.2s;">
                                        <div style="font-size: 32px; text-align: center;">🎭</div>
                                        <h3 style="color: #fff; text-align: center; margin: 8px 0;">Cutscene Editor</h3>
                                        <p style="color: #ddd; font-size: 12px; text-align: center;">Edit dialogue cutscenes</p>
                                        <p style="color: #ff9800; font-size: 10px; text-align: center; margin-top: 4px;">✓ Click to Open</p>
                                    </div>
                                    
                                    <div class="editor-card" id="mission-editor-card" style="background: #2196f3; border: 1px solid #2196f3; border-radius: 8px; padding: 16px; cursor: pointer; transition: all 0.2s;">
                                        <div style="font-size: 32px; text-align: center;">📋</div>
                                        <h3 style="color: #fff; text-align: center; margin: 8px 0;">Mission Editor</h3>
                                        <p style="color: #ddd; font-size: 12px; text-align: center;">Create and edit missions</p>
                                        <p style="color: #2196f3; font-size: 10px; text-align: center; margin-top: 4px;">✓ Click to Open</p>
                                    </div>
                                    
                                    <div class="editor-card" id="map-editor-card" style="background: #ff5722; border: 1px solid #ff5722; border-radius: 8px; padding: 16px; cursor: pointer; transition: all 0.2s;">
                                        <div style="font-size: 32px; text-align: center;">🗺️</div>
                                        <h3 style="color: #fff; text-align: center; margin: 8px 0;">Map Editor</h3>
                                        <p style="color: #ddd; font-size: 12px; text-align: center;">Edit locations</p>
                                        <p style="color: #ff5722; font-size: 10px; text-align: center; margin-top: 4px;">✓ Click to Open</p>
                                    </div>
                                    
                                    <div class="editor-card" id="npc-editor-card" style="background: #9c27b0; border: 1px solid #9c27b0; border-radius: 8px; padding: 16px; cursor: pointer; transition: all 0.2s;">
                                        <div style="font-size: 32px; text-align: center;">👤</div>
                                        <h3 style="color: #fff; text-align: center; margin: 8px 0;">NPC Editor</h3>
                                        <p style="color: #ddd; font-size: 12px; text-align: center;">Create and edit NPCs</p>
                                        <p style="color: #9c27b0; font-size: 10px; text-align: center; margin-top: 4px;">✓ Click to Open</p>
                                    </div>
                                </div>
                                
                                <div style="margin-top: 24px; padding: 16px; background: #1a2a1a; border: 1px solid #2a4a2a; border-radius: 8px;">
                                    <h4 style="color: #4caf50; margin-bottom: 8px;">📊 Quick Stats</h4>
                                    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px;">
                                        <div style="background: #0a1a0a; padding: 12px; border-radius: 4px; text-align: center;">
                                            <div style="color: #888; font-size: 11px;">Entities</div>
                                            <div style="color: #4caf50; font-size: 24px; font-weight: bold;" id="stat-entities">0</div>
                                        </div>
                                        <div style="background: #0a1a0a; padding: 12px; border-radius: 4px; text-align: center;">
                                            <div style="color: #888; font-size: 11px;">Templates</div>
                                            <div style="color: #ff9800; font-size: 24px; font-weight: bold;">7</div>
                                        </div>
                                        <div style="background: #0a1a0a; padding: 12px; border-radius: 4px; text-align: center;">
                                            <div style="color: #888; font-size: 11px;">Assets</div>
                                            <div style="color: #2196f3; font-size: 24px; font-weight: bold;">10</div>
                                        </div>
                                    </div>
                                </div>
                            `;
                            
                            // Add event listeners for each editor card
                            document.getElementById('anim-editor-card')?.addEventListener('click', () => {
                                this.lastOpenedEditor = 'animation-editor-panel';
                                this.game.openAnimationEditor();
                            });
                            document.getElementById('cutscene-editor-card')?.addEventListener('click', () => {
                                this.lastOpenedEditor = 'cutscene-editor-panel';
                                this.game.openCutsceneEditor();
                            });
                            document.getElementById('mission-editor-card')?.addEventListener('click', () => {
                                this.lastOpenedEditor = 'mission-editor-panel';
                                this.game.openMissionEditor();
                            });
                            document.getElementById('map-editor-card')?.addEventListener('click', () => {
                                this.lastOpenedEditor = 'map-editor-panel';
                                this.game.openMapEditor();
                            });
                            document.getElementById('npc-editor-card')?.addEventListener('click', () => {
                                this.lastOpenedEditor = 'npc-editor-panel';
                                this.game.openNpcEditor();
                            });
                        }
                    }
                    this.console.log('info', 'Switched to Editor');
                    
                } else if (text === 'Admin Shell') {
                    // Show editor container for Admin Shell
                    editorContainer.style.display = 'block';
                    editorContainer.style.visibility = 'visible';
                    
                    // Show Admin Shell
                    if (!this.adminShell) {
                        this.adminShell = new AdminShell(this.game);
                    }
                    this.adminShell.show();
                    this.console.log('info', 'Switched to Admin Shell');
                }
            });
        });

        // Console controls
        document.getElementById('console-clear').addEventListener('click', () => {
            this.console.clear();
        });
        
        document.getElementById('console-copy').addEventListener('click', () => {
            this.console.copyAll();
        });
        
        document.getElementById('console-toggle').addEventListener('click', () => {
            const panel = document.getElementById('console-panel');
            panel.style.display = panel.style.display === 'none' ? 'flex' : 'none';
        });
        
        document.getElementById('filter-level').addEventListener('change', (e) => {
            this.console.setFilter(e.target.value);
        });

        // Initialize BtoolsPanel (appears in Properties area when no entity selected)
        this.btools = new BtoolsPanel(this.game, this);
        
        // Ensure Btools shows when no entity is selected
        if (!this.game.selectedEntity) {
            this.btools.show();
        }

        this.console.log('info', 'UI initialized');
    }

switchToEditorTab(showCards = true) {
    const tabs = document.querySelectorAll('.tab');
    const editorTab = tabs[1];
    
    if (editorTab) {
        // --- STEP 1: Hide ALL panels ---
        const gameContainer = document.getElementById('game-container');
        const editorContainer = document.getElementById('editor-container');
        const editorContent = document.getElementById('editor-content');
        
        // Hide game container
        if (gameContainer) {
            gameContainer.style.display = 'none';
            gameContainer.style.visibility = 'hidden';
        }
        
        // Hide editor container
        if (editorContainer) {
            editorContainer.style.display = 'none';
            editorContainer.style.visibility = 'hidden';
        }
        
        // Hide all editor panels
        const editorPanels = editorContainer?.querySelectorAll(
            '#animation-editor-panel, #cutscene-editor-panel, #mission-editor-panel, #map-editor-panel, #npc-editor-panel, #btools-panel, #admin-shell-panel'
        ) || [];
        editorPanels.forEach(panel => {
            if (panel) {
                panel.style.display = 'none';
            }
        });
        
        // Hide the card grid
        if (editorContent) {
            editorContent.style.display = 'none';
            editorContent.style.visibility = 'hidden';
        }
        
        // --- STEP 2: Show Editor tab ---
        tabs.forEach(t => t.classList.remove('active'));
        editorTab.classList.add('active');
        
        // Show editor container
        if (editorContainer) {
            editorContainer.style.display = 'block';
            editorContainer.style.visibility = 'visible';
        }
        
        // --- STEP 3: Only show cards grid if explicitly requested ---
        // (i.e., when user clicks the Editor tab, not when a tool is clicked)
        if (showCards && !this.lastOpenedEditor) {
            if (editorContent) {
                editorContent.style.display = 'block';
                editorContent.style.visibility = 'visible';
            }
            this.console.log('info', 'Switched to Editor - Cards Grid');
        } else if (this.lastOpenedEditor) {
            // If there was a previously opened editor, restore it
            const panel = document.getElementById(this.lastOpenedEditor);
            if (panel) {
                panel.style.display = 'block';
                this.console.log('info', `Restored last editor: ${this.lastOpenedEditor}`);
                return;
            }
        }
    }
}

    setupMenuBar() {
        // Setup Project menu with dropdown
        const projectMenuItem = document.querySelector('.menu-item');
        if (!projectMenuItem) return;
        
        // Change the text to indicate it's a dropdown
        projectMenuItem.textContent = 'Project ▾';
        
        // Create dropdown container
        const dropdown = document.createElement('div');
        dropdown.className = 'dropdown-menu';
        dropdown.style.cssText = `
            display: none;
            position: absolute;
            top: 100%;
            left: 0;
            background: #2a2a2a;
            border: 1px solid #444;
            border-radius: 4px;
            min-width: 180px;
            z-index: 1000;
            box-shadow: 0 4px 12px rgba(0,0,0,0.5);
            padding: 4px 0;
        `;
        
        // Add dropdown items
        dropdown.innerHTML = `
            <div class="dropdown-item" data-action="save" style="padding: 8px 16px; color: #aaa; cursor: pointer; font-size: 13px; display: flex; align-items: center; gap: 8px;">
                <span>💾</span> Save Project
                <span id="save-status" style="font-size: 10px; color: #666; margin-left: auto;"></span>
            </div>
            <div style="border-top: 1px solid #333; margin: 4px 8px;"></div>
            <div class="dropdown-item" data-action="settings" style="padding: 8px 16px; color: #666; cursor: default; font-size: 13px; opacity: 0.5;">
                ⚙️ Settings (Coming Soon)
            </div>
        `;
        
        // Position the dropdown relative to the menu bar
        const menuBar = document.getElementById('menu-bar');
        if (menuBar) {
            menuBar.style.position = 'relative';
            menuBar.appendChild(dropdown);
        }
        
        // Handle dropdown item clicks
        dropdown.querySelectorAll('.dropdown-item[data-action]').forEach(item => {
            item.addEventListener('click', (e) => {
                e.stopPropagation();
                const action = item.dataset.action;
                if (action === 'save') {
                    this.handleProjectSave();
                    this.closeDropdown(dropdown);
                }
            });
        });
        
        // Toggle dropdown on Project menu click
        projectMenuItem.addEventListener('click', (e) => {
            e.stopPropagation();
            const isVisible = dropdown.style.display === 'block';
            this.closeAllDropdowns();
            if (!isVisible) {
                dropdown.style.display = 'block';
                this.updateSaveStatus();
            }
        });
        
        // Close dropdown when clicking outside
        document.addEventListener('click', () => {
            this.closeAllDropdowns();
        });
        
        // Close dropdown on Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeAllDropdowns();
            }
        });
        
        // Store reference for later use
        this._projectDropdown = dropdown;
        this._projectMenuItem = projectMenuItem;
    }
    
    closeAllDropdowns() {
        document.querySelectorAll('.dropdown-menu').forEach(d => {
            d.style.display = 'none';
        });
    }
    
    closeDropdown(dropdown) {
        if (dropdown) {
            dropdown.style.display = 'none';
        }
    }
    
    updateSaveStatus() {
        const statusEl = document.getElementById('save-status');
        if (statusEl) {
            if (this.isDirty()) {
                statusEl.textContent = '⚠️ Unsaved';
                statusEl.style.color = '#ff9800';
            } else {
                statusEl.textContent = '✓ Saved';
                statusEl.style.color = '#4caf50';
            }
        }
        
        // Also update the main status bar
        const mainStatus = document.getElementById('project-status');
        if (mainStatus) {
            if (this.isDirty()) {
                mainStatus.textContent = '⚠️ Unsaved Changes';
                mainStatus.style.color = '#ff9800';
            } else {
                mainStatus.textContent = '✓ Saved';
                mainStatus.style.color = '#4caf50';
            }
        }
    }

    /**
     * Handle Project → Save action
     */
    async handleProjectSave() {
        // Close dropdown
        this.closeAllDropdowns();
        
        if (!this.isDirty()) {
            this.console.log('info', '📁 No changes to save. Project is clean.');
            this.showToast('No changes to save.', 'info');
            return;
        }
        
        this.console.log('info', '💾 Saving project...');
        this.showToast('Saving project...', 'info');
        
        try {
            // Check if Tauri is available
            if (typeof window.__TAURI__ === 'undefined') {
                this.console.log('warning', 'Tauri not available. Cannot save project files.');
                this.showToast('Tauri not available. Cannot save.', 'error');
                return;
            }
            
            // Import fs APIs
            const { writeTextFile } = await import('@tauri-apps/plugin-fs');
            
            let savedCount = 0;
            
            // Save location data if it exists
            if (this.game && this.game.locationLoader) {
                const location = this.game.locationLoader.getCurrentLocation();
                if (location && location.id) {
                    const path = `data/locations/${location.id}.json`;
                    await writeTextFile(path, JSON.stringify(location, null, 2));
                    this.console.log('info', `Saved location: ${location.id}`);
                    savedCount++;
                }
            }
            
            // Save NPC templates if they were modified
            // This would need a central storage mechanism
            
            // Save mission data
            // This would need a central storage mechanism
            
            // Save animation data is handled by the Animation Editor directly
            
            // Mark project as clean
            this.markClean();
            this.updateSaveStatus();
            this.console.log('info', `✅ Project saved successfully. (${savedCount} files)`);
            this.showToast(`✅ Project saved successfully! (${savedCount} files)`, 'success');
            
        } catch (error) {
            console.error('Error saving project:', error);
            this.console.log('error', `Failed to save project: ${error.message}`);
            this.showToast(`❌ Failed to save project: ${error.message}`, 'error');
        }
    }
    
    showToast(message, type = 'info') {
        // Remove existing toast
        const existing = document.querySelector('.toast-message');
        if (existing) existing.remove();
        
        const toast = document.createElement('div');
        toast.className = 'toast-message';
        const colors = {
            info: '#888',
            success: '#4caf50',
            error: '#f44336',
            warning: '#ff9800'
        };
        toast.style.cssText = `
            position: fixed;
            bottom: 60px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0, 0, 0, 0.9);
            color: ${colors[type] || '#888'};
            padding: 10px 24px;
            border-radius: 6px;
            border: 1px solid ${colors[type] || '#888'};
            font-family: 'Courier New', monospace;
            font-size: 13px;
            z-index: 10000;
            pointer-events: none;
            opacity: 1;
            transition: opacity 0.5s;
            max-width: 80%;
            text-align: center;
        `;
        toast.textContent = message;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 500);
        }, 3000);
    }
    
    initGame() {
        const canvas = document.getElementById('gameCanvas');
        this.game.init(canvas);
        
        // Setup game loop
        let lastTime = 0;
        const gameLoop = (timestamp) => {
            const dt = Math.min((timestamp - lastTime) / 1000, 0.05);
            lastTime = timestamp;
            
            this.game.update(dt);
            this.game.render();
            
            requestAnimationFrame(gameLoop);
        };
        
        requestAnimationFrame(gameLoop);
    }
    
    setupConsole() {
        // Override console methods
        const originalLog = console.log;
        const originalError = console.error;
        const originalWarn = console.warn;
        
        console.log = (...args) => {
            originalLog(...args);
            this.console.log('debug', args.join(' '));
        };
        
        console.error = (...args) => {
            originalError(...args);
            this.console.log('error', args.join(' '));
        };
        
        console.warn = (...args) => {
            originalWarn(...args);
            this.console.log('warning', args.join(' '));
        };
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'F3') {
                e.preventDefault();
                const panel = document.getElementById('console-panel');
                panel.style.display = panel.style.display === 'none' ? 'flex' : 'none';
            }
            
            // Ctrl+S to save
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                this.handleProjectSave();
            }
        });
        
        this.console.log('info', 'ZombieSurvival Game Builder initialized');
        this.console.log('info', 'Press F3 to toggle console');
        this.console.log('info', 'Press Ctrl+S to save project');
        
        // Add console toggle button in menu bar
        const toggleBtn = document.getElementById('toggle-console-btn');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => {
                const panel = document.getElementById('console-panel');
                if (panel.style.display === 'none') {
                    panel.style.display = 'flex';
                    toggleBtn.textContent = 'Console';
                    toggleBtn.style.borderColor = '#444';
                } else {
                    panel.style.display = 'none';
                    toggleBtn.textContent = 'Show Console';
                    toggleBtn.style.borderColor = '#4caf50';
                }
            });
        }
    }
    
    createFromTemplate(templateType) {
        // Load template and create entity
        this.templateLoader.loadTemplate(templateType).then(template => {
            if (!template) {
                this.console.log('error', `Template ${templateType} not found`);
                return;
            }
            
            const entity = this.entityManager.createEntity(template.name, template.type);
            // Copy components
            for (const [compName, compData] of Object.entries(template.components)) {
                entity.components[compName] = { ...compData };
            }
            
            // Give it a position if it doesn't have one (place near player)
            if (entity.components.transform) {
                const player = this.game.player;
                if (player) {
                    entity.components.transform.x = player.components.transform.x + (Math.random() - 0.5) * 100;
                    entity.components.transform.y = player.components.transform.y + (Math.random() - 0.5) * 100 + 50;
                }
            }
            
            this.game.addEntity(entity);
            this.console.log('info', `Created ${templateType} entity with ID ${entity.id}`);
            
            // --- FIX 1: Save entity to location ---
            this.addEntityToLocation(entity);
            
            // Show in properties
            this.showEntityProperties(entity);
            
            // Mark project dirty
            this.markDirty();
            this.updateSaveStatus();
        }).catch(err => {
            this.console.log('error', `Failed to create ${templateType}: ${err.message}`);
        });
    }
    
    addEntityToLocation(entity) {
        const location = this.game.locationLoader.getCurrentLocation();
        if (!location) return;
        
        if (!location.entities) {
            location.entities = [];
        }
        
        // Convert entity to location format
        const entityData = {
            type: entity.type,
            x: Math.floor(entity.components.transform.x / this.game.tileSize),
            y: Math.floor(entity.components.transform.y / this.game.tileSize)
        };
        
        // Add NPC-specific data
        if (entity.type === 'npc' && entity.components.npc) {
            entityData.name = entity.components.npc.name || 'NPC';
            entityData.dialogue = entity.components.npc.dialogue || 'test_conversation';
            entityData.faction = entity.components.npc.faction || 'neutral';
            entityData.interactionRadius = entity.components.npc.interactionRadius || 50;
        }
        
        // Add item-specific data
        if (entity.type === 'item' && entity.components.consumable) {
            // For items, we need to determine the template type
            // This is a simplification - would need better mapping
            if (entity.components.consumable.type === 'food') {
                entityData.template = 'food';
            } else if (entity.components.consumable.type === 'water') {
                entityData.template = 'water';
            } else if (entity.components.consumable.type === 'medicine') {
                entityData.template = 'medicine';
            }
        }
        
        // Store animation assignment if present
        if (entity.components.animation && entity.components.animation.animationName) {
            entityData.animation = entity.components.animation.animationName;
        }
        
        location.entities.push(entityData);
        this.console.log('info', `Added entity to location data: ${entityData.type} at (${entityData.x}, ${entityData.y})`);
    }

    removeEntityFromLocation(entity) {
        const location = this.game.locationLoader.getCurrentLocation();
        if (!location || !location.entities) return;
        
        // Find and remove entity from location data
        // Use grid position as identifier
        const gridX = Math.floor(entity.components.transform.x / this.game.tileSize);
        const gridY = Math.floor(entity.components.transform.y / this.game.tileSize);
        
        const index = location.entities.findIndex(e => 
            e.x === gridX && e.y === gridY && e.type === entity.type
        );
        
        if (index !== -1) {
            location.entities.splice(index, 1);
            this.console.log('info', `Removed entity from location data`);
        }
    }

    syncEntityToLocation(entity) {
        const location = this.game.locationLoader.getCurrentLocation();
        if (!location || !location.entities) return;
        
        const gridX = Math.floor(entity.components.transform.x / this.game.tileSize);
        const gridY = Math.floor(entity.components.transform.y / this.game.tileSize);
        
        const entityData = location.entities.find(e => 
            e.x === gridX && e.y === gridY && e.type === entity.type
        );
        
        if (entityData) {
            // Update existing entity data
            if (entity.type === 'npc' && entity.components.npc) {
                entityData.name = entity.components.npc.name || 'NPC';
                entityData.dialogue = entity.components.npc.dialogue || 'test_conversation';
                entityData.faction = entity.components.npc.faction || 'neutral';
            }
            
            // Update animation assignment
            if (entity.components.animation && entity.components.animation.animationName) {
                entityData.animation = entity.components.animation.animationName;
            }
            
            this.markDirty();
            this.updateSaveStatus();
        }
    }

    showEntityProperties(entity) {
        // Hide Btools when an entity is selected
        if (this.btools) {
            this.btools.hide();
        }

        const container = document.getElementById('property-editor');
        container.innerHTML = '';
        
        const title = document.createElement('h3');
        title.textContent = `Entity: ${entity.name || entity.id}`;
        title.style.cssText = 'color: #4caf50; margin-bottom: 12px;';
        container.appendChild(title);
        
        // Show entity ID
        const idDiv = document.createElement('div');
        idDiv.style.cssText = 'padding: 4px 8px; background: #1a1a1a; border-radius: 4px; margin-bottom: 8px;';
        idDiv.innerHTML = `<span style="color:#888;">ID:</span> <span style="color:#aaa;font-size:11px;">${entity.id}</span>`;
        container.appendChild(idDiv);
        
        // Show type
        const typeDiv = document.createElement('div');
        typeDiv.style.cssText = 'padding: 4px 8px; background: #1a1a1a; border-radius: 4px; margin-bottom: 8px;';
        typeDiv.innerHTML = `<span style="color:#888;">Type:</span> <span style="color:#ff9800;">${entity.type}</span>`;
        container.appendChild(typeDiv);
        
        // Show components
        const compTitle = document.createElement('div');
        compTitle.style.cssText = 'color: #888; margin-top: 12px; margin-bottom: 8px; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; border-bottom: 1px solid #333; padding-bottom: 4px;';
        compTitle.textContent = 'Components';
        container.appendChild(compTitle);
        
        for (const [compName, compData] of Object.entries(entity.components)) {
            const compDiv = document.createElement('div');
            compDiv.style.cssText = 'margin: 4px 0; padding: 8px; background: #1a1a1a; border-left: 3px solid #4caf50; border-radius: 2px;';
            
            let html = `<div style="color:#ff9800;font-weight:bold;margin-bottom:4px;">${compName}</div>`;
            
            // Show all properties of this component
            for (const [key, value] of Object.entries(compData)) {
                if (typeof value === 'function') continue;
                const displayValue = typeof value === 'object' ? JSON.stringify(value) : value;
                html += `<div style="display:flex;justify-content:space-between;padding:2px 0;font-size:12px;border-bottom:1px solid #222;">
                    <span style="color:#888;">${key}:</span>
                    <span style="color:#4caf50;max-width:150px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${displayValue}</span>
                </div>`;
            }
            
            compDiv.innerHTML = html;
            container.appendChild(compDiv);
        }
        
        // Add action buttons
        const actionsDiv = document.createElement('div');
        actionsDiv.style.cssText = 'margin-top: 16px; display: flex; gap: 8px; flex-wrap: wrap;';
        
        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = 'Delete Entity';
        deleteBtn.style.cssText = 'background: #f44336; color: white; border: none; padding: 6px 12px; cursor: pointer; font-family: inherit; font-size: 12px; border-radius: 3px;';
        deleteBtn.addEventListener('click', () => {
            if (confirm(`Delete ${entity.name || entity.id}?`)) {
                this.removeEntityFromLocation(entity);
                this.game.entities = this.game.entities.filter(e => e.id !== entity.id);
                this.entityManager.removeEntity(entity.id);
                this.console.log('info', `Deleted ${entity.name || entity.id}`);
                container.innerHTML = '<p style="color:#666;">Entity deleted</p>';
                this.markDirty();
                this.updateSaveStatus();
                // --- FIX: Show Btools after deletion ---
                this.clearSelection();
            }
        });
        actionsDiv.appendChild(deleteBtn);
        
        const spawnBtn = document.createElement('button');
        spawnBtn.textContent = 'Spawn Copy';
        spawnBtn.style.cssText = 'background: #4caf50; color: white; border: none; padding: 6px 12px; cursor: pointer; font-family: inherit; font-size: 12px; border-radius: 3px;';
        spawnBtn.addEventListener('click', () => {
            const copy = JSON.parse(JSON.stringify(entity));
            copy.id = 'copy_' + Date.now();
            copy.name = copy.name + '_copy';
            const newEntity = this.game.createEntityFromTemplate({
                name: copy.name,
                type: copy.type,
                components: copy.components
            });
            this.game.addEntity(newEntity);
            this.console.log('info', `Spawned copy of ${entity.name}`);
            this.showEntityProperties(newEntity);
            this.markDirty();
            this.updateSaveStatus();
        });
        actionsDiv.appendChild(spawnBtn);
        
        const saveBtn = document.createElement('button');
        saveBtn.textContent = 'Save Changes';
        saveBtn.style.cssText = 'background: #ff9800; color: white; border: none; padding: 6px 12px; cursor: pointer; font-family: inherit; font-size: 12px; border-radius: 3px;';
        saveBtn.addEventListener('click', () => {
            this.syncEntityToLocation(entity);
            this.console.log('info', `Saved changes to ${entity.name}`);
            this.showToast(`✅ Saved changes to ${entity.name}`, 'success');
        });
        actionsDiv.appendChild(saveBtn);
        
        container.appendChild(actionsDiv);
    }

    clearSelection() {
        // --- FIX: Show Btools when no entity is selected ---
        if (this.btools) {
            this.btools.show();
        }
        
        this.game.selectedEntity = null;
        const container = document.getElementById('property-editor');
        if (container) {
            container.innerHTML = '<p style="color:#666;font-style:italic;">No entity selected</p>';
        }
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
});