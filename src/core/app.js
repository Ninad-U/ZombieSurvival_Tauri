// Main application entry point
import { GameRuntime } from '../runtime/game.js';
import { Console } from '../utils/console.js';
import { EntityManager } from '../entities/entity.js';
import { TemplateLoader } from '../utils/templateLoader.js';

class App {
    constructor() {
        this.console = new Console();
        this.entityManager = new EntityManager();
        this.templateLoader = new TemplateLoader();
        this.game = new GameRuntime(this);
        this.lastOpenedEditor = null;
        
        this.initUI();
        this.initGame();
        this.setupConsole();
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
            } else if (tool === 'sprites') {
                this.console.log('info', 'Sprite Editor - Coming soon!');
                alert('Sprite Editor will be available in a future update.');
            } else if (tool === 'maps') {
    this.console.log('info', 'Opening Map Editor');
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab').forEach(t => {
        if (t.textContent.trim() === 'Editor') {
            t.classList.add('active');
            t.click();
        }
    });
    setTimeout(() => {
        this.game.openMapEditor();
    }, 100);
} else if (tool === 'missions') {
    this.console.log('info', 'Opening Mission Editor');
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab').forEach(t => {
        if (t.textContent.trim() === 'Editor') {
            t.classList.add('active');
            t.click();
        }
    });
    setTimeout(() => {
        this.game.openMissionEditor();
    }, 100);
} else if (tool === 'dialogue') {
    this.console.log('info', 'Opening Cutscene/Dialogue Editor');
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelector('.tab:last-child').classList.add('active');
    document.querySelector('.tab:last-child').click();
    this.game.openCutsceneEditor();
} else if (tool === 'items') {
    this.console.log('info', 'Items');
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab').forEach(t => {
        if (t.textContent.trim() === 'Editor') {
            t.classList.add('active');
            t.click();
        }
    });
} else if (tool === 'npcs') {
    this.console.log('info', 'Opening NPC Editor');
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab').forEach(t => {
        if (t.textContent.trim() === 'Editor') {
            t.classList.add('active');
            t.click();
        }
    });
    setTimeout(() => {
        this.game.openNpcEditor();
    }, 100);
} else if (tool === 'assets') {
    this.console.log('info', 'Assets');
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab').forEach(t => {
        if (t.textContent.trim() === 'Editor') {
            t.classList.add('active');
            t.click();
        }
    });
} else if (tool === 'sprites') {
    this.console.log('info', 'Sprites');
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab').forEach(t => {
        if (t.textContent.trim() === 'Editor') {
            t.classList.add('active');
            t.click();
        }
    });
} else {
                document.getElementById('templates-panel').style.display = 'block';
            }
        });
    });
    
    // Menu bar items
    document.querySelectorAll('.menu-item').forEach(item => {
        item.addEventListener('click', () => {
            const text = item.textContent.trim();
            this.console.log('info', `Menu: ${text} clicked`);
            if (text === 'Project') {
                alert('Project settings will be available in a future update.');
            } else if (text === 'Edit') {
                alert('Edit tools will be available in a future update.');
            } else if (text === 'Create') {
                alert('Create menu will be available in a future update.');
            } else if (text === 'Test') {
                this.console.log('info', 'Testing game...');
                alert('Game test mode will be available in a future update.');
            } else if (text === 'View') {
                alert('View options will be available in a future update.');
            } else if (text === 'Debug') {
                alert('Debug tools will be available in a future update.');
            }
        });
    });
    
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

    // Tab switching (Game Preview / Editor) - SINGLE VERSION
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            const gameContainer = document.getElementById('game-container');
            const editorContainer = document.getElementById('editor-container');
            
            const text = tab.textContent.trim();
            if (text === 'Game Preview') {
                gameContainer.style.display = 'flex';
                gameContainer.style.visibility = 'visible';
                editorContainer.style.display = 'none';
                editorContainer.style.visibility = 'hidden';
                this.console.log('info', 'Switched to Game Preview');
                setTimeout(() => {
                    this.game.resize();
                }, 50);
           } else if (text === 'Editor') {
    gameContainer.style.display = 'none';
    gameContainer.style.visibility = 'hidden';
    editorContainer.style.display = 'block';
    editorContainer.style.visibility = 'visible';
    
    // Hide all editor panels
    const editorPanels = editorContainer.querySelectorAll(
        '#animation-editor-panel, #cutscene-editor-panel, #mission-editor-panel, #map-editor-panel, #npc-editor-panel'
    );
    editorPanels.forEach(panel => {
        panel.style.display = 'none';
    });
    
    // If there was a previously opened editor, restore it
    if (this.lastOpenedEditor) {
        const panel = document.getElementById(this.lastOpenedEditor);
        if (panel) {
            // Hide the card grid
            const editorContent = document.getElementById('editor-content');
            if (editorContent) {
                editorContent.style.display = 'none';
            }
            panel.style.display = 'block';
            this.console.log('info', `Restored last editor: ${this.lastOpenedEditor}`);
            return;
        }
    }
    
    // No last editor, show the card grid
    const editorContent = document.getElementById('editor-content');
    if (editorContent) {
        editorContent.style.display = 'block';
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
    
    // Update stats
    setTimeout(() => {
        const statEl = document.getElementById('stat-entities');
        if (statEl && this.game) {
            statEl.textContent = this.game.entities.length;
        }
    }, 100);
    
    this.console.log('info', 'Switched to Editor');
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
    
    this.console.log('info', 'UI initialized');
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
        });
        
        this.console.log('info', 'ZombieSurvival Game Builder initialized');
        this.console.log('info', 'Press F3 to toggle console');
        
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
            this.game.addEntity(entity);
            this.console.log('info', `Created ${templateType} entity with ID ${entity.id}`);
            
            // Show in properties
            this.showEntityProperties(entity);
        }).catch(err => {
            this.console.log('error', `Failed to create ${templateType}: ${err.message}`);
        });
    }
    

    showEntityProperties(entity) {
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
                this.game.entities = this.game.entities.filter(e => e.id !== entity.id);
                this.entityManager.removeEntity(entity.id);
                this.console.log('info', `Deleted ${entity.name || entity.id}`);
                container.innerHTML = '<p style="color:#666;">Entity deleted</p>';
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
        });
        actionsDiv.appendChild(spawnBtn);
        
        container.appendChild(actionsDiv);
    }


    clearSelection() {
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