// Map Editor - Minimal version
// Basic location configuration only. World building handled by Btools later.

export class MapEditor {
    constructor(gameRuntime) {
        this.game = gameRuntime;
        this.currentLocation = null;
        this.currentLocationId = null;
        this.isNewLocation = false;
        
        this.initUI();
    }
    
    initUI() {
        const panel = document.createElement('div');
        panel.id = 'map-editor-panel';
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
                <h2 style="color: #4caf50; margin: 0;">🗺️ Map Editor</h2>
                <div style="display: flex; gap: 8px;">
                    <button id="map-new-btn" style="background: #2196f3; color: #fff; border: none; padding: 6px 16px; cursor: pointer; font-family: inherit; border-radius: 3px;">+ New Map</button>
                    <button id="map-load-btn" style="background: #ff9800; color: #fff; border: none; padding: 6px 16px; cursor: pointer; font-family: inherit; border-radius: 3px;">📂 Load</button>
                </div>
            </div>
            
            <div id="map-list-container" style="margin-bottom: 16px; display: none;">
                <div style="color: #888; font-size: 12px; margin-bottom: 6px;">Select a location to edit:</div>
                <select id="map-select" style="width: 100%; background: #2a2a2a; color: #c0c0c0; border: 1px solid #444; padding: 8px 12px; font-family: inherit; font-size: 13px;"></select>
                <div style="margin-top: 8px; display: flex; gap: 8px;">
                    <button id="map-load-selected-btn" style="background: #4caf50; color: #fff; border: none; padding: 6px 16px; cursor: pointer; font-family: inherit; border-radius: 3px;">Load Selected</button>
                    <button id="map-cancel-load-btn" style="background: #666; color: #fff; border: none; padding: 6px 16px; cursor: pointer; font-family: inherit; border-radius: 3px;">Cancel</button>
                </div>
            </div>
            
            <div id="map-editor-content" style="display: none;">
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px;">
                    <div>
                        <label style="color: #888; font-size: 11px; display: block; margin-bottom: 4px;">Location ID</label>
                        <input id="map-id-input" type="text" style="width: 100%; background: #2a2a2a; color: #c0c0c0; border: 1px solid #444; padding: 6px 10px; font-family: inherit; font-size: 13px; border-radius: 3px;">
                    </div>
                    <div>
                        <label style="color: #888; font-size: 11px; display: block; margin-bottom: 4px;">Name</label>
                        <input id="map-name-input" type="text" style="width: 100%; background: #2a2a2a; color: #c0c0c0; border: 1px solid #444; padding: 6px 10px; font-family: inherit; font-size: 13px; border-radius: 3px;">
                    </div>
                    <div style="grid-column: span 2;">
                        <label style="color: #888; font-size: 11px; display: block; margin-bottom: 4px;">Description</label>
                        <input id="map-desc-input" type="text" style="width: 100%; background: #2a2a2a; color: #c0c0c0; border: 1px solid #444; padding: 6px 10px; font-family: inherit; font-size: 13px; border-radius: 3px;">
                    </div>
                    <div>
                        <label style="color: #888; font-size: 11px; display: block; margin-bottom: 4px;">Width (tiles)</label>
                        <input id="map-width-input" type="number" min="5" max="100" value="30" style="width: 100%; background: #2a2a2a; color: #c0c0c0; border: 1px solid #444; padding: 6px 10px; font-family: inherit; font-size: 13px; border-radius: 3px;">
                    </div>
                    <div>
                        <label style="color: #888; font-size: 11px; display: block; margin-bottom: 4px;">Height (tiles)</label>
                        <input id="map-height-input" type="number" min="5" max="100" value="20" style="width: 100%; background: #2a2a2a; color: #c0c0c0; border: 1px solid #444; padding: 6px 10px; font-family: inherit; font-size: 13px; border-radius: 3px;">
                    </div>
                </div>
                
                <div style="display: flex; gap: 8px; border-top: 1px solid #333; padding-top: 12px;">
                    <button id="map-save-btn" style="background: #4caf50; color: #fff; border: none; padding: 8px 20px; cursor: pointer; font-family: inherit; font-size: 13px; border-radius: 3px;">💾 Save Map</button>
                    <button id="map-export-btn" style="background: #ff9800; color: #fff; border: none; padding: 8px 20px; cursor: pointer; font-family: inherit; font-size: 13px; border-radius: 3px;">📤 Export JSON</button>
                    <button id="map-close-btn" style="background: #666; color: #fff; border: none; padding: 8px 20px; cursor: pointer; font-family: inherit; font-size: 13px; border-radius: 3px; margin-left: auto;">Close</button>
                </div>
            </div>
        `;
        
        const editorContainer = document.getElementById('editor-container');
        if (editorContainer) {
            editorContainer.appendChild(panel);
        }
        
        this.setupEvents();
        this.populateMapList();
    }
    
    populateMapList() {
        const select = document.getElementById('map-select');
        if (!select) return;
        
        const locations = ['pine_ridge', 'test_outside', 'abandoned_house'];
        select.innerHTML = '';
        for (const id of locations) {
            const option = document.createElement('option');
            option.value = id;
            option.textContent = id.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            select.appendChild(option);
        }
    }
    
    setupEvents() {
        document.getElementById('map-new-btn')?.addEventListener('click', () => {
            this.newMap();
        });
        
        document.getElementById('map-load-btn')?.addEventListener('click', () => {
            document.getElementById('map-list-container').style.display = 'block';
        });
        
        document.getElementById('map-cancel-load-btn')?.addEventListener('click', () => {
            document.getElementById('map-list-container').style.display = 'none';
        });
        
        document.getElementById('map-load-selected-btn')?.addEventListener('click', () => {
            const select = document.getElementById('map-select');
            if (select && select.value) {
                this.loadMap(select.value);
                document.getElementById('map-list-container').style.display = 'none';
            }
        });
        
        document.getElementById('map-save-btn')?.addEventListener('click', () => {
            this.saveMap();
        });
        
        document.getElementById('map-export-btn')?.addEventListener('click', () => {
            this.exportMap();
        });
        
        document.getElementById('map-close-btn')?.addEventListener('click', () => {
            this.close();
        });
    }
    
    async loadMap(locationId) {
        try {
            const response = await fetch(`data/locations/${locationId}.json`);
            if (!response.ok) {
                throw new Error(`Failed to load location: ${locationId}`);
            }
            const data = await response.json();
            
            this.currentLocation = data;
            this.currentLocationId = locationId;
            this.isNewLocation = false;
            
            this.loadMapIntoUI(data);
            document.getElementById('map-editor-content').style.display = 'block';
            
            console.log(`Map loaded: ${data.name}`);
        } catch (error) {
            console.error('Error loading map:', error);
            alert(`Failed to load map: ${error.message}`);
        }
    }
    
    newMap() {
        this.currentLocation = {
            id: `location_${Date.now()}`,
            name: 'New Location',
            description: '',
            width: 30,
            height: 20,
            tileSize: 32,
            tileset: 'grass_tiles.png',
            layers: {
                ground: [],
                objects: [],
                collision: []
            },
            entities: [],
            exits: [],
            spawnPoints: {
                default: { x: 15, y: 10 }
            }
        };
        this.currentLocationId = this.currentLocation.id;
        this.isNewLocation = true;
        
        const w = this.currentLocation.width;
        const h = this.currentLocation.height;
        this.currentLocation.layers.ground = Array(h).fill(null).map(() => Array(w).fill(0));
        this.currentLocation.layers.objects = Array(h).fill(null).map(() => Array(w).fill(0));
        this.currentLocation.layers.collision = Array(h).fill(null).map(() => Array(w).fill(0));
        
        this.loadMapIntoUI(this.currentLocation);
        document.getElementById('map-editor-content').style.display = 'block';
    }
    
    loadMapIntoUI(data) {
        document.getElementById('map-id-input').value = data.id || '';
        document.getElementById('map-name-input').value = data.name || '';
        document.getElementById('map-desc-input').value = data.description || '';
        document.getElementById('map-width-input').value = data.width || 30;
        document.getElementById('map-height-input').value = data.height || 20;
    }
    
    getMapData() {
        if (!this.currentLocation) return null;
        
        return {
            id: document.getElementById('map-id-input').value || this.currentLocation.id,
            name: document.getElementById('map-name-input').value || this.currentLocation.name,
            description: document.getElementById('map-desc-input').value || this.currentLocation.description,
            width: parseInt(document.getElementById('map-width-input').value) || this.currentLocation.width,
            height: parseInt(document.getElementById('map-height-input').value) || this.currentLocation.height,
            tileSize: this.currentLocation.tileSize || 32,
            tileset: this.currentLocation.tileset || 'grass_tiles.png',
            layers: this.currentLocation.layers || { ground: [], objects: [], collision: [] },
            entities: this.currentLocation.entities || [],
            exits: this.currentLocation.exits || [],
            spawnPoints: this.currentLocation.spawnPoints || { default: { x: 15, y: 10 } }
        };
    }
    
    async saveMap() {
        const data = this.getMapData();
        if (!data) return;
        
        if (!data.id) {
            alert('Location ID is required');
            return;
        }
        
        try {
            if (window.__TAURI__) {
                const { writeTextFile } = window.__TAURI__.fs;
                const path = `data/locations/${data.id}.json`;
                await writeTextFile(path, JSON.stringify(data, null, 2));
                alert(`Map saved: ${data.name}`);
            } else {
                this.exportMap();
            }
        } catch (error) {
            console.error('Save error:', error);
            alert(`Save failed: ${error.message}`);
        }
    }
    
    exportMap() {
        const data = this.getMapData();
        if (!data) return;
        
        const json = JSON.stringify(data, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.download = `${data.id || 'location'}.json`;
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

    const panel = document.getElementById('map-editor-panel');
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
        this.game.app.lastOpenedEditor = 'map-editor-panel';
    }

    // --- FIX: Hide cards grid ---
    const editorContent = document.getElementById('editor-content');
    if (editorContent) {
        editorContent.style.display = 'none';
        editorContent.style.visibility = 'hidden';
    }

        const panel = document.getElementById('map-editor-panel');
        if (panel) {
            panel.style.display = 'block';
        }
        if (!this.currentLocation) {
            this.newMap();
        }
}



}