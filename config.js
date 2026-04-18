export const CONFIG = {
    PLAYER: {
        MOVE_SPEED: 10,
        JUMP_FORCE: 12,
        GROUND_LEVEL: 0,
    },
    WORLD: {
        SIZE: 150,
        TREE_COUNT: 100, // Increased for forest feel
        GARBAGE_COUNT: 60,
        NPC_COUNT: 1,
        BUILDING_COUNT: 12,
        FACTORY_COUNT: 4,
        MOUNTAIN_COUNT: 10,
        ANIMAL_COUNT: 15,
    },
    STATS: {
        MAX_OXYGEN: 100,
        MAX_HEALTH: 100,
        OXYGEN_DECAY_PER_TREE: 8,
        OXYGEN_GAIN_PER_GARBAGE: 4,
        MONEY_GAIN_PER_GARBAGE: 5,
        ANIMAL_REWARD: 50,
        BASE_FIRE_RATE: 1.0, 
        FIRE_RATE_MODIFIER: 0.008, 
        CRITICAL_OXYGEN: 20,
        BURN_DAMAGE_RATE: 15,
        BASE_REACH: 3.5,
        BASE_DURABILITY: 15,
        BASE_MOVE_SPEED: 10,
        UPGRADE_COSTS: {
            REACH: { wood: 10, money: 100 },
            DURABILITY: { wood: 5, money: 50 },
            SPEED: { wood: 8, money: 80 },
            EFFICIENCY: { wood: 15, money: 150 },
            HUNTING_GEAR: { wood: 20, money: 200 }
        }
    },
    COLORS: {
        GROUND: 0x3d5a3d,
        TREE_TRUNK: 0x8b4513,
        TREE_LEAVES: 0x228b22,
        GARBAGE: 0x888888,
        SKY_CLEAN: 0x87ceeb,
        SKY_POLLUTED: 0x4a4a4a,
        NPC: 0xffcc00,
        MOUNTAIN: 0x666666,
        BUILDING: 0xcccccc,
        FACTORY: 0x555555,
        LAKE: 0x0044ff,
        ANIMAL: 0xaa6644
    }
};
