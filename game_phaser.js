// Game configuration
const FONT_SIZE = 14 * 3;
const GAME_HEIGHT = window.innerHeight * 2.5;
const GAME_SPEED = 4; // frames per second
const FONT = "Courier New, monospace";
const MOVEMENT_INTERVAL = 1000 / GAME_SPEED;
const GRID_SIZE = getCharWidth();
const GAME_WIDTH = GRID_SIZE * 42;

const grid = (x) => x * GRID_SIZE;

// get the width of a character in the given font
function getCharWidth() {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    context.font = `${FONT_SIZE}px ${FONT}`;
    const width = context.measureText('M').width;
    canvas.remove();
    return width;
}

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

class SpawnManager {
    static distance(obs1, obs2) {
        if (obs1.x >= obs2.x + obs2.width || obs1.x + obs1.width <= obs2.x) {
            return Infinity;
        }

        // Get vertical distance considering object heights
        // If obs1 is above obs2
        if (obs1.y + obs1.height <= obs2.y) {
            return obs2.y - (obs1.y + obs1.height);
        }
        // If obs2 is above obs1
        else if (obs2.y + obs2.height <= obs1.y) {
            return obs1.y - (obs2.y + obs2.height);
        }
        // If objects overlap vertically
        return 0;
    }

    static distanceToOthers(obj) {
        const obstacles = obj.scene.obstacles;
        let min = Infinity;
        for (const obs of obstacles.children.entries) {
            if (obs === obj) {
                continue;
            }
            const dist = SpawnManager.distance(obj, obs);
            if (dist < min) {
                min = dist;
            }
        }
        return min;
    }

    static trySpawning(spawn) {
        const dist = SpawnManager.distanceToOthers(spawn);
        if (dist < grid(spawn.minDistance + 1)) {
            spawn.destroy()
        }
    }
}

// Register all the objects

function registerObject(factory, obj) {
    factory.displayList.add(obj);
    factory.scene.obstacles.add(obj);
    return obj;
}

Phaser.GameObjects.GameObjectFactory.register('movingdeathmachine', function (y) {
    return registerObject(this, new MovingDeathMachine(this.scene, y));
});

Phaser.GameObjects.GameObjectFactory.register('wanderer', function (y) {
    return registerObject(this, new Wanderer(this.scene, y));
});

Phaser.GameObjects.GameObjectFactory.register('building', function (y) {
    return registerObject(this, new Building(this.scene, y));
});

Phaser.GameObjects.GameObjectFactory.register('parkeddeathmachine', function (y) {
    return registerObject(this, new ParkedDeathMachine(this.scene, y));
});

Phaser.GameObjects.GameObjectFactory.register('ttc', function (y) {
    return registerObject(this, new TTC(this.scene, y));
});

Phaser.GameObjects.GameObjectFactory.register('oncomingdeathmachine', function (y) {
    return registerObject(this, new OncomingDeathMachine(this.scene, y));
});

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
        this.bicycle = this.add.bicycle(grid(CONFIG.LANES.BIKE), grid(12));
        this.physics.world.enable(this.bicycle);
        this.bicycle.body.setSize(this.bicycle.width, this.bicycle.height);

        // Simplified obstacle group setup
        this.obstacles = this.physics.add.group();

        // Direct collision setup
        this.physics.add.collider(this.bicycle, this.obstacles, () => {
            if (!this.isGameOver) this.gameOver();
        });

        // UI elements
        this.scoreText = this.add.text(10, 10, 'Score: 0', {
            fontFamily: FONT,
            fontSize: FONT_SIZE,
            color: '#00FF00'
        });

        this.gameOverText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2,
            'GAME OVER\nPress SPACE to restart', {
                fontFamily: FONT,
                fontSize: FONT_SIZE * 2,
                color: '#FF0000',
                align: 'center'
            }
        ).setOrigin(0.5).setVisible(false);

        this.moveTimer = this.time.addEvent({
            delay: MOVEMENT_INTERVAL,
            callback: this.moveObstacles,
            callbackScope: this,
            loop: true
        });

        // Controls
        this.spaceKey = this.input.keyboard.addKey('SPACE');

        this.setupTracks();
        this.createInitialSpawns()

        // Game loop
        this.time.addEvent({
            delay: 1000 / GAME_SPEED,
            callback: this.gameLoop,
            callbackScope: this,
            loop: true
        });
    }

    createInitialSpawns() {
        this.add.parkeddeathmachine(grid(0))
        this.add.parkeddeathmachine(grid(12))
        this.add.parkeddeathmachine(grid(22))
        this.add.parkeddeathmachine(grid(32))
        this.add.parkeddeathmachine(grid(48))

        this.add.ttc(grid(9))

        const b1 = this.add.building(grid(0))
        const b2 = this.add.building(grid(2) + b1.y + b1.height)
        const b3 = this.add.building(grid(2) + b2.y + b2.height)
        const b4 = this.add.building(grid(2) + b3.y + b3.height)
        const b5 = this.add.building(grid(2) + b4.y + b4.height)

        this.add.oncomingdeathmachine(grid(2))
        this.add.oncomingdeathmachine(grid(12))
        this.add.oncomingdeathmachine(grid(24))
    }

    moveObstacles() {
        if (this.isGameOver) return;

        this.obstacles.children.each(obstacle => {
            obstacle.move();
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
        this.createSpawns();
        this.scoreText.setText(`Score: ${this.score}`);
    }

    createSpawns() {
        if (Math.random() < 0.4) {
            SpawnManager.trySpawning(this.add.ttc(GAME_HEIGHT))
        } else {
            SpawnManager.trySpawning(this.add.movingdeathmachine(GAME_HEIGHT))
        }
        SpawnManager.trySpawning(this.add.oncomingdeathmachine(grid(-5)))
        SpawnManager.trySpawning(this.add.wanderer(grid(-1)));
        SpawnManager.trySpawning(this.add.parkeddeathmachine(grid(-8)));
        SpawnManager.trySpawning(this.add.building(grid(-12)))
    }

    setupTracks() {
        // Create road lines
        this.tracksContainer = this.add.container();
        const roadLinePositions = [grid(CONFIG.LANES.DIVIDER), grid(CONFIG.LANES.DIVIDER + 1)];
        roadLinePositions.forEach(x => {
            const roadLine = this.add.text(x, 0, '‖\n'.repeat(60), artConfig('#fbfb00'));
            this.tracksContainer.add(roadLine);
        });

        // Create TTC tracks
        const ttcTrackPositions = [
            grid(CONFIG.LANES.TRACKS + 1),
            grid(CONFIG.LANES.TRACKS + 5),
        ];
        ttcTrackPositions.forEach(x => {
            const track = this.add.text(x, 0, '‖\n'.repeat(60), artConfig("#444"));
            this.tracksContainer.add(track);
        });
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
        this.bicycle.setPosition(grid(CONFIG.LANES.BIKE), grid(12));
        this.scoreText.setText('Score: 0');
        this.obstacles.clear(true, true);
    }
}

// Initialize and start the game
window.addEventListener('load', () => new BicycleGame());
