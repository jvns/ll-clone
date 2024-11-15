// Game configuration
const GRID_SIZE = 10;
const GAME_HEIGHT = 600;
const GAME_WIDTH = GRID_SIZE * 30;
const GAME_SPEED = 3; // frames per second
const FONT = "Courier New";

class BicycleGame extends Phaser.Game {
    constructor() {
        const config = {
            type: Phaser.AUTO,
            width: GAME_WIDTH,
            height: GAME_HEIGHT,
            backgroundColor: '#000000',
            physics: {
                default: 'arcade',
                arcade: {
                    debug: true // Set to true to see collision boxes
                }
            },
            scene: MainScene,
            scale: {
                mode: Phaser.Scale.NONE,
                autoCenter: Phaser.Scale.CENTER_BOTH
            }
        };
        super(config);
    }
}

class MainScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MainScene' });
        this.gameState = {
            position: { x: 5, y: 8 },
            frame: 0,
            score: 0,
            obstacles: [],
            isGameOver: false
        };
    }

    create() {
        // Create game elements containers
        this.gameContainer = this.add.container(0, 0);
        this.tracksContainer = this.add.container(0, 0);
        this.spawnContainer = this.add.container(0, 0);

        // Create physics groups
        this.obstacles = this.physics.add.group();

        // Setup game elements
        this.setupGame();
        this.spawnManager = new SpawnManager(this);

        // Create score display
        this.scoreText = this.add.text(10, 10, 'Score: 0', {
            fontFamily: FONT,
            fontSize: GRID_SIZE,
            color: '#00FF00'
        });

        // Setup controls
        this.cursors = this.input.keyboard.createCursorKeys();
        this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

        // Set game speed
        this.time.addEvent({
            delay: 1000 / GAME_SPEED,
            callback: this.gameLoop,
            callbackScope: this,
            loop: true
        });
        this.moveTimer = 0;
        this.moveDelay = 150; // Delay between moves in milliseconds
    }

    setupGame() {
        // Create bicycle as a physics sprite
        this.bicycle = this.add.text(
            this.gameState.position.x * GRID_SIZE,
            this.gameState.position.y * GRID_SIZE,
            DARLINGS.BIKE.art.join("\n"),
            {
                fontFamily: FONT,
                fontSize: GRID_SIZE,
                color: '#00FF00'
            }
        );

        // Enable physics on the bicycle
        this.physics.world.enable(this.bicycle);

        // Set the bicycle's collision body size
        this.bicycle.body.setSize(GRID_SIZE * 2, GRID_SIZE * 2.5);

        // Setup collision detection
        this.physics.add.collider(this.bicycle, this.obstacles, (bicycle, obstacle) => {
            this.gameOver();
        });

        this.setupTracks();
        this.setupGameOverText();
    }

    setupTracks() {
        // Create road lines
        const roadLinePositions = [GRID_SIZE * 8, GRID_SIZE * 9];
        roadLinePositions.forEach(x => {
            const roadLine = this.add.text(x, 0, '‖\n'.repeat(60), {
                fontFamily: FONT,
                fontSize: GRID_SIZE,
                color: '#fbfb00',
                lineHeight: 16
            });
            this.tracksContainer.add(roadLine);
        });

        // Create TTC tracks
        const ttcTrackPositions = [
            (CONFIG.LANES.TRACKS + 1) * GRID_SIZE,
            (CONFIG.LANES.TRACKS + 3) * GRID_SIZE
        ];
        ttcTrackPositions.forEach(x => {
            const track = this.add.text(x, 0, '‖\n'.repeat(60), {
                fontFamily: FONT,
                fontSize: GRID_SIZE,
                color: '#444444',
                lineHeight: 16
            });
            this.tracksContainer.add(track);
        });
    }

    setupGameOverText() {
        this.gameOverText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2,
            'GAME OVER\nPress SPACE to restart', {
                fontFamily: FONT,
                fontSize: GRID_SIZE * 2,
                color: '#FF0000',
                align: 'center'
            }
        );
        this.gameOverText.setOrigin(0.5);
        this.gameOverText.setVisible(false);
    }

    gameOver() {
        if (this.gameState.isGameOver) return;

        this.gameState.isGameOver = true;
        this.gameOverText.setVisible(true);
        this.bicycle.setTint(0xFF0000);

        // Disable physics when game is over
        this.bicycle.body.enable = false;
    }

    restartGame() {
        this.gameState = {
            position: { x: 5, y: 8 },
            frame: 0,
            score: 0,
            obstacles: [],
            isGameOver: false
        };

        this.gameOverText.setVisible(false);
        this.bicycle.setTint(0xFFFFFF);
        this.scoreText.setText('Score: 0');

        // Re-enable physics
        this.bicycle.body.enable = true;

        // Clear all obstacles
        this.obstacles.clear(true, true);
        this.spawnManager.clearSpawns();
    }

    update(time, delta) {
        if (this.gameState.isGameOver) {
            if (Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
                this.restartGame();
            }
            return;
        }

        if (time > this.moveTimer) {
            if (this.cursors.left.isDown && this.gameState.position.x > 0) {
                this.gameState.position.x--;
                this.moveTimer = time + this.moveDelay;
            }
            else if (this.cursors.right.isDown &&
                     this.gameState.position.x < (GAME_WIDTH / GRID_SIZE) - 1) {
                this.gameState.position.x++;
                this.moveTimer = time + this.moveDelay;
            }
        }
    }

    renderSpawns() {
        // Clear previous spawns
        this.obstacles.clear(true, true);

        // Render new spawns
        const activeSpawns = this.spawnManager.getActiveSpawns();
        for (const [darlingType, spawns] of activeSpawns) {
            if (darlingType === DarlingType.BUILDING) continue; // Skip buildings for collision

            spawns.forEach(spawn => {
                const colours = COLOURS['VEHICLES'];
                const colour = colours[0];

                let art;
                switch (darlingType) {
                    case DarlingType.TTC:
                        art = DARLINGS.TTC.art;
                        break;
                    case DarlingType.TTC_LANE_DEATHMACHINE:
                        art = DARLINGS.MOVINGDEATHMACHINE.art;
                        break;
                    case DarlingType.ONCOMING_DEATHMACHINE:
                        art = DARLINGS.ONCOMINGDEATHMACHINE.art;
                        break;
                    case DarlingType.PARKED_DEATHMACHINE:
                        art = DARLINGS.DEATHMACHINE.art;
                        break;
                    case DarlingType.WANDERER:
                        art = DARLINGS.WANDERER.UP.art;
                        break;
                }

                const spawnText = this.add.text(
                    spawn.position.x * GRID_SIZE,
                    spawn.position.y * GRID_SIZE,
                    art.join("\n"),
                    {
                        fontFamily: FONT,
                        fontSize: GRID_SIZE,
                        color: colour
                    }
                );

                const width = art[0].length - 2;
                const height = art.length - 1;

                // Enable physics on the spawn and add to obstacles group
                this.physics.world.enable(spawnText);
                spawnText.body.setSize(GRID_SIZE * width, GRID_SIZE * height);
                this.obstacles.add(spawnText);
            });
        }
    }

    updateBicycle() {
        this.bicycle.setPosition(
            this.gameState.position.x * GRID_SIZE,
            this.gameState.position.y * GRID_SIZE
        );

        this.gameState.score += 1;
        this.scoreText.setText(`Score: ${this.gameState.score}`);
    }

    gameLoop() {
        console.log('loop');
        this.updateBicycle();
        this.spawnManager.update();
        this.renderSpawns();
        // No need for manual collision checking anymore!
    }
}

class SpawnManager {
    constructor() {
        this.spawnConfigs = new Map();
        this.activeSpawns = new Map();
        this.lastSpawnTimes = new Map();
        this.config = CONFIG;
        this.spawnConfigs = this.createSpawnConfigRulesForAllDarlingTypes();
    }

    createSpawnConfigRulesForAllDarlingTypes() {
        return new Map([
            [
                DarlingType.TTC,
                {
                    baseSpacing: this.config.SAFE_DISTANCE.TTC,
                    randomSpacingRange: {
                        min: Math.floor(this.config.SAFE_DISTANCE.TTC * 0.3),
                        max: Math.floor(this.config.SAFE_DISTANCE.TTC * 0.8),
                    },
                    laneRules: {
                        allowedLanes: [this.config.LANES.TRACKS],
                        spawnPosition: {
                            x: this.config.LANES.TRACKS,
                            y: this.config.GAME.HEIGHT + 5,
                        },
                        direction: -1,
                    },
                },
            ],
            [
                DarlingType.TTC_LANE_DEATHMACHINE,
                {
                    baseSpacing: this.config.SAFE_DISTANCE.TTC_LANE_DEATHMACHINE,
                    randomSpacingRange: {
                        min: Math.floor(this.config.SAFE_DISTANCE.TTC_LANE_DEATHMACHINE * 0.3),
                        max: Math.floor(this.config.SAFE_DISTANCE.TTC_LANE_DEATHMACHINE * 0.8),
                    },
                    laneRules: {
                        allowedLanes: [this.config.LANES.TRACKS + 1],
                        spawnPosition: {
                            x: this.config.LANES.TRACKS + 1,
                            y: this.config.GAME.HEIGHT + 1,
                        },
                        direction: -1,
                    },
                },
            ],
            [
                DarlingType.ONCOMING_DEATHMACHINE,
                {
                    baseSpacing: this.config.SAFE_DISTANCE.ONCOMING_DEATHMACHINE,
                    randomSpacingRange: {
                        min: Math.floor(this.config.SAFE_DISTANCE.ONCOMING_DEATHMACHINE * 0.3),
                        max: Math.floor(this.config.SAFE_DISTANCE.ONCOMING_DEATHMACHINE * 0.8),
                    },
                    laneRules: {
                        allowedLanes: [this.config.LANES.ONCOMING],
                        spawnPosition: {
                            x: this.config.LANES.ONCOMING,
                            y: -10,
                        },
                        direction: 1,
                    },
                },
            ],
            [
                DarlingType.PARKED_DEATHMACHINE,
                {
                    baseSpacing: this.config.SAFE_DISTANCE.PARKED,
                    randomSpacingRange: {
                        min: 0,
                        max: Math.floor(this.config.SAFE_DISTANCE.PARKED * 0.2),
                    },
                    laneRules: {
                        allowedLanes: [this.config.LANES.PARKED],
                        spawnPosition: {
                            x: this.config.LANES.PARKED,
                            y: -5,
                        },
                        direction: 1,
                    },
                },
            ],
            [
                DarlingType.WANDERER,
                {
                    baseSpacing: this.config.SAFE_DISTANCE.WANDERER,
                    randomSpacingRange: {
                        min: Math.floor(this.config.SAFE_DISTANCE.WANDERER * 0.3),
                        max: Math.floor(this.config.SAFE_DISTANCE.WANDERER * 0.8),
                    },
                    laneRules: {
                        allowedLanes: [this.config.LANES.SIDEWALK, this.config.LANES.SIDEWALK + 3],
                        spawnPosition: {
                            x: this.config.LANES.SIDEWALK,
                            y: -1,
                        },
                        direction: 1,
                    },
                },
            ],
            [
                DarlingType.BUILDING,
                {
                    baseSpacing: this.config.SAFE_DISTANCE.BUILDING,
                    randomSpacingRange: {
                        min: 0,
                        max: 1,
                    },
                    laneRules: {
                        allowedLanes: [this.config.LANES.BUILDINGS],
                        spawnPosition: {
                            x: this.config.LANES.BUILDINGS,
                            y: this.config.GAME.HEIGHT,
                        },
                        direction: -1,
                    },
                },
            ],
        ]);
    }

    update(deltaTime) {
        // Check and spawn for each darling type
        for (const [darlingType, config] of this.spawnConfigs) {
            this.updateDarlingType(darlingType, config, deltaTime);
        }

        // Update existing spawns
        this.updateActiveSpawns(deltaTime);
    }

    updateDarlingType(darlingType, config, deltaTime) {
        const lastSpawnTime = this.lastSpawnTimes.get(darlingType) || 0;
        const currentTime = Date.now();

        // Calculate spawn interval with random variation
        const randomSpacing = Math.floor(
            Math.random() *
            (config.randomSpacingRange.max - config.randomSpacingRange.min) +
            config.randomSpacingRange.min
        );

        const spawnInterval = (config.baseSpacing + randomSpacing) * 1000;

        if (currentTime - lastSpawnTime > spawnInterval) {
            this.spawn(darlingType, config);
            this.lastSpawnTimes.set(darlingType, currentTime);
        }
    }

    spawn(darlingType, config) {
        const spawnPosition = { ...config.laneRules.spawnPosition };

        // Create new spawn based on darling type
        const newSpawn = {
            type: darlingType,
            position: spawnPosition,
            direction: config.laneRules.direction,
            lane: config.laneRules.allowedLanes[
                Math.floor(Math.random() * config.laneRules.allowedLanes.length)
            ],
        };

        // Add to active spawns
        if (!this.activeSpawns.has(darlingType)) {
            this.activeSpawns.set(darlingType, []);
        }
        this.activeSpawns.get(darlingType).push(newSpawn);

        return newSpawn;
    }

    updateActiveSpawns(deltaTime) {
        for (const [darlingType, spawns] of this.activeSpawns) {
            const config = this.spawnConfigs.get(darlingType);

            // Update positions
            // TODO: figure out speed here
            spawns.forEach(spawn => {
                spawn.position.y += spawn.direction;
            });

            // Remove spawns that are off screen
            this.activeSpawns.set(
                darlingType,
                spawns.filter(spawn =>
                    spawn.position.y > -20 &&
                    spawn.position.y < CONFIG.GAME.HEIGHT + 20
                )
            );
        }
    }

    getActiveSpawns() {
        return this.activeSpawns;
    }

    clearSpawns() {
        this.activeSpawns.clear();
        this.lastSpawnTimes.clear();
    }
}

// Initialize and start the game
window.addEventListener('load', () => new BicycleGame());
