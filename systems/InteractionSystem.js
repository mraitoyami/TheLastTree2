import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';
import { CONFIG } from '../config.js';
import { audioSystem } from './AudioSystem.js';

export class InteractionSystem {
    constructor(player, environment) {
        this.player = player;
        this.environment = environment;
        this.interactionRadius = 4;
        this.nearbyObject = null;
        
        window.addEventListener('player-interact', () => this.handleInteraction());
        window.addEventListener('sorting-finished', (e) => this.handleSortingFinished(e.detail));
        this.tempVec = new THREE.Vector3();
    }

    update() {
        let closest = null;
        let minDist = Infinity;

        const objects = [
            ...this.environment.trees, 
            ...this.environment.garbage, 
            ...this.environment.npcs,
            ...this.environment.animals,
            ...this.environment.loggers,
            ...this.environment.predators,
            ...this.environment.fish
        ];
        
        if (this.environment.artifact) objects.push(this.environment.artifact);

        for (const obj of objects) {
            if (!obj.parent) continue;

            // Use world position for accurate distance
            obj.getWorldPosition(this.tempVec);
            const dist = this.player.mesh.position.distanceTo(this.tempVec);
            
            let reach = this.interactionRadius;
            if (obj.userData.type === 'tree') reach = this.player.stats.reach;
            if (obj.userData.type === 'animal') reach = this.player.stats.reach;
            if (obj.userData.type === 'logger' || obj.userData.type === 'predator') reach = this.player.stats.reach;
            
            if (dist < reach && dist < minDist) {
                minDist = dist;
                closest = obj;
            }
        }

        if (this.nearbyObject !== closest) {
            this.nearbyObject = closest;
            window.dispatchEvent(new CustomEvent('nearby-object-changed', { detail: closest ? closest.userData : null }));
        }

        // Hostile logic: Predators and Loggers attack if close
        const hostiles = [...this.environment.predators, ...this.environment.loggers];
        hostiles.forEach(h => {
            const d = h.position.distanceTo(this.player.mesh.position);
            if (d < 5) {
                h.userData.velocity.copy(this.player.mesh.position).sub(h.position).normalize();
                h.userData.speed = h.userData.type === 'predator' ? 8 : 4;
                if (d < 2 && Math.random() < 0.05) {
                    this.player.takeDamage(h.userData.type === 'predator' ? 10 : 15);
                    audioSystem.playHurt();
                }
            }
        });
    }

    async handleInteraction() {
        await audioSystem.init();
        if (!this.nearbyObject) return;

        const data = this.nearbyObject.userData;

        if (data.type === 'tree') {
            if (this.player.stats.durability <= 0) return;
            if (this.player.attack()) {
                audioSystem.playChopping();
                this.player.updateStats(0, 0, 0, 0, -0.5);
                this.handleCutTree();
            }
        } else if (data.type === 'animal') {
            if (!this.player.stats.hasHuntingGear) return;
            if (this.player.attack()) {
                audioSystem.playChopping();
                this.handleCombat(this.nearbyObject, 'animal');
            }
        } else if (data.type === 'logger' || data.type === 'predator') {
            if (this.player.attack()) {
                audioSystem.playChopping();
                this.handleCombat(this.nearbyObject, data.type);
            }
        } else if (data.type === 'garbage') {
            audioSystem.playTrash();
            window.dispatchEvent(new CustomEvent('start-sorting', { detail: data }));
        } else if (data.type === 'npc') {
            this.handleNPCInteract();
        } else if (data.type === 'artifact') {
            this.handleArtifact();
        }
    }

    handleCombat(target, type) {
        target.userData.health -= 1;
        target.scale.setScalar(1.2);
        setTimeout(() => target.scale.setScalar(1.0), 100);

        if (target.userData.health <= 0) {
            this.environment.scene.remove(target);
            const lists = {
                'animal': this.environment.animals,
                'logger': this.environment.loggers,
                'predator': this.environment.predators
            };
            const list = lists[type];
            if (list) {
                const idx = list.indexOf(target);
                if (idx > -1) list.splice(idx, 1);
            }

            if (type === 'animal') {
                this.player.updateStats(0, CONFIG.STATS.ANIMAL_REWARD, 0, 0, 0, -10, CONFIG.STATS.REPUTATION_LOSS_HUNT);
            } else if (type === 'logger') {
                this.player.updateStats(0, 100, 0, 0, 0, 20, CONFIG.STATS.REPUTATION_GAIN_LOGGER);
                audioSystem.playMoney();
                this.checkQuestProgress('logger');
            } else if (type === 'predator') {
                this.player.updateStats(0, 50, 0, 0, 0, 10, 0);
            }
        }
    }

    checkQuestProgress(type) {
        const q = this.player.activeQuest;
        if (q && q.type === type && !q.isComplete) {
            q.progress++;
            if (q.progress >= q.target) {
                q.isComplete = true;
                window.dispatchEvent(new CustomEvent('notification', { detail: `Даалгавар биеллээ: ${q.title}!` }));
                audioSystem.playQuestComplete();
            }
            window.dispatchEvent(new CustomEvent('quest-updated', { detail: q }));
        }
    }

    handleCutTree() {
        const tree = this.nearbyObject;
        tree.userData.health -= 1;
        tree.scale.set(1.1, 0.9, 1.1);
        setTimeout(() => tree.scale.set(1, 1, 1), 100);

        if (tree.userData.health <= 0) {
            this.environment.scene.remove(tree);
            const index = this.environment.trees.indexOf(tree);
            if (index > -1) this.environment.trees.splice(index, 1);
            
            const oxyLoss = CONFIG.STATS.OXYGEN_DECAY_PER_TREE * this.player.stats.efficiency;
            this.player.updateStats(-oxyLoss, 0, CONFIG.STATS.WOOD_GAIN_TREE, 0, 0, -5, CONFIG.STATS.REPUTATION_LOSS_TREE);
            this.checkQuestProgress('tree');
        }
    }

    handleSortingFinished(result) {
        const garbage = this.environment.garbage.find(g => g.userData.id === result.id);
        if (!garbage) return;

        this.environment.scene.remove(garbage);
        const index = this.environment.garbage.indexOf(garbage);
        if (index > -1) this.environment.garbage.splice(index, 1);

        let oxyGain = CONFIG.STATS.OXYGEN_GAIN_PER_GARBAGE;
        let moneyGain = CONFIG.STATS.MONEY_GAIN_PER_GARBAGE;
        let natureGain = 15;
        let repGain = CONFIG.STATS.REPUTATION_GAIN_GARBAGE;

        if (result.isCorrect) {
            moneyGain += CONFIG.STATS.SORTING_BONUS;
            natureGain += 10;
            repGain += 2;
            window.dispatchEvent(new CustomEvent('notification', { detail: `Зөв ангиллаа! +$${moneyGain}` }));
        } else {
            window.dispatchEvent(new CustomEvent('notification', { detail: `Буруу ангиллаа. Энэ бол ${result.category} байлаа.` }));
        }
        
        this.player.updateStats(oxyGain, moneyGain, 0, 1, 0, natureGain, repGain);
        audioSystem.playMoney();
        this.checkQuestProgress('garbage');
    }

    handleArtifact() {
        this.environment.scene.remove(this.environment.artifact);
        this.player.stats.hasArtifact = true;
        this.player.updateStats(0, 0, 0, 0, 0, 100, 50);
        audioSystem.playQuestComplete();
        this.checkQuestProgress('artifact');
        window.dispatchEvent(new CustomEvent('notification', { detail: 'Эртний техник олдлоо: Гараг тогтворжлоо!' }));
    }

    handleNPCInteract() {
        const data = this.nearbyObject.userData;
        const rep = this.player.stats.reputation;
        const activeQuest = this.player.activeQuest;
        
        // If quest is complete and talking to the quest giver (or anyone for simplicity)
        if (activeQuest && activeQuest.isComplete) {
            this.player.updateStats(0, activeQuest.reward, 0, 0, 0, 20, 10);
            this.player.activeQuest = null;
            window.dispatchEvent(new CustomEvent('show-dialogue', { detail: { 
                title: data.name || "Тосгоны иргэн", 
                text: "Маш их баярлалаа! Үүнийг шагнал болгон аваарай. Та ойд үнэхээр тус боллоо." 
            }}));
            window.dispatchEvent(new CustomEvent('quest-updated', { detail: null }));
            return;
        }

        let message = data.story || "Сайн байна уу, аялагчаа.";
        if (rep < CONFIG.REPUTATION.ANGRY_THRESHOLD) message = "Эндээс яв! Та зөвхөн сүйтгэж байна!";
        else if (rep > CONFIG.REPUTATION.TRUST_THRESHOLD) message = "Бидний ойг аварсанд талархаж байна!";

        // Offer quest if they have questData and player has no quest
        let questToOffer = null;
        if (data.questData && !activeQuest) {
            questToOffer = { ...data.questData, progress: 0, isComplete: false };
            // Hide indicator when quest is viewed/offered (or you can do it when accepted)
            if (data.questIndicator) data.questIndicator.visible = false;
        }

        window.dispatchEvent(new CustomEvent('show-dialogue', { detail: { 
            title: data.name || "Тосгоны иргэн", 
            text: message,
            quest: questToOffer
        }}));
    }
}
