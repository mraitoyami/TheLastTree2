import * as THREE from 'three';
import { CONFIG } from '../config.js';

export class Environment {
    constructor(scene) {
        this.scene = scene;
        this.trees = [];
        this.garbage = [];
        this.npcs = [];
        this.animals = [];
        this.buildingPositions = [];
        this.fireParticles = [];
        this.ground = null;
        this.setupWorld();
    }

    setupWorld() {
        // Ground with better material
        const groundGeo = new THREE.PlaneGeometry(CONFIG.WORLD.SIZE * 2, CONFIG.WORLD.SIZE * 2);
        const groundMat = new THREE.MeshStandardMaterial({ 
            color: CONFIG.COLORS.GROUND,
            roughness: 0.8,
            metalness: 0.1
        });
        this.ground = new THREE.Mesh(groundGeo, groundMat);
        this.ground.rotation.x = -Math.PI / 2;
        this.ground.receiveShadow = true;
        this.scene.add(this.ground);

        // Better Lights
        const ambientLight = new THREE.AmbientLight(0x404040, 1.2);
        this.scene.add(ambientLight);

        const sunLight = new THREE.DirectionalLight(0xffffff, 2.5);
        sunLight.position.set(100, 100, 50);
        sunLight.castShadow = true;
        sunLight.shadow.mapSize.width = 2048;
        sunLight.shadow.mapSize.height = 2048;
        sunLight.shadow.camera.left = -150;
        sunLight.shadow.camera.right = 150;
        sunLight.shadow.camera.top = 150;
        sunLight.shadow.camera.bottom = -150;
        this.scene.add(sunLight);

        // Sky and Fog
        this.scene.background = new THREE.Color(CONFIG.COLORS.SKY_CLEAN);
        this.scene.fog = new THREE.Fog(CONFIG.COLORS.SKY_CLEAN, 10, CONFIG.WORLD.SIZE);

        // Fire particle pool
        this.createFirePool();

        // Spawn Objects in order
        this.spawnMountains();
        this.spawnLake();
        this.spawnBuildings(); // Buildings first to store positions
        this.spawnFactories();
        this.spawnClouds();
        this.spawnTrees();
        this.spawnGarbage();
        this.spawnNPCs();
        this.spawnAnimals();
    }

    createFirePool() {
        const fireGeo = new THREE.SphereGeometry(0.2, 8, 8);
        const fireMat = new THREE.MeshStandardMaterial({ color: 0xff4400, emissive: 0xff0000, emissiveIntensity: 2 });
        for (let i = 0; i < 50; i++) {
            const p = new THREE.Mesh(fireGeo, fireMat);
            p.visible = false;
            this.scene.add(p);
            this.fireParticles.push({
                mesh: p,
                velocity: new THREE.Vector3(),
                life: 0
            });
        }
    }

    spawnAnimals() {
        const bodyGeo = new THREE.BoxGeometry(0.8, 0.6, 1.2);
        const bodyMat = new THREE.MeshStandardMaterial({ color: CONFIG.COLORS.ANIMAL });
        const headGeo = new THREE.BoxGeometry(0.4, 0.4, 0.4);

        for (let i = 0; i < CONFIG.WORLD.ANIMAL_COUNT; i++) {
            const animal = new THREE.Group();
            
            const body = new THREE.Mesh(bodyGeo, bodyMat);
            body.position.y = 0.6;
            animal.add(body);

            const head = new THREE.Mesh(headGeo, bodyMat);
            head.position.set(0, 0.9, 0.6);
            animal.add(head);

            let x = (Math.random() - 0.5) * CONFIG.WORLD.SIZE;
            let z = (Math.random() - 0.5) * CONFIG.WORLD.SIZE;

            // Avoid Lake
            if (this.isNearLake(x, z, 30)) x += 60;

            animal.position.set(x, 0, z);
            animal.userData = { 
                type: 'animal', 
                id: `animal_${i}`,
                health: 2, 
                velocity: new THREE.Vector3(Math.random() - 0.5, 0, Math.random() - 0.5).normalize(),
                speed: 1 + Math.random() * 2,
                moveTimer: 0
            };
            animal.castShadow = true;
            this.scene.add(animal);
            this.animals.push(animal);
        }
    }

    isNearLake(x, z, radius = 30) {
        return Math.sqrt(Math.pow(x - 40, 2) + Math.pow(z + 40, 2)) < radius;
    }

    spawnClouds() {
        const cloudGeo = new THREE.SphereGeometry(3, 8, 8);
        const cloudMat = new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.8 });

        for (let i = 0; i < 15; i++) {
            const cloud = new THREE.Group();
            for(let j = 0; j < 3; j++) {
                const part = new THREE.Mesh(cloudGeo, cloudMat);
                part.position.x = j * 2.5;
                part.position.y = Math.random() * 2;
                part.scale.set(1, 0.6, 0.8);
                cloud.add(part);
            }
            cloud.position.set(
                (Math.random() - 0.5) * CONFIG.WORLD.SIZE * 1.5,
                30 + Math.random() * 10,
                (Math.random() - 0.5) * CONFIG.WORLD.SIZE * 1.5
            );
            this.scene.add(cloud);
        }
    }

    spawnMountains() {
        const mountainGeo = new THREE.ConeGeometry(20, 40, 4);
        const mountainMat = new THREE.MeshStandardMaterial({ color: CONFIG.COLORS.MOUNTAIN });

        for (let i = 0; i < CONFIG.WORLD.MOUNTAIN_COUNT; i++) {
            const mountain = new THREE.Mesh(mountainGeo, mountainMat);
            const angle = (i / CONFIG.WORLD.MOUNTAIN_COUNT) * Math.PI * 2;
            const dist = CONFIG.WORLD.SIZE * 0.9;
            
            mountain.position.set(
                Math.cos(angle) * dist,
                20,
                Math.sin(angle) * dist
            );
            mountain.scale.y = 0.5 + Math.random();
            mountain.rotation.y = Math.random() * Math.PI;
            this.scene.add(mountain);
        }
    }

    spawnLake() {
        const lakeGeo = new THREE.CircleGeometry(25, 64);
        const lakeMat = new THREE.MeshStandardMaterial({ 
            color: CONFIG.COLORS.LAKE,
            transparent: true,
            opacity: 0.6,
            roughness: 0,
            metalness: 0.8
        });
        this.lake = new THREE.Mesh(lakeGeo, lakeMat);
        this.lake.rotation.x = -Math.PI / 2;
        this.lake.position.set(40, 0.05, -40);
        this.scene.add(this.lake);
    }

    spawnBuildings() {
        for (let i = 0; i < CONFIG.WORLD.BUILDING_COUNT; i++) {
            const buildingGroup = new THREE.Group();
            
            const wallMat = new THREE.MeshStandardMaterial({ color: CONFIG.COLORS.BUILDING, side: THREE.DoubleSide });
            const roofMat = new THREE.MeshStandardMaterial({ color: 0x444444 });

            const size = 6 + Math.random() * 4;
            const height = 8 + Math.random() * 4;

            let x = (Math.random() - 0.5) * CONFIG.WORLD.SIZE * 0.8;
            let z = (Math.random() - 0.5) * CONFIG.WORLD.SIZE * 0.8;
            
            // Avoid Lake
            if (Math.sqrt(Math.pow(x - 40, 2) + Math.pow(z + 40, 2)) < 35) {
                x -= 60;
            }

            // Store building position for tree avoidance
            this.buildingPositions.push({ x, z, size });

            // Back Wall
            const backWall = new THREE.Mesh(new THREE.BoxGeometry(size, height, 0.2), wallMat);
            backWall.position.set(0, height / 2, -size / 2);
            buildingGroup.add(backWall);

            // Left Wall
            const leftWall = new THREE.Mesh(new THREE.BoxGeometry(0.2, height, size), wallMat);
            leftWall.position.set(-size / 2, height / 2, 0);
            buildingGroup.add(leftWall);

            // Right Wall
            const rightWall = new THREE.Mesh(new THREE.BoxGeometry(0.2, height, size), wallMat);
            rightWall.position.set(size / 2, height / 2, 0);
            buildingGroup.add(rightWall);

            // Front Wall (with door)
            const wallPartSize = (size - 2) / 2;
            const frontWallLeft = new THREE.Mesh(new THREE.BoxGeometry(wallPartSize, height, 0.2), wallMat);
            frontWallLeft.position.set(-(size / 2 - wallPartSize / 2), height / 2, size / 2);
            buildingGroup.add(frontWallLeft);

            const frontWallRight = new THREE.Mesh(new THREE.BoxGeometry(wallPartSize, height, 0.2), wallMat);
            frontWallRight.position.set(size / 2 - wallPartSize / 2, height / 2, size / 2);
            buildingGroup.add(frontWallRight);

            const frontWallTop = new THREE.Mesh(new THREE.BoxGeometry(2, height - 3, 0.2), wallMat);
            frontWallTop.position.set(0, height - (height - 3) / 2, size / 2);
            buildingGroup.add(frontWallTop);

            // Roof
            const roof = new THREE.Mesh(new THREE.BoxGeometry(size + 1, 0.5, size + 1), roofMat);
            roof.position.set(0, height, 0);
            buildingGroup.add(roof);

            // Add some interior "loot" (Garbage or Wood)
            if (Math.random() > 0.5) {
                const loot = new THREE.Mesh(
                    new THREE.BoxGeometry(0.5, 0.5, 0.5),
                    new THREE.MeshStandardMaterial({ color: CONFIG.COLORS.GARBAGE })
                );
                loot.position.set(0, 0.25, 0);
                loot.userData = { type: 'garbage', id: `building_loot_${i}` };
                buildingGroup.add(loot);
                this.garbage.push(loot);
            }

            buildingGroup.position.set(x, 0, z);
            buildingGroup.rotation.y = Math.random() * Math.PI * 2;
            
            buildingGroup.traverse(child => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                }
            });

            this.scene.add(buildingGroup);
        }
    }

    spawnFactories() {
        for (let i = 0; i < CONFIG.WORLD.FACTORY_COUNT; i++) {
            const factoryGroup = new THREE.Group();
            
            // Main body
            const body = new THREE.Mesh(
                new THREE.BoxGeometry(10, 6, 10),
                new THREE.MeshStandardMaterial({ color: CONFIG.COLORS.FACTORY })
            );
            body.position.y = 3;
            factoryGroup.add(body);

            // Chimney
            const chimney = new THREE.Mesh(
                new THREE.CylinderGeometry(1, 1, 8),
                new THREE.MeshStandardMaterial({ color: CONFIG.COLORS.FACTORY })
            );
            chimney.position.set(3, 7, 3);
            factoryGroup.add(chimney);

            factoryGroup.position.set(
                (Math.random() - 0.5) * CONFIG.WORLD.SIZE * 0.8,
                0,
                (Math.random() - 0.5) * CONFIG.WORLD.SIZE * 0.8
            );
            
            // Ensure factories don't spawn in lake
            if (factoryGroup.position.distanceTo(new THREE.Vector3(40, 0, -40)) < 35) {
                factoryGroup.position.z += 50;
            }

            factoryGroup.castShadow = true;
            this.scene.add(factoryGroup);
        }
    }

    spawnTrees() {
        const treeTrunkGeo = new THREE.CylinderGeometry(0.2, 0.3, 2, 8);
        const treeTrunkMat = new THREE.MeshStandardMaterial({ color: CONFIG.COLORS.TREE_TRUNK });
        const treeLeavesGeo = new THREE.ConeGeometry(1.2, 2.5, 8);
        const treeLeavesMat = new THREE.MeshStandardMaterial({ color: CONFIG.COLORS.TREE_LEAVES });

        // Cluster trees for forest feel
        const clusters = 10;
        const treesPerCluster = Math.floor(CONFIG.WORLD.TREE_COUNT / clusters);

        for (let c = 0; c < clusters; c++) {
            const centerX = (Math.random() - 0.5) * CONFIG.WORLD.SIZE;
            const centerZ = (Math.random() - 0.5) * CONFIG.WORLD.SIZE;

            for (let i = 0; i < treesPerCluster; i++) {
                let x = centerX + (Math.random() - 0.5) * 40;
                let z = centerZ + (Math.random() - 0.5) * 40;

                // Check if in lake
                if (this.isNearLake(x, z, 28)) continue;
                
                // Check if inside building
                let isInsideBuilding = false;
                for (const b of this.buildingPositions) {
                    const dist = Math.sqrt(Math.pow(x - b.x, 2) + Math.pow(z - b.z, 2));
                    if (dist < b.size / 2 + 1.5) {
                        isInsideBuilding = true;
                        break;
                    }
                }
                if (isInsideBuilding) continue;

                const treeGroup = new THREE.Group();
                
                const trunk = new THREE.Mesh(treeTrunkGeo, treeTrunkMat);
                trunk.position.y = 1;
                trunk.castShadow = true;
                treeGroup.add(trunk);

                const leaves = new THREE.Mesh(treeLeavesGeo, treeLeavesMat);
                leaves.position.y = 3;
                leaves.castShadow = true;
                treeGroup.add(leaves);

                treeGroup.position.set(x, 0, z);
                treeGroup.userData = { type: 'tree', id: `tree_${c}_${i}`, health: 3 };
                this.scene.add(treeGroup);
                this.trees.push(treeGroup);
            }
        }
    }

    spawnGarbage() {
        const garbageGeo = new THREE.BoxGeometry(0.5, 0.5, 0.5);
        const garbageMat = new THREE.MeshStandardMaterial({ color: CONFIG.COLORS.GARBAGE });

        for (let i = 0; i < CONFIG.WORLD.GARBAGE_COUNT; i++) {
            const trash = new THREE.Mesh(garbageGeo, garbageMat);
            let x = (Math.random() - 0.5) * CONFIG.WORLD.SIZE;
            let z = (Math.random() - 0.5) * CONFIG.WORLD.SIZE;

            // Check if in lake
            const distToLake = Math.sqrt(Math.pow(x - 40, 2) + Math.pow(z + 40, 2));
            if (distToLake < 28) {
                x += 60;
            }

            trash.position.set(x, 0.25, z);
            trash.rotation.set(Math.random(), Math.random(), Math.random());
            trash.userData = { type: 'garbage', id: i };
            trash.castShadow = true;
            this.scene.add(trash);
            this.garbage.push(trash);
        }
    }

    spawnNPCs() {
        const npcGeo = new THREE.CapsuleGeometry(0.4, 1, 4, 8);
        const npcMat = new THREE.MeshStandardMaterial({ color: CONFIG.COLORS.NPC });
        
        for (let i = 0; i < CONFIG.WORLD.NPC_COUNT; i++) {
            const npc = new THREE.Mesh(npcGeo, npcMat);
            npc.position.set(
                (Math.random() - 0.5) * CONFIG.WORLD.SIZE * 0.5,
                0.9,
                (Math.random() - 0.5) * CONFIG.WORLD.SIZE * 0.5
            );
            npc.userData = { type: 'npc', id: i, name: 'Mayor Green', quest: 'Cut 3 Trees' };
            npc.castShadow = true;
            this.scene.add(npc);
            this.npcs.push(npc);
        }
    }

    update(deltaTime, playerPos, oxygenLevel) {
        // Adjust sky color based on oxygen
        const t = 1 - (oxygenLevel / CONFIG.STATS.MAX_OXYGEN);
        const cleanColor = new THREE.Color(CONFIG.COLORS.SKY_CLEAN);
        const pollutedColor = new THREE.Color(CONFIG.COLORS.SKY_POLLUTED);
        const currentColor = cleanColor.lerp(pollutedColor, t);
        
        this.scene.background.copy(currentColor);
        this.scene.fog.color.copy(currentColor);

        // Shimmer lake
        if (this.lake) {
            this.lake.material.opacity = 0.5 + Math.sin(Date.now() * 0.001) * 0.1;
        }

        // Animal AI
        this.animals.forEach(animal => {
            const data = animal.userData;
            data.moveTimer -= deltaTime;
            
            if (data.moveTimer <= 0) {
                // Change direction
                data.velocity.set(Math.random() - 0.5, 0, Math.random() - 0.5).normalize();
                data.moveTimer = 2 + Math.random() * 3;
                
                // Rotate to face movement
                const angle = Math.atan2(data.velocity.x, data.velocity.z);
                animal.rotation.y = angle;
            }

            // Apply movement
            animal.position.addScaledVector(data.velocity, data.speed * deltaTime);

            // Boundary checks
            if (Math.abs(animal.position.x) > CONFIG.WORLD.SIZE) animal.position.x *= -0.9;
            if (Math.abs(animal.position.z) > CONFIG.WORLD.SIZE) animal.position.z *= -0.9;
        });

        // Handle Fire Particles if Oxygen is critical
        if (oxygenLevel < CONFIG.STATS.CRITICAL_OXYGEN) {
            this.fireParticles.forEach(p => {
                if (!p.mesh.visible || p.life <= 0) {
                    p.mesh.visible = true;
                    p.mesh.position.set(
                        playerPos.x + (Math.random() - 0.5) * 15,
                        0.2,
                        playerPos.z + (Math.random() - 0.5) * 15
                    );
                    p.velocity.set((Math.random() - 0.5) * 2, 4 + Math.random() * 4, (Math.random() - 0.5) * 2);
                    p.life = 1.0 + Math.random();
                } else {
                    p.mesh.position.addScaledVector(p.velocity, deltaTime);
                    p.life -= deltaTime;
                    p.mesh.scale.setScalar(p.life);
                    if (p.life <= 0) p.mesh.visible = false;
                }
            });
        } else {
            this.fireParticles.forEach(p => p.mesh.visible = false);
        }
    }
}
