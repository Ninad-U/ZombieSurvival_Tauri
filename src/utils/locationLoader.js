// Location Loader
// Loads and manages location data

export class LocationLoader {
    constructor() {
        this.locations = new Map();
        this.currentLocation = null;
    }
    
    async loadLocation(locationId) {
        try {
            const response = await fetch(`data/locations/${locationId}.json`);
            if (!response.ok) {
                throw new Error(`Failed to load location: ${locationId}`);
            }
            const data = await response.json();
            
            this.locations.set(locationId, data);
            this.currentLocation = locationId;
            
            return data;
        } catch (error) {
            console.error('Error loading location:', error);
            return null;
        }
    }
    
    getCurrentLocation() {
        return this.locations.get(this.currentLocation) || null;
    }
    
    getLocation(locationId) {
        return this.locations.get(locationId) || null;
    }
    
    getExit(exitId) {
        const location = this.getCurrentLocation();
        if (!location) return null;
        return location.exits?.find(e => e.id === exitId) || null;
    }
    
    getSpawnPoint(spawnId) {
        const location = this.getCurrentLocation();
        if (!location) return null;
        return location.spawnPoints?.[spawnId] || location.spawnPoints?.default || null;
    }
    
    getEntities() {
        const location = this.getCurrentLocation();
        if (!location) return [];
        return location.entities || [];
    }
    
getExitAt(playerX, playerY) {
    const location = this.getCurrentLocation();
    if (!location) return null;
    
    for (const exit of (location.exits || [])) {
        const sizeX = exit.size?.x || 2; // Default to 2 for normal door
        const sizeY = exit.size?.y || 3; // Default height to 3 for doors
        
        // Check if player is within the exit's tile area
        const minX = exit.x;
        const maxX = exit.x + sizeX - 1;
        const minY = exit.y;
        const maxY = exit.y + sizeY - 1;
        
        if (playerX >= minX && playerX <= maxX && 
            playerY >= minY && playerY <= maxY) {
            return exit;
        }
    }
    return null;
}
    
    getExitAtTile(tileX, tileY) {
        const location = this.getCurrentLocation();
        if (!location) return null;
        
        for (const exit of (location.exits || [])) {
            if (exit.x === tileX && exit.y === tileY) {
                return exit;
            }
        }
        return null;
    }
    
    isValidPosition(x, y) {
        const location = this.getCurrentLocation();
        if (!location) return false;
        
        const w = location.width || 40;
        const h = location.height || 30;
        
        if (x < 0 || x >= w || y < 0 || y >= h) return false;
        
        const collision = location.layers?.collision || [];
        if (collision[y] && collision[y][x] === 1) {
            return false;
        }
        
        return true;
    }
    
    isSolid(x, y) {
        const location = this.getCurrentLocation();
        if (!location) return true;
        
        const w = location.width || 40;
        const h = location.height || 30;
        
        if (x < 0 || x >= w || y < 0 || y >= h) return true;
        
        const collision = location.layers?.collision || [];
        if (collision[y] && collision[y][x] === 1) {
            return true;
        }
        
        return false;
    }
    
    getMapWidth() {
        const location = this.getCurrentLocation();
        if (!location) return 40;
        return location.width || 40;
    }
    
    getMapHeight() {
        const location = this.getCurrentLocation();
        if (!location) return 30;
        return location.height || 30;
    }
}