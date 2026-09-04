// Component definitions
export class Component {
    constructor(type, data = {}) {
        this.type = type;
        this.data = data;
    }
    
    get(key, defaultValue = null) {
        return this.data[key] !== undefined ? this.data[key] : defaultValue;
    }
    
    set(key, value) {
        this.data[key] = value;
    }
    
    toJSON() {
        return { type: this.type, data: this.data };
    }
}

// Component registry
export const ComponentRegistry = {
    components: new Map(),
    
    register(name, defaults = {}) {
        this.components.set(name, { name, defaults });
    },
    
    get(name) {
        return this.components.get(name) || null;
    },
    
    create(name, data = {}) {
        const def = this.get(name);
        if (!def) {
            throw new Error(`Unknown component: ${name}`);
        }
        return new Component(name, { ...def.defaults, ...data });
    }
};

// Register default components
ComponentRegistry.register('transform', { x: 0, y: 0, width: 32, height: 32 });
ComponentRegistry.register('sprite', { asset: 'default.png', width: 32, height: 32, frame: 0 });
ComponentRegistry.register('movement', { speed: 100 });
ComponentRegistry.register('health', { maxHealth: 100, currentHealth: 100 });
ComponentRegistry.register('collision', { width: 24, height: 24, offsetX: 4, offsetY: 4 });
ComponentRegistry.register('combat', { damage: 10, range: 40, cooldown: 0.5 });
ComponentRegistry.register('ai', { type: 'passive', detectionRange: 150, attackRange: 30 });
ComponentRegistry.register('inventory', { items: [], maxSize: 20 });
ComponentRegistry.register('interaction', { range: 50, prompt: '' });
ComponentRegistry.register('status_effects', { effects: [] });