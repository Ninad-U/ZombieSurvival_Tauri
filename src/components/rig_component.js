// Character Rig / Body Layout System
// Lightweight attachment point system for 2D pixel-art characters

export const RigPresets = {
    SIMPLE_BIPED: 'simple_biped',
    DETAILED_BIPED: 'detailed_biped',
    CUSTOM: 'custom'
};

export class RigComponent {
    constructor(preset = RigPresets.SIMPLE_BIPED, customPoints = {}) {
        this.preset = preset;
        this.attachmentPoints = {};
        this.scale = 1;
        this.offset = { x: 0, y: 0 };
        
        this.initializeRig(preset, customPoints);
    }
    
    initializeRig(preset, customPoints) {
        switch(preset) {
            case RigPresets.SIMPLE_BIPED:
                this.attachmentPoints = this.getSimpleBipedRig();
                break;
            case RigPresets.DETAILED_BIPED:
                this.attachmentPoints = this.getDetailedBipedRig();
                break;
            case RigPresets.CUSTOM:
                this.attachmentPoints = customPoints;
                break;
            default:
                this.attachmentPoints = this.getSimpleBipedRig();
        }
    }
    
    getSimpleBipedRig() {
        return {
            root: { x: 0, y: 0, relative: true },
            head: { x: 0, y: -32, relative: true },
            neck: { x: 0, y: -20, relative: true },
            torso: { x: 0, y: 0, relative: true },
            hip: { x: 0, y: 16, relative: true },
            shoulder_l: { x: -16, y: -12, relative: true },
            shoulder_r: { x: 16, y: -12, relative: true },
            hand_l: { x: -20, y: 8, relative: true },
            hand_r: { x: 20, y: 8, relative: true },
            leg_l: { x: -8, y: 20, relative: true },
            leg_r: { x: 8, y: 20, relative: true },
            foot_l: { x: -8, y: 32, relative: true },
            foot_r: { x: 8, y: 32, relative: true },
            weapon_hand: { x: 20, y: 8, relative: true },
            weapon_offhand: { x: -20, y: 8, relative: true },
            helmet: { x: 0, y: -38, relative: true },
            chest: { x: 0, y: -8, relative: true },
            legs: { x: 0, y: 16, relative: true },
            boots: { x: 0, y: 32, relative: true }
        };
    }
    
    getDetailedBipedRig() {
        return {
            root: { x: 0, y: 0, relative: true },
            head: { x: 0, y: -36, relative: true },
            neck: { x: 0, y: -24, relative: true },
            torso_upper: { x: 0, y: -8, relative: true },
            torso_lower: { x: 0, y: 8, relative: true },
            hip: { x: 0, y: 20, relative: true },
            shoulder_l: { x: -18, y: -16, relative: true },
            shoulder_r: { x: 18, y: -16, relative: true },
            elbow_l: { x: -22, y: 0, relative: true },
            elbow_r: { x: 22, y: 0, relative: true },
            hand_l: { x: -24, y: 16, relative: true },
            hand_r: { x: 24, y: 16, relative: true },
            finger_l: { x: -26, y: 20, relative: true },
            finger_r: { x: 26, y: 20, relative: true },
            hip_l: { x: -10, y: 20, relative: true },
            hip_r: { x: 10, y: 20, relative: true },
            knee_l: { x: -10, y: 28, relative: true },
            knee_r: { x: 10, y: 28, relative: true },
            foot_l: { x: -10, y: 38, relative: true },
            foot_r: { x: 10, y: 38, relative: true },
            toe_l: { x: -12, y: 40, relative: true },
            toe_r: { x: 12, y: 40, relative: true },
            weapon_hand: { x: 24, y: 16, relative: true },
            weapon_offhand: { x: -24, y: 16, relative: true },
            helmet: { x: 0, y: -42, relative: true },
            chest: { x: 0, y: -8, relative: true },
            legs: { x: 0, y: 16, relative: true },
            boots: { x: 0, y: 36, relative: true },
            effect_center: { x: 0, y: 0, relative: true },
            effect_head: { x: 0, y: -36, relative: true },
            effect_hands: { x: 0, y: 16, relative: true }
        };
    }
    
    getAttachmentPoint(name) {
        return this.attachmentPoints[name] || null;
    }
    
    getWorldPosition(pointName, entityTransform) {
        const point = this.getAttachmentPoint(pointName);
        if (!point) return null;
        
        const x = entityTransform.x + (point.x * this.scale) + this.offset.x;
        const y = entityTransform.y + (point.y * this.scale) + this.offset.y;
        
        return { x, y };
    }
    
    getRelativePosition(pointName) {
        const point = this.getAttachmentPoint(pointName);
        if (!point) return null;
        return { x: point.x * this.scale + this.offset.x, y: point.y * this.scale + this.offset.y };
    }
    
    setScale(scale) {
        this.scale = scale;
    }
    
    setOffset(x, y) {
        this.offset.x = x;
        this.offset.y = y;
    }
    
    toJSON() {
        return {
            preset: this.preset,
            scale: this.scale,
            offset: this.offset,
            attachmentPoints: this.attachmentPoints
        };
    }
    
    static fromJSON(data) {
        const rig = new RigComponent(data.preset, data.attachmentPoints);
        rig.scale = data.scale || 1;
        rig.offset = data.offset || { x: 0, y: 0 };
        return rig;
    }
}