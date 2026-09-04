export class Entity {
    constructor(name, type) {
        this.id = this.generateId();
        this.name = name || 'Entity';
        this.type = type || 'entity';
        this.components = {};
        this.active = true;
        this.createdAt = Date.now();
    }
    
    generateId() {
        return 'entity_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
    }
    
    getComponent(name) {
        return this.components[name] || null;
    }
    
    setComponent(name, data) {
        this.components[name] = data;
    }
    
    hasComponent(name) {
        return name in this.components;
    }
    
    getRig() {
        return this.components.rig || null;
    }
    
    getAttachmentPoint(name) {
        const rig = this.getRig();
        if (!rig) return null;
        const transform = this.components.transform;
        if (!transform) return null;
        return rig.getWorldPosition(name, transform);
    }
    
    toJSON() {
        return {
            id: this.id,
            name: this.name,
            type: this.type,
            components: this.components,
            active: this.active
        };
    }
    
    static fromJSON(data) {
        const entity = new Entity(data.name, data.type);
        entity.id = data.id;
        entity.components = data.components || {};
        entity.active = data.active !== undefined ? data.active : true;
        return entity;
    }
}

export class EntityManager {
    constructor() {
        this.entities = new Map();
        this.listeners = [];
    }
    
    createEntity(name, type) {
        const entity = new Entity(name, type);
        this.entities.set(entity.id, entity);
        this.notify('create', entity);
        return entity;
    }
    
    getEntity(id) {
        return this.entities.get(id) || null;
    }
    
    getEntitiesByType(type) {
        const result = [];
        for (const entity of this.entities.values()) {
            if (entity.type === type) {
                result.push(entity);
            }
        }
        return result;
    }
    
    removeEntity(id) {
        const entity = this.entities.get(id);
        if (entity) {
            this.entities.delete(id);
            this.notify('remove', entity);
            return true;
        }
        return false;
    }
    
    addListener(callback) {
        this.listeners.push(callback);
    }
    
    notify(event, entity) {
        for (const listener of this.listeners) {
            listener(event, entity);
        }
    }
    
    toJSON() {
        return Array.from(this.entities.values()).map(e => e.toJSON());
    }
    
    fromJSON(data) {
        for (const item of data) {
            const entity = Entity.fromJSON(item);
            this.entities.set(entity.id, entity);
        }
    }
}