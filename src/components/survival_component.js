// Survival Component
// Tracks hunger, thirst, and fatigue for entities

export class SurvivalComponent {
    constructor(config = {}) {
        // Hunger (0-100, 0 = starving, 100 = full)
        this.hunger = config.hunger || 100;
        this.maxHunger = config.maxHunger || 100;
        this.hungerDrainRate = config.hungerDrainRate || 0.5; // per second
        
        // Thirst (0-100, 0 = dehydrated, 100 = hydrated)
        this.thirst = config.thirst || 100;
        this.maxThirst = config.maxThirst || 100;
        this.thirstDrainRate = config.thirstDrainRate || 0.7; // per second
        
        // Fatigue (0-100, 0 = exhausted, 100 = rested)
        this.fatigue = config.fatigue || 100;
        this.maxFatigue = config.maxFatigue || 100;
        this.fatigueDrainRate = config.fatigueDrainRate || 0.2; // per second (slower)
        
        // Status flags
        this.isStarving = false;
        this.isDehydrated = false;
        this.isExhausted = false;
        this.isDead = false;
        
        // Consequences
        this.healthDamagePerSecond = config.healthDamagePerSecond || 2;
        this.speedReduction = config.speedReduction || 0.5; // 50% speed when exhausted
        
        // Timers for warning messages
        this.lastWarningTime = 0;
        this.warningCooldown = 5; // seconds between warnings
    }
    
    update(dt, healthComponent) {
        if (this.isDead) return;
        
        // Drain hunger
        this.hunger -= this.hungerDrainRate * dt;
        if (this.hunger < 0) this.hunger = 0;
        
        // Drain thirst
        this.thirst -= this.thirstDrainRate * dt;
        if (this.thirst < 0) this.thirst = 0;
        
        // Drain fatigue (only when awake/moving - will be handled by game)
        // Fatigue drains faster when moving, slower when idle
        
        // Check statuses
        this.isStarving = this.hunger <= 0;
        this.isDehydrated = this.thirst <= 0;
        this.isExhausted = this.fatigue <= 0;
        
        // Apply health damage from starvation/dehydration
        if (healthComponent && (this.isStarving || this.isDehydrated)) {
            const damage = this.healthDamagePerSecond * dt;
            healthComponent.currentHealth -= damage;
            if (healthComponent.currentHealth <= 0) {
                healthComponent.currentHealth = 0;
                this.isDead = true;
            }
        }
    }
    
    getSpeedMultiplier() {
        if (this.isExhausted) {
            return this.speedReduction;
        }
        if (this.fatigue < 20) {
            // Gradually slow down as fatigue gets low
            return 0.5 + (this.fatigue / 20) * 0.5;
        }
        return 1.0;
    }
    
    getHungerStatus() {
        if (this.hunger <= 0) return 'starving';
        if (this.hunger < 25) return 'very hungry';
        if (this.hunger < 50) return 'hungry';
        if (this.hunger < 75) return 'peckish';
        return 'full';
    }
    
    getThirstStatus() {
        if (this.thirst <= 0) return 'dehydrated';
        if (this.thirst < 25) return 'very thirsty';
        if (this.thirst < 50) return 'thirsty';
        if (this.thirst < 75) return 'parched';
        return 'hydrated';
    }
    
    getFatigueStatus() {
        if (this.fatigue <= 0) return 'exhausted';
        if (this.fatigue < 25) return 'very tired';
        if (this.fatigue < 50) return 'tired';
        if (this.fatigue < 75) return 'rested';
        return 'fully rested';
    }
    
    // Methods for modifying survival stats
    addHunger(amount) {
        this.hunger = Math.min(this.maxHunger, this.hunger + amount);
    }
    
    addThirst(amount) {
        this.thirst = Math.min(this.maxThirst, this.thirst + amount);
    }
    
    addFatigue(amount) {
        this.fatigue = Math.min(this.maxFatigue, this.fatigue + amount);
    }
    
    removeHunger(amount) {
        this.hunger = Math.max(0, this.hunger - amount);
    }
    
    removeThirst(amount) {
        this.thirst = Math.max(0, this.thirst - amount);
    }
    
    removeFatigue(amount) {
        this.fatigue = Math.max(0, this.fatigue - amount);
    }
    
    reset() {
        this.hunger = this.maxHunger;
        this.thirst = this.maxThirst;
        this.fatigue = this.maxFatigue;
        this.isStarving = false;
        this.isDehydrated = false;
        this.isExhausted = false;
        this.isDead = false;
    }
    
    toJSON() {
        return {
            hunger: this.hunger,
            maxHunger: this.maxHunger,
            hungerDrainRate: this.hungerDrainRate,
            thirst: this.thirst,
            maxThirst: this.maxThirst,
            thirstDrainRate: this.thirstDrainRate,
            fatigue: this.fatigue,
            maxFatigue: this.maxFatigue,
            fatigueDrainRate: this.fatigueDrainRate,
            isDead: this.isDead
        };
    }
    
    static fromJSON(data) {
        const comp = new SurvivalComponent({
            hunger: data.hunger,
            maxHunger: data.maxHunger,
            hungerDrainRate: data.hungerDrainRate,
            thirst: data.thirst,
            maxThirst: data.maxThirst,
            thirstDrainRate: data.thirstDrainRate,
            fatigue: data.fatigue,
            maxFatigue: data.maxFatigue,
            fatigueDrainRate: data.fatigueDrainRate
        });
        comp.isDead = data.isDead || false;
        return comp;
    }
}