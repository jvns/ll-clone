// Game configuration
const GRID_SIZE = 18;
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
                mode: Phaser.Scale.FIT,
                autoCenter: Phaser.Scale.CENTER_BOTH,
                parent: 'game-container',
                width: GAME_WIDTH,
                height: GAME_HEIGHT
            }
        };
        super(config);
    }
}

function setupArtObject(textObject, art) {
    textObject.setText(art.join("\n"));
    textObject.setSize(art[0].length * GRID_SIZE * 0.6, art.length * GRID_SIZE * 0.9);
}

function artConfig(color) {
    return {
        fontFamily: FONT,
        fontSize: GRID_SIZE,
        color: color
    };
}

function setupPhysics(scene, textObject) {
    scene.physics.world.enable(textObject);
    textObject.body.setSize(textObject.width, textObject.height);
}


class TTC extends Phaser.GameObjects.Text {
    constructor(scene, y) {
        const x = (CONFIG.LANES.TRACKS + 1) * GRID_SIZE;
        super(scene, x, y, '', artConfig('red'));
        setupArtObject(this, DARLINGS.TTC.art);
        setupPhysics(scene, this);
        this.moveDelay = 300;
        this.nextMoveTime = 0;
    }

    preUpdate(time, _delta) {
        if (time > this.nextMoveTime) {
            this.y -= GRID_SIZE;
            this.nextMoveTime = time + this.moveDelay;
        }
        if (this.y < -1 * this.height) {
            this.destroy();
            console.log('destroyed');
        }
    }
}

function registerObject(factory, obj) {
    factory.displayList.add(obj);
    factory.updateList.add(obj);  // This line adds it to the update list
    factory.scene.obstacles.add(obj);
    return obj;
}

Phaser.GameObjects.GameObjectFactory.register('ttc', function (y) {
    return registerObject(this, new TTC(this.scene, y));
});


class OncomingDeathMachine extends Phaser.GameObjects.Text {
    constructor (scene, y) {
        const x = CONFIG.LANES.ONCOMING * GRID_SIZE;
        super(scene, x, y, '', artConfig('blue'));
        setupArtObject(this, DARLINGS.ONCOMINGDEATHMACHINE.art);
        setupPhysics(scene, this);
        this.moveDelay = 200;
        this.nextMoveTime = 0;
    }

    preUpdate (time, _delta) {
        if (time > this.nextMoveTime) {
            this.y += GRID_SIZE;
            this.nextMoveTime = time + this.moveDelay;
        }
        if (this.y > GAME_HEIGHT) {
            this.destroy();
        }
    }
}

Phaser.GameObjects.GameObjectFactory.register('oncomingdeathmachine', function (y) {
    return registerObject(this, new OncomingDeathMachine(this.scene, y));
});

class Bicycle extends Phaser.GameObjects.Text {
    constructor (scene, x, y) {
        super(scene, x, y, '', artConfig('#00FF00'));
        setupArtObject(this, DARLINGS.BIKE.art);
        this.leftMoveTimer = 0;
        this.rightMoveTimer = 0;
        this.cursors = scene.input.keyboard.createCursorKeys();
    }

    preUpdate (time, _delta) {
        if (time > this.leftMoveTimer) {
            this.leftMoveTimer = time + this.moveDelay;
            if (this.cursors.left.isDown && this.x > 0) {
                this.x -= GRID_SIZE;
            }
        }
        if (time > this.rightMoveTimer) {
            if (this.cursors.right.isDown && this.x < GAME_WIDTH - GRID_SIZE) {
                this.x += GRID_SIZE;
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
}

Phaser.GameObjects.GameObjectFactory.register('bicycle', function (x, y) {
    const obj = new Bicycle(this.scene, x, y);
    this.displayList.add(obj);
    this.updateList.add(obj);
    return obj;
});

class MainScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MainScene' });
        // Simplified game state - only track what's needed
        this.score = 0;
        this.isGameOver = false;
        this.moveDelay = 200; // Delay between moves in milliseconds
    }

    create() {
        // Create bicycle and enable physics for it
        this.bicycle = this.add.bicycle(5 * GRID_SIZE, 12 * GRID_SIZE);
        this.physics.world.enable(this.bicycle);
        this.bicycle.body.setSize(this.bicycle.width, this.bicycle.height);

        // Simplified obstacle group setup
        this.obstacles = this.physics.add.group();

        this.add.ttc(GAME_HEIGHT- GRID_SIZE* 10);
        this.add.oncomingdeathmachine(-10);

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
        this.spaceKey = this.input.keyboard.addKey('SPACE');

        // Spawn manager
        //this.spawnManager = new SpawnManager(this);
        this.setupTracks();

        // Game loop
        this.time.addEvent({
            delay: 1000 / GAME_SPEED,
            callback: this.gameLoop,
            callbackScope: this,
            loop: true
        });
    }

    update(time, _delta) {
        if (this.isGameOver) {
            if (Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
                this.restart();
            }
            return;
        }
    }

    gameLoop() {
        if (this.isGameOver) return;

        this.score += 1;
        this.scoreText.setText(`Score: ${this.score}`);

        //this.spawnManager.update(this.obstacles);
        //this.renderSpawns();
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
        // clear update list
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
        this.spawnConfigs = SPAWN_RULES;
    }

    update(obstacles) {
        // Check and spawn for each darling type
        for (const [darlingType, config] of this.spawnConfigs) {
            this.updateDarlingType(darlingType, config, obstacles);
        }

        // Update existing spawns
        this.updateActiveSpawns();
    }

    updateDarlingType(darlingType, config, obstacles) {
        const spawnY = config.laneRules.spawnPosition.y * GRID_SIZE;
        const spawnX = config.laneRules.spawnPosition.x * GRID_SIZE;

        // Check if we have enough space to spawn
        const canSpawn = this.hasEnoughSpace(
            spawnX,
            spawnY,
            config.baseSpacing * GRID_SIZE,
            config.laneRules.direction,
            darlingType, obstacles
        );

        if (canSpawn) {
            this.spawn(darlingType, config);
        }
    }

    hasEnoughSpace(spawnX, spawnY, minDistance, direction, darlingType, obstacles) {
        // iterate over obstacles
        for (const obstacle of obstacles.children.entries) {
            // Only check obstacles in the same lane (with some tolerance)
            const xDiff = Math.abs(obstacle.x - spawnX);
            if (xDiff > GRID_SIZE) continue;

            // Calculate distance based on direction of movement
            let distance;
            if (direction > 0) { // Moving down
                distance = obstacle.y - spawnY;

                // Don't spawn if there's an obstacle too close ahead
                if (distance > 0 && distance < minDistance) {
                    return false;
                }

                // Check for obstacles behind
                if (distance < 0 && Math.abs(distance) < (minDistance * 0.5)) {
                    return false;
                }
            } else { // Moving up
                const height = obstacle.body.height;
                distance = spawnY - obstacle.y - height;

                // Don't spawn if there's an obstacle too close ahead
                if (distance > 0 && distance < minDistance + obstacle.body.height) {
                    console.log("too close", distance, darlingType);
                    return false;
                }

                // Check for obstacles behind
                if (distance < 0 && Math.abs(distance) < (minDistance * 0.5)) {
                    return false;
                }
            }
        }

        // Add some randomness to prevent predictable spawning
        // console.log("spawn time", darlingType);
        return Math.random() < 0.7; // 40% chance to spawn when space is available
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

    updateActiveSpawns() {
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
