import * as THREE from 'three';
import { CONFIG } from '../config.js';

export class HUD {
    constructor(player) {
        this.player = player;
        this.setupElements();
        this.setupListeners();
    }

    setupElements() {
        this.container = document.createElement('div');
        this.container.id = 'hud';
        this.container.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            font-family: 'Orbitron', sans-serif;
            color: white;
            padding: 10px;
            box-sizing: border-box;
            z-index: 2000;
        `;

        // Stats & Mission Panel
        this.statsPanel = document.createElement('div');
        this.statsPanel.style.cssText = `
            position: absolute;
            top: 2%;
            left: 2%;
            background: rgba(0, 0, 0, 0.7);
            padding: 15px;
            border-radius: 12px;
            backdrop-filter: blur(8px);
            border: 1px solid rgba(0, 255, 255, 0.3);
            pointer-events: auto;
            width: 250px;
            box-shadow: 0 0 15px rgba(0,255,255,0.1);
        `;
        this.statsPanel.innerHTML = `
            <div style="font-size: 1.2em; margin-bottom: 8px; font-weight: bold; color: #00ffff; text-shadow: 0 0 5px #00ffff;">🌍 ЭХ ДЭЛХИЙГЭЭ АВРАГЧ</div>
            <div id="mission-timer" style="color: #ffcc00; font-size: 0.9em; margin-bottom: 10px;">Сүйрэх хугацаа: 10:00</div>
            
            <div style="font-size: 0.7em; margin-bottom: 2px;">ГАРАГИЙН ЭРҮҮЛ МЭНД</div>
            <div style="width: 100%; height: 8px; background: #222; border-radius: 4px; margin-bottom: 10px; overflow: hidden;">
                <div id="nature-bar" style="width: 0%; height: 100%; background: linear-gradient(to right, #ff4444, #44ff44); transition: width 0.3s;"></div>
            </div>

            <div id="health-stat" style="color: #ff4444; font-weight: bold; margin-bottom: 5px;">❤️ Эрүүл мэнд: 100</div>
            <div id="oxygen-stat" style="color: #00ffff; margin-bottom: 5px;">🌀 Хүчилтөрөгч: 100%</div>
            
            <div style="font-size: 0.7em; margin-bottom: 2px; margin-top: 10px;">НЭР ХҮНД</div>
            <div style="width: 100%; height: 12px; background: #222; border-radius: 6px; margin-bottom: 5px; overflow: hidden; position: relative; border: 1px solid rgba(255,255,255,0.1);">
                <div id="reputation-bar" style="width: 50%; height: 100%; background: #888; transition: width 0.5s, background 0.5s;"></div>
                <div style="position: absolute; left: 50%; top: 0; width: 1px; height: 100%; background: rgba(255,255,255,0.5);"></div>
            </div>
            <div id="reputation-stat" style="font-size: 0.8em; color: #aaa; text-align: center;">Хэвийн</div>
            
            <hr style="border: 0; border-top: 1px solid rgba(255,255,255,0.1); margin: 10px 0;">
            
            <div style="display: flex; justify-content: space-between; font-size: 0.9em;">
                <span id="money-stat">💰 $0</span>
                <span id="wood-stat">🪵 0</span>
            </div>
            <div id="burn-warning" style="display:none; color: #ff0000; animation: blink 0.5s infinite; margin-top: 10px; font-size: 0.8em; text-align: center;">⚠️ ХҮЧИЛТӨРӨГЧ БАГА!</div>
        `;
        this.container.appendChild(this.statsPanel);

        // Dialogue Box
        this.dialogueBox = document.createElement('div');
        this.dialogueBox.style.cssText = `
            position: absolute;
            bottom: 20%;
            left: 50%;
            transform: translateX(-50%);
            width: 90%;
            max-width: 600px;
            background: rgba(0, 0, 0, 0.9);
            border: 2px solid #00ffff;
            padding: 20px;
            border-radius: 15px;
            display: none;
            pointer-events: auto;
            color: white;
            text-align: left;
            z-index: 2500;
            max-height: 50vh;
            overflow-y: auto;
        `;
        this.dialogueBox.innerHTML = `
            <div id="dialogue-title" style="color: #00ffff; font-weight: bold; margin-bottom: 10px; font-size: 1.1em;">Нэр</div>
            <div id="dialogue-text" style="font-size: 1em; line-height: 1.4; margin-bottom: 15px;">Текст...</div>
            <div id="quest-offer" style="display: none; background: rgba(0,255,255,0.1); padding: 10px; border-radius: 8px; margin-bottom: 15px; border: 1px solid #00ffff;">
                <div style="font-weight: bold; color: #ffcc00;">ШИНЭ ДААЛГАВАР</div>
                <div id="quest-title" style="font-weight: bold;"></div>
                <div id="quest-desc" style="font-size: 0.9em;"></div>
                <button id="accept-quest" style="margin-top: 10px; background: #00ffff; color: black; border: none; padding: 8px 15px; border-radius: 5px; font-weight: bold; cursor: pointer;">ЗӨВШӨӨРӨХ</button>
            </div>
            <button id="dialogue-close" style="background: rgba(255,255,255,0.1); color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; float: right; font-weight: bold;">ХААХ</button>
        `;
        this.container.appendChild(this.dialogueBox);

        // Quest Tracking (On HUD)
        this.questTrack = document.createElement('div');
        this.questTrack.id = 'quest-tracker';
        this.questTrack.style.cssText = `
            position: absolute;
            top: 180px;
            right: 20px;
            background: rgba(0, 0, 0, 0.7);
            padding: 15px;
            border-radius: 12px;
            border: 1px solid #ffcc00;
            display: none;
            width: 200px;
            font-size: 0.8em;
            pointer-events: none;
        `;
        this.container.appendChild(this.questTrack);

        // Notifications
        this.notification = document.createElement('div');
        this.notification.style.cssText = `
            position: absolute;
            top: 20%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 255, 255, 0.2);
            padding: 15px 30px;
            border-radius: 30px;
            border: 1px solid #00ffff;
            backdrop-filter: blur(5px);
            font-size: 1.2em;
            color: #00ffff;
            display: none;
            text-shadow: 0 0 10px #00ffff;
            animation: fadeInOut 3s forwards;
            pointer-events: none;
        `;
        this.container.appendChild(this.notification);

        // Interaction Hint
        this.interactionHint = document.createElement('div');
        this.interactionHint.id = 'interact-btn';
        this.interactionHint.style.cssText = `
            position: absolute;
            bottom: 30%;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0, 0, 0, 0.85);
            padding: 20px 40px;
            border-radius: 50px;
            font-size: 1.5em;
            display: none;
            border: 3px solid #00ffff;
            box-shadow: 0 0 20px rgba(0, 255, 255, 0.5);
            animation: pulse 1s infinite alternate;
            pointer-events: auto;
            color: #00ffff;
            font-weight: bold;
            text-transform: uppercase;
        `;
        this.interactionHint.onpointerdown = (e) => {
            e.preventDefault(); e.stopPropagation();
            window.dispatchEvent(new CustomEvent('player-interact'));
        };
        this.container.appendChild(this.interactionHint);

        // Shop Modal
        this.shopModal = document.createElement('div');
        this.shopModal.id = 'shop-modal';
        this.shopModal.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: linear-gradient(135deg, rgba(20, 20, 20, 0.95), rgba(40, 40, 40, 0.95));
            padding: 30px;
            border-radius: 20px;
            border: 2px solid #00ffff;
            width: 85%;
            max-width: 400px;
            display: none;
            pointer-events: auto;
            text-align: center;
            box-shadow: 0 0 40px rgba(0, 255, 255, 0.3);
            max-height: 80vh;
            overflow-y: auto;
            z-index: 2100;
        `;
        this.container.appendChild(this.shopModal);

        this.shopBtn = document.createElement('div');
        this.shopBtn.id = 'shop-btn';
        this.shopBtn.style.cssText = `
            position: absolute;
            bottom: 5%;
            right: 5%;
            background: linear-gradient(135deg, #0088ff, #00ffff);
            padding: 15px 25px;
            border-radius: 15px;
            pointer-events: auto;
            cursor: pointer;
            box-shadow: 0 4px 15px rgba(0, 255, 255, 0.4);
            font-weight: bold;
            border: 1px solid white;
            z-index: 2050;
            user-select: none;
        `;
        this.shopBtn.innerText = '🛠️ ДЭЛГҮҮР';
        this.shopBtn.onpointerdown = (e) => {
            e.preventDefault(); e.stopPropagation();
            this.toggleShop();
        };
        this.container.appendChild(this.shopBtn);

        // Tutorial Overlay
        this.setupTutorial();

        // Mini-map
        this.setupMiniMap();

        // End Game Modals
        this.setupSortingModal();
        this.endModal = document.createElement('div');
        this.endModal.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.95);
            padding: 40px;
            border-radius: 20px;
            width: 80%;
            max-width: 500px;
            display: none;
            pointer-events: auto;
            text-align: center;
            color: white;
            z-index: 3000;
            border: 5px solid #00ffff;
        `;
        this.container.appendChild(this.endModal);

        document.body.appendChild(this.container);

        const style = document.createElement('style');
        style.innerHTML = `
            @keyframes pulse { from { opacity: 0.7; transform: translateX(-50%) scale(1); } to { opacity: 1; transform: translateX(-50%) scale(1.1); } }
            @keyframes blink { 0% { opacity: 1; } 50% { opacity: 0; } 100% { opacity: 1; } }
            @keyframes fadeInOut { 0% { opacity: 0; } 10% { opacity: 1; } 90% { opacity: 1; } 100% { opacity: 0; } }
        `;
        document.head.appendChild(style);
    }

    setupMiniMap() {
        this.miniMapContainer = document.createElement('div');
        this.miniMapContainer.id = 'minimap';
        this.miniMapContainer.style.cssText = `
            position: absolute;
            top: 20px;
            right: 20px;
            width: 150px;
            height: 150px;
            background: rgba(0, 20, 0, 0.8);
            border: 2px solid #00ffff;
            border-radius: 50%;
            overflow: hidden;
            pointer-events: none;
            box-shadow: 0 0 15px rgba(0, 255, 255, 0.3);
            display: flex;
            align-items: center;
            justify-content: center;
        `;

        this.miniMapCanvas = document.createElement('canvas');
        this.miniMapCanvas.width = 150;
        this.miniMapCanvas.height = 150;
        this.miniMapContainer.appendChild(this.miniMapCanvas);
        this.container.appendChild(this.miniMapContainer);
        this.miniMapCtx = this.miniMapCanvas.getContext('2d');
        this.tempVec = new THREE.Vector3();
    }

    update(player, environment) {
        if (!this.miniMapCtx) return;
        const ctx = this.miniMapCtx;
        const width = this.miniMapCanvas.width;
        const height = this.miniMapCanvas.height;
        const centerX = width / 2;
        const centerY = height / 2;
        if (!CONFIG || !CONFIG.WORLD) return;
        const worldSize = CONFIG.WORLD.SIZE;
        const scale = (width / 2) / worldSize;

        ctx.clearRect(0, 0, width, height);

        // Grid lines for high-tech look
        ctx.strokeStyle = 'rgba(0, 255, 255, 0.1)';
        ctx.beginPath();
        for(let i=0; i<width; i+=30) { ctx.moveTo(i,0); ctx.lineTo(i,height); ctx.moveTo(0,i); ctx.lineTo(width,i); }
        ctx.stroke();

        const drawMarker = (pos, color, size = 4, isPlayer = false) => {
            const relX = (pos.x - player.mesh.position.x) * scale;
            const relZ = (pos.z - player.mesh.position.z) * scale;
            
            const x = centerX + relX;
            const y = centerY + relZ;

            // Only draw if within circular map
            const dist = Math.sqrt(relX * relX + relZ * relZ);
            if (dist > width / 2 - 5) return;

            ctx.fillStyle = color;
            if (isPlayer) {
                ctx.save();
                ctx.translate(x, y);
                // Rotate player marker based on mesh rotation (forward is -z in Three.js)
                ctx.rotate(player.mesh.rotation.y + Math.PI);
                ctx.beginPath();
                ctx.moveTo(0, -size * 2);
                ctx.lineTo(-size, size);
                ctx.lineTo(size, size);
                ctx.closePath();
                ctx.fill();
                ctx.restore();
            } else {
                ctx.beginPath();
                ctx.arc(x, y, size, 0, Math.PI * 2);
                ctx.fill();
                if (size > 4) { // Glow for objectives
                    ctx.strokeStyle = color;
                    ctx.lineWidth = 2;
                    ctx.stroke();
                }
            }
        };

        // Draw Artifact
        if (environment.artifact && environment.artifact.parent) {
            drawMarker(environment.artifact.position, '#00ffff', 6);
        }

        // Draw NPCs
        environment.npcs.forEach(npc => {
            npc.getWorldPosition(this.tempVec);
            drawMarker(this.tempVec, '#ffff00', 4);
        });

        // Draw Hostiles (Loggers & Predators)
        [...environment.loggers, ...environment.predators].forEach(h => {
            drawMarker(h.position, '#ff4444', 3);
        });

        // Draw Player (always at center)
        drawMarker(player.mesh.position, '#00ffff', 5, true);
    }

    setupSortingModal() {
        this.sortingModal = document.createElement('div');
        this.sortingModal.id = 'sorting-modal';
        this.sortingModal.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.95);
            padding: 30px;
            border-radius: 20px;
            border: 2px solid #00ffff;
            width: 80%;
            max-width: 400px;
            display: none;
            pointer-events: auto;
            text-align: center;
            z-index: 3500;
        `;
        this.container.appendChild(this.sortingModal);

        window.addEventListener('start-sorting', (e) => {
            const data = e.detail;
            this.renderSorting(data);
        });
    }

    renderSorting(data) {
        this.sortingModal.style.display = 'block';
        this.sortingModal.innerHTML = `
            <h2 style="color: #00ffff; margin-top: 0;">ХОГ АНГИЛАХ</h2>
            <div style="font-size: 3em; margin-bottom: 20px;">${data.emoji}</div>
            <p>Энэ ямар төрлийн хог вэ?</p>
            <div style="display: flex; flex-direction: column; gap: 10px;">
                <button class="sort-btn" data-cat="хуванцар">ХУВАНЦАР</button>
                <button class="sort-btn" data-cat="металл">МЕТАЛЛ</button>
                <button class="sort-btn" data-cat="цаас">ЦААС</button>
            </div>
            <style>
                .sort-btn { padding: 15px; background: rgba(0,255,255,0.1); color: white; border: 1px solid #00ffff; border-radius: 10px; cursor: pointer; font-weight: bold; font-family: 'Orbitron'; }
                .sort-btn:hover { background: #00ffff; color: black; }
            </style>
        `;

        this.sortingModal.querySelectorAll('.sort-btn').forEach(btn => {
            btn.onpointerdown = (e) => {
                e.preventDefault(); e.stopPropagation();
                const choice = btn.getAttribute('data-cat');
                const isCorrect = choice === data.category;
                this.sortingModal.style.display = 'none';
                window.dispatchEvent(new CustomEvent('sorting-finished', { detail: { 
                    id: data.id, 
                    isCorrect, 
                    category: data.category 
                }}));
            };
        });
    }

    setupTutorial() {
        this.tutorialOverlay = document.createElement('div');
        this.tutorialOverlay.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.95);
            padding: 40px;
            border-radius: 20px;
            border: 2px solid #00ffff;
            width: 85%;
            max-width: 600px;
            display: block;
            pointer-events: auto;
            color: white;
            z-index: 4000;
            max-height: 80vh;
            overflow-y: auto;
            text-align: left;
        `;
        this.tutorialOverlay.innerHTML = `
            <h1 style="color: #00ffff; text-align: center; margin-top: 0;">ХЭРХЭН ТОГЛОХ ВЭ?</h1>
            <p style="font-size: 1.1em; line-height: 1.4;">
                Сайн байна уу, Аврагчаа! Дэлхий гараг сүйрлийн ирмэг дээр байна. Таны даалгавар бол байгалийг сэргээж, экосистемийг аврах явдал юм.
            </p>
            <div style="background: rgba(0,255,255,0.1); padding: 15px; border-radius: 10px; margin: 15px 0;">
                <h3 style="margin-top: 0; color: #ffcc00;">📍 ҮНДСЭН ЗОРИЛГО</h3>
                10 минутын дотор <b>250 Байгалийн Оноо</b> цуглуулж Дэлхийг авар.
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                <div>
                    <h4 style="color: #00ffff; margin-bottom: 5px;">🎮 УДИРДЛАГА</h4>
                    • WASD: Хөдөлгөөн<br>
                    • Хулгана/Чирэх: Харах<br>
                    • ТОВЧЛУУР: Харилцах
                </div>
                <div>
                    <h4 style="color: #00ffff; margin-bottom: 5px;">🍃 БАЙГАЛЬ</h4>
                    • Хог түү: Хүчилтөрөгч +<br>
                    • Мод огтол: Мод +<br>
                    • Дайснууд: Болгоомжил!
                </div>
            </div>
            <p style="font-size: 0.9em; margin-top: 15px; border-top: 1px solid #333; padding-top: 10px;">
                <i>Санамж: Хүчилтөрөгч багасвал таны эрүүл мэнд буурна. Дэлгүүрээс тоног төхөөрөмжөө сайжруулаарай.</i>
            </p>
            <button id="close-tutorial" style="width: 100%; padding: 15px; background: #00ffff; color: black; border: none; border-radius: 10px; font-weight: bold; cursor: pointer; font-size: 1.1em; margin-top: 10px;">АЯЛЛЫГ ЭХЛҮҮЛЭХ</button>
        `;
        this.container.appendChild(this.tutorialOverlay);
        this.tutorialOverlay.querySelector('#close-tutorial').onpointerdown = (e) => {
            e.preventDefault(); e.stopPropagation();
            this.tutorialOverlay.style.display = 'none';
        };
    }

    setupListeners() {
        window.addEventListener('player-stats-updated', (e) => {
            const s = e.detail;
            const healthEl = document.getElementById('health-stat');
            const oxygenEl = document.getElementById('oxygen-stat');
            const moneyEl = document.getElementById('money-stat');
            const woodEl = document.getElementById('wood-stat');
            const nBar = document.getElementById('nature-bar');
            const repBar = document.getElementById('reputation-bar');
            const repStat = document.getElementById('reputation-stat');
            const warning = document.getElementById('burn-warning');
            const timer = document.getElementById('mission-timer');
            
            if (healthEl) healthEl.innerText = `❤️ Эрүүл мэнд: ${Math.ceil(s.health)}`;
            if (oxygenEl) oxygenEl.innerText = `🌀 Хүчилтөрөгч: ${Math.round(s.oxygen)}%`;
            if (moneyEl) moneyEl.innerText = `💰 $${s.money}`;
            if (woodEl) woodEl.innerText = `🪵 ${s.wood}`;
            
            if (nBar) {
                const nPercent = Math.min(100, (s.natureScore / CONFIG.MISSION.NATURE_SCORE_TARGET) * 100);
                nBar.style.width = `${nPercent}%`;
            }
            
            // Reputation bar logic (-50 to 100 range for visualization)
            if (repBar) {
                const repMin = -50, repMax = 100;
                const repRange = repMax - repMin;
                const repPercent = Math.min(100, Math.max(0, ((s.reputation - repMin) / repRange) * 100));
                repBar.style.width = `${repPercent}%`;
                
                let repText = "Хэвийн";
                let repColor = "#888";
                if (s.reputation < CONFIG.REPUTATION.ANGRY_THRESHOLD) {
                    repText = "🔴 Үзэн ядагдсан";
                    repColor = "#ff4444";
                } else if (s.reputation > CONFIG.REPUTATION.TRUST_THRESHOLD) {
                    repText = "🌟 Итгэл хүлээсэн";
                    repColor = "#ffcc00";
                } else if (s.reputation > CONFIG.REPUTATION.FRIENDLY_THRESHOLD) {
                    repText = "🟢 Найрсаг";
                    repColor = "#44ff44";
                }
                repBar.style.background = repColor;
                if (repStat) {
                    repStat.innerText = repText;
                    repStat.style.color = repColor;
                }
            }

            if (warning) warning.style.display = s.oxygen < CONFIG.STATS.CRITICAL_OXYGEN ? 'block' : 'none';

            // Timer update
            if (timer) {
                const minutes = Math.floor(this.player.missionTimer / 60);
                const seconds = Math.floor(this.player.missionTimer % 60);
                timer.innerText = `Сүйрэх хугацаа: ${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
            }

            if (this.shopModal.style.display === 'block') this.renderShop();
        });

        window.addEventListener('player-died', (e) => {
            this.showEndScreen('ТА ГЭЙМ ОВЕР БОЛЛОО', `Дэлхий гараг сүйрлээ. Шалтгаан: ${e.detail === "Oxygen Depleted" ? "Хүчилтөрөгч дууссан" : e.detail}.`, '#ff4444');
        });

        window.addEventListener('mission-complete', () => {
            this.showEndScreen('БАЯР ХҮРГЭЕ', 'Ой мод сэргэж, дэлхий аврагдлаа! Амьдрал эргэн ирлээ.', '#44ff44');
        });

        window.addEventListener('weather-changed', (e) => this.showNotification(e.detail));
        window.addEventListener('notification', (e) => this.showNotification(e.detail));

        window.addEventListener('show-dialogue', (e) => {
            const { title, text, quest } = e.detail;
            document.getElementById('dialogue-title').innerText = title;
            document.getElementById('dialogue-text').innerText = text;
            
            const questOffer = document.getElementById('quest-offer');
            if (quest) {
                questOffer.style.display = 'block';
                document.getElementById('quest-title').innerText = quest.title;
                document.getElementById('quest-desc').innerText = quest.description;
                document.getElementById('accept-quest').onpointerdown = (ev) => {
                    ev.preventDefault(); ev.stopPropagation();
                    this.player.activeQuest = quest;
                    this.updateQuestTracker(quest);
                    questOffer.style.display = 'none';
                    this.showNotification(`Даалгавар хүлээн авлаа: ${quest.title}`);
                };
            } else {
                questOffer.style.display = 'none';
            }
            
            this.dialogueBox.style.display = 'block';
        });

        window.addEventListener('quest-updated', (e) => this.updateQuestTracker(e.detail));

        document.getElementById('dialogue-close').onpointerdown = () => this.dialogueBox.style.display = 'none';

        window.addEventListener('nearby-object-changed', (e) => {
            const obj = e.detail;
            if (obj) {
                this.interactionHint.style.display = 'block';
                const label = { 
                    'tree': '🪓 Мод огтлох', 
                    'garbage': '🚮 Хог түүх', 
                    'npc': '💬 Ярилцах', 
                    'animal': '🏹 Ан хийх', 
                    'logger': '⚔️ Тэмцэх', 
                    'predator': '⚔️ Тулалдах', 
                    'artifact': '✨ Олдвор авах' 
                };
                this.interactionHint.innerText = label[obj.type] || 'Харилцах';
            } else {
                this.interactionHint.style.display = 'none';
            }
        });
    }

    updateQuestTracker(quest) {
        if (!quest) {
            this.questTrack.style.display = 'none';
            return;
        }
        this.questTrack.style.display = 'block';
        this.questTrack.innerHTML = `
            <div style="font-weight: bold; color: #ffcc00; border-bottom: 1px solid rgba(255,255,0,0.3); padding-bottom: 5px; margin-bottom: 5px;">ИДЭВХТЭЙ ДААЛГАВАР</div>
            <div style="font-weight: bold;">${quest.title}</div>
            <div style="color: #ccc;">${quest.description}</div>
            <div style="margin-top: 10px; color: ${quest.isComplete ? '#44ff44' : '#fff'}">
                Явц: ${quest.progress}/${quest.target}
                ${quest.isComplete ? '<br><b>Дууслаа! Хариугаа өгнө үү.</b>' : ''}
            </div>
        `;
    }

    showNotification(text) {
        this.notification.innerText = text;
        this.notification.style.display = 'block';
        setTimeout(() => this.notification.style.display = 'none', 3000);
    }

    showEndScreen(title, text, color) {
        this.endModal.style.borderColor = color;
        this.endModal.innerHTML = `
            <h1 style="color:${color};">${title}</h1>
            <p style="font-size: 1.2em;">${text}</p>
            <button id="restart-btn" style="padding: 15px 30px; font-size: 1.2em; background:${color}; color:black; border:none; border-radius:10px; font-weight:bold; cursor:pointer; margin-top:20px;">RESTART MISSION</button>
        `;
        const btn = this.endModal.querySelector('#restart-btn');
        if (btn) btn.onpointerdown = () => window.location.reload();
        this.endModal.style.display = 'block';
    }

    toggleShop() {
        const isVisible = this.shopModal.style.display === 'block';
        this.shopModal.style.display = isVisible ? 'none' : 'block';
        if (!isVisible) this.renderShop();
    }

    renderShop() {
        const s = this.player.stats;
        this.shopModal.innerHTML = `
            <h2 style="margin-top:0; color:#00ffff; text-shadow: 0 0 10px #00ffff">САЙЖРУУЛАХ ТӨВ</h2>
            <div style="margin-bottom: 20px; font-size: 1.1em; color: #fff;">🪵 Мод: ${s.wood} | 💰 Мөнгө: $${s.money}</div>
            <style>
                .shop-item { background: rgba(255,255,255,0.05); padding: 15px; border-radius: 12px; margin-bottom: 12px; border: 1px solid rgba(0,255,255,0.2); text-align: left; }
                .buy-btn { width: 100%; padding: 12px; margin-top: 10px; border-radius: 8px; border: none; font-weight: bold; text-transform: uppercase; cursor: pointer; font-size: 1em; }
                .buy-btn:enabled { background: #00ffff; color: #000; }
                .buy-btn:disabled { background: #333; color: #666; }
            </style>
            ${this.renderShopItem('upgrade-reach', '📏 СҮХНИЙ ХҮРЭЭ (+1.0м)', 'Модыг холоос огтлох боломжтой.', CONFIG.STATS.UPGRADE_COSTS.REACH)}
            ${this.renderShopItem('upgrade-dur', '🛡️ ТЭСВЭРЛЭХ ЧАДВАР (+5)', 'Сүхний дээд хязгаар.', CONFIG.STATS.UPGRADE_COSTS.DURABILITY)}
            ${this.renderShopItem('upgrade-speed', '⚡ ХУРДАСГАГЧ (+2 Хурд)', 'Илүү хурдан гүйх.', CONFIG.STATS.UPGRADE_COSTS.SPEED)}
            ${this.renderShopItem('upgrade-eff', '🤿 ХҮЧИЛТӨРӨГЧИЙН ХУВЦАС (-20%)', 'Илүү удаан амьсгалах.', CONFIG.STATS.UPGRADE_COSTS.EFFICIENCY)}
            ${this.renderShopItem('upgrade-hunt', '🏹 АНГИЙН ХЭРЭГСЭЛ', 'Амьтан агнахад шаардлагатай.', CONFIG.STATS.UPGRADE_COSTS.HUNTING_GEAR, s.hasHuntingGear)}
            <div class="shop-item" style="border-color: #ff4444">
                <strong>🔧 СҮХ ЗАХИСАХ</strong>
                <button id="repair-weapon" class="buy-btn" style="background: #ff4444; color: white" ${s.money < 10 || s.durability >= s.maxDurability ? 'disabled' : ''}>Засах ($10)</button>
            </div>
            <button id="close-shop" style="width: 100%; margin-top:10px; padding:15px; background:rgba(255,255,255,0.1); color:white; border:none; border-radius:12px; cursor:pointer; font-weight: bold;">ХААХ</button>
        `;

        const bind = (id, fn) => {
            const btn = this.shopModal.querySelector(`#${id}`);
            if (btn) btn.onpointerdown = (e) => { e.preventDefault(); e.stopPropagation(); if (!btn.disabled) fn(); };
        };
        bind('upgrade-reach', () => this.player.upgradeReach());
        bind('upgrade-dur', () => this.player.upgradeDurability());
        bind('upgrade-speed', () => this.player.upgradeSpeed());
        bind('upgrade-eff', () => this.player.upgradeEfficiency());
        bind('upgrade-hunt', () => this.player.upgradeHuntingGear());
        bind('repair-weapon', () => this.player.repairWeapon());
        document.getElementById('close-shop').onpointerdown = () => this.toggleShop();
    }

    renderShopItem(id, title, desc, cost, owned = false) {
        const s = this.player.stats;
        const disabled = owned || s.wood < cost.wood || s.money < cost.money;
        return `<div class="shop-item"><strong>${title}</strong><br><span style="font-size:0.8em; color:#aaa">${desc}</span><br><button id="${id}" class="buy-btn" ${disabled ? 'disabled' : ''}>${owned ? 'ЭЗЭМШСЭН' : `Худалдаж авах (${cost.wood} Мод, $${cost.money})`}</button></div>`;
    }
}
