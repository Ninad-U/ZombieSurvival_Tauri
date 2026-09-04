// Mission Component
// Data-driven mission system for tracking player missions

export class MissionComponent {
    constructor(config = {}) {
        this.id = config.id || null;
        this.name = config.name || 'Mission';
        this.description = config.description || '';
        this.startNpc = config.startNpc || null;
        this.startLocation = config.startLocation || null;
        this.status = config.status || 'inactive'; // inactive, active, completed, failed
        this.objectives = config.objectives || [];
        this.currentObjectiveIndex = 0;
        this.rewards = config.rewards || { items: [], xp: 0 };
        this.completedAt = null;
        this.startedAt = null;
    }
    
    start() {
        if (this.status === 'inactive') {
            this.status = 'active';
            this.startedAt = Date.now();
            this.currentObjectiveIndex = 0;
            if (this.objectives.length > 0) {
                this.objectives[0].completed = false;
            }
            return true;
        }
        return false;
    }
    
    getCurrentObjective() {
        if (this.currentObjectiveIndex < this.objectives.length) {
            return this.objectives[this.currentObjectiveIndex];
        }
        return null;
    }
    
    getNextObjective() {
        const nextIndex = this.currentObjectiveIndex + 1;
        if (nextIndex < this.objectives.length) {
            return this.objectives[nextIndex];
        }
        return null;
    }
    
    advanceObjective() {
        // Mark current objective as completed
        const current = this.getCurrentObjective();
        if (current) {
            current.completed = true;
        }
        
        // Move to next objective
        this.currentObjectiveIndex++;
        
        // Check if all objectives are complete
        if (this.currentObjectiveIndex >= this.objectives.length) {
            this.complete();
            return null;
        }
        
        // Return the next objective
        return this.getCurrentObjective();
    }
    
    complete() {
        if (this.status === 'active') {
            this.status = 'completed';
            this.completedAt = Date.now();
            // Mark all objectives as completed
            for (const obj of this.objectives) {
                obj.completed = true;
            }
            return true;
        }
        return false;
    }
    
    fail() {
        if (this.status === 'active') {
            this.status = 'failed';
            return true;
        }
        return false;
    }
    
    isActive() {
        return this.status === 'active';
    }
    
    isComplete() {
        return this.status === 'completed';
    }
    
    isFailed() {
        return this.status === 'failed';
    }
    
    getProgress() {
        const total = this.objectives.length;
        const completed = this.objectives.filter(o => o.completed).length;
        return { total, completed, percent: total > 0 ? (completed / total) * 100 : 0 };
    }
    
    getObjectiveById(id) {
        return this.objectives.find(o => o.id === id) || null;
    }
    
checkObjective(eventType, data) {
    const current = this.getCurrentObjective();
    if (!current || current.completed) return false;
    
    // Check if this objective matches the event
    switch (current.type) {
        case 'talk_to_npc':
            if (eventType === 'npc_talked' && current.target === data.npcId) {
                return this.advanceObjective();
            }
            break;
        case 'reach_location':
            if (eventType === 'location_reached' && current.target === data.locationId) {
                return this.advanceObjective();
            }
            break;
        case 'collect_item':
            if (eventType === 'item_collected' && current.item === data.itemId) {
                if (!current._collected) current._collected = 0;
                current._collected += data.quantity || 1;
                if (current._collected >= current.quantity) {
                    return this.advanceObjective();
                }
                return false;
            }
            break;
        case 'kill_enemy':
            if (eventType === 'enemy_killed') {
                if (!current._killed) current._killed = 0;
                current._killed += 1;
                if (current._killed >= current.quantity) {
                    return this.advanceObjective();
                }
                return false;
            }
            break;
        case 'kill_specific_enemy':
            if (eventType === 'enemy_killed' && current.target === data.enemyType) {
                if (!current._killed) current._killed = 0;
                current._killed += 1;
                if (current._killed >= current.required) {
                    return this.advanceObjective();
                }
                return false;
            }
            break;
        case 'reach_location':
            if (eventType === 'location_reached' && current.target === data.locationId) {
                return this.advanceObjective();
            }
            break;
        default:
            return false;
    }
    return false;
}
    
    toJSON() {
        return {
            id: this.id,
            name: this.name,
            description: this.description,
            startNpc: this.startNpc,
            startLocation: this.startLocation,
            status: this.status,
            objectives: this.objectives,
            currentObjectiveIndex: this.currentObjectiveIndex,
            rewards: this.rewards,
            completedAt: this.completedAt,
            startedAt: this.startedAt
        };
    }
    
    static fromJSON(data) {
        const mission = new MissionComponent({
            id: data.id,
            name: data.name,
            description: data.description,
            startNpc: data.startNpc,
            startLocation: data.startLocation,
            status: data.status,
            objectives: data.objectives,
            rewards: data.rewards
        });
        mission.currentObjectiveIndex = data.currentObjectiveIndex || 0;
        mission.completedAt = data.completedAt || null;
        mission.startedAt = data.startedAt || null;
        return mission;
    }
}