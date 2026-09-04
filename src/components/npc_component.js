// NPC Component
// Data-driven NPC behavior

import { DialogueManager } from '../components/dialogue_component.js';

// NPC Component
// Data-driven NPC behavior

export class NPCComponent {
    constructor(config = {}) {
        this.name = config.name || 'NPC';
        this.faction = config.faction || 'neutral'; // friendly, neutral, hostile
        this.dialogue = config.dialogue || null;
        this.interactionRadius = config.interactionRadius || 50;
        this.isMerchant = config.isMerchant || false;
        this.hasQuest = config.hasQuest || false;
        this.isHostile = config.isHostile || false;
        this.questId = config.questId || null;
        this.shopItems = config.shopItems || [];
        this.relationship = config.relationship || 0; // -100 to 100
        this.isInteracting = false;
        this.lastInteractionTime = 0;
    }
    
    canInteract() {
        const now = Date.now();
        if (now - this.lastInteractionTime < 1000) return false;
        return true;
    }
    
    startInteraction() {
        this.isInteracting = true;
        this.lastInteractionTime = Date.now();
    }
    
    endInteraction() {
        this.isInteracting = false;
    }
    
    getGreeting() {
        if (this.faction === 'hostile') {
            return 'Stay back!';
        }
        if (this.faction === 'friendly') {
            return 'Hello there, survivor.';
        }
        return '...';
    }
    
    getDialogueId() {
        return this.dialogue;
    }
    
    toJSON() {
        return {
            name: this.name,
            faction: this.faction,
            dialogue: this.dialogue,
            interactionRadius: this.interactionRadius,
            isMerchant: this.isMerchant,
            hasQuest: this.hasQuest,
            isHostile: this.isHostile,
            questId: this.questId,
            shopItems: this.shopItems,
            relationship: this.relationship
        };
    }
    
    static fromJSON(data) {
        return new NPCComponent(data);
    }
}