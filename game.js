// Game configuration
const GRID_SIZE = 10;
const GAME_HEIGHT = '300';
const GAME_WIDTH = GRID_SIZE * 20;
const GAME_SPEED = 3; // frames per second
const FONT = "Courier New, monospace";

class BicycleGame {
    constructor() {
        this.app = new PIXI.Application({});
        this.gameState = {
            position: { x: 5, y: 8 },
            frame: 0,
            score: 0,
            obstacles: []
        };
    }

    async init() {
        // Initialize application
        await this.app.init({
            width: GAME_WIDTH,
            height: GAME_HEIGHT,
            backgroundColor: '#000000',
            resolution: window.devicePixelRatio || 1,
        });
        document.body.appendChild(this.app.canvas);
        this.spawnManager = new SpawnManager();

        // Create game container
        this.gameContainer = new PIXI.Container();
        this.app.stage.addChild(this.gameContainer);

        // Setup game elements
        this.setupGame();

        // Start game loop
        // this.app.ticker.add(() => this.gameLoop());
        this.run();
    }

    setupTracks() {
        // Create road lines
        this.roadLines = [];
        const roadLinePositions = [GRID_SIZE * 8, GRID_SIZE * 9];

        for (let x of roadLinePositions) {
            const roadLine = new PIXI.Text('‖\n'.repeat(30), {
                fontFamily: FONT,
                fontSize: GRID_SIZE,
                fill: '#fbfb00',
                align: 'left',
                lineHeight: 16  // Reduce this number to bring lines closer together
            });
            roadLine.position.set(x, 0);
            this.tracksContainer.addChild(roadLine);
            this.roadLines.push(roadLine);
        }

        // Create TTC tracks (double lines with ties)
        this.ttcTracks = [];
        const ttcTrackPositions = [(CONFIG.LANES.TRACKS + 1)  * GRID_SIZE, (CONFIG.LANES.TRACKS + 3) * GRID_SIZE];

        for (let x of ttcTrackPositions) {
            const track = new PIXI.Text('‖\n'.repeat(30), {
                fontFamily: FONT,
                fontSize: GRID_SIZE,
                fill: '#444',
                align: 'left',
                lineHeight: 16
            });
            track.position.set(x, 0);
            this.tracksContainer.addChild(track);
            this.ttcTracks.push(track);
        }
    }

    setupGame() {
        // Create game grid
        this.gridContainer = new PIXI.Container();
        this.gameContainer.addChild(this.gridContainer);

        // Create bicycle
        this.bicycle = new PIXI.Text(DARLINGS.BIKE.art.join("\n"), {
            fontFamily: FONT,
            fontSize: GRID_SIZE,
            fill: '#00FF00',
            align: 'left'
        });
        this.gridContainer.addChild(this.bicycle);

        this.tracksContainer = new PIXI.Container();
        this.gameContainer.addChild(this.tracksContainer);
        this.setupTracks();

        this.spawnContainer = new PIXI.Container();
        this.gameContainer.addChild(this.spawnContainer);

        // Create score display
        this.scoreText = new PIXI.Text('Score: 0', {
            fontFamily: FONT,
            fontSize: GRID_SIZE,
            fill: '#00FF00',
            align: 'left'
        });
        this.scoreText.position.set(10, 10);
        this.gameContainer.addChild(this.scoreText);

        // Setup keyboard controls
        this.setupControls();
    }

    setupControls() {
        window.addEventListener('keydown', (e) => {
            switch(e.key) {
                case 'ArrowLeft':
                    if (this.gameState.position.x > 0) {
                        this.gameState.position.x--;
                    }
                    break;
                case 'ArrowRight':
                    if (this.gameState.position.x < (GAME_WIDTH / GRID_SIZE) - 1) {
                        this.gameState.position.x++;
                    }
                    break;
            }
        });
    }
    renderSpawns() {
        // Clear previous spawns
        while(this.spawnContainer.children[0]) {
            this.spawnContainer.removeChild(this.spawnContainer.children[0]);
        }

        // Render new spawns
        const activeSpawns = this.spawnManager.getActiveSpawns();
        for (const [darlingType, spawns] of activeSpawns) {
            spawns.forEach(spawn => {
                const colours = COLOURS['VEHICLES'];
                const colour = colours[0];

                let art;
                if (darlingType === DarlingType.TTC) {
                    art = DARLINGS.TTC.art;
                } else if (darlingType === DarlingType.TTC_LANE_DEATHMACHINE) {
                    art = DARLINGS.MOVINGDEATHMACHINE.art;
                } else if (darlingType === DarlingType.ONCOMING_DEATHMACHINE) {
                    art = DARLINGS.ONCOMINGDEATHMACHINE.art;
                } else if (darlingType === DarlingType.PARKED_DEATHMACHINE) {
                    art = DARLINGS.DEATHMACHINE.art;
                } else if (darlingType === DarlingType.WANDERER) {
                    art = DARLINGS.WANDERER.UP.art;
                } else if (darlingType === DarlingType.BUILDING) {
                    art = TORONTO_BUILDINGS[0].art;
                }

                const spawnText = new PIXI.Text({
                    text: art.join("\n"),
                    style: {
                        fontFamily: FONT,
                        fontSize: GRID_SIZE,
                        fill: colour,
                        align: 'left'
                    }
                });
                spawnText.position.set(
                    spawn.position.x * GRID_SIZE,
                    spawn.position.y * GRID_SIZE
                );
                this.spawnContainer.addChild(spawnText);
            });
        }
    }

    updateBicycle() {
        // Animate bicycle
        //this.gameState.frame = (this.gameState.frame + 1) % BICYCLE_FRAMES.length;
        //this.bicycle.text = BICYCLE_FRAMES[this.gameState.frame];

        // Update position
        this.bicycle.position.set(
            this.gameState.position.x * GRID_SIZE,
            this.gameState.position.y * GRID_SIZE
        );

        this.gameState.score += 1;
        this.scoreText.text = `Score: ${this.gameState.score}`;
    }

    run() {
        const frameTime = 1000 / GAME_SPEED;
        let lastTime = 0;
        const loop = (currentTime) => {
            requestAnimationFrame(loop);

            const deltaTime = currentTime - lastTime;
            if (deltaTime >= frameTime) {
                lastTime = currentTime;
                this.app.ticker.update(currentTime);
                this.gameLoop(deltaTime / 1000); // Convert to seconds
            }
        };
        requestAnimationFrame(loop);
    }

    gameLoop(deltaTime) {
        this.updateBicycle();

        this.spawnManager.update(deltaTime);
        this.renderSpawns();
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
                spawn.position.y += spawn.direction * deltaTime * 3;
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
const game = new BicycleGame();
window.addEventListener('load', () => game.init());
