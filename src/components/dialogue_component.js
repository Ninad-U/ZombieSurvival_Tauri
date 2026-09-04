// Dialogue Component
// Data-driven dialogue system for NPCs

export class DialogueComponent {
    constructor(config = {}) {
        this.dialogueId = config.dialogueId || null;
        this.currentLineIndex = 0;
        this.isActive = false;
        this.isComplete = false;
        this.lines = [];
        this.onComplete = config.onComplete || null;
        this.flags = config.flags || {};
        this.participants = config.participants || {};
        
        // Cutscene data - stored as-is, aligned by index
        this.cutscene = config.cutscene || [];
        this.focus = config.focus || [];
        this.cutsceneData = {
            cutscene: this.cutscene,
            focus: this.focus
        };
    }
    
    setDialogue(dialogueData) {
        this.dialogueId = dialogueData.id || this.dialogueId;
        this.lines = dialogueData.lines || [];
        this.participants = dialogueData.participants || {};
        this.onComplete = dialogueData.onComplete || null;
        
        // Store cutscene data as-is, aligned by index
        this.cutscene = dialogueData.cutscene || [];
        this.focus = dialogueData.focus || [];
        this.cutsceneData = {
            cutscene: this.cutscene,
            focus: this.focus
        };
        
        this.currentLineIndex = 0;
        this.isActive = false;
        this.isComplete = false;
    }
    
    getCutsceneData() {
        return this.cutsceneData;
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
    
    start() {
        if (this.lines.length === 0) return null;
        this.isActive = true;
        this.isComplete = false;
        this.currentLineIndex = 0;
        
        // Return the first line with its cutscene data
        return {
            line: this.getCurrentLine(),
            cutsceneData: this.cutsceneData,
            lineIndex: 0
        };
    }
    
    advance() {
        if (!this.isActive) return null;
        
        this.currentLineIndex++;
        
        if (this.currentLineIndex >= this.lines.length) {
            this.isActive = false;
            this.isComplete = true;
            if (this.onComplete) {
                this.handleComplete();
            }
            return null;
        }
        
        return {
            line: this.getCurrentLine(),
            cutsceneData: this.cutsceneData,
            lineIndex: this.currentLineIndex
        };
    }
    
    getCurrentLine() {
        if (this.currentLineIndex >= this.lines.length) return null;
        return this.lines[this.currentLineIndex];
    }
    
    getCurrentLineIndex() {
        return this.currentLineIndex;
    }
    
    getCurrentSpeaker() {
        const line = this.getCurrentLine();
        if (!line) return null;
        return this.participants.find(p => p.id === line.speaker) || null;
    }
    
    getSpeakerName(speakerId) {
        const participant = this.participants.find(p => p.id === speakerId);
        return participant ? participant.name : speakerId;
    }
    
    handleComplete() {
        if (this.onComplete) {
            if (this.onComplete.setFlag) {
                this.flags[this.onComplete.setFlag] = true;
                console.log(`[Dialogue] Flag set: ${this.onComplete.setFlag}`);
            }
            if (this.onComplete.startMission) {
                console.log(`[Dialogue] Mission start requested: ${this.onComplete.startMission}`);
            }
        }
    }
    
    isInProgress() {
        return this.isActive && !this.isComplete;
    }
    
    hasFlag(flagName) {
        return !!this.flags[flagName];
    }
    
    reset() {
        this.currentLineIndex = 0;
        this.isActive = false;
        this.isComplete = false;
    }
    
    toJSON() {
        return {
            dialogueId: this.dialogueId,
            currentLineIndex: this.currentLineIndex,
            isActive: this.isActive,
            isComplete: this.isComplete,
            flags: this.flags,
            cutscene: this.cutscene,
            focus: this.focus
        };
    }
    
    static fromJSON(data) {
        const comp = new DialogueComponent({
            dialogueId: data.dialogueId,
            flags: data.flags || {},
            cutscene: data.cutscene || [],
            focus: data.focus || []
        });
        comp.currentLineIndex = data.currentLineIndex || 0;
        comp.isActive = data.isActive || false;
        comp.isComplete = data.isComplete || false;
        return comp;
    }
}

export class DialogueManager {
    constructor() {
        this.dialogues = new Map();
        this.currentDialogue = null;
        this.currentNpc = null;
        this.isDialogueActive = false;
        this.callbacks = {
            onLine: null,
            onComplete: null,
            onStart: null,
            onCutscene: null,
            onFocus: null
        };
    }
    
    async loadDialogue(dialogueId) {
        try {
            const response = await fetch(`data/dialogue/${dialogueId}.json`);
            if (!response.ok) {
                throw new Error(`Failed to load dialogue: ${dialogueId}`);
            }
            const data = await response.json();
            this.dialogues.set(dialogueId, data);
            return data;
        } catch (error) {
            console.error('Error loading dialogue:', error);
            return null;
        }
    }
    
    async startDialogue(npc, dialogueId) {
        if (this.isDialogueActive) return;
        
        let dialogueData = this.dialogues.get(dialogueId);
        if (!dialogueData) {
            dialogueData = await this.loadDialogue(dialogueId);
            if (!dialogueData) {
                console.error(`[Dialogue] Failed to load: ${dialogueId}`);
                return;
            }
        }
        
        let dialogueComp = npc.components.dialogue;
        if (!dialogueComp) {
            dialogueComp = new DialogueComponent({ dialogueId });
            npc.components.dialogue = dialogueComp;
        }
        
        dialogueComp.setDialogue(dialogueData);
        const result = dialogueComp.start();
        
        this.currentDialogue = dialogueComp;
        this.currentNpc = npc;
        this.isDialogueActive = true;
        
        if (this.callbacks.onStart) {
            this.callbacks.onStart(npc, dialogueData);
        }
        
        // Process cutscene data for the first line
        if (result && result.cutsceneData && this.callbacks.onCutscene) {
            const focusInst = dialogueComp.getFocusInstruction(0);
            const cutsceneInst = dialogueComp.getCutsceneInstruction(0);
            this.callbacks.onCutscene({
                focus: focusInst,
                cutscene: cutsceneInst,
                lineIndex: 0
            });
        }
        
        if (this.callbacks.onLine && result) {
            this.callbacks.onLine(result.line, dialogueComp);
        }
        
        return result;
    }
    
    advanceDialogue() {
        if (!this.isDialogueActive || !this.currentDialogue) return null;
        
        const result = this.currentDialogue.advance();
        
        if (!result) {
            this.isDialogueActive = false;
            if (this.callbacks.onComplete) {
                this.callbacks.onComplete(this.currentNpc, this.currentDialogue);
            }
            this.currentDialogue = null;
            this.currentNpc = null;
            return null;
        }
        
        // Process cutscene data for the next line
        if (result.cutsceneData && this.callbacks.onCutscene) {
            const focusInst = this.currentDialogue.getFocusInstruction(result.lineIndex);
            const cutsceneInst = this.currentDialogue.getCutsceneInstruction(result.lineIndex);
            this.callbacks.onCutscene({
                focus: focusInst,
                cutscene: cutsceneInst,
                lineIndex: result.lineIndex
            });
        }
        
        if (this.callbacks.onLine) {
            this.callbacks.onLine(result.line, this.currentDialogue);
        }
        
        return result.line;
    }
    
    isActive() {
        return this.isDialogueActive;
    }
    
    getCurrentLine() {
        if (!this.currentDialogue) return null;
        return this.currentDialogue.getCurrentLine();
    }
    
    getCurrentLineIndex() {
        if (!this.currentDialogue) return 0;
        return this.currentDialogue.getCurrentLineIndex();
    }
    
    getCurrentSpeaker() {
        if (!this.currentDialogue) return null;
        return this.currentDialogue.getCurrentSpeaker();
    }
    
    getCurrentDialogue() {
        return this.currentDialogue;
    }
    
    getCurrentNpc() {
        return this.currentNpc;
    }
    
    setCallbacks(callbacks) {
        this.callbacks = { ...this.callbacks, ...callbacks };
    }
    
    reset() {
        this.isDialogueActive = false;
        if (this.currentDialogue) {
            this.currentDialogue.reset();
        }
        this.currentDialogue = null;
        this.currentNpc = null;
    }
}