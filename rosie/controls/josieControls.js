import * as THREE from 'three';
import { CONFIG } from '../config.js';

export class Player {
    constructor() {
        this.stats = {
            oxygen: CONFIG.STATS.MAX_OXYGEN,
            health: CONFIG.STATS.MAX_HEALTH,
            money: 0,
            wood: 0,
            garbageCollected: 0,
            natureScore: 0,
            reputation: 0,
            weaponLevel: 1,
            lastAttackTime: 0,
            reach: CONFIG.STATS.BASE_REACH,
            durability: CONFIG.STATS.BASE_DURABILITY,
            maxDurability: CONFIG.STATS.BASE_DURABILITY,
            moveSpeed: CONFIG.STATS.BASE_MOVE_SPEED,
            efficiency: 1.0, 
            hasHuntingGear: false,
            hasArtifact: false,
            isDead: false,
            missionComplete: false
        };
        this.mesh = this.createMesh();
        this.activeQuest = null;
        this.isBurning = false;
        this.missionTimer = CONFIG.MISSION.COLLAPSE_TIMER;
    }

    createMesh() {
        const group = new THREE.Group();
        
        // Better character - Body with textures simulated by colors/parts
        const bodyGeo = new THREE.CapsuleGeometry(0.4, 1, 8, 16);
        const bodyMat = new THREE.MeshStandardMaterial({ 
            color: 0x2244ff, 
            roughness: 0.3,
            metalness: 0.5
        });
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        body.position.y = 0.9;
        body.castShadow = true;
        group.add(body);

        // Backpack (for oxygen)
        const packGeo = new THREE.BoxGeometry(0.5, 0.7, 0.4);
        const packMat = new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.8, roughness: 0.2 });
        const pack = new THREE.Mesh(packGeo, packMat);
        pack.position.set(0, 1.1, -0.3);
        group.add(pack);

        // Head with helmet/visor look
        const headGeo = new THREE.SphereGeometry(0.35, 32, 32);
        const headMat = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.9, roughness: 0.1 });
        const head = new THREE.Mesh(headGeo, headMat);
        head.position.y = 1.7;
        head.castShadow = true;
        group.add(head);

        // Visor/Goggles - Glowing
        const visorGeo = new THREE.TorusGeometry(0.2, 0.05, 16, 32, Math.PI);
        const visorMat = new THREE.MeshStandardMaterial({ color: 0x00ffff, emissive: 0x00ffff, emissiveIntensity: 2 });
        const visor = new THREE.Mesh(visorGeo, visorMat);
        visor.position.set(0, 1.75, 0.25);
        visor.rotation.x = Math.PI / 2;
        group.add(visor);

        // Weapon - High Tech Axe
        const handleGeo = new THREE.CylinderGeometry(0.04, 0.04, 1.0);
        const handleMat = new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 1 });
        const handle = new THREE.Mesh(handleGeo, handleMat);
        
        const bladeGeo = new THREE.BoxGeometry(0.5, 0.4, 0.1);
        const bladeMat = new THREE.MeshStandardMaterial({ 
            color: 0x00ffcc, 
            emissive: 0x00ffcc, 
            emissiveIntensity: 1.5,
            transparent: true,
            opacity: 0.9
        });
        const blade = new THREE.Mesh(bladeGeo, bladeMat);
        blade.position.y = 0.4;
        
        // Hunting Attachment
        const huntGeo = new THREE.BoxGeometry(0.1, 0.4, 0.1);
        const huntMat = new THREE.MeshStandardMaterial({ color: 0xff0000, emissive: 0xff0000, emissiveIntensity: 2 });
        this.huntMesh = new THREE.Mesh(huntGeo, huntMat);
        this.huntMesh.position.set(0, 0.6, 0);
        this.huntMesh.visible = false;

        this.weaponMesh = new THREE.Group();
        this.weaponMesh.add(handle);
        this.weaponMesh.add(blade);
        this.weaponMesh.add(this.huntMesh);
        this.weaponMesh.position.set(0.6, 1.2, 0.3);
        group.add(this.weaponMesh);

        return group;
    }

    upgradeHuntingGear() {
        const cost = CONFIG.STATS.UPGRADE_COSTS.HUNTING_GEAR;
        if (this.stats.wood >= cost.wood && this.stats.money >= cost.money) {
            this.stats.wood -= cost.wood;
            this.stats.money -= cost.money;
            this.stats.hasHuntingGear = true;
            this.huntMesh.visible = true;
            this.updateStats(0);
            return true;
        }
        return false;
    }

    upgradeSpeed() {
        const cost = CONFIG.STATS.UPGRADE_COSTS.SPEED;
        if (this.stats.wood >= cost.wood && this.stats.money >= cost.money) {
            this.stats.wood -= cost.wood;
            this.stats.money -= cost.money;
            this.stats.moveSpeed += 2;
            this.updateStats(0);
            return true;
        }
        return false;
    }

    upgradeEfficiency() {
        const cost = CONFIG.STATS.UPGRADE_COSTS.EFFICIENCY;
        if (this.stats.wood >= cost.wood && this.stats.money >= cost.money) {
            this.stats.wood -= cost.wood;
            this.stats.money -= cost.money;
            this.stats.efficiency *= 0.8; // 20% reduction in loss
            this.updateStats(0);
            return true;
        }
        return false;
    }

    update(deltaTime) {
        if (this.stats.isDead || this.stats.missionComplete) return;

        // Mission Logic
        this.missionTimer -= deltaTime;
        if (this.missionTimer <= 0) {
            this.die("Цаг дууссан. Гараг сүйрлээ.");
            return;
        }

        if (this.stats.natureScore >= CONFIG.MISSION.NATURE_SCORE_TARGET) {
            this.stats.missionComplete = true;
            window.dispatchEvent(new CustomEvent('mission-complete', { detail: 'Байгаль сэргэлээ!' }));
        }

        // Burning Logic
        if (this.stats.oxygen < CONFIG.STATS.CRITICAL_OXYGEN) {
            this.isBurning = true;
            this.takeDamage(CONFIG.STATS.BURN_DAMAGE_RATE * deltaTime);
            const t = Math.sin(Date.now() * 0.01) * 0.5 + 0.5;
            this.mesh.traverse(child => {
                if (child.isMesh && child.material.emissive) child.material.emissive.setRGB(t * 0.5, 0, 0);
            });
        } else {
            this.isBurning = false;
            this.mesh.traverse(child => {
                if (child.isMesh && child.material.emissive && child !== this.weaponMesh.children[1]) child.material.emissive.set(0, 0, 0);
            });
        }
    }

    takeDamage(amount) {
        if (this.stats.isDead) return;
        this.stats.health = Math.max(0, this.stats.health - amount);
        if (this.stats.health <= 0) this.die("Эрүүл мэнд дууссан.");
        window.dispatchEvent(new CustomEvent('player-stats-updated', { detail: this.stats }));
    }

    die(reason = "Хүчилтөрөгч дууссан") {
        this.stats.isDead = true;
        this.mesh.rotation.z = Math.PI / 2;
        window.dispatchEvent(new CustomEvent('player-died', { detail: reason }));
    }

    updateStats(deltaOxygen, deltaMoney = 0, deltaWood = 0, deltaGarbage = 0, deltaDurability = 0, deltaNature = 0, deltaRep = 0) {
        if (this.stats.isDead) return;
        
        this.stats.oxygen = Math.max(0, Math.min(CONFIG.STATS.MAX_OXYGEN, this.stats.oxygen + deltaOxygen));
        this.stats.money += deltaMoney;
        this.stats.wood += deltaWood;
        this.stats.garbageCollected += deltaGarbage;
        this.stats.durability = Math.max(0, Math.min(this.stats.maxDurability, this.stats.durability + deltaDurability));
        this.stats.natureScore += deltaNature;
        this.stats.reputation += deltaRep;
        
        const reachScale = this.stats.reach / CONFIG.STATS.BASE_REACH;
        this.weaponMesh.scale.set(reachScale, reachScale, reachScale);
        if (this.stats.hasHuntingGear) this.huntMesh.visible = true;

        window.dispatchEvent(new CustomEvent('player-stats-updated', { detail: this.stats }));
    }

    upgradeReach() {
        const cost = CONFIG.STATS.UPGRADE_COSTS.REACH;
        if (this.stats.wood >= cost.wood && this.stats.money >= cost.money) {
            this.stats.wood -= cost.wood;
            this.stats.money -= cost.money;
            this.stats.reach += 1.0;
            this.updateStats(0);
            return true;
        }
        return false;
    }

    upgradeDurability() {
        const cost = CONFIG.STATS.UPGRADE_COSTS.DURABILITY;
        if (this.stats.wood >= cost.wood && this.stats.money >= cost.money) {
            this.stats.wood -= cost.wood;
            this.stats.money -= cost.money;
            this.stats.maxDurability += 5;
            this.stats.durability = this.stats.maxDurability;
            this.updateStats(0);
            return true;
        }
        return false;
    }

    repairWeapon() {
        if (this.stats.money >= 10 && this.stats.durability < this.stats.maxDurability) {
            this.stats.money -= 10;
            this.stats.durability = this.stats.maxDurability;
            this.updateStats(0);
            return true;
        }
        return false;
    }

    getAttackCooldown() {
        // As oxygen decreases, fire rate increases (cooldown decreases)
        // Normal oxygen (100) -> Base cooldown (1.0s)
        // Low oxygen (0) -> (1 - 100 * 0.005) = 0.5s cooldown
        const oxygenLost = CONFIG.STATS.MAX_OXYGEN - this.stats.oxygen;
        const modifier = 1 - (oxygenLost * CONFIG.STATS.FIRE_RATE_MODIFIER);
        return Math.max(0.1, CONFIG.STATS.BASE_FIRE_RATE * modifier);
    }

    canAttack() {
        const now = Date.now() / 1000;
        return now - this.stats.lastAttackTime >= this.getAttackCooldown();
    }

    attack() {
        if (!this.canAttack()) return false;
        this.stats.lastAttackTime = Date.now() / 1000;
        
        // Visual swing
        this.weaponMesh.rotation.z = Math.PI / 2;
        this.weaponMesh.rotation.x = -Math.PI / 4;
        setTimeout(() => {
            this.weaponMesh.rotation.z = 0;
            this.weaponMesh.rotation.x = 0;
        }, 150);
        return true;
    }
}
