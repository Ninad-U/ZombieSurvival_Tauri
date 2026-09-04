export class TemplateLoader {
    constructor() {
        this.templates = new Map();
        this.loaded = false;
    }
    
    async loadAll() {
        // Load templates from data
        const templateData = {
player: {
    name: 'Player',
    type: 'player',
    components: {
        transform: { x: 0, y: 0, width: 32, height: 48 },
        sprite: { asset: 'player.png', width: 32, height: 48 },
        movement: { speed: 200 },
        health: { maxHealth: 100, currentHealth: 100 },
        collision: { width: 24, height: 32, offsetX: 4, offsetY: 8 },
        combat: { damage: 10, range: 40, cooldown: 0.5 },
        rig: { preset: 'detailed_biped', scale: 1 },
        survival: {
            hunger: 100,
            maxHunger: 100,
            hungerDrainRate: 0.3,
            thirst: 100,
            maxThirst: 100,
            thirstDrainRate: 0.4,
            fatigue: 100,
            maxFatigue: 100,
            fatigueDrainRate: 0.1,
            healthDamagePerSecond: 2
        }
    }
},
            enemy: {
                name: 'Enemy',
                type: 'enemy',
                components: {
                    transform: { x: 0, y: 0, width: 32, height: 48 },
                    sprite: { asset: 'zombie.png', width: 32, height: 48 },
                    health: { maxHealth: 50, currentHealth: 50 },
                    collision: { width: 24, height: 32, offsetX: 4, offsetY: 8 },
                    combat: { damage: 5, range: 30, cooldown: 1.0 },
                    ai: { type: 'chase', detectionRange: 200, attackRange: 35 },
                    rig: { preset: 'simple_biped', scale: 1 }
                }
            },
npc: {
    name: 'NPC',
    type: 'npc',
    components: {
        transform: { x: 0, y: 0, width: 32, height: 48 },
        sprite: { asset: 'player.png', width: 32, height: 48 },
        health: { maxHealth: 50, currentHealth: 50 },
        rig: { preset: 'simple_biped', scale: 1 },
        npc: {
            name: 'NPC',
            faction: 'neutral',
            dialogue: 'test_conversation',
            interactionRadius: 50
        }
    }
},
            item: {
                name: 'Item',
                type: 'item',
                components: {
                    transform: { x: 0, y: 0, width: 16, height: 16 },
                    sprite: { asset: 'food.png', width: 16, height: 16 },
                    interaction: { range: 30, prompt: 'Pick Up' }
                }
            },
            weapon: {
                name: 'Weapon',
                type: 'item',
                components: {
                    transform: { x: 0, y: 0, width: 24, height: 24 },
                    sprite: { asset: 'crate.png', width: 24, height: 24 },
                    combat: { damage: 15, range: 50, cooldown: 0.3 }
                }
            },
            interactable: {
                name: 'Interactable',
                type: 'interactable',
                components: {
                    transform: { x: 0, y: 0, width: 32, height: 32 },
                    sprite: { asset: 'crate.png', width: 32, height: 32 },
                    interaction: { range: 40, prompt: 'Interact' }
                }
            },
            mission: {
                name: 'Mission',
                type: 'mission',
                components: {
                    transform: { x: 0, y: 0, width: 16, height: 16 },
                    sprite: { asset: 'food.png', width: 16, height: 16 }
                }
            },
            food: {
    name: 'Food',
    type: 'item',
    components: {
        transform: { x: 0, y: 0, width: 16, height: 16 },
        sprite: { asset: 'food.png', width: 16, height: 16 },
        interaction: { range: 30, prompt: 'Pick Up' },
        consumable: {
            type: 'food',
            hungerRestore: 30,
            thirstRestore: 0,
            fatigueRestore: 0,
            useTime: 1.0,
            message: 'You ate some food.'
        }
    }
},
water: {
    name: 'Water',
    type: 'item',
    components: {
        transform: { x: 0, y: 0, width: 16, height: 16 },
        sprite: { asset: 'water.png', width: 16, height: 16 },
        interaction: { range: 30, prompt: 'Pick Up' },
        consumable: {
            type: 'water',
            hungerRestore: 0,
            thirstRestore: 40,
            fatigueRestore: 0,
            useTime: 0.8,
            message: 'You drank some water.'
        }
    }
},
medicine: {
    name: 'Medicine',
    type: 'item',
    components: {
        transform: { x: 0, y: 0, width: 16, height: 16 },
        sprite: { asset: 'medicine.png', width: 16, height: 16 },
        interaction: { range: 30, prompt: 'Pick Up' },
        consumable: {
            type: 'medicine',
            hungerRestore: 0,
            thirstRestore: 0,
            fatigueRestore: 0,
            healthRestore: 25,
            useTime: 1.5,
            message: 'You took some medicine.'
        }
    }
},

crate: {
    name: 'Crate',
    type: 'object',
    components: {
        transform: { x: 0, y: 0, width: 32, height: 32 },
        sprite: { asset: 'crate.png', width: 32, height: 32 },
        collision: { width: 28, height: 28, offsetX: 2, offsetY: 2 }
    }
},
door: {
    name: 'Door',
    type: 'object',
    components: {
        transform: { x: 0, y: 0, width: 32, height: 48 },
        sprite: { asset: 'door.png', width: 32, height: 48 },
        collision: { width: 28, height: 44, offsetX: 2, offsetY: 2 }
    }
},
bed: {
    name: 'Bed',
    type: 'object',
    components: {
        transform: { x: 0, y: 0, width: 48, height: 32 },
        sprite: { asset: 'bed.png', width: 48, height: 32 },
        collision: { width: 44, height: 28, offsetX: 2, offsetY: 2 }
    }
},
tree: {
    name: 'Tree',
    type: 'object',
    components: {
        transform: { x: 0, y: 0, width: 32, height: 48 },
        sprite: { asset: 'tree.png', width: 32, height: 48 },
        collision: { width: 20, height: 20, offsetX: 6, offsetY: 14 }
    }
},
rock: {
    name: 'Rock',
    type: 'object',
    components: {
        transform: { x: 0, y: 0, width: 32, height: 24 },
        sprite: { asset: 'rock.png', width: 32, height: 24 },
        collision: { width: 28, height: 20, offsetX: 2, offsetY: 2 }
    }
},
barrel: {
    name: 'Barrel',
    type: 'object',
    components: {
        transform: { x: 0, y: 0, width: 24, height: 32 },
        sprite: { asset: 'crate.png', width: 24, height: 32 }, // Using crate as placeholder
        collision: { width: 20, height: 28, offsetX: 2, offsetY: 2 }
    }
}



        };
        
        for (const [key, data] of Object.entries(templateData)) {
            this.templates.set(key, data);
        }
        
        this.loaded = true;
        return this.templates;
    }
    
    async loadTemplate(name) {
        if (!this.loaded) {
            await this.loadAll();
        }
        return this.templates.get(name) || null;
    }
    
    getTemplateNames() {
        return Array.from(this.templates.keys());
    }
    
    saveTemplate(name, data) {
        this.templates.set(name, data);
        // In a real implementation, this would save to disk
    }
}