import { Entity } from '../entities/entity.js';
import { RigComponent } from '../components/rig_component.js';
import { LocationLoader } from '../utils/locationLoader.js';
import { SurvivalComponent } from '../components/survival_component.js';
import { NPCComponent } from '../components/npc_component.js';
import { DialogueManager } from '../components/dialogue_component.js';
import { MissionLoader } from '../utils/missionLoader.js';
import { AssetLoader } from '../utils/assetLoader.js';
import { AnimationComponent } from '../components/animation_component.js';
import { CutsceneComponent } from '../components/cutscene_component.js';

// Cinematic constants - adjust these for desired look
const CINEMATIC_BAR_HEIGHT_RATIO = 0.15; // 15% of viewport height per bar (30% total covered)
const CINEMATIC_ANIMATION_DURATION = 0.5; // 500ms for squeeze in/out

export class GameRuntime {
    constructor(app){
        this.app = app;
        this.canvas = null;
        this.ctx = null;
        this.entities = [];
        this.player = null;
        this.keys = {};
        this.mouse = { x: 0, y: 0 };
        this.showRigPoints = false;
        this.locationLoader = new LocationLoader();
        this.currentLocationId = 'pine_ridge';
        this.tileSize = 32;
        this.camera = { x: 0, y: 0 };
        this._transitioning = false;
        this.selectedEntity = null;
        this.dialogueManager = new DialogueManager();
        this.isInDialogue = false;
        this._eKeyReleased = true;
        this._eKeyJustPressed = false;
        this.missionLoader = new MissionLoader();
        this.missionUI = null;
        this._missionCompleteShown = false;
        this._missionCompleteTimer = 0;
        this._missionCompleteMissionId = null;
        this._killedEnemies = {};
        this.animationEditor = null;
        this.assetLoader = new AssetLoader();
        this.loadedImages = {};
        // Cutscene properties
        this.cutsceneEditor = null;
        this._cutsceneActive = false;
        this._cutsceneComponent = null;
        this._cutsceneInstruction = 0;
        this._cutsceneProgress = 0;
        this._cutsceneState = 'none'; // 'none', 'squeezing_in', 'static', 'squeezing_out'
        this._focusTarget = null;
        this._focusFrom = null;
        this._focusTo = null;
        this._focusProgress = 0;
        this._isSliding = false;
        this._cutsceneBarsVisible = false;
        this._cutsceneTargetHeight = 0;
        this._cutsceneCurrentHeight = 0;
        this._normalUIHidden = false;
        this._cutsceneSource = null; // Track which dialogue started the cutscene
    }

    async init(canvas) {
        console.log('🔴 GAME INIT STARTED - DEBUG');
        this.selectedEntity = null;
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');

        document.addEventListener('keydown', (e) => {
            this.keys[e.key] = true;
            if (e.key === 'r' || e.key === 'R') {
                this.showRigPoints = !this.showRigPoints;
                this.app.console.log('info', `Rig points ${this.showRigPoints ? 'shown' : 'hidden'}`);
            }
        });
        document.addEventListener('keyup', (e) => {
            this.keys[e.key] = false;
        });

        this.resize();
        this.setupSelection();
        window.addEventListener('resize', () => this.resize());

        await this.loadLocation('pine_ridge');

        this.app.console.log('info', 'Game runtime initialized');
        this.app.console.log('info', 'Press R to toggle rig attachment points');
    }

    resize() {
        const container = document.getElementById('game-container');
        if (!container) {
            this.app.console.log('error', 'Game container not found');
            return;
        }

        const rect = container.getBoundingClientRect();
        const width = Math.floor(rect.width);
        const height = Math.floor(rect.height);

        if (width <= 0 || height <= 0) {
            this.app.console.log('warning', 'Invalid container dimensions:', width, height);
            return;
        }

        this.canvas.width = width;
        this.canvas.height = height;
        this.canvas.style.width = width + 'px';
        this.canvas.style.height = height + 'px';
        this.canvas.style.display = 'block';

        this.app.console.log('debug', `Canvas resized to ${width}x${height}`);
    }

    updateCamera() {
        if (!this.player) return;

        const playerX = this.player.components.transform.x;
        const playerY = this.player.components.transform.y;

        this.camera.x = playerX - this.canvas.width / 2;
        this.camera.y = playerY - this.canvas.height / 2;
    }

    async createEntityFromTemplate(template) {
        const entity = new Entity(template.name, template.type);
        entity.id = template.name + '_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4);

        for (const [compName, compData] of Object.entries(template.components)) {
            if (compData && typeof compData === 'object' && compData.constructor && compData.constructor.name !== 'Object') {
                entity.components[compName] = compData;
                console.log(`Preserved class instance for ${compName}:`, compData.constructor.name);
            } else if (compName === 'rig') {
                const rig = new RigComponent(compData.preset, compData.customPoints || {});
                if (compData.scale) rig.setScale(compData.scale);
                if (compData.offset) rig.setOffset(compData.offset.x, compData.offset.y);
                entity.components[compName] = rig;
            } else if (compName === 'survival') {
                const survival = new SurvivalComponent(compData);
                entity.components[compName] = survival;
            } else if (compName === 'npc') {
                if (compData.constructor && compData.constructor.name === 'Object') {
                    const npc = new NPCComponent(compData);
                    entity.components[compName] = npc;
                    console.log('Created NPCComponent from plain object');
                } else {
                    entity.components[compName] = compData;
                }
            } else {
                entity.components[compName] = { ...compData };
            }
        }

        if (entity.components.npc) {
            console.log('Final NPC component type:', entity.components.npc.constructor.name);
            console.log('Has getDialogueId?', typeof entity.components.npc.getDialogueId === 'function');
        }

        return entity;
    }

    async loadLocation(locationId, spawnPointId = 'default') {
        this.app.console.log('info', `Loading location: ${locationId} (spawn: ${spawnPointId})`);

        this.entities = [];
        this.player = null;

        const locationData = await this.locationLoader.loadLocation(locationId);
        if (!locationData) {
            this.app.console.log('error', `Failed to load location: ${locationId}`);
            return;
        }

        this.currentLocationId = locationId;
        this.tileSize = locationData.tileSize || 32;

        const entities = this.locationLoader.getEntities();
        for (const entityData of entities) {
            if (entityData.type === 'player') {
                // Use the spawn point passed in, or fallback to default
                const spawnPoint = this.locationLoader.getSpawnPoint(spawnPointId);
                let spawnX, spawnY;
                
                if (spawnPoint) {
                    spawnX = spawnPoint.x * this.tileSize + this.tileSize / 2;
                    spawnY = spawnPoint.y * this.tileSize + this.tileSize / 2;
                } else {
                    // Fallback to the entity's defined position
                    spawnX = entityData.x * this.tileSize + this.tileSize / 2;
                    spawnY = entityData.y * this.tileSize + this.tileSize / 2;
                }
                
                const template = {
                    name: 'Player',
                    type: 'player',
                    components: {
                        transform: {
                            x: spawnX,
                            y: spawnY,
                            width: 32,
                            height: 48
                        },
                        sprite: { asset: 'player.png', width: 32, height: 48 },
                        movement: { speed: 200 },
                        health: { maxHealth: 100, currentHealth: 100 },
                        combat: { damage: 10, range: 40, cooldown: 0.5 },
                        collision: { width: 24, height: 32, offsetX: 4, offsetY: 8 },
                        rig: new RigComponent('detailed_biped'),
                        survival: new SurvivalComponent({
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
                        })
                    }
                };
                this.player = await this.createEntityFromTemplate(template);
                this.addEntity(this.player);
            } else if (entityData.type === 'enemy') {
                // Check if this enemy was already killed
                const enemyKey = `${locationId}_${entityData.x}_${entityData.y}`;
                const enemyGridX = entityData.x;
                const enemyGridY = entityData.y;
                
                if (this.isEnemyKilled(enemyKey)) {
                    this.app.console.log('debug', `Skipping already killed enemy at (${enemyGridX}, ${enemyGridY})`);
                    continue;
                }
                
                const template = {
                    name: 'Zombie',
                    type: 'enemy',
                    components: {
                        transform: {
                            x: entityData.x * this.tileSize + this.tileSize / 2,
                            y: entityData.y * this.tileSize + this.tileSize / 2,
                            width: 32,
                            height: 48
                        },
                        // Store grid position directly on the component
                        gridPos: { x: enemyGridX, y: enemyGridY },
                        sprite: { asset: 'zombie.png', width: 32, height: 48 },
                        health: { maxHealth: 50, currentHealth: 50 },
                        combat: { damage: 5, range: 30, cooldown: 1.0 },
                        collision: { width: 24, height: 32, offsetX: 4, offsetY: 8 },
                        ai: { type: 'chase', detectionRange: 200, attackRange: 35 },
                        rig: new RigComponent('simple_biped')
                    }
                };
                const enemy = await this.createEntityFromTemplate(template);
                this.addEntity(enemy);
            } else if (entityData.type === 'item') {
                let templateData = {};
                if (entityData.template === 'food') {
                    templateData = {
                        name: 'Food',
                        type: 'item',
                        components: {
                            transform: {
                                x: entityData.x * this.tileSize + this.tileSize / 2,
                                y: entityData.y * this.tileSize + this.tileSize / 2,
                                width: 16,
                                height: 16
                            },
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
                    };
                } else if (entityData.template === 'water') {
                    templateData = {
                        name: 'Water',
                        type: 'item',
                        components: {
                            transform: {
                                x: entityData.x * this.tileSize + this.tileSize / 2,
                                y: entityData.y * this.tileSize + this.tileSize / 2,
                                width: 16,
                                height: 16
                            },
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
                    };
                } else if (entityData.template === 'medicine') {
                    templateData = {
                        name: 'Medicine',
                        type: 'item',
                        components: {
                            transform: {
                                x: entityData.x * this.tileSize + this.tileSize / 2,
                                y: entityData.y * this.tileSize + this.tileSize / 2,
                                width: 16,
                                height: 16
                            },
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
                    };
                }
                const item = await this.createEntityFromTemplate(templateData);
                this.addEntity(item);
            } else if (entityData.type === 'npc') {
                // Create NPCComponent instance
                const npcComp = new NPCComponent({
                    name: entityData.name || 'NPC',
                    faction: entityData.faction || 'neutral',
                    dialogue: entityData.dialogue || 'test_conversation',
                    interactionRadius: entityData.interactionRadius || 50,
                    isMerchant: entityData.isMerchant || false,
                    hasQuest: entityData.hasQuest || false,
                    isHostile: entityData.isHostile || false
                });
                
                console.log('Created NPCComponent:', npcComp.constructor.name);
                console.log('Has getDialogueId?', typeof npcComp.getDialogueId === 'function');
                
                const template = {
                    name: entityData.name || 'NPC',
                    type: 'npc',
                    components: {
                        transform: {
                            x: entityData.x * this.tileSize + this.tileSize / 2,
                            y: entityData.y * this.tileSize + this.tileSize / 2,
                            width: 32,
                            height: 48
                        },
                        sprite: { asset: 'player.png', width: 32, height: 48 },
                        health: { maxHealth: 50, currentHealth: 50 },
                        npc: npcComp  // Pass the instance directly
                    }
                };
                const npc = await this.createEntityFromTemplate(template);
                this.addEntity(npc);
            }
        }

        this.app.console.log('info', `Location loaded: ${locationData.name}`);
        
        // Check if entering this location completes any mission objectives
        const progress = this.missionLoader.checkEvent('location_reached', { locationId });
        if (progress) {
            this.app.console.log('debug', `Location event triggered mission progress`);
            this.updateMissionUI();
        }
    }

    isEnemyKilled(enemyId) {
        const key = `${this.currentLocationId}_${enemyId}`;
        return this._killedEnemies[key] === true;
    }

    markEnemyKilled(enemyId) {
        const key = `${this.currentLocationId}_${enemyId}`;
        this._killedEnemies[key] = true;
    }

    addEntity(entity) {
        this.entities.push(entity);
        if (entity.type === 'player') {
            this.player = entity;
        }
    }

    update(dt) {
        this.handleInteractions();

        if (this.isInDialogue) {
            for (const entity of this.entities) {
                if (entity.type === 'enemy' && entity.components.ai) {
                    this.updateEnemyAI(entity, dt);
                }
            }
            for (const entity of this.entities) {
                if (entity.components.health) {
                    const health = entity.components.health;
                    if (health.currentHealth <= 0 && !entity._dead) {
                        entity._dead = true;
                        this.app.console.log('info', `${entity.name} (${entity.id}) died`);
                        setTimeout(() => {
                            const idx = this.entities.indexOf(entity);
                            if (idx !== -1) this.entities.splice(idx, 1);
                        }, 2000);
                    }
                }
            }
            this.updateMissionUI();
            // Update cutscene even during dialogue
            this.updateCutscene(dt);
            return;
        }

        if (this.player) {
            const survival = this.player.components.survival;
            const health = this.player.components.health;
            if (survival && health) {
                survival.update(dt, health);

                if (survival.isDead) {
                    this.app.console.log('error', 'Player died from starvation/dehydration!');
                }

                const move = this.player.components.movement;
                if (move) {
                    const speedMult = survival.getSpeedMultiplier();
                    if (!move._originalSpeed) {
                        move._originalSpeed = move.speed;
                    }
                    move.speed = move._originalSpeed * speedMult;
                }
            }

            const move = this.player.components.movement;
            const transform = this.player.components.transform;
            let dx = 0,
                dy = 0;

            if (this.keys['ArrowUp'] || this.keys['w'] || this.keys['W']) dy = -1;
            if (this.keys['ArrowDown'] || this.keys['s'] || this.keys['S']) dy = 1;
            if (this.keys['ArrowLeft'] || this.keys['a'] || this.keys['A']) dx = -1;
            if (this.keys['ArrowRight'] || this.keys['d'] || this.keys['D']) dx = 1;

            if (dx !== 0 || dy !== 0) {
                const len = Math.sqrt(dx * dx + dy * dy);
                dx /= len;
                dy /= len;

                const newX = transform.x + dx * move.speed * dt;
                const newY = transform.y + dy * move.speed * dt;

                const tileSize = this.tileSize;
                const playerWidth = 20;
                const playerHeight = 28;

                const testX = newX;
                const testY = transform.y;
                const tileX1 = Math.floor((testX - playerWidth / 2) / tileSize);
                const tileX2 = Math.floor((testX + playerWidth / 2) / tileSize);
                const tileY1 = Math.floor((testY - playerHeight / 2) / tileSize);
                const tileY2 = Math.floor((testY + playerHeight / 2) / tileSize);

                let canMoveX = true;
                for (let ty = tileY1; ty <= tileY2; ty++) {
                    for (let tx = tileX1; tx <= tileX2; tx++) {
                        if (this.locationLoader.isSolid(tx, ty)) {
                            canMoveX = false;
                            break;
                        }
                    }
                    if (!canMoveX) break;
                }

                const testX2 = transform.x;
                const testY2 = newY;
                const tileX3 = Math.floor((testX2 - playerWidth / 2) / tileSize);
                const tileX4 = Math.floor((testX2 + playerWidth / 2) / tileSize);
                const tileY3 = Math.floor((testY2 - playerHeight / 2) / tileSize);
                const tileY4 = Math.floor((testY2 + playerHeight / 2) / tileSize);

                let canMoveY = true;
                for (let ty = tileY3; ty <= tileY4; ty++) {
                    for (let tx = tileX3; tx <= tileX4; tx++) {
                        if (this.locationLoader.isSolid(tx, ty)) {
                            canMoveY = false;
                            break;
                        }
                    }
                    if (!canMoveY) break;
                }

                if (canMoveX) {
                    transform.x = newX;
                }
                if (canMoveY) {
                    transform.y = newY;
                }

                const mapWidth = this.locationLoader.getCurrentLocation()?.width || 40;
                const mapHeight = this.locationLoader.getCurrentLocation()?.height || 30;
                const maxX = mapWidth * this.tileSize;
                const maxY = mapHeight * this.tileSize;
                transform.x = Math.max(20, Math.min(maxX - 20, transform.x));
                transform.y = Math.max(20, Math.min(maxY - 20, transform.y));
            }

            if (this.keys[' '] || (this.keys['e'] || this.keys['E']) && !this.isInDialogue) {
                const combat = this.player.components.combat;
                if (combat.cooldownTimer === undefined || combat.cooldownTimer <= 0) {
                    combat.cooldownTimer = combat.cooldown;
                    this.performAttack(this.player);
                }
            }

            if (this.player.components.combat.cooldownTimer !== undefined) {
                this.player.components.combat.cooldownTimer -= dt;
                if (this.player.components.combat.cooldownTimer < 0) {
                    this.player.components.combat.cooldownTimer = 0;
                }
            }
        }

        for (const entity of this.entities) {
            if (entity.components.animation) {
                entity.components.animation.update(dt);
            }
        }

        // Update cutscene
        this.updateCutscene(dt);

        for (const entity of this.entities) {
            if (entity.type === 'enemy' && entity.components.ai) {
                this.updateEnemyAI(entity, dt);
            }
        }

        for (const entity of this.entities) {
            if (entity.components.health) {
                const health = entity.components.health;
                if (health.currentHealth <= 0 && !entity._dead) {
                    entity._dead = true;
                    this.app.console.log('info', `${entity.name} (${entity.id}) died`);
                    setTimeout(() => {
                        const idx = this.entities.indexOf(entity);
                        if (idx !== -1) this.entities.splice(idx, 1);
                    }, 2000);
                }
            }
        }

        if (this.player && !this._transitioning) {
            const transform = this.player.components.transform;
            const tileX = Math.floor(transform.x / this.tileSize);
            const tileY = Math.floor(transform.y / this.tileSize);

            const exit = this.locationLoader.getExitAt(tileX, tileY);
            if (exit) {
                this.app.console.log('info', `At exit: ${exit.id} -> ${exit.targetLocation} (spawn: ${exit.targetSpawn || 'default'})`);

                if (this.keys['e'] || this.keys['E']) {
                    this._transitioning = true;
                    this.app.console.log('info', `Transitioning to: ${exit.targetLocation}`);
                    this.loadLocation(exit.targetLocation, exit.targetSpawn || 'default').then(() => {
                        this._transitioning = false;
                    });
                }
            }
        }

        this.updateMissionUI();
    }

    updateEnemyAI(entity, dt) {
        if (entity._dead) return;

        const ai = entity.components.ai;
        const transform = entity.components.transform;
        if (!this.player) return;
        const playerTransform = this.player.components.transform;
        const dx = playerTransform.x - transform.x;
        const dy = playerTransform.y - transform.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < ai.detectionRange) {
            if (dist > ai.attackRange) {
                const speed = 80;
                const nx = dx / dist;
                const ny = dy / dist;
                transform.x += nx * speed * dt;
                transform.y += ny * speed * dt;
            } else {
                const combat = entity.components.combat;
                if (combat.cooldownTimer === undefined || combat.cooldownTimer <= 0) {
                    combat.cooldownTimer = combat.cooldown;
                    this.performAttack(entity);
                }
            }
        }

        if (entity.components.combat.cooldownTimer !== undefined) {
            entity.components.combat.cooldownTimer -= dt;
            if (entity.components.combat.cooldownTimer < 0) {
                entity.components.combat.cooldownTimer = 0;
            }
        }
    }

    performAttack(attacker) {
        const combat = attacker.components.combat;
        const transform = attacker.components.transform;
        this.app.console.log('debug', `${attacker.name} attacks for ${combat.damage} damage`);

        for (const entity of this.entities) {
            if (entity === attacker) continue;
            if (!entity.components.health) continue;
            if (entity._dead) continue;

            if (entity.type === 'npc' && entity.components.npc) {
                const npc = entity.components.npc;
                if (!npc.isHostile) {
                    continue;
                }
            }

            const eTransform = entity.components.transform;
            const dx = eTransform.x - transform.x;
            const dy = eTransform.y - transform.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < combat.range + 20) {
                const health = entity.components.health;
                health.currentHealth -= combat.damage;
                this.app.console.log('info', `${entity.name} took ${combat.damage} damage (${health.currentHealth}/${health.maxHealth})`);

                if (health.currentHealth <= 0 && !entity._dead) {
                    entity._dead = true;

                    let gridX, gridY;
                    if (entity.components.gridPos) {
                        gridX = entity.components.gridPos.x;
                        gridY = entity.components.gridPos.y;
                    } else {
                        gridX = Math.floor(entity.components.transform.x / this.tileSize);
                        gridY = Math.floor(entity.components.transform.y / this.tileSize);
                    }
                    const enemyKey = `${this.currentLocationId}_${gridX}_${gridY}`;
                    this.app.console.log('debug', `Marking enemy killed: ${enemyKey}`);
                    this.markEnemyKilled(enemyKey);

                    const enemyType = entity.type === 'npc' ? entity.components.npc?.name?.toLowerCase() || 'npc' : entity.type;
                    this.missionLoader.checkEvent('enemy_killed', { enemyType: enemyType });
                    this.updateMissionUI();
                    setTimeout(() => {
                        const idx = this.entities.indexOf(entity);
                        if (idx !== -1) this.entities.splice(idx, 1);
                    }, 2000);
                }

                if (dist > 0) {
                    const kb = 20;
                    eTransform.x += (dx / dist) * kb;
                    eTransform.y += (dy / dist) * kb;
                }
            }
        }
    }

    render() {
        this.updateCamera();

        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;

        ctx.fillStyle = '#1a2a1a';
        ctx.fillRect(0, 0, w, h);

        ctx.save();
        ctx.translate(-this.camera.x, -this.camera.y);

        this.renderMap(ctx);

        const sorted = [...this.entities].sort((a, b) => {
            const ay = a.components.transform?.y || 0;
            const by = b.components.transform?.y || 0;
            return ay - by;
        });

        for (const entity of sorted) {
            if (!entity._dead) {
                this.renderEntity(ctx, entity);
            }
        }

        if (this.showRigPoints) {
            for (const entity of sorted) {
                if (!entity._dead && entity.components.rig) {
                    this.renderRigPoints(ctx, entity);
                }
            }
        }

        // Render cutscene (black bars, focus indicator)
        this.renderCutscene(ctx);
        ctx.restore();

        this.renderUI(ctx);
    }

    renderMap(ctx) {
        const location = this.locationLoader.getCurrentLocation();
        if (!location) return;

        const w = location.width || 40;
        const h = location.height || 30;
        const tileSize = this.tileSize;

        const ground = location.layers?.ground || [];
        for (let y = 0; y < h; y++) {
            for (let x = 0; x < w; x++) {
                const tile = ground[y]?.[x] || 0;
                const px = x * tileSize;
                const py = y * tileSize;

                if (tile === 0) {
                    ctx.fillStyle = (x + y) % 2 === 0 ? '#2d5a2d' : '#3a6b3a';
                } else if (tile === 1) {
                    ctx.fillStyle = '#8b7355';
                } else if (tile === 2) {
                    ctx.fillStyle = '#6b6b6b';
                } else {
                    ctx.fillStyle = '#2d5a2d';
                }
                ctx.fillRect(px, py, tileSize, tileSize);
            }
        }

        const objects = location.layers?.objects || [];
        for (let y = 0; y < h; y++) {
            for (let x = 0; x < w; x++) {
                const obj = objects[y]?.[x] || 0;
                if (obj === 1) {
                    const px = x * tileSize;
                    const py = y * tileSize;
                    ctx.fillStyle = '#1a4a1a';
                    ctx.fillRect(px + 4, py + 4, tileSize - 8, tileSize - 8);
                    ctx.fillStyle = '#2d6b2d';
                    ctx.fillRect(px + 8, py, tileSize - 16, tileSize - 8);
                } else if (obj === 2) {
                    const px = x * tileSize;
                    const py = y * tileSize;
                    ctx.fillStyle = '#5a5a5a';
                    ctx.fillRect(px, py, tileSize, tileSize);
                    ctx.strokeStyle = '#4a4a4a';
                    ctx.lineWidth = 1;
                    ctx.strokeRect(px, py, tileSize, tileSize);
                }
            }
        }

        const exits = location.exits || [];
        for (const exit of exits) {
            if (exit.visible === false) continue;

            const sizeX = exit.size?.x || 1;
            const sizeY = exit.size?.y || 3;
            const tileSize = this.tileSize;

            const startX = exit.x * tileSize;
            const startY = exit.y * tileSize;
            const width = sizeX * tileSize;
            const height = sizeY * tileSize;

            ctx.fillStyle = 'rgba(255, 200, 50, 0.3)';
            ctx.fillRect(startX, startY, width, height);

            ctx.strokeStyle = '#ffcc00';
            ctx.lineWidth = 2;
            ctx.strokeRect(startX, startY, width, height);

            ctx.fillStyle = '#ffcc00';
            ctx.font = 'bold 10px monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('EXIT', startX + width / 2, startY + height / 2);
        }
    }

    renderEntity(ctx, entity) {
        const transform = entity.components.transform;
        const sprite = entity.components.sprite;
        const health = entity.components.health;
        const animation = entity.components.animation;

        if (!transform) return;

        const x = transform.x;
        const y = transform.y;
        const w = sprite?.width || 32;
        const h = sprite?.height || 48;

        // --- PRIORITY 1: Active Animation ---
        if (animation && animation.playing) {
            const frame = animation.getCurrentFrame();
            if (frame) {
                const assetPath = frame.filename || frame.asset;
                if (assetPath) {
                    let fullPath = `assets/animations/${assetPath}`;
                    if (!assetPath.includes('/')) {
                        fullPath = `assets/sprites/${assetPath}`;
                    }
                    const img = this.assetLoader.getImage(fullPath);
                    if (img) {
                        ctx.save();
                        ctx.imageSmoothingEnabled = false;
                        const fw = frame.width || w;
                        const fh = frame.height || h;
                        ctx.drawImage(img, x - fw / 2, y - fh / 2, fw, fh);
                        ctx.restore();

                        if (health && health.maxHealth > 0) {
                            this.drawHealthBar(ctx, x, y, w, h, health);
                        }
                        this.drawNameLabel(ctx, x, y, w, h, entity);
                        if (this.selectedEntity === entity) {
                            this.drawSelectionHighlight(ctx, x, y, w, h);
                        }
                        return;
                    } else {
                       if (!this.assetLoader.isMissing(fullPath)) {
                            this.assetLoader.loadImage(fullPath).catch(() => {});
                        }
                    }
                }
            }
        }

        // --- PRIORITY 2: Static PNG (sprite.asset) ---
        const assetPath = sprite?.asset;
        if (assetPath) {
            const fullPath = `assets/sprites/${assetPath}`;
            let img = this.assetLoader.getImage(fullPath);
            
            if (!img && !this.assetLoader.isMissing(fullPath)) {
                // Try to load in background (no blocking)
                this.assetLoader.loadImage(fullPath).catch(() => {});
                // Use fallback for this frame
            } else if (img) {
                ctx.save();
                ctx.imageSmoothingEnabled = false;
                ctx.drawImage(img, x - w / 2, y - h / 2, w, h);
                ctx.restore();

                if (health && health.maxHealth > 0) {
                    this.drawHealthBar(ctx, x, y, w, h, health);
                }
                this.drawNameLabel(ctx, x, y, w, h, entity);
                if (this.selectedEntity === entity) {
                    this.drawSelectionHighlight(ctx, x, y, w, h);
                }
                return;
            }
        }

        // --- PRIORITY 3: Fallback colored rectangle placeholder ---
        let color, headColor, eyeColor;
        switch (entity.type) {
            case 'player':
                color = '#4488ff';
                headColor = '#88bbff';
                eyeColor = '#fff';
                break;
            case 'enemy':
                color = '#44bb44';
                headColor = '#33cc33';
                eyeColor = '#ff4444';
                break;
            case 'npc':
                color = '#ffaa44';
                headColor = '#ffcc88';
                eyeColor = '#fff';
                break;
            default:
                color = '#8888ff';
                headColor = '#aaaaff';
                eyeColor = '#fff';
        }

        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath();
        ctx.ellipse(x, y + h / 2 + 4, w / 2, 4, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = color;
        ctx.fillRect(x - w / 2, y - h / 2, w, h);

        ctx.fillStyle = color;
        ctx.globalAlpha = 0.7;
        ctx.fillRect(x - w / 2, y + h / 6, w, h / 3);
        ctx.globalAlpha = 1;

        const armY = y - h / 2.2;
        const armWidth = 8;
        const armLength = h * 0.55;
        ctx.fillStyle = color;
        ctx.fillRect(x - w / 2 - 7, armY, armWidth, armLength);
        ctx.fillRect(x + w / 2 - 1, armY, armWidth, armLength);

        ctx.fillStyle = color;
        ctx.globalAlpha = 0.8;
        ctx.fillRect(x - w / 3, y + h / 3, 6, h / 3);
        ctx.fillRect(x + w / 3 - 6, y + h / 3, 6, h / 3);
        ctx.globalAlpha = 1;

        ctx.fillStyle = headColor;
        ctx.fillRect(x - 10, y - h / 2 - 10, 20, 20);

        if (entity.type === 'enemy') {
            ctx.fillStyle = '#228822';
            ctx.fillRect(x - 12, y - h / 2 - 8, 4, 4);
            ctx.fillRect(x + 8, y - h / 2 - 6, 4, 4);
        }

        ctx.fillStyle = '#fff';
        ctx.fillRect(x - 7, y - h / 2 - 4, 5, 5);
        ctx.fillRect(x + 2, y - h / 2 - 4, 5, 5);

        ctx.fillStyle = '#222';
        ctx.fillRect(x - 5, y - h / 2 - 2, 3, 3);
        ctx.fillRect(x + 4, y - h / 2 - 2, 3, 3);

        if (entity.type === 'enemy') {
            ctx.fillStyle = '#882222';
            ctx.fillRect(x - 4, y - h / 2 + 4, 8, 3);
            ctx.fillStyle = '#ddd';
            ctx.fillRect(x - 4, y - h / 2 + 4, 2, 3);
            ctx.fillRect(x + 2, y - h / 2 + 4, 2, 3);
        }

        if (health && health.maxHealth > 0) {
            this.drawHealthBar(ctx, x, y, w, h, health);
        }

        this.drawNameLabel(ctx, x, y, w, h, entity);

        if (this.selectedEntity === entity) {
            this.drawSelectionHighlight(ctx, x, y, w, h);
        }
    }

    // Helper methods
    drawHealthBar(ctx, x, y, w, h, health) {
        const barWidth = 32;
        const barHeight = 4;
        const ratio = Math.max(0, Math.min(1, health.currentHealth / health.maxHealth));

        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(x - barWidth / 2 - 1, y - h / 2 - 16, barWidth + 2, barHeight + 2);

        ctx.fillStyle = ratio > 0.5 ? '#4caf50' : ratio > 0.25 ? '#ff9800' : '#f44336';
        ctx.fillRect(x - barWidth / 2, y - h / 2 - 15, barWidth * ratio, barHeight);
    }

    drawNameLabel(ctx, x, y, w, h, entity) {
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        const label = entity.name || entity.type;
        ctx.font = '10px monospace';
        ctx.textAlign = 'center';
        const metrics = ctx.measureText(label);
        ctx.fillRect(x - metrics.width / 2 - 4, y + h / 2 + 4, metrics.width + 8, 14);
        ctx.fillStyle = '#aaa';
        ctx.fillText(label, x, y + h / 2 + 14);
    }

    drawSelectionHighlight(ctx, x, y, w, h) {
        ctx.strokeStyle = '#4caf50';
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        ctx.strokeRect(x - w / 2 - 4, y - h / 2 - 4, w + 8, h + 8);
        ctx.setLineDash([]);
        ctx.fillStyle = '#4caf50';
        ctx.font = '10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('SELECTED', x, y - h / 2 - 12);
    }

    renderRigPoints(ctx, entity) {
        const rig = entity.components.rig;
        if (!rig) return;

        if (!rig.attachmentPoints || typeof rig.attachmentPoints !== 'object') {
            return;
        }

        const transform = entity.components.transform;
        if (!transform) return;

        const points = Object.keys(rig.attachmentPoints);
        for (const name of points) {
            const point = rig.attachmentPoints[name];
            if (!point || typeof point.x === 'undefined' || typeof point.y === 'undefined') continue;

            const pos = rig.getWorldPosition(name, transform);
            if (pos) {
                ctx.fillStyle = '#ff4444';
                ctx.beginPath();
                ctx.arc(pos.x, pos.y, 3, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#ffaa00';
                ctx.font = '7px monospace';
                ctx.textAlign = 'center';
                const shortName = name.length > 6 ? name.substring(0, 6) : name;
                ctx.fillText(shortName, pos.x, pos.y - 8);
            }
        }
    }

    hideGameplayUI() {
        if (this._normalUIHidden) return;
        this._normalUIHidden = true;
    }

    restoreGameplayUI() {
        if (!this._normalUIHidden) return;
        this._normalUIHidden = false;
    }

    renderUI(ctx) {
        const w = this.canvas.width;
        const h = this.canvas.height;

        // If cutscene is active, hide gameplay UI elements
        if (this._cutsceneActive || this._cutsceneBarsVisible) {
            // Only show minimal info if not in cutscene
            if (!this._cutsceneActive) {
                ctx.fillStyle = 'rgba(0,0,0,0.5)';
                ctx.fillRect(w - 120, 10, 110, 25);
                ctx.fillStyle = '#666';
                ctx.font = '11px monospace';
                ctx.textAlign = 'right';
                ctx.fillText(`Entities: ${this.entities.length}`, w - 15, 28);
            }
            // Don't render the full HUD
            return;
        }

        // Normal HUD rendering
        if (this.player) {
            const health = this.player.components.health;
            const survival = this.player.components.survival;

            ctx.fillStyle = 'rgba(0,0,0,0.7)';
            ctx.fillRect(10, 10, 240, 130);
            ctx.strokeStyle = '#444';
            ctx.strokeRect(10, 10, 240, 130);

            let yOffset = 16;

            const location = this.locationLoader.getCurrentLocation();
            if (location) {
                ctx.fillStyle = '#4caf50';
                ctx.font = '10px monospace';
                ctx.textAlign = 'left';
                ctx.fillText(`📍 ${location.name}`, 16, yOffset);
                yOffset += 14;
            }

            ctx.fillStyle = '#aaa';
            ctx.font = '11px monospace';
            ctx.textAlign = 'left';
            ctx.fillText(`Player: ${this.player.name}`, 16, yOffset);
            yOffset += 14;

            if (health) {
                const barX = 16;
                const barY = yOffset;
                const barW = 210;
                const barH = 12;

                ctx.fillStyle = '#333';
                ctx.fillRect(barX, barY, barW, barH);
                const ratio = Math.max(0, Math.min(1, health.currentHealth / health.maxHealth));
                ctx.fillStyle = ratio > 0.5 ? '#4caf50' : ratio > 0.25 ? '#ff9800' : '#f44336';
                ctx.fillRect(barX, barY, barW * ratio, barH);

                ctx.fillStyle = '#aaa';
                ctx.font = '9px monospace';
                ctx.textAlign = 'left';
                ctx.fillText(`HP: ${Math.floor(health.currentHealth)}/${health.maxHealth}`, barX + 4, barY + 9);
                yOffset += 16;
            }

            if (survival) {
                const barX = 16;
                const barY = yOffset;
                const barW = 210;
                const barH = 10;

                ctx.fillStyle = '#333';
                ctx.fillRect(barX, barY, barW, barH);
                const ratio = Math.max(0, Math.min(1, survival.hunger / survival.maxHunger));
                ctx.fillStyle = ratio > 0.5 ? '#ff9800' : ratio > 0.25 ? '#ff5722' : '#f44336';
                ctx.fillRect(barX, barY, barW * ratio, barH);

                ctx.fillStyle = '#aaa';
                ctx.font = '8px monospace';
                ctx.textAlign = 'left';
                ctx.fillText(`🍖 ${Math.floor(survival.hunger)}/${survival.maxHunger}`, barX + 4, barY + 8);
                yOffset += 14;

                const barY2 = yOffset;
                ctx.fillStyle = '#333';
                ctx.fillRect(barX, barY2, barW, barH);
                const ratio2 = Math.max(0, Math.min(1, survival.thirst / survival.maxThirst));
                ctx.fillStyle = ratio2 > 0.5 ? '#2196f3' : ratio2 > 0.25 ? '#1976d2' : '#0d47a1';
                ctx.fillRect(barX, barY2, barW * ratio2, barH);

                ctx.fillStyle = '#aaa';
                ctx.font = '8px monospace';
                ctx.textAlign = 'left';
                ctx.fillText(`💧 ${Math.floor(survival.thirst)}/${survival.maxThirst}`, barX + 4, barY2 + 8);
                yOffset += 14;

                const barY3 = yOffset;
                ctx.fillStyle = '#333';
                ctx.fillRect(barX, barY3, barW, barH);
                const ratio3 = Math.max(0, Math.min(1, survival.fatigue / survival.maxFatigue));
                ctx.fillStyle = ratio3 > 0.5 ? '#9c27b0' : ratio3 > 0.25 ? '#7b1fa2' : '#4a148c';
                ctx.fillRect(barX, barY3, barW * ratio3, barH);

                ctx.fillStyle = '#aaa';
                ctx.font = '8px monospace';
                ctx.textAlign = 'left';
                ctx.fillText(`😴 ${Math.floor(survival.fatigue)}/${survival.maxFatigue}`, barX + 4, barY3 + 8);
            }

            if (this.player) {
                const transform = this.player.components.transform;
                const tileX = Math.floor(transform.x / this.tileSize);
                const tileY = Math.floor(transform.y / this.tileSize);
                const exit = this.locationLoader.getExitAt(tileX, tileY);
                if (exit) {
                    ctx.fillStyle = '#ff9800';
                    ctx.font = 'bold 10px monospace';
                    ctx.textAlign = 'left';
                    ctx.fillText(`🚪 Press E to exit`, 16, 128);
                }
            }

            if (survival) {
                let warnings = [];
                if (survival.isStarving) warnings.push('⚠️ STARVING!');
                if (survival.isDehydrated) warnings.push('⚠️ DEHYDRATED!');
                if (survival.isExhausted) warnings.push('⚠️ EXHAUSTED!');

                if (warnings.length > 0) {
                    ctx.fillStyle = 'rgba(255,0,0,0.8)';
                    ctx.font = 'bold 12px monospace';
                    ctx.textAlign = 'center';
                    ctx.fillText(warnings.join('  '), 140, 155);
                }
            }
        }

        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(w - 120, 10, 110, 25);
        ctx.fillStyle = '#666';
        ctx.font = '11px monospace';
        ctx.textAlign = 'right';
        ctx.fillText(`Entities: ${this.entities.length}`, w - 15, 28);

        if (this.showRigPoints) {
            ctx.fillStyle = 'rgba(0,0,0,0.5)';
            ctx.fillRect(w - 150, 40, 140, 20);
            ctx.fillStyle = '#4caf50';
            ctx.font = '10px monospace';
            ctx.textAlign = 'right';
            ctx.fillText('RIG POINTS: ON', w - 15, 54);
        }

        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(10, h - 40, 420, 30);
        ctx.fillStyle = '#888';
        ctx.font = '11px monospace';
        ctx.textAlign = 'left';
        ctx.fillText('WASD: Move  |  SPACE/E: Attack  |  F3: Console  |  R: Rig  |  Click: Select', 20, h - 20);
    }

    async handleInteractions() {
        if (!this.player) return;
        const playerTransform = this.player.components.transform;

        for (const entity of this.entities) {
            if (entity.type === 'item' && entity.components.interaction) {
                const eTransform = entity.components.transform;
                const dx = eTransform.x - playerTransform.x;
                const dy = eTransform.y - playerTransform.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < entity.components.interaction.range) {
                    if (!entity._prompt_shown) {
                        entity._prompt_shown = true;
                        this.app.console.log('info', `Press E to pick up ${entity.name}`);
                    }
                    if (this.keys['e'] || this.keys['E']) {
                        const consumable = entity.components.consumable;
                        const survival = this.player.components.survival;
                        const itemType = consumable ? consumable.type : null;

                        if (consumable && survival) {
                            if (consumable.hungerRestore > 0) {
                                survival.addHunger(consumable.hungerRestore);
                                this.app.console.log('info', `+${consumable.hungerRestore} hunger`);
                            }
                            if (consumable.thirstRestore > 0) {
                                survival.addThirst(consumable.thirstRestore);
                                this.app.console.log('info', `+${consumable.thirstRestore} thirst`);
                            }
                            if (consumable.healthRestore > 0) {
                                const health = this.player.components.health;
                                if (health) {
                                    health.currentHealth = Math.min(health.maxHealth, health.currentHealth + consumable.healthRestore);
                                    this.app.console.log('info', `+${consumable.healthRestore} health`);
                                }
                            }
                            if (consumable.message) {
                                this.app.console.log('info', consumable.message);
                            }

                            if (itemType) {
                                this.app.console.log('debug', `Item collected: ${itemType}`);
                                const progress = this.missionLoader.checkEvent('item_collected', { itemId: itemType, quantity: 1 });
                                if (progress) {
                                    this.app.console.log('debug', `Item collection triggered mission progress`);
                                    this.updateMissionUI();
                                }
                            }
                        }

                        const idx = this.entities.indexOf(entity);
                        if (idx !== -1) {
                            this.entities.splice(idx, 1);
                            this.app.console.log('info', `Picked up and used ${entity.name}`);
                        }
                    }
                } else {
                    entity._prompt_shown = false;
                }
            }

            if (entity.type === 'npc' && entity.components.npc) {
                const npc = entity.components.npc;
                const eTransform = entity.components.transform;
                const dx = eTransform.x - playerTransform.x;
                const dy = eTransform.y - playerTransform.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < npc.interactionRadius) {
                    if (!entity._prompt_shown) {
                        entity._prompt_shown = true;
                        this.app.console.log('info', `Press E to talk to ${npc.name}`);
                    }

                    const ePressed = this.keys['e'] || this.keys['E'];

                    if (ePressed && this._eKeyReleased && !this.isInDialogue) {
                        this._eKeyReleased = false;
                        if (npc.canInteract()) {
                            npc.startInteraction();
                            const missionStarted = await this.checkMissionStart(npc);
                            this.startDialogue(entity, missionStarted);
                        }
                    } else if (!ePressed) {
                        this._eKeyReleased = true;
                    }
                } else {
                    entity._prompt_shown = false;
                }
            }
        }
    }

    async checkMissionStart(npc) {
        const npcId = npc.name.toLowerCase().replace(/\s/g, '_');
        this.app.console.log('debug', `Checking mission start for NPC: ${npcId}`);

        let missionData = this.missionLoader.getMission('first_steps');

        if (!missionData) {
            this.app.console.log('debug', 'Mission not loaded, loading now...');
            missionData = await this.missionLoader.loadMission('first_steps');
            if (!missionData) {
                this.app.console.log('debug', 'Failed to load mission');
                return false;
            }
        }

        this.app.console.log('debug', `Mission data loaded. startNpc: ${missionData.startNpc}, NPC ID: ${npcId}`);

        if (missionData && missionData.startNpc === npcId) {
            const active = this.missionLoader.getActiveMission('first_steps');
            if (!active) {
                this.app.console.log('info', 'Starting mission: First Steps');
                const mission = await this.missionLoader.startMission('first_steps');
                if (mission) {
                    this.createMissionUI();
                    this.updateMissionUI();
                    this.app.console.log('info', 'Mission started: First Steps');
                    return true;
                }
            } else {
                this.app.console.log('debug', 'Mission already active');
            }
        } else {
            this.app.console.log('debug', `No mission for this NPC (expected ${missionData?.startNpc}, got ${npcId})`);
        }
        return false;
    }

    async startMissionFromDialogue(missionId) {
        this.app.console.log('debug', `Starting mission from dialogue: ${missionId}`);

        const missionData = this.missionLoader.getMission(missionId);
        if (!missionData) {
            await this.missionLoader.loadMission(missionId);
        }

        const active = this.missionLoader.getActiveMission(missionId);
        if (!active) {
            const mission = await this.missionLoader.startMission(missionId);
            if (mission) {
                this.createMissionUI();
                this.updateMissionUI();
                this.app.console.log('info', `Mission started from dialogue: ${mission.name}`);
                return true;
            }
        }
        return false;
    }

    createMissionUI() {
        if (this.missionUI) return;

        const panel = document.createElement('div');
        panel.id = 'mission-panel';
        panel.style.cssText = `
            position: absolute;
            top: 80px;
            right: 20px;
            width: 280px;
            max-width: 30%;
            background: rgba(0, 0, 0, 0.8);
            border: 1px solid #4caf50;
            border-radius: 6px;
            padding: 12px 16px;
            z-index: 500;
            font-family: 'Courier New', monospace;
            color: #c0c0c0;
            pointer-events: none;
            display: none;
        `;

        panel.innerHTML = `
            <div style="color: #4caf50; font-weight: bold; font-size: 12px; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 1px;">📋 MISSION</div>
            <div id="mission-name" style="color: #fff; font-size: 13px; font-weight: bold; margin-bottom: 6px;"></div>
            <div id="mission-objectives" style="font-size: 11px; line-height: 1.6;"></div>
            <div id="mission-progress" style="color: #666; font-size: 10px; margin-top: 6px; border-top: 1px solid #333; padding-top: 4px;"></div>
        `;

        document.getElementById('game-container').appendChild(panel);
        this.missionUI = panel;
    }

    updateMissionUI() {
        if (!this.missionUI) return;

        const activeMissions = this.missionLoader.getActiveMissions();
        const completedMissions = this.missionLoader.getCompletedMissions();

        if (completedMissions.length > 0 && !this._missionCompleteShown) {
            const mission = completedMissions[completedMissions.length - 1];
            this.missionUI.style.display = 'block';

            document.getElementById('mission-name').textContent = '✓ Mission Complete';
            document.getElementById('mission-name').style.color = '#4caf50';
            document.getElementById('mission-name').style.fontSize = '13px';

            document.getElementById('mission-objectives').innerHTML = '';
            document.getElementById('mission-progress').textContent = '';

            this._missionCompleteShown = true;
            this._missionCompleteTimer = 0;
            this._missionCompleteMissionId = mission.id;
            return;
        }

        if (this._missionCompleteShown) {
            this._missionCompleteTimer += 0.016;
            if (this._missionCompleteTimer >= 3.0) {
                this.missionUI.style.display = 'none';
                this._missionCompleteShown = false;
                this._missionCompleteTimer = 0;

                if (this._missionCompleteMissionId) {
                    const compMissions = this.missionLoader.completedMissions;
                    const index = compMissions.findIndex(m => m.id === this._missionCompleteMissionId);
                    if (index !== -1) {
                        compMissions.splice(index, 1);
                    }
                    this._missionCompleteMissionId = null;
                }
            }
            return;
        }

        if (activeMissions.length === 0) {
            this.missionUI.style.display = 'none';
            return;
        }

        const mission = activeMissions[0];
        this.missionUI.style.display = 'block';

        document.getElementById('mission-name').textContent = mission.name;
        document.getElementById('mission-name').style.color = '#fff';
        document.getElementById('mission-name').style.fontSize = '13px';

        const objectivesHtml = mission.objectives.map(obj => {
            const checked = obj.completed ? '✓' : '□';
            const style = obj.completed ? 'color: #4caf50;' : 'color: #aaa;';

            let progressText = '';
            if (!obj.completed && (obj.type === 'kill_enemy' || obj.type === 'kill_specific_enemy')) {
                const current = obj._killed || 0;
                const required = obj.quantity || obj.required || 1;
                progressText = ` (${current}/${required})`;
            } else if (!obj.completed && obj.type === 'collect_item') {
                const current = obj._collected || 0;
                const required = obj.quantity || 1;
                progressText = ` (${current}/${required})`;
            }

            return `<div style="${style}">${checked} ${obj.description || obj.id}${progressText}</div>`;
        }).join('');

        document.getElementById('mission-objectives').innerHTML = objectivesHtml;

        const progress = mission.getProgress();
        document.getElementById('mission-progress').textContent =
            `Progress: ${progress.completed}/${progress.total}`;
    }

    setupSelection() {
        this.canvas.addEventListener('click', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const scaleX = this.canvas.width / rect.width;
            const scaleY = this.canvas.height / rect.height;

            const screenX = (e.clientX - rect.left) * scaleX;
            const screenY = (e.clientY - rect.top) * scaleY;

            const worldX = screenX + this.camera.x;
            const worldY = screenY + this.camera.y;

            let selected = null;
            for (let i = this.entities.length - 1; i >= 0; i--) {
                const entity = this.entities[i];
                if (entity._dead) continue;

                const transform = entity.components.transform;
                if (!transform) continue;

                const w = entity.components.sprite?.width || 32;
                const h = entity.components.sprite?.height || 48;

                const left = transform.x - w / 2;
                const right = transform.x + w / 2;
                const top = transform.y - h / 2;
                const bottom = transform.y + h / 2;

                if (worldX >= left && worldX <= right &&
                    worldY >= top && worldY <= bottom) {
                    selected = entity;
                    break;
                }
            }

            if (selected) {
                this.app.console.log('info', `Selected: ${selected.name} (${selected.id})`);
                this.app.showEntityProperties(selected);
                this.selectedEntity = selected;
            } else {
                this.app.console.log('info', 'Deselected');
                this.selectedEntity = null;
                const container = document.getElementById('property-editor');
                if (container) {
                    container.innerHTML = '<p style="color:#666;font-style:italic;">No entity selected</p>';
                }
            }
        });
    }

    createDialogueUI() {
        if (document.getElementById('dialogue-panel')) return;

        const panel = document.createElement('div');
        panel.id = 'dialogue-panel';
        panel.style.cssText = `
            position: absolute;
            bottom: 80px;
            left: 50%;
            transform: translateX(-50%);
            width: 600px;
            max-width: 80%;
            background: rgba(0, 0, 0, 0.85);
            border: 2px solid #4caf50;
            border-radius: 8px;
            padding: 16px 20px;
            display: none;
            z-index: 1000;
            font-family: 'Courier New', monospace;
            color: #c0c0c0;
            pointer-events: auto;
        `;

        panel.innerHTML = `
            <div id="dialogue-speaker" style="color: #4caf50; font-weight: bold; font-size: 14px; margin-bottom: 6px;"></div>
            <div id="dialogue-text" style="font-size: 14px; line-height: 1.5; min-height: 40px;"></div>
            <div style="display: flex; justify-content: space-between; margin-top: 10px; font-size: 11px; color: #666;">
                <span>Press SPACE or E to continue</span>
                <span>Press ESC to skip</span>
            </div>
        `;

        document.getElementById('game-container').appendChild(panel);

        document.addEventListener('keydown', this.handleDialogueKey.bind(this));
    }

    handleDialogueKey(e) {
        if (!this.isInDialogue) return;

        if (e.key === ' ' || e.key === 'e' || e.key === 'E') {
            e.preventDefault();
            this.advanceDialogue();
        } else if (e.key === 'Escape') {
            e.preventDefault();
            this.endDialogue();
        }
    }

    startDialogue(npc, missionStarted = false) {
        if (this.isInDialogue) {
            return;
        }

        if (this._missionCompleteShown) {
            this.app.console.log('debug', 'Mission complete UI showing, ignoring dialogue start');
            return;
        }

        const npcComp = npc.components.npc;

        if (!npcComp) {
            this.app.console.log('error', 'NPC has no npc component');
            return;
        }

        if (typeof npcComp.getDialogueId !== 'function') {
            this.app.console.log('error', 'NPC component is not properly instantiated');
            return;
        }

        const npcId = npcComp.name.toLowerCase().replace(/\s/g, '_');
        const activeMissions = this.missionLoader.getActiveMissions();
        let returnObjectiveCompleted = false;

        // Only check for return objectives if a mission was NOT just started
        if (!missionStarted) {
            for (const mission of activeMissions) {
                const current = mission.getCurrentObjective();
                if (current && current.type === 'talk_to_npc' && current.target === npcId) {
                    this.app.console.log('debug', `Completing return_to_npc objective for ${npcId}`);
                    const progress = this.missionLoader.checkEvent('npc_talked', { npcId });
                    this.updateMissionUI();

                    if (mission.isComplete()) {
                        this.app.console.log('info', `Mission Complete: ${mission.name}!`);
                        this.updateMissionUI();
                    }
                    returnObjectiveCompleted = true;
                    break;
                }
            }
        } else {
            this.app.console.log('debug', 'Mission just started, skipping return objective check for this NPC');
        }

        if (returnObjectiveCompleted) {
            this.app.console.log('debug', 'Return objective completed, skipping dialogue playback');
            return;
        }

        const dialogueId = npcComp.getDialogueId();

        if (!dialogueId) {
            this.app.console.log('info', `${npcComp.name} has nothing to say.`);
            return;
        }

        this.app.console.log('info', `Starting dialogue: ${dialogueId}`);

        this.createDialogueUI();

        const panel = document.getElementById('dialogue-panel');
        const speakerEl = document.getElementById('dialogue-speaker');
        const textEl = document.getElementById('dialogue-text');

        // Check if dialogue has cutscene data
        const dialogueData = this.dialogueManager.dialogues.get(dialogueId);
        const hasCutscene = dialogueData && dialogueData.cutscene && dialogueData.cutscene.length > 0;
        
        if (hasCutscene) {
            this._cutsceneActive = true;
            this._cutsceneSource = dialogueId;
            this.hideGameplayUI();
            // Also hide mission UI during cutscene
            if (this.missionUI) {
                this.missionUI.style.display = 'none';
            }
        }

        this.dialogueManager.setCallbacks({
            onStart: (npc, data) => {
                this.isInDialogue = true;
                panel.style.display = 'block';
                this.app.console.log('info', `Dialogue started: ${data.title || dialogueId}`);
            },
            onLine: (line, comp) => {
                const speaker = comp.getSpeakerName(line.speaker);
                speakerEl.textContent = speaker + ':';
                textEl.textContent = line.text;
                this.app.console.log('debug', `[${speaker}] ${line.text}`);
            },
            onCutscene: (data) => {
                this.handleCutsceneInstruction(data);
            },
            onComplete: (npc, comp) => {
                const npcId2 = npcComp.name.toLowerCase().replace(/\s/g, '_');
                this.app.console.log('debug', `Dialogue complete with NPC: ${npcId2}`);

                const dialogueData = comp;
                if (dialogueData && dialogueData.onComplete) {
                    if (dialogueData.onComplete.startMission) {
                        const missionId = dialogueData.onComplete.startMission;
                        this.app.console.log('debug', `Dialogue wants to start mission: ${missionId}`);
                        this.startMissionFromDialogue(missionId);
                    }
                }

                const progress = this.missionLoader.checkEvent('npc_talked', { npcId: npcId2 });
                this.app.console.log('debug', `Mission progress: ${progress}`);

                const activeMissions2 = this.missionLoader.getActiveMissions();
                for (const mission of activeMissions2) {
                    if (mission.isComplete()) {
                        this.app.console.log('info', `Mission Complete: ${mission.name}!`);
                        this.updateMissionUI();
                    }
                }

                this.updateMissionUI();
                this.endDialogue();
                this.app.console.log('info', `Dialogue complete. Flags:`, comp.flags);
            }
        });

        this.dialogueManager.startDialogue(npc, dialogueId);
    }

    advanceDialogue() {
        if (!this.isInDialogue) return;
        const nextLine = this.dialogueManager.advanceDialogue();
    }

    endDialogue() {
        this.isInDialogue = false;
        const panel = document.getElementById('dialogue-panel');
        if (panel) {
            panel.style.display = 'none';
        }
        this.dialogueManager.reset();
        this._eKeyReleased = false;
        
        // Restore UI and reset cutscene state
        this._cutsceneActive = false;
        this._cutsceneBarsVisible = false;
        this._cutsceneState = 'none';
        this._cutsceneCurrentHeight = 0;
        this._cutsceneProgress = 0;
        this._cutsceneSource = null;
        this.restoreGameplayUI();
        
        // Restore mission UI if it exists
        if (this.missionUI) {
            this.missionUI.style.display = 'block';
        }
        
        // Reset focus
        this._focusTarget = null;
        this._focusFrom = null;
        this._focusTo = null;
        this._isSliding = false;
        
        this.app.console.log('info', 'Dialogue ended');
    }

    async handleCutsceneInstruction(data) {
        const { focus, cutscene, lineIndex } = data;
        
        this.app.console.log('debug', `Cutscene instruction: line ${lineIndex}, focus: ${focus}, cutscene: ${cutscene}`);
        
        // Apply focus FIRST (order: focus then cutscene)
        if (focus !== undefined && focus !== '' && focus !== null) {
            this.applyFocus(focus);
        }
        
        // Then apply cutscene (black bars) instruction
        if (cutscene !== undefined) {
            this.applyCutscene(cutscene);
        }
    }

    applyFocus(instruction) {
        // Handle empty string - no change
        if (instruction === '' || instruction === null || instruction === undefined) {
            return;
        }
        
        // Handle array for smooth slide
        if (Array.isArray(instruction) && instruction.length === 2) {
            const from = this.resolveFocusTarget(instruction[0]);
            const to = this.resolveFocusTarget(instruction[1]);
            if (from && to) {
                // Store for interpolation
                this._focusFrom = from;
                this._focusTo = to;
                this._focusProgress = 0;
                this._isSliding = true;
                // Set initial target to from position
                this._focusTarget = from;
            }
            return;
        }
        
        // Single target - snap
        if (typeof instruction === 'string') {
            const target = this.resolveFocusTarget(instruction);
            if (target) {
                this._focusTarget = target;
                this._focusFrom = null;
                this._focusTo = null;
                this._focusProgress = 0;
                this._isSliding = false;
            }
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
        
        // NPC by name (find the first matching NPC)
        for (const entity of this.entities) {
            if (entity.type === 'npc' && entity.components.npc) {
                const npcName = entity.components.npc.name || '';
                // Case-insensitive match
                if (npcName.toLowerCase() === instruction.toLowerCase()) {
                    return { type: 'npc', name: instruction, entity: entity };
                }
            }
        }
        
        // If no NPC found, return as generic name target
        return { type: 'named', name: instruction };
    }

// Replace the applyCutscene method in src/runtime/game.js

applyCutscene(instruction) {
    // instruction: 1=Squeeze In, 2=Static, 3=Squeeze Out, 0=None
    this._cutsceneInstruction = instruction;
    this._cutsceneActive = true;
    
    // Calculate target height based on viewport
    // Use a smaller ratio - cinematic bars should leave significant space in the middle
    // 15% per bar means 30% total covered, 70% visible game area
    const targetHeight = this.canvas.height * CINEMATIC_BAR_HEIGHT_RATIO;
    this._cutsceneTargetHeight = targetHeight;
    
    switch(instruction) {
        case 1: // Squeeze In - bars come from outside (above and below)
            this._cutsceneState = 'squeezing_in';
            this._cutsceneProgress = 0;
            this._cutsceneCurrentHeight = 0; // Start at 0 (bars invisible, outside viewport)
            this._cutsceneBarsVisible = true;
            this.hideGameplayUI();
            if (this.missionUI) {
                this.missionUI.style.display = 'none';
            }
            break;
        case 2: // Static - instant full bars
            this._cutsceneState = 'static';
            this._cutsceneProgress = 1;
            this._cutsceneCurrentHeight = targetHeight;
            this._cutsceneBarsVisible = true;
            this.hideGameplayUI();
            if (this.missionUI) {
                this.missionUI.style.display = 'none';
            }
            break;
        case 3: // Squeeze Out - bars go back outside (above and below)
            this._cutsceneState = 'squeezing_out';
            this._cutsceneProgress = 1;
            this._cutsceneCurrentHeight = targetHeight;
            this._cutsceneBarsVisible = true;
            break;
        case 0: // None - keep current state
        default:
            // Do nothing, keep current state
            break;
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
        
        if (target.type === 'player' && this.player) {
            return { 
                x: this.player.components.transform.x, 
                y: this.player.components.transform.y 
            };
        }
        
        if (target.type === 'npc' && target.entity) {
            // Use the stored entity reference
            return { 
                x: target.entity.components.transform.x, 
                y: target.entity.components.transform.y 
            };
        }
        
        if (target.type === 'named') {
            // Try to find NPC by name
            for (const entity of this.entities) {
                if (entity.type === 'npc' && entity.components.npc) {
                    const npcName = entity.components.npc.name || '';
                    if (npcName.toLowerCase() === target.name.toLowerCase()) {
                        return { 
                            x: entity.components.transform.x, 
                            y: entity.components.transform.y 
                        };
                    }
                }
            }
        }
        
        return null;
    }

    getCutsceneFocusPosition() {
        if (!this._focusTarget) return null;
        return this.getTargetPosition(this._focusTarget);
    }

// Replace the updateCutscene method in src/runtime/game.js

updateCutscene(dt) {
    // Update focus slide
    if (this._isSliding && this._focusFrom && this._focusTo) {
        this._focusProgress += dt / 0.5; // 0.5 second slide
        if (this._focusProgress >= 1) {
            this._focusProgress = 1;
            this._isSliding = false;
            this._focusTarget = this._focusTo;
            this._focusFrom = null;
            this._focusTo = null;
        } else {
            // Interpolate position
            const fromPos = this.getTargetPosition(this._focusFrom);
            const toPos = this.getTargetPosition(this._focusTo);
            if (fromPos && toPos) {
                const t = this._focusProgress;
                this._focusTarget = {
                    type: 'interpolated',
                    x: fromPos.x + (toPos.x - fromPos.x) * t,
                    y: fromPos.y + (toPos.y - fromPos.y) * t
                };
            }
        }
    }
    
    // Update black bars animation
    if (!this._cutsceneActive) return;
    
    const targetHeight = this._cutsceneTargetHeight;
    
    switch(this._cutsceneState) {
        case 'squeezing_in':
            this._cutsceneProgress += dt / CINEMATIC_ANIMATION_DURATION;
            if (this._cutsceneProgress >= 1) {
                this._cutsceneProgress = 1;
                this._cutsceneCurrentHeight = targetHeight;
                this._cutsceneState = 'static';
            } else {
                // Ease in-out for smoother animation
                const t = this._cutsceneProgress;
                const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
                // Bar comes from outside (height grows from 0 to targetHeight)
                // The bar itself moves inward, covering more of the viewport
                this._cutsceneCurrentHeight = targetHeight * eased;
            }
            break;
            
        case 'squeezing_out':
            this._cutsceneProgress -= dt / CINEMATIC_ANIMATION_DURATION;
            if (this._cutsceneProgress <= 0) {
                this._cutsceneProgress = 0;
                this._cutsceneCurrentHeight = 0;
                this._cutsceneState = 'none';
                this._cutsceneActive = false;
                this._cutsceneBarsVisible = false;
                this.restoreGameplayUI();
                if (this.missionUI) {
                    this.missionUI.style.display = 'block';
                }
                // Reset focus
                this._focusTarget = null;
            } else {
                const t = this._cutsceneProgress;
                const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
                this._cutsceneCurrentHeight = targetHeight * eased;
            }
            break;
            
        case 'static':
            this._cutsceneCurrentHeight = targetHeight;
            break;
            
        case 'none':
        default:
            this._cutsceneCurrentHeight = 0;
            this._cutsceneActive = false;
            this._cutsceneBarsVisible = false;
            this.restoreGameplayUI();
            if (this.missionUI) {
                this.missionUI.style.display = 'block';
            }
            break;
    }
}

// Replace the renderCutscene method in src/runtime/game.js

renderCutscene(ctx) {
    // Draw focus indicator (debug) - in world space
    const focusPos = this.getCutsceneFocusPosition();
    if (focusPos && this.showRigPoints) {
        ctx.save();
        ctx.strokeStyle = '#00ff88';
        ctx.lineWidth = 2;
        ctx.setLineDash([8, 8]);
        ctx.strokeRect(focusPos.x - 30, focusPos.y - 30, 60, 60);
        ctx.setLineDash([]);
        ctx.fillStyle = '#00ff88';
        ctx.font = '10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('FOCUS', focusPos.x, focusPos.y - 36);
        ctx.restore();
    }
    
    // Draw cinematic black bars - in SCREEN space (not affected by camera)
    if (this._cutsceneBarsVisible && this._cutsceneCurrentHeight > 0) {
        const barHeight = this._cutsceneCurrentHeight;
        const canvasWidth = this.canvas.width;
        const canvasHeight = this.canvas.height;
        
        // We need to draw in screen space, so we temporarily reset the transform
        // But we're already in a ctx.save()/restore() from the render() method
        // The render() method does: ctx.save(); ctx.translate(-camera.x, -camera.y);
        // So we need to undo that translation for the bars
        
        // Save current transform
        ctx.save();
        
        // Reset transform to screen space (identity)
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        
        // Draw full-width black bars - NO GAPS on left/right
        ctx.fillStyle = '#000000';
        
        // Top bar: from top of canvas down to barHeight
        ctx.fillRect(0, 0, canvasWidth, barHeight);
        
        // Bottom bar: from canvasHeight - barHeight to bottom of canvas
        ctx.fillRect(0, canvasHeight - barHeight, canvasWidth, barHeight);
        
        // Restore transform
        ctx.restore();
    }
}

    async openAnimationEditor() {
        console.log('🔴 Opening Animation Editor...');
        try {
            if (!this.animationEditor) {
                const { AnimationEditor } = await import('../editor/animationEditor.js');
                console.log('🔴 AnimationEditor imported successfully');
                this.animationEditor = new AnimationEditor(this);
            }
            this.animationEditor.show();
            console.log('🔴 Animation Editor shown');
        } catch (error) {
            console.error('🔴 Error opening Animation Editor:', error);
        }
    }

    async openCutsceneEditor() {
        console.log('🔴 Opening Cutscene Editor...');
        try {
            if (!this.cutsceneEditor) {
                const { CutsceneEditor } = await import('../editor/cutsceneEditor.js');
                console.log('🔴 CutsceneEditor imported successfully');
                this.cutsceneEditor = new CutsceneEditor(this);
            }
            this.cutsceneEditor.show();
            console.log('🔴 Cutscene Editor shown');
        } catch (error) {
            console.error('🔴 Error opening Cutscene Editor:', error);
        }
    }

async openMissionEditor() {
    console.log('Opening Mission Editor...');
    try {
        if (!this.missionEditor) {
            const { MissionEditor } = await import('../editor/missionEditor.js');
            this.missionEditor = new MissionEditor(this);
        }
        this.missionEditor.show();
    } catch (error) {
        console.error('Error opening Mission Editor:', error);
    }
}


async openMapEditor() {
    console.log('Opening Map Editor...');
    try {
        if (!this.mapEditor) {
            const { MapEditor } = await import('../editor/mapEditor.js');
            this.mapEditor = new MapEditor(this);
        }
        this.mapEditor.show();
    } catch (error) {
        console.error('Error opening Map Editor:', error);
    }
}

async openNpcEditor() {
    console.log('Opening NPC Editor...');
    try {
        if (!this.npcEditor) {
            const { NPCEditor } = await import('../editor/npcEditor.js');
            this.npcEditor = new NPCEditor(this);
        }
        this.npcEditor.show();
    } catch (error) {
        console.error('Error opening NPC Editor:', error);
    }
}

    resetMissionProgress() {
        // Reset mission loader
        this.missionLoader.resetMissionProgress();
        
        // Reset UI flags
        this._missionCompleteShown = false;
        this._missionCompleteTimer = 0;
        this._missionCompleteMissionId = null;
        
        // Reset dialogue flags that might prevent mission start
        if (this.dialogueManager && this.dialogueManager.currentDialogue) {
            this.dialogueManager.currentDialogue.flags = {};
        }
        
        // Update UI
        this.updateMissionUI();
        
        // Hide mission panel if visible
        if (this.missionUI) {
            this.missionUI.style.display = 'none';
        }
        
        this.app.console.log('info', '🔄 Mission progress reset - ready for new mission testing');
    }
}