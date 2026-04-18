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
            z-index: 1000;
        `;

        // Stats Panel
        this.statsPanel = document.createElement('div');
        this.statsPanel.style.cssText = `
            position: absolute;
            top: 5%;
            left: 3%;
            background: rgba(0, 0, 0, 0.5);
            padding: 10px;
            border-radius: 8px;
            backdrop-filter: blur(5px);
            border: 1px solid rgba(255, 255, 255, 0.2);
            pointer-events: auto;
        `;
        this.statsPanel.innerHTML = `
            <div style="margin-bottom: 5px; font-weight: bold; border-bottom: 1px solid rgba(255,255,255,0.3); padding-bottom: 5px;">🌍 Earth Saving RPG</div>
            <div id="health-stat" style="color: #ff4444; font-weight: bold;">Health: 100</div>
            <div id="oxygen-stat">Oxygen: 100%</div>
            <div id="attack-stat">Attack Speed: 1.0s</div>
            <div id="durability-stat">Durability: 10/10</div>
            <div style="height: 10px;"></div>
            <div id="money-stat">Money: $0</div>
            <div id="wood-stat">Wood: 0</div>
            <div id="garbage-stat">Garbage Sorted: 0</div>
            <div id="burn-warning" style="display:none; color: #ff0000; animation: blink 0.5s infinite; margin-top: 10px; font-size: 0.8em;">⚠️ OXYGEN CRITICAL: BURNING!</div>
        `;
        this.container.appendChild(this.statsPanel);

        // Quest Panel
        this.questPanel = document.createElement('div');
        this.questPanel.style.cssText = `
            position: absolute;
            top: 5%;
            right: 3%;
            background: rgba(0, 0, 0, 0.5);
            padding: 10px;
            border-radius: 8px;
            width: 180px;
            font-size: 0.8em;
            display: none;
        `;
        this.container.appendChild(this.questPanel);

        // Interaction Hint - Larger for mobile
        this.interactionHint = document.createElement('div');
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
        this.interactionHint.id = 'interact-btn';
        this.interactionHint.onclick = (e) => {
            e.stopPropagation();
            window.dispatchEvent(new CustomEvent('player-interact'));
        };
        this.container.appendChild(this.interactionHint);

        // Shop Modal - Better graphics
        this.shopModal = document.createElement('div');
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
        `;
        this.container.appendChild(this.shopModal);

        // Shop Button - Better placement for mobile
        this.shopBtn = document.createElement('div');
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
        `;
        this.shopBtn.innerText = '🛠️ SHOP';
        this.shopBtn.onclick = (e) => {
            e.stopPropagation();
            this.toggleShop();
        };
        this.container.appendChild(this.shopBtn);

        // Death Modal
        this.deathModal = document.createElement('div');
        this.deathModal.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(100, 0, 0, 0.95);
            padding: 30px;
            border-radius: 12px;
            border: 5px solid #ff0000;
            width: 300px;
            display: none;
            pointer-events: auto;
            text-align: center;
            color: white;
            z-index: 2000;
        `;
        this.deathModal.innerHTML = `
            <h1 style="margin: 0;">YOU BURNT!</h1>
            <p>The oxygen reached critical levels and the heat was too much.</p>
            <button onclick="window.location.reload()" style="padding: 10px 20px; font-size: 1.2em; cursor: pointer; background: #fff; border: none; border-radius: 4px;">Restart</button>
        `;
        this.container.appendChild(this.deathModal);

        document.body.appendChild(this.container);

        // Add animations
        const style = document.createElement('style');
        style.innerHTML = `
            @keyframes pulse {
                from { opacity: 0.7; transform: translateX(-50%) scale(1); }
                to { opacity: 1; transform: translateX(-50%) scale(1.1); }
            }
            @keyframes blink {
                0% { opacity: 1; }
                50% { opacity: 0; }
                100% { opacity: 1; }
            }
        `;
        document.head.appendChild(style);
    }

    setupListeners() {
        window.addEventListener('player-stats-updated', (e) => {
            const stats = e.detail;
            document.getElementById('health-stat').innerText = `Health: ${Math.ceil(stats.health)}`;
            document.getElementById('oxygen-stat').innerText = `Oxygen: ${Math.round(stats.oxygen)}%`;
            document.getElementById('attack-stat').innerText = `Attack CD: ${this.player.getAttackCooldown().toFixed(2)}s`;
            document.getElementById('durability-stat').innerText = `Durability: ${Math.ceil(stats.durability)}/${stats.maxDurability}`;
            document.getElementById('money-stat').innerText = `Money: $${stats.money}`;
            document.getElementById('wood-stat').innerText = `Wood: ${stats.wood}`;
            document.getElementById('garbage-stat').innerText = `Garbage Sorted: ${stats.garbageCollected}`;
            
            const warning = document.getElementById('burn-warning');
            if (stats.oxygen < CONFIG.STATS.CRITICAL_OXYGEN) {
                warning.style.display = 'block';
            } else {
                warning.style.display = 'none';
            }

            if (this.shopModal.style.display === 'block') this.renderShop();
        });

        window.addEventListener('player-died', () => {
            this.deathModal.style.display = 'block';
        });

        window.addEventListener('nearby-object-changed', (e) => {
            const obj = e.detail;
            if (obj) {
                this.interactionHint.style.display = 'block';
                if (obj.type === 'tree') this.interactionHint.innerText = '🪓 Cut Tree';
                else if (obj.type === 'garbage') this.interactionHint.innerText = '🚮 Sort Garbage';
                else if (obj.type === 'npc') this.interactionHint.innerText = '💬 Talk to Mayor';
                else if (obj.type === 'animal') this.interactionHint.innerText = '🏹 Hunt Animal';
            } else {
                this.interactionHint.style.display = 'none';
            }
        });

        window.addEventListener('quest-accepted', (e) => this.updateQuestUI(e.detail));
        window.addEventListener('quest-turned-in', () => this.questPanel.style.display = 'none');
        window.addEventListener('quest-complete', (e) => {
            e.detail.isComplete = true;
            this.updateQuestUI(e.detail);
        });
    }

    updateQuestUI(quest) {
        if (!quest) return;
        this.questPanel.style.display = 'block';
        this.questPanel.innerHTML = `
            <div style="font-weight: bold; color: #ffcc00;">QUEST: ${quest.title}</div>
            <div>${quest.description}</div>
            <div style="margin-top: 5px; color: ${quest.isComplete ? '#44ff44' : '#ffffff'}">
                Progress: ${quest.progress}/${quest.target}
                ${quest.isComplete ? '<br><b>Ready to turn in!</b>' : ''}
            </div>
        `;
    }

    toggleShop() {
        const isVisible = this.shopModal.style.display === 'block';
        this.shopModal.style.display = isVisible ? 'none' : 'block';
        if (!isVisible) this.renderShop();
    }

    renderShop() {
        const reachCost = CONFIG.STATS.UPGRADE_COSTS.REACH;
        const durCost = CONFIG.STATS.UPGRADE_COSTS.DURABILITY;
        const speedCost = CONFIG.STATS.UPGRADE_COSTS.SPEED;
        const effCost = CONFIG.STATS.UPGRADE_COSTS.EFFICIENCY;
        const huntCost = CONFIG.STATS.UPGRADE_COSTS.HUNTING_GEAR;
        const s = this.player.stats;

        this.shopModal.innerHTML = `
            <h2 style="margin-top:0; color:#00ffff; text-shadow: 0 0 10px #00ffff">CRAFTING HUB</h2>
            <div style="margin-bottom: 20px; font-size: 1.1em; color: #fff;">
                🪵 Wood: <strong>${s.wood}</strong> | 💰 Money: <strong>$${s.money}</strong>
            </div>
            
            <style>
                .shop-item {
                    background: rgba(255,255,255,0.05);
                    padding: 15px;
                    border-radius: 12px;
                    margin-bottom: 12px;
                    border: 1px solid rgba(0,255,255,0.2);
                    text-align: left;
                }
                .buy-btn {
                    width: 100%;
                    padding: 12px;
                    margin-top: 10px;
                    border-radius: 8px;
                    border: none;
                    font-weight: bold;
                    text-transform: uppercase;
                    cursor: pointer;
                    font-size: 1em;
                }
                .buy-btn:enabled { background: #00ffff; color: #000; }
                .buy-btn:disabled { background: #333; color: #666; }
            </style>

            <div class="shop-item">
                <strong>📏 AXE REACH (+1.0m)</strong><br>
                <span style="font-size:0.8em; color:#aaa">Distance for cutting trees.</span><br>
                <button id="upgrade-reach" class="buy-btn" 
                    ${s.wood < reachCost.wood || s.money < reachCost.money ? 'disabled' : ''}>
                    Buy (${reachCost.wood} Wood, $${reachCost.money})
                </button>
            </div>

            <div class="shop-item">
                <strong>🛡️ DURABILITY (+5)</strong><br>
                <span style="font-size:0.8em; color:#aaa">Max axe health.</span><br>
                <button id="upgrade-dur" class="buy-btn" 
                    ${s.wood < durCost.wood || s.money < durCost.money ? 'disabled' : ''}>
                    Buy (${durCost.wood} Wood, $${durCost.money})
                </button>
            </div>

            <div class="shop-item">
                <strong>⚡ JET BOOTS (+2 Speed)</strong><br>
                <span style="font-size:0.8em; color:#aaa">Run faster through the world.</span><br>
                <button id="upgrade-speed" class="buy-btn" 
                    ${s.wood < speedCost.wood || s.money < speedCost.money ? 'disabled' : ''}>
                    Buy (${speedCost.wood} Wood, $${speedCost.money})
                </button>
            </div>

            <div class="shop-item">
                <strong>🤿 OXYGEN SUIT (-20% Drain)</strong><br>
                <span style="font-size:0.8em; color:#aaa">Cut trees with less oxygen loss.</span><br>
                <button id="upgrade-eff" class="buy-btn" 
                    ${s.wood < effCost.wood || s.money < effCost.money ? 'disabled' : ''}>
                    Buy (${effCost.wood} Wood, $${effCost.money})
                </button>
            </div>

            <div class="shop-item">
                <strong>🏹 HUNTING GEAR</strong><br>
                <span style="font-size:0.8em; color:#aaa">Required to hunt animals for money.</span><br>
                <button id="upgrade-hunt" class="buy-btn" 
                    ${s.hasHuntingGear ? 'disabled' : (s.wood < huntCost.wood || s.money < huntCost.money ? 'disabled' : '')}>
                    ${s.hasHuntingGear ? 'OWNED' : `Buy (${huntCost.wood} Wood, $${huntCost.money})`}
                </button>
            </div>

            <div class="shop-item" style="border-color: #ff4444">
                <strong>🔧 REPAIR AXE</strong><br>
                <button id="repair-weapon" class="buy-btn" style="background: #ff4444; color: white"
                    ${s.money < 10 || s.durability >= s.maxDurability ? 'disabled' : ''}>
                    Repair ($10)
                </button>
            </div>

            <button onclick="this.parentElement.style.display='none'" style="width: 100%; margin-top:10px; padding:15px; background:rgba(255,255,255,0.1); color:white; border:none; border-radius:12px; cursor:pointer; font-weight: bold;">CLOSE</button>
        `;

        // Bind buttons
        this.shopModal.querySelector('#upgrade-reach').onclick = () => this.player.upgradeReach();
        this.shopModal.querySelector('#upgrade-dur').onclick = () => this.player.upgradeDurability();
        this.shopModal.querySelector('#upgrade-speed').onclick = () => this.player.upgradeSpeed();
        this.shopModal.querySelector('#upgrade-eff').onclick = () => this.player.upgradeEfficiency();
        this.shopModal.querySelector('#upgrade-hunt').onclick = () => this.player.upgradeHuntingGear();
        this.shopModal.querySelector('#repair-weapon').onclick = () => this.player.repairWeapon();
    }
}
