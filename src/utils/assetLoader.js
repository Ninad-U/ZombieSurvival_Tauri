// Asset Loader
// Loads and caches images for the game with state tracking

export const AssetState = {
    IDLE: 'idle',
    LOADING: 'loading',
    LOADED: 'loaded',
    MISSING: 'missing',
    FAILED: 'failed'
};

export class AssetLoader {
    constructor() {
        this.cache = new Map();
        this.states = new Map();
        this.loadingPromises = new Map();
        this.preloadComplete = false;
    }
    
    async loadImage(path) {
        if (this.cache.has(path)) {
            return this.cache.get(path);
        }
        
        const state = this.states.get(path);
        if (state === AssetState.MISSING || state === AssetState.FAILED) {
            return null;
        }
        
        if (this.loadingPromises.has(path)) {
            return this.loadingPromises.get(path);
        }
        
        this.states.set(path, AssetState.LOADING);
        const promise = new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                this.cache.set(path, img);
                this.states.set(path, AssetState.LOADED);
                this.loadingPromises.delete(path);
                resolve(img);
            };
            img.onerror = () => {
                this.states.set(path, AssetState.MISSING);
                this.loadingPromises.delete(path);
                reject(new Error(`Failed to load image: ${path}`));
            };
            img.src = path;
        });
        
        this.loadingPromises.set(path, promise);
        
        try {
            return await promise;
        } catch {
            return null;
        }
    }
    
    getImage(path) {
        if (this.states.get(path) === AssetState.MISSING) {
            return null;
        }
        return this.cache.get(path) || null;
    }
    
    getState(path) {
        return this.states.get(path) || AssetState.IDLE;
    }
    
    isLoaded(path) {
        return this.cache.has(path);
    }
    
    isMissing(path) {
        return this.states.get(path) === AssetState.MISSING;
    }
}