import * as THREE from 'three';
import { PlayerController, ThirdPersonCameraController } from './rosie/controls/rosieControls.js';
import { CONFIG } from './config.js';
import { Player } from './entities/Player.js';
import { Environment } from './entities/Environment.js';
import { InteractionSystem } from './systems/InteractionSystem.js';
import { HUD } from './ui/HUD.js';

class Game {
    constructor() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.BasicShadowMap; // Optimized for mobile
        document.body.appendChild(this.renderer.domElement);

        this.player = new Player();
        this.scene.add(this.player.mesh);

        this.environment = new Environment(this.scene);
        this.interactionSystem = new InteractionSystem(this.player, this.environment);
        this.hud = new HUD(this.player);

        // Rosie Controls
        this.controller = new PlayerController(this.player.mesh, {
            moveSpeed: CONFIG.PLAYER.MOVE_SPEED,
            jumpForce: CONFIG.PLAYER.JUMP_FORCE,
            groundLevel: CONFIG.PLAYER.GROUND_LEVEL + 0.9 // Pivot at 0.9
        });

        this.cameraController = new ThirdPersonCameraController(
            this.camera, this.player.mesh, this.renderer.domElement, {
                distance: 10,
                height: 5
            }
        );

        this.clock = new THREE.Clock();
        
        window.addEventListener('resize', () => this.onWindowResize());
        window.addEventListener('keydown', (e) => {
            if (e.code === 'KeyE') {
                window.dispatchEvent(new CustomEvent('player-interact'));
            }
        });
        this.animate();

        // Start stats broadcast
        this.player.updateStats(0);
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        const deltaTime = this.clock.getDelta();

        const rotation = this.cameraController.update();
        if (!this.player.stats.isDead) {
            // --- Water/Swimming Logic ---
            const distToLake = this.player.mesh.position.distanceTo(new THREE.Vector3(40, this.player.mesh.position.y, -40));
            const isInWater = distToLake < 25;

            if (isInWater) {
                // Swimming physics
                this.controller.moveSpeed = this.player.stats.moveSpeed * 0.4; // Slow down
                this.controller.jumpForce = 5; // Weaker "jump" as swim stroke
                
                // Allow "floating" or swimming up
                if (this.controller.keys['Space']) {
                    this.controller.velocity.y = 4;
                }

                // If deep in water, keep player slightly buoyant
                if (this.player.mesh.position.y < 0.5) {
                    this.controller.velocity.y += 0.5;
                }
            } else {
                // Normal physics
                this.controller.moveSpeed = this.player.stats.moveSpeed;
                this.controller.jumpForce = CONFIG.PLAYER.JUMP_FORCE;
            }

            this.controller.update(deltaTime, rotation);
            this.interactionSystem.update();
        }
        
        this.player.update(deltaTime);
        
        // Update environment visuals (sky/fog/fire)
        this.environment.update(deltaTime, this.player.mesh.position, this.player.stats.oxygen, this.player.stats.natureScore);

        // Update HUD (mini-map etc)
        this.hud.update(this.player, this.environment);

        this.renderer.render(this.scene, this.camera);
    }
}

new Game();
