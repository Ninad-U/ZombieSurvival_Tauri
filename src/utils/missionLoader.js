// Mission Loader
// Loads and manages mission data

export class MissionLoader {
    constructor() {
        this.missions = new Map();
        this.activeMissions = [];
        this.completedMissions = [];
        this.listeners = [];
    }
    
    resetMissionProgress() {
        // Clear active missions
        this.activeMissions = [];
        
        // Clear completed missions
        this.completedMissions = [];
        
        // Notify listeners if needed
        this.notify('reset', null);
        
        console.log('🔄 Mission progress reset - all missions cleared');
    }
    
    async loadMission(missionId) {
        try {
            const response = await fetch(`data/missions/${missionId}.json`);
            if (!response.ok) {
                throw new Error(`Failed to load mission: ${missionId}`);
            }
            const data = await response.json();
            this.missions.set(missionId, data);
            return data;
        } catch (error) {
            console.error('Error loading mission:', error);
            return null;
        }
    }
    
    async startMission(missionId) {
        // Check if already active
        if (this.activeMissions.some(m => m.id === missionId)) {
            console.log(`Mission ${missionId} is already active`);
            return false;
        }
        
        // Load mission data if not loaded
        let missionData = this.missions.get(missionId);
        if (!missionData) {
            missionData = await this.loadMission(missionId);
            if (!missionData) {
                console.error(`Failed to load mission: ${missionId}`);
                return false;
            }
        }
        
        // Create mission instance
        const { MissionComponent } = await import('../components/mission_component.js');
        const mission = new MissionComponent(missionData);
        mission.start();
        
        this.activeMissions.push(mission);
        this.notify('start', mission);
        
        console.log(`Mission started: ${mission.name}`);
        return mission;
    }
    
    getActiveMission(missionId) {
        return this.activeMissions.find(m => m.id === missionId) || null;
    }
    
    getActiveMissions() {
        return this.activeMissions;
    }
    
    getCompletedMissions() {
        return this.completedMissions;
    }
    
    getMission(missionId) {
        // Return the raw mission data if loaded, or try to load it
        if (this.missions.has(missionId)) {
            return this.missions.get(missionId);
        }
        // Try to load it synchronously (will be loaded async later)
        return null;
    }
    
    // Check if mission is loaded without async
    isMissionLoaded(missionId) {
        return this.missions.has(missionId);
    }
    
checkEvent(eventType, eventData) {
    let progress = false;
    for (const mission of this.activeMissions) {
        if (mission.isActive()) {
            const result = mission.checkObjective(eventType, eventData);
            if (result === true) {
                progress = true;
                this.notify('objective_complete', { mission, objective: mission.getCurrentObjective() });
            }
            
            // Check if mission is complete after objective advancement
            if (mission.isComplete()) {
                this.onMissionComplete(mission);
            }
        }
    }
    return progress;
}
    
    onMissionComplete(mission) {
        // Move from active to completed
        const index = this.activeMissions.indexOf(mission);
        if (index !== -1) {
            this.activeMissions.splice(index, 1);
            this.completedMissions.push(mission);
            this.notify('complete', mission);
            console.log(`Mission complete: ${mission.name}`);
            
            // Apply rewards
            if (mission.rewards) {
                console.log('Rewards:', mission.rewards);
            }
        }
    }
    
    addListener(callback) {
        this.listeners.push(callback);
    }
    
    notify(event, data) {
        for (const listener of this.listeners) {
            listener(event, data);
        }
    }
}