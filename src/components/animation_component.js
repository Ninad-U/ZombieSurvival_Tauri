// Animation Component
// Data-driven animation system

// Animation Component
// Data-driven animation system for runtime playback

export class AnimationComponent {
    constructor(animationData = null) {
        this.currentAnimation = null;
        this.animations = {};
        this.currentFrame = 0;
        this.frameTimer = 0;
        this.playing = false;
        this.looping = true;
        this.onComplete = null;
        this.keyframeCallbacks = {};
        
        if (animationData) {
            this.loadAnimation(animationData);
        }
    }
    
    loadAnimation(data) {
        this.animations = data.animations || {};
        this.currentAnimation = null;
        this.currentFrame = 0;
        this.frameTimer = 0;
        this.playing = false;
    }
    
    loadAnimationData(animationData) {
        // Load from exported animation JSON
        this.animationName = animationData.name || 'unnamed';
        this.fps = animationData.fps || 12;
        this.loop = animationData.loop !== undefined ? animationData.loop : true;
        this.frames = animationData.frames || [];
        this.currentFrameIndex = 0;
        this.frameTimer = 0;
        this.playing = false;
        this.isComplete = false;
    }
    
    play(animationName, loop = true, onComplete = null) {
        if (!this.animations[animationName]) {
            console.warn(`Animation "${animationName}" not found`);
            return;
        }
        
        this.currentAnimation = animationName;
        this.currentFrame = 0;
        this.frameTimer = 0;
        this.playing = true;
        this.looping = loop;
        this.onComplete = onComplete;
        this.isComplete = false;
        
        // Trigger frame 0 keyframes
        this.triggerKeyframes(0);
    }
    
    playData(frames, fps = 12, loop = true, onComplete = null) {
        if (!frames || frames.length === 0) {
            console.warn('No frames to play');
            return;
        }
        
        this.frames = frames;
        this.fps = fps;
        this.loop = loop;
        this.onComplete = onComplete;
        this.currentFrameIndex = 0;
        this.frameTimer = 0;
        this.playing = true;
        this.isComplete = false;
        this.currentAnimation = 'data';
    }
    
    stop() {
        this.playing = false;
        this.currentFrame = 0;
        this.frameTimer = 0;
    }
    
    pause() {
        this.playing = false;
    }
    
    resume() {
        if (!this.isComplete) {
            this.playing = true;
        }
    }
    
    update(dt) {
        if (!this.playing || this.isComplete) return;
        
        // Check if we have data frames
        if (!this.frames || this.frames.length === 0) {
            return;
        }
        
        this.frameTimer += dt;
        const frameDuration = 1 / this.fps;
        
        if (this.frameTimer >= frameDuration) {
            this.frameTimer = 0;
            this.currentFrameIndex++;
            
            // Check if animation is complete
            if (this.currentFrameIndex >= this.frames.length) {
                if (this.loop) {
                    this.currentFrameIndex = 0;
                } else {
                    this.playing = false;
                    this.isComplete = true;
                    this.currentFrameIndex = this.frames.length - 1;
                    if (this.onComplete) {
                        this.onComplete();
                    }
                }
            }
        }
    }
    
    getCurrentFrame() {
        if (!this.frames || this.frames.length === 0) {
            return null;
        }
        return this.frames[this.currentFrameIndex] || null;
    }
    
    getCurrentFrameIndex() {
        return this.currentFrameIndex;
    }
    
    getFrameCount() {
        return this.frames ? this.frames.length : 0;
    }
    
    getProgress() {
        if (!this.frames || this.frames.length === 0) return 0;
        return (this.currentFrameIndex + 1) / this.frames.length;
    }
    
    isPlaying() {
        return this.playing;
    }
    
    isLooping() {
        return this.loop;
    }
    
    triggerKeyframes(frameIndex) {
        // Placeholder for keyframe system
        // Will be expanded later
    }
    
    toJSON() {
        return {
            currentAnimation: this.currentAnimation,
            currentFrame: this.currentFrame,
            playing: this.playing,
            looping: this.looping,
            animations: this.animations
        };
    }
    
    static fromJSON(data) {
        const comp = new AnimationComponent();
        comp.currentAnimation = data.currentAnimation || null;
        comp.currentFrame = data.currentFrame || 0;
        comp.playing = data.playing || false;
        comp.looping = data.looping || true;
        comp.animations = data.animations || {};
        return comp;
    }
}
