// Cutscene Component
// Lightweight cutscene data parser and runtime logic

export class CutsceneComponent {
    constructor(config = {}) {
        this.cutscene = config.cutscene || [];
        this.focus = config.focus || [];
        this.currentIndex = -1;
        this.isActive = false;
        
        // Focus state
        this.focusTarget = null;
        this.focusFrom = null;
        this.focusTo = null;
        this.focusProgress = 0;
        this.focusDuration = 0.5; // seconds
        this.isSliding = false;
        
        // Black bar state
        this.blackBarsVisible = false;
        this.blackBarProgress = 0;
        this.blackBarTarget = 0;
        this.blackBarState = 'none'; // 'none', 'squeeze_in', 'static', 'squeeze_out'
        this.blackBarHeight = 0.15; // 15% of screen height per bar
    }
    
    loadData(dialogueData) {
        this.cutscene = dialogueData.cutscene || [];
        this.focus = dialogueData.focus || [];
        this.currentIndex = -1;
        this.isActive = false;
        this.blackBarsVisible = false;
        this.blackBarState = 'none';
        this.isSliding = false;
    }
    
    advance(index) {
        this.currentIndex = index;
        
        // Process focus for this line - returns focus instruction
        let focusInstruction = null;
        if (index < this.focus.length) {
            focusInstruction = this.focus[index];
        }
        
        // Process cutscene for this line
        let cutsceneInstruction = 0;
        if (index < this.cutscene.length) {
            cutsceneInstruction = this.cutscene[index];
        }
        
        // Return both instructions for the game to process
        return {
            focus: focusInstruction,
            cutscene: cutsceneInstruction,
            lineIndex: index
        };
    }
    
    processFocus(instruction) {
        // This method is deprecated - focus is now handled in game.js
        // Kept for backward compatibility
        if (Array.isArray(instruction) && instruction.length === 2) {
            const from = this.resolveFocusTarget(instruction[0]);
            const to = this.resolveFocusTarget(instruction[1]);
            if (from && to) {
                this.focusFrom = from;
                this.focusTo = to;
                this.focusProgress = 0;
                this.isSliding = true;
                this.focusTarget = from;
                return;
            }
        }
        
        const target = this.resolveFocusTarget(instruction);
        if (target) {
            this.focusTarget = target;
            this.focusFrom = null;
            this.focusTo = null;
            this.focusProgress = 0;
            this.isSliding = false;
        }
    }
    
    resolveFocusTarget(instruction) {
        if (typeof instruction !== 'string') return null;
        
        // Player
        if (instruction === 'player') {
            return { type: 'player', name: 'player' };
        }
        
        // World coordinates: <x,y>
        const coordMatch = instruction.match(/^<(\d+),(\d+)>$/);
        if (coordMatch) {
            return { 
                type: 'world', 
                x: parseInt(coordMatch[1]), 
                y: parseInt(coordMatch[2]) 
            };
        }
        
        // NPC by name
        return { type: 'npc', name: instruction };
    }
    
    processCutscene(instruction) {
        // This method is deprecated - cutscene is now handled in game.js
        // Kept for backward compatibility
        switch(instruction) {
            case 1: // Squeeze In
                this.blackBarState = 'squeeze_in';
                this.blackBarProgress = 0;
                this.blackBarsVisible = true;
                break;
            case 2: // Static
                this.blackBarState = 'static';
                this.blackBarProgress = 1;
                this.blackBarsVisible = true;
                break;
            case 3: // Squeeze Out
                this.blackBarState = 'squeeze_out';
                this.blackBarProgress = 1;
                break;
            default:
                this.blackBarState = 'none';
        }
    }
    
    updateFocus(dt) {
        if (this.isSliding && this.focusFrom && this.focusTo) {
            this.focusProgress += dt / this.focusDuration;
            if (this.focusProgress >= 1) {
                this.focusProgress = 1;
                this.isSliding = false;
                this.focusTarget = this.focusTo;
                this.focusFrom = null;
                this.focusTo = null;
            } else {
                // Interpolate between from and to
                const t = this.focusProgress;
                const fromPos = this.getTargetPosition(this.focusFrom);
                const toPos = this.getTargetPosition(this.focusTo);
                if (fromPos && toPos) {
                    this.focusTarget = {
                        type: 'interpolated',
                        x: fromPos.x + (toPos.x - fromPos.x) * t,
                        y: fromPos.y + (toPos.y - fromPos.y) * t
                    };
                }
            }
        }
        return this.focusTarget;
    }
    
    updateBlackBars(dt) {
        const speed = 1.5; // seconds to fully animate
        switch(this.blackBarState) {
            case 'squeeze_in':
                this.blackBarProgress += dt / speed;
                if (this.blackBarProgress >= 1) {
                    this.blackBarProgress = 1;
                    this.blackBarState = 'static';
                }
                return true;
            case 'squeeze_out':
                this.blackBarProgress -= dt / speed;
                if (this.blackBarProgress <= 0) {
                    this.blackBarProgress = 0;
                    this.blackBarState = 'none';
                    this.blackBarsVisible = false;
                    return false;
                }
                return true;
            case 'static':
                return true;
            default:
                return false;
        }
    }
    
    getTargetPosition(target) {
        if (!target) return null;
        if (target.type === 'world') {
            return { x: target.x, y: target.y };
        }
        if (target.type === 'interpolated') {
            return { x: target.x, y: target.y };
        }
        // Player or NPC - will be resolved by the game runtime
        return null;
    }
    
    getFocusTarget() {
        return this.focusTarget;
    }
    
    getBlackBarProgress() {
        return this.blackBarProgress;
    }
    
    isBlackBarsVisible() {
        return this.blackBarsVisible;
    }
    
    getCutsceneInstruction(index) {
        if (index < this.cutscene.length) {
            return this.cutscene[index];
        }
        return 0; // Default to 0 (None)
    }
    
    getFocusInstruction(index) {
        if (index < this.focus.length) {
            return this.focus[index];
        }
        return ''; // Default to empty (no change)
    }
    
    reset() {
        this.currentIndex = -1;
        this.isActive = false;
        this.focusTarget = null;
        this.focusFrom = null;
        this.focusTo = null;
        this.focusProgress = 0;
        this.isSliding = false;
        this.blackBarsVisible = false;
        this.blackBarProgress = 0;
        this.blackBarState = 'none';
    }
    
    toJSON() {
        return {
            cutscene: this.cutscene,
            focus: this.focus
        };
    }
}