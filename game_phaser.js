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
        // Simplified game state - only track what's needed
        this.score = 0;
        this.isGameOver = false;
        this.leftMoveTimer = 0;
        this.rightMoveTimer = 0;
        this.moveDelay = 200; // Delay between moves in milliseconds
    }

    create() {
        // Create bicycle and enable physics in one step
        this.bicycle = this.add.text(
            5 * GRID_SIZE,
            8 * GRID_SIZE,
            DARLINGS.BIKE.art.join("\n"),
            {
                fontFamily: FONT,
                fontSize: GRID_SIZE,
                color: '#00FF00'
            }
        );
        this.physics.world.enable(this.bicycle);
        this.bicycle.body.setSize(GRID_SIZE * 2, GRID_SIZE * 2.5);

        // Simplified obstacle group setup
        this.obstacles = this.physics.add.group();

        // Direct collision setup
        this.physics.add.collider(this.bicycle, this.obstacles, () => {
            if (!this.isGameOver) this.gameOver();
        });

        // UI elements
        this.scoreText = this.add.text(10, 10, 'Score: 0', {
            fontFamily: FONT,
            fontSize: GRID_SIZE,
            color: '#00FF00'
        });

        this.gameOverText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2,
            'GAME OVER\nPress SPACE to restart', {
                fontFamily: FONT,
                fontSize: GRID_SIZE * 2,
                color: '#FF0000',
                align: 'center'
            }
        ).setOrigin(0.5).setVisible(false);

        // Controls
        this.cursors = this.input.keyboard.createCursorKeys();
        this.spaceKey = this.input.keyboard.addKey('SPACE');

        // Spawn manager
        this.spawnManager = new SpawnManager(this);
        this.setupTracks();

        // Game loop
        this.time.addEvent({
            delay: 1000 / GAME_SPEED,
            callback: this.gameLoop,
            callbackScope: this,
            loop: true
        });
    }

    update(time, delta) {
        if (this.isGameOver) {
            if (Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
                this.restart();
            }
            return;
        }
        if (time > this.leftMoveTimer) {
            this.leftMoveTimer = time + this.moveDelay;
            if (this.cursors.left.isDown && this.bicycle.x > 0) {
                this.bicycle.x -= GRID_SIZE;
            }
        }
        if (time > this.rightMoveTimer) {
            if (this.cursors.right.isDown && this.bicycle.x < GAME_WIDTH - GRID_SIZE) {
                this.bicycle.x += GRID_SIZE;
                this.rightMoveTimer = time + this.moveDelay;
            }
        }

        if (this.cursors.left.isUp) {
            this.leftMoveTimer = 0;
        }
        if (this.cursors.right.isUp) {
            this.rightMoveTimer = 0;
        }
    }

    gameLoop() {
        if (this.isGameOver) return;

        this.score += 1;
        this.scoreText.setText(`Score: ${this.score}`);

        this.spawnManager.update();
        this.renderSpawns();
    }

    setupTracks() {
        // Create road lines
        this.tracksContainer = this.add.container();
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

    renderSpawns() {
        this.obstacles.clear(true, true);

        for (const [darlingType, spawns] of this.spawnManager.getActiveSpawns()) {
            if (darlingType === DarlingType.BUILDING) continue;

            spawns.forEach(spawn => {
                const art = this.getArtForDarling(darlingType);
                const obstacle = this.add.text(
                    spawn.position.x * GRID_SIZE,
                    spawn.position.y * GRID_SIZE,
                    art.join("\n"),
                    {
                        fontFamily: FONT,
                        fontSize: GRID_SIZE,
                        color: COLOURS['VEHICLES'][0]
                    }
                );

                this.physics.world.enable(obstacle);
                obstacle.body.setSize(
                    GRID_SIZE * (art[0].length - 2),
                    GRID_SIZE * (art.length - 1)
                );
                this.obstacles.add(obstacle);
            });
        }
    }

    getArtForDarling(type) {
        const artMap = {
            [DarlingType.TTC]: DARLINGS.TTC.art,
            [DarlingType.TTC_LANE_DEATHMACHINE]: DARLINGS.MOVINGDEATHMACHINE.art,
            [DarlingType.ONCOMING_DEATHMACHINE]: DARLINGS.ONCOMINGDEATHMACHINE.art,
            [DarlingType.PARKED_DEATHMACHINE]: DARLINGS.DEATHMACHINE.art,
            [DarlingType.WANDERER]: DARLINGS.WANDERER.UP.art
        };
        return artMap[type];
    }

    gameOver() {
        this.isGameOver = true;
        this.gameOverText.setVisible(true);
        this.bicycle.setTint(0xFF0000);
        this.bicycle.body.enable = false;
    }

    restart() {
        this.score = 0;
        this.isGameOver = false;
        this.gameOverText.setVisible(false);
        this.bicycle.setTint(0xFFFFFF);
        this.bicycle.body.enable = true;
        this.bicycle.setPosition(5 * GRID_SIZE, 8 * GRID_SIZE);
        this.scoreText.setText('Score: 0');
        this.obstacles.clear(true, true);
        this.spawnManager.clearSpawns();
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
