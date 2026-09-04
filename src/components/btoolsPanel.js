// src/components/btoolsPanel.js
// BTOOLS panel for the Properties area

import { btoolsResources, getCategoriesForSection, getResourcesByCategory } from '../utils/btoolsResources.js';

// src/components/btoolsPanel.js
// Replace the entire object drag/drop section with this custom implementation

export class BtoolsPanel {
  constructor(gameRuntime, app) {
    this.game = gameRuntime;
    this.app = app;
    this.panel = null;
    this.currentSection = 'environment';
    this.currentFilter = 'All';
    
    this.selectedTerrain = null;
    this.isPainting = false;
    this.brushSize = 1;
    this.brushSizes = [1, 4, 8, 16];
    
    // --- NEW: Custom placement state ---
    this.placementActive = false;
    this.placementResource = null;
    this.placementGhost = null;
    this.placementGridX = 0;
    this.placementGridY = 0;
    this.placementWorldX = 0;
    this.placementWorldY = 0;
    this.isOverCanvas = false;
    
    this.init();
  }
  
  init() {
    this.createPanel();
    this.render();
    this.setupEvents();
  }
  
  createPanel() {
    if (document.getElementById('btools-panel')) {
      this.panel = document.getElementById('btools-panel');
      return;
    }
    
    const propertiesContent = document.getElementById('properties-content');
    if (!propertiesContent) return;
    
    const defaultMsg = propertiesContent.querySelector('p');
    if (defaultMsg) {
      defaultMsg.style.display = 'none';
    }
    
    this.panel = document.createElement('div');
    this.panel.id = 'btools-panel';
    this.panel.className = 'btools-panel';
    this.panel.style.cssText = `
      display: flex;
      flex-direction: column;
      gap: 6px;
      padding: 4px 0;
      height: 100%;
      overflow-y: auto;
      max-height: 500px;
    `;
    
    propertiesContent.appendChild(this.panel);
  }
  
  render() {
    if (!this.panel) return;
    
    const section = btoolsResources[this.currentSection];
    if (!section) {
      this.panel.innerHTML = '<div style="color: #666;">No resources loaded</div>';
      return;
    }
    
    const categories = getCategoriesForSection(this.currentSection);
    const resources = getResourcesByCategory(this.currentSection, this.currentFilter);
    const isTerrainSection = this.currentSection === 'environment';
    
    let html = `
      <div class="btools-header" style="
        color: #4caf50;
        font-weight: bold;
        font-size: 13px;
        text-transform: uppercase;
        letter-spacing: 1px;
        margin-bottom: 2px;
        border-bottom: 1px solid #2a4a2a;
        padding-bottom: 4px;
      ">🔧 BTOOLS</div>
      
      <div style="display: flex; gap: 8px; margin-bottom: 2px;">
        <button class="btools-section-btn" data-section="environment" style="
          background: ${this.currentSection === 'environment' ? '#4caf50' : '#2a2a2a'};
          color: ${this.currentSection === 'environment' ? '#fff' : '#aaa'};
          border: 1px solid ${this.currentSection === 'environment' ? '#4caf50' : '#444'};
          padding: 2px 10px;
          font-family: inherit;
          font-size: 10px;
          cursor: pointer;
          border-radius: 3px;
        ">MAP / ENVIRONMENT</button>
        <button class="btools-section-btn" data-section="objects" style="
          background: ${this.currentSection === 'objects' ? '#4caf50' : '#2a2a2a'};
          color: ${this.currentSection === 'objects' ? '#fff' : '#aaa'};
          border: 1px solid ${this.currentSection === 'objects' ? '#4caf50' : '#444'};
          padding: 2px 10px;
          font-family: inherit;
          font-size: 10px;
          cursor: pointer;
          border-radius: 3px;
        ">OBJECTS</button>
      </div>
      
      <div style="color: #888; font-size: 11px; font-weight: bold; margin: 2px 0 2px 0;">
        ${section.label} ${isTerrainSection ? `— Brush Size: ${this.brushSize}×${this.brushSize}` : ''}
      </div>
    `;
    
    if (isTerrainSection) {
      html += `
        <div style="display: flex; gap: 4px; flex-wrap: wrap; margin-bottom: 4px;">
          ${this.brushSizes.map(size => `
            <button class="btools-brush-btn" data-size="${size}" style="
              background: ${this.brushSize === size ? '#4caf50' : '#2a2a2a'};
              color: ${this.brushSize === size ? '#fff' : '#aaa'};
              border: 1px solid ${this.brushSize === size ? '#4caf50' : '#444'};
              padding: 1px 8px;
              font-family: inherit;
              font-size: 9px;
              cursor: pointer;
              border-radius: 3px;
            ">${size}×${size}</button>
          `).join('')}
          <span style="color: #555; font-size: 9px; margin-left: 4px; align-self: center;">
            ${this.selectedTerrain ? `Selected: ${this.selectedTerrain.name}` : 'Click a terrain to select'}
          </span>
        </div>
      `;
    }
    
    html += `
      <div class="btools-filters" style="
        display: flex;
        flex-wrap: wrap;
        gap: 3px;
        margin-bottom: 4px;
      ">
    `;
    
    for (const cat of categories) {
      const isActive = cat === this.currentFilter;
      html += `
        <button class="btools-filter-btn" data-filter="${cat}" style="
          background: ${isActive ? '#4caf50' : '#2a2a2a'};
          color: ${isActive ? '#fff' : '#aaa'};
          border: 1px solid ${isActive ? '#4caf50' : '#444'};
          padding: 1px 8px;
          font-family: inherit;
          font-size: 9px;
          cursor: pointer;
          border-radius: 10px;
          transition: all 0.2s;
        ">${cat}</button>
      `;
    }
    
    html += `
      </div>
      
      <div class="btools-resources" style="
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(50px, 1fr));
        gap: 4px;
        margin-top: 2px;
      ">
    `;
    
    for (const resource of resources) {
      const categoryPath = resource.category ? resource.category.join(' › ') : '';
      const isTerrain = resource.type === 'terrain';
      const isSelected = this.selectedTerrain && this.selectedTerrain.id === resource.id;
      
      // --- CHANGED: Use mousedown instead of draggable ---
      html += `
        <div class="btools-resource" 
             data-resource-id="${resource.id}"
             data-resource-type="${resource.type}"
             style="
               background: ${isSelected ? '#1a3a1a' : '#1a1a1a'};
               border: ${isSelected ? '2px solid #4caf50' : '1px solid #333'};
               border-radius: 3px;
               padding: 4px 2px;
               text-align: center;
               ${isTerrain ? 'cursor: pointer;' : 'cursor: crosshair;'}
               transition: all 0.2s;
               position: relative;
               user-select: none;
             "
             title="${resource.name}\n${categoryPath}">
          <div class="btools-resource-thumb" style="
            width: 100%;
            aspect-ratio: 1;
            border-radius: 2px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 2px;
            ${isTerrain ? `background: ${resource.color || '#333'}; border: 1px solid #555;` : 'background: #111;'}
          ">
            ${isTerrain ? '' : this.getResourceImage(resource)}
          </div>
          <div class="btools-resource-name" style="
            font-size: 7px;
            color: ${isSelected ? '#4caf50' : '#888'};
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            line-height: 1.2;
          ">${resource.name}</div>
          ${isTerrain && isSelected ? '<div style="color:#4caf50;font-size:8px;position:absolute;top:-4px;right:-4px;">✓</div>' : ''}
        </div>
      `;
    }
    
    html += `
      </div>
      
      <div style="margin-top: 4px; border-top: 1px solid #2a2a2a; padding-top: 4px; font-size: 8px; color: #555; text-align: center;">
        ${isTerrainSection ? 'Click terrain, then paint on Game Preview' : 'Click object, then click on Game Preview to place'}
      </div>
    `;
    
    this.panel.innerHTML = html;
    
    // Event listeners
    this.panel.querySelectorAll('.btools-section-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.currentSection = btn.dataset.section;
        this.currentFilter = 'All';
        this.selectedTerrain = null;
        this.cancelPlacement();
        this.render();
      });
    });
    
    this.panel.querySelectorAll('.btools-filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.currentFilter = btn.dataset.filter;
        this.cancelPlacement();
        this.render();
      });
    });
    
    this.panel.querySelectorAll('.btools-brush-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.brushSize = parseInt(btn.dataset.size);
        this.render();
      });
    });
    
    this.panel.querySelectorAll('.btools-resource[data-resource-type="terrain"]').forEach(el => {
      el.addEventListener('click', () => {
        this.cancelPlacement();
        const resourceId = el.dataset.resourceId;
        const resource = this.getResourceById(resourceId);
        if (resource) {
          this.selectedTerrain = resource;
          this.render();
          this.app.console.log('info', `[Btools] Selected terrain: ${resource.name} (brush: ${this.brushSize}×${this.brushSize})`);
        }
      });
    });
    
    // --- CHANGED: Use mousedown to start placement, not dragstart ---
    this.panel.querySelectorAll('.btools-resource[data-resource-type="object"]').forEach(el => {
      el.addEventListener('mousedown', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const resourceId = el.dataset.resourceId;
        const resource = this.getResourceById(resourceId);
        if (resource) {
          this.startPlacement(resource);
        }
      });
    });
  }
  
// In src/components/btoolsPanel.js

getResourceImage(resource) {
  if (!resource.asset) return '';
  
  // --- FIX: Build the full path correctly ---
  const fullPath = `assets/sprites/${resource.asset}`;
  const img = this.game.assetLoader.getImage(fullPath);
  
  if (img) {
    return `<img src="${fullPath}" style="width:100%;height:100%;object-fit:contain;image-rendering:pixelated;">`;
  }
  
  // Trigger loading
  this.game.assetLoader.loadImage(fullPath).catch(() => {});
  return `<div style="width:100%;height:100%;background:#2a2a2a;border-radius:2px;font-size:12px;color:#555;display:flex;align-items:center;justify-content:center;">?</div>`;
}

// Also fix createPlacementGhost
createPlacementGhost(resource) {
  // Remove old ghost
  if (this.placementGhost) {
    this.placementGhost.remove();
    this.placementGhost = null;
  }
  
  const ghost = document.createElement('div');
  ghost.id = 'btools-placement-ghost';
  ghost.style.cssText = `
    position: fixed;
    pointer-events: none;
    z-index: 9999;
    opacity: 0.7;
    border: 2px solid #4caf50;
    border-radius: 4px;
    background: rgba(76, 175, 80, 0.15);
    display: none;
    image-rendering: pixelated;
    transition: none;
  `;
  
  // Try to load the actual image for preview
  if (resource.asset) {
    // --- FIX: Build the full path ---
    const fullPath = `assets/sprites/${resource.asset}`;
    const img = this.game.assetLoader.getImage(fullPath);
    if (img) {
      const w = resource.width || 32;
      const h = resource.height || 32;
      ghost.innerHTML = `<img src="${fullPath}" style="width:${w}px;height:${h}px;image-rendering:pixelated;display:block;">`;
      ghost.style.width = w + 'px';
      ghost.style.height = h + 'px';
    } else {
      // Fallback colored box
      const w = resource.width || 32;
      const h = resource.height || 32;
      ghost.style.width = w + 'px';
      ghost.style.height = h + 'px';
      ghost.style.backgroundColor = '#4caf50';
      ghost.style.opacity = '0.5';
      // Trigger loading for next time
      this.game.assetLoader.loadImage(fullPath).catch(() => {});
    }
  } else {
    // Fallback colored box
    const w = resource.width || 32;
    const h = resource.height || 32;
    ghost.style.width = w + 'px';
    ghost.style.height = h + 'px';
    ghost.style.backgroundColor = '#4caf50';
    ghost.style.opacity = '0.5';
  }
  
  // Add grid position label
  const label = document.createElement('div');
  label.id = 'btools-ghost-label';
  label.style.cssText = `
    position: absolute;
    bottom: -18px;
    left: 50%;
    transform: translateX(-50%);
    color: #4caf50;
    font-size: 9px;
    font-family: 'Courier New', monospace;
    background: rgba(0,0,0,0.8);
    padding: 0 4px;
    border-radius: 2px;
    white-space: nowrap;
    display: none;
  `;
  label.textContent = '(0, 0)';
  ghost.appendChild(label);
  
  document.body.appendChild(ghost);
  this.placementGhost = ghost;
}
  
  getResourceById(id) {
    for (const section of Object.values(btoolsResources)) {
      for (const resource of section.resources) {
        if (resource.id === id) {
          return resource;
        }
      }
    }
    return null;
  }
  
  // ============================================================
  // CUSTOM PLACEMENT SYSTEM
  // ============================================================
  
  startPlacement(resource) {
    if (this.placementActive) {
      this.cancelPlacement();
    }
    
    this.placementActive = true;
    this.placementResource = resource;
    this.isOverCanvas = false;
    
    // Create ghost preview
    this.createPlacementGhost(resource);
    
    // Setup mouse tracking
    this.setupPlacementEvents();
    
    this.app.console.log('info', `[Btools] Placement started: ${resource.name}. Click on Game Preview to place.`);
    this.showToast(`Click on Game Preview to place ${resource.name}`, 'info');
  }
  
  createPlacementGhost(resource) {
    // Remove old ghost
    if (this.placementGhost) {
      this.placementGhost.remove();
      this.placementGhost = null;
    }
    
    const ghost = document.createElement('div');
    ghost.id = 'btools-placement-ghost';
    ghost.style.cssText = `
      position: fixed;
      pointer-events: none;
      z-index: 9999;
      opacity: 0.7;
      border: 2px solid #4caf50;
      border-radius: 4px;
      background: rgba(76, 175, 80, 0.15);
      display: none;
      image-rendering: pixelated;
      transition: none;
    `;
    
    // Try to load the actual image for preview
    if (resource.asset) {
      const img = this.game.assetLoader.getImage(resource.asset);
      if (img) {
        const w = resource.width || 32;
        const h = resource.height || 32;
        ghost.innerHTML = `<img src="${resource.asset}" style="width:${w}px;height:${h}px;image-rendering:pixelated;display:block;">`;
        ghost.style.width = w + 'px';
        ghost.style.height = h + 'px';
      } else {
        // Fallback colored box
        const w = resource.width || 32;
        const h = resource.height || 32;
        ghost.style.width = w + 'px';
        ghost.style.height = h + 'px';
        ghost.style.backgroundColor = '#4caf50';
        ghost.style.opacity = '0.5';
      }
    } else {
      // Fallback colored box
      const w = resource.width || 32;
      const h = resource.height || 32;
      ghost.style.width = w + 'px';
      ghost.style.height = h + 'px';
      ghost.style.backgroundColor = '#4caf50';
      ghost.style.opacity = '0.5';
    }
    
    // Add grid position label
    const label = document.createElement('div');
    label.id = 'btools-ghost-label';
    label.style.cssText = `
      position: absolute;
      bottom: -18px;
      left: 50%;
      transform: translateX(-50%);
      color: #4caf50;
      font-size: 9px;
      font-family: 'Courier New', monospace;
      background: rgba(0,0,0,0.8);
      padding: 0 4px;
      border-radius: 2px;
      white-space: nowrap;
      display: none;
    `;
    label.textContent = '(0, 0)';
    ghost.appendChild(label);
    
    document.body.appendChild(ghost);
    this.placementGhost = ghost;
  }
  
  setupPlacementEvents() {
    // Remove any existing listeners to avoid duplicates
    this.cleanupPlacementEvents();
    
    // Store bound handlers so we can remove them later
    this._placementHandlers = {
      mousemove: this.onPlacementMouseMove.bind(this),
      mouseup: this.onPlacementMouseUp.bind(this),
      keydown: this.onPlacementKeyDown.bind(this)
    };
    
    document.addEventListener('mousemove', this._placementHandlers.mousemove);
    document.addEventListener('mouseup', this._placementHandlers.mouseup);
    document.addEventListener('keydown', this._placementHandlers.keydown);
  }
  
  cleanupPlacementEvents() {
    if (this._placementHandlers) {
      document.removeEventListener('mousemove', this._placementHandlers.mousemove);
      document.removeEventListener('mouseup', this._placementHandlers.mouseup);
      document.removeEventListener('keydown', this._placementHandlers.keydown);
      this._placementHandlers = null;
    }
  }
  
  onPlacementMouseMove(e) {
    if (!this.placementActive || !this.placementGhost) return;
    
    const canvas = document.getElementById('gameCanvas');
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const isOver = e.clientX >= rect.left && e.clientX <= rect.right &&
                   e.clientY >= rect.top && e.clientY <= rect.bottom;
    
    this.isOverCanvas = isOver;
    
    if (!isOver) {
      this.placementGhost.style.display = 'none';
      const label = document.getElementById('btools-ghost-label');
      if (label) label.style.display = 'none';
      canvas.style.outline = 'none';
      return;
    }
    
    // Show ghost
    this.placementGhost.style.display = 'block';
    canvas.style.outline = '2px solid #4caf50';
    
    // Calculate world position
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const screenX = (e.clientX - rect.left) * scaleX;
    const screenY = (e.clientY - rect.top) * scaleY;
    
    const worldX = screenX + this.game.camera.x;
    const worldY = screenY + this.game.camera.y;
    
    const tileSize = this.game.tileSize || 32;
    const gridX = Math.floor(worldX / tileSize);
    const gridY = Math.floor(worldY / tileSize);
    const snapX = gridX * tileSize + tileSize / 2;
    const snapY = gridY * tileSize + tileSize / 2;
    
    this.placementGridX = gridX;
    this.placementGridY = gridY;
    this.placementWorldX = snapX;
    this.placementWorldY = snapY;
    
    // Position ghost on screen (snapped to grid)
    const ghostScreenX = (snapX - this.game.camera.x) * (rect.width / canvas.width) + rect.left;
    const ghostScreenY = (snapY - this.game.camera.y) * (rect.height / canvas.height) + rect.top;
    
    const ghostWidth = this.placementGhost.offsetWidth || (this.placementResource.width || 32);
    const ghostHeight = this.placementGhost.offsetHeight || (this.placementResource.height || 32);
    
    this.placementGhost.style.left = (ghostScreenX - ghostWidth / 2) + 'px';
    this.placementGhost.style.top = (ghostScreenY - ghostHeight / 2) + 'px';
    
    // Update label
    const label = document.getElementById('btools-ghost-label');
    if (label) {
      label.style.display = 'block';
      label.textContent = `(${gridX}, ${gridY})`;
    }
  }
  
  onPlacementMouseUp(e) {
    if (!this.placementActive) return;
    
    // Check if mouse was over canvas when released
    const canvas = document.getElementById('gameCanvas');
    if (!canvas) {
      this.cancelPlacement();
      return;
    }
    
    const rect = canvas.getBoundingClientRect();
    const isOver = e.clientX >= rect.left && e.clientX <= rect.right &&
                   e.clientY >= rect.top && e.clientY <= rect.bottom;
    
    if (isOver && this.placementResource) {
      // Place the object!
      this.placeObjectAtGrid(
        this.placementResource,
        this.placementGridX,
        this.placementGridY,
        this.placementWorldX,
        this.placementWorldY
      );
    }
    
    // Always cancel placement after click (whether placed or not)
    this.cancelPlacement();
  }
  
  onPlacementKeyDown(e) {
    if (e.key === 'Escape') {
      this.cancelPlacement();
      this.app.console.log('info', '[Btools] Placement cancelled');
    }
  }
  
  cancelPlacement() {
    this.placementActive = false;
    this.placementResource = null;
    this.isOverCanvas = false;
    
    this.cleanupPlacementEvents();
    
    if (this.placementGhost) {
      this.placementGhost.remove();
      this.placementGhost = null;
    }
    
    const canvas = document.getElementById('gameCanvas');
    if (canvas) canvas.style.outline = 'none';
    
    // Reset cursor
    document.body.style.cursor = 'default';
  }
  
placeObjectAtGrid(resource, gridX, gridY, worldX, worldY) {
  const tileSize = this.game.tileSize || 32;
  const snapX = gridX * tileSize + tileSize / 2;
  const snapY = gridY * tileSize + tileSize / 2;
  
  const templateName = resource.template || resource.id;
  const template = this.app.templateLoader.templates.get(templateName);
  
  // --- CRITICAL FIX: Ensure we have the asset path ---
  const assetPath = resource.asset || null;
  const resourceName = resource.name || 'Object';
  const resourceWidth = resource.width || 32;
  const resourceHeight = resource.height || 32;
  
  // Log what we're placing
  console.log('[Btools] Placing resource:', {
    name: resourceName,
    asset: assetPath,
    width: resourceWidth,
    height: resourceHeight,
    template: templateName,
    hasTemplate: !!template
  });
  
  if (template) {
    // Create entity from template
    const entity = this.app.entityManager.createEntity(
      resourceName || template.name,
      template.type || 'object'
    );
    
    // Copy template components
    for (const [compName, compData] of Object.entries(template.components)) {
      entity.components[compName] = { ...compData };
    }
    
    // --- FIX: Set transform with correct position ---
    if (entity.components.transform) {
      entity.components.transform.x = snapX;
      entity.components.transform.y = snapY;
      if (resourceWidth) entity.components.transform.width = resourceWidth;
      if (resourceHeight) entity.components.transform.height = resourceHeight;
    }
    
    // --- FIX: Set sprite asset directly and ensure it's correct ---
    if (entity.components.sprite) {
      // Override the sprite with the resource's asset
      entity.components.sprite.asset = assetPath;
      entity.components.sprite.width = resourceWidth;
      entity.components.sprite.height = resourceHeight;
    } else if (assetPath) {
      // Create sprite component if it doesn't exist
      entity.components.sprite = {
        asset: assetPath,
        width: resourceWidth,
        height: resourceHeight
      };
    }
    
    // --- FIX: Pre-load the image to ensure it renders ---
    if (assetPath) {
      // Ensure the asset is loaded
      const fullPath = `assets/sprites/${assetPath}`;
      // Check if already loaded, if not trigger load
      if (!this.game.assetLoader.getImage(fullPath)) {
        this.game.assetLoader.loadImage(fullPath).catch(() => {
          console.warn(`[Btools] Could not load asset: ${fullPath}`);
        });
      }
    }
    
    // Add collision if missing
    if (!entity.components.collision) {
      const w = resourceWidth;
      const h = resourceHeight;
      entity.components.collision = {
        width: w * 0.7,
        height: h * 0.7,
        offsetX: w * 0.15,
        offsetY: h * 0.15
      };
    }
    
    // Add to game
    this.game.addEntity(entity);
    this.app.addEntityToLocation(entity);
    this.app.showEntityProperties(entity);
    
    this.showToast(`Placed ${resourceName} at (${gridX}, ${gridY})`, 'success');
    this.app.console.log('info', `[Btools] Placed object ${resourceName} with asset ${assetPath || 'none'} at (${gridX}, ${gridY})`);
    
    if (this.app) {
      this.app.markDirty();
      this.app.updateSaveStatus();
      this.app.console.log('info', '[Btools] Object placed - project marked dirty');
    }
    return;
  }
  
  // --- FIX: Create simple object without template ---
  // Use the actual asset path, NOT a hardcoded fallback
  const entity = this.app.entityManager.createEntity(resourceName, 'object');
  
  // Set transform
  entity.components.transform = {
    x: snapX,
    y: snapY,
    width: resourceWidth,
    height: resourceHeight
  };
  
  // --- FIX: Set sprite with the actual asset path ---
  // Use assetPath (which may be null) - if null, use a placeholder
  const finalAsset = assetPath || 'crate.png';
  entity.components.sprite = {
    asset: finalAsset,
    width: resourceWidth,
    height: resourceHeight
  };
  
  // --- FIX: Pre-load the image ---
  if (assetPath) {
    const fullPath = `assets/sprites/${assetPath}`;
    if (!this.game.assetLoader.getImage(fullPath)) {
      this.game.assetLoader.loadImage(fullPath).catch(() => {
        console.warn(`[Btools] Could not load asset: ${fullPath}`);
      });
    }
  }
  
  // Add collision
  entity.components.collision = {
    width: resourceWidth * 0.7,
    height: resourceHeight * 0.7,
    offsetX: resourceWidth * 0.15,
    offsetY: resourceHeight * 0.15
  };
  
  // Add to game
  this.game.addEntity(entity);
  this.app.addEntityToLocation(entity);
  this.app.showEntityProperties(entity);
  
  this.showToast(`Placed ${resourceName} at (${gridX}, ${gridY})`, 'success');
  this.app.console.log('info', `[Btools] Placed simple object ${resourceName} with asset ${finalAsset} at (${gridX}, ${gridY})`);
  
  if (this.app) {
    this.app.markDirty();
    this.app.updateSaveStatus();
    this.app.console.log('info', '[Btools] Object placed - project marked dirty');
  }
}
  
  // ============================================================
  // TOAST NOTIFICATIONS
  // ============================================================
  
  showToast(message, type = 'info') {
    const existing = document.querySelector('.btools-toast');
    if (existing) existing.remove();
    
    const toast = document.createElement('div');
    toast.className = 'btools-toast';
    const colors = {
      info: '#888',
      success: '#4caf50',
      error: '#f44336',
      warning: '#ff9800'
    };
    toast.style.cssText = `
      position: fixed;
      bottom: 100px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(0, 0, 0, 0.9);
      color: ${colors[type] || '#888'};
      padding: 8px 20px;
      border-radius: 6px;
      border: 1px solid ${colors[type] || '#888'};
      font-family: 'Courier New', monospace;
      font-size: 12px;
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
    }, 2000);
  }
  
  // ============================================================
  // TERRAIN PAINTING (unchanged)
  // ============================================================
  
  setupEvents() {
    const canvas = document.getElementById('gameCanvas');
    if (!canvas) {
      console.error('[Btools] Canvas not found!');
      return;
    }
    
    // --- TERRAIN PAINTING ---
    canvas.addEventListener('mousedown', (e) => {
      if (!this.selectedTerrain) return;
      if (this.currentSection !== 'environment') return;
      if (e.button !== 0) return;
      
      this.isPainting = true;
      this.paintTerrain(e);
    });
    
    canvas.addEventListener('mousemove', (e) => {
      if (!this.isPainting || !this.selectedTerrain) return;
      this.paintTerrain(e);
    });
    
    canvas.addEventListener('mouseup', () => {
      if (this.isPainting) {
        this.isPainting = false;
        if (this.app) {
          this.app.markDirty();
          this.app.updateSaveStatus();
          this.app.console.log('info', '[Btools] Terrain painted - project marked dirty');
        }
      }
    });
    
    canvas.addEventListener('mouseleave', () => {
      if (this.isPainting) {
        this.isPainting = false;
      }
    });
    
    console.log('[Btools] Events setup complete (custom placement)');
  }
  
  paintTerrain(e) {
    if (!this.selectedTerrain) return;
    
    const canvas = document.getElementById('gameCanvas');
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const screenX = (e.clientX - rect.left) * scaleX;
    const screenY = (e.clientY - rect.top) * scaleY;
    
    const worldX = screenX + this.game.camera.x;
    const worldY = screenY + this.game.camera.y;
    
    const tileSize = this.game.tileSize || 32;
    const centerTileX = Math.floor(worldX / tileSize);
    const centerTileY = Math.floor(worldY / tileSize);
    
    const location = this.game.locationLoader.getCurrentLocation();
    if (!location) return;
    
    if (!location.layers) location.layers = {};
    if (!location.layers.ground) {
      const h = location.height || 30;
      const w = location.width || 40;
      location.layers.ground = Array(h).fill(null).map(() => Array(w).fill(0));
    }
    
    const h = location.layers.ground.length;
    const w = location.layers.ground[0]?.length || 40;
    
    const halfSize = Math.floor(this.brushSize / 2);
    const tileValue = this.selectedTerrain.tileValue !== undefined ? this.selectedTerrain.tileValue : 0;
    
    let painted = false;
    for (let dy = -halfSize; dy < this.brushSize - halfSize; dy++) {
      for (let dx = -halfSize; dx < this.brushSize - halfSize; dx++) {
        const tx = centerTileX + dx;
        const ty = centerTileY + dy;
        if (tx >= 0 && tx < w && ty >= 0 && ty < h) {
          location.layers.ground[ty][tx] = tileValue;
          painted = true;
        }
      }
    }
    
    if (painted && canvas) {
      canvas.style.outline = '2px solid #ffcc00';
      setTimeout(() => {
        canvas.style.outline = '2px solid #4caf50';
      }, 100);
    }
  }
  
  // ============================================================
  // SHOW / HIDE
  // ============================================================
  
  switchSection(sectionId) {
    this.cancelPlacement();
    this.currentSection = sectionId;
    this.currentFilter = 'All';
    this.selectedTerrain = null;
    this.render();
  }
  
  show() {
    if (this.panel) {
      this.panel.style.display = 'flex';
    }
    const propertiesContent = document.getElementById('properties-content');
    if (propertiesContent) {
      const defaultMsg = propertiesContent.querySelector('p');
      if (defaultMsg) {
        defaultMsg.style.display = 'none';
      }
    }
    this.render();
  }
  
  hide() {
    this.cancelPlacement();
    if (this.panel) {
      this.panel.style.display = 'none';
    }
    const propertiesContent = document.getElementById('properties-content');
    if (propertiesContent) {
      const defaultMsg = propertiesContent.querySelector('p');
      if (defaultMsg && !this.app.game.selectedEntity) {
        defaultMsg.style.display = 'block';
      }
    }
  }
}