// Animation System
// Handles animation updates for all entities

export class AnimationSystem {
    constructor(game) {
        this.game = game;
        this.animators = new Map();
    }
    
    addEntity(entity, animationComponent) {
        this.animators.set(entity.id, animationComponent);
        // Listen for keyframe events
        document.addEventListener('animation_keyframe', this.handleKeyframe.bind(this));
    }
    
    removeEntity(entityId) {
        this.animators.delete(entityId);
    }
    
    update(dt) {
        for (const [entityId, animator] of this.animators) {
            animator.update(dt);
        }
    }
    
    handleKeyframe(event) {
        const { animation, frame, event: eventType, data } = event.detail;
        
        // Handle common keyframe events
        switch(eventType) {
            case 'hitbox_enable':
                // Enable hitbox for attack
                this.game.app.console.log('debug', `Hitbox enabled on ${animation} frame ${frame}`);
                break;
            case 'hitbox_disable':
                // Disable hitbox
                this.game.app.console.log('debug', `Hitbox disabled on ${animation} frame ${frame}`);
                break;
            case 'spawn_projectile':
                // Spawn a projectile
                this.game.app.console.log('debug', `Spawning projectile from ${animation}`);
                break;
            case 'play_sound':
                // Play a sound effect
                this.game.app.console.log('debug', `Playing sound: ${data.sound || 'default'}`);
                break;
            case 'apply_knockback':
                // Apply knockback
                this.game.app.console.log('debug', `Applying knockback: ${data.strength || 0}`);
                break;
            case 'spawn_particles':
                // Spawn particle effect
                this.game.app.console.log('debug', `Spawning particles: ${data.count || 0}`);
                break;
            default:
                // Custom event - let game handle it
                this.game.app.console.log('debug', `Custom keyframe event: ${eventType}`);
        }
    }
}
