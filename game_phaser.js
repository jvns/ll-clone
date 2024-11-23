// Game configuration
const GRID_SIZE = 18;
const GAME_HEIGHT = window.innerHeight;
const GAME_WIDTH = GRID_SIZE * 30;
const GAME_SPEED = 3; // frames per second
const FONT = "Courier New";
const MOVEMENT_INTERVAL = 1000 / GAME_SPEED;

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

function distance(obs1, obs2) {
    if (obs1.x > obs2.x + obs2.width || obs1.x + obs1.width < obs2.x) {
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

function distanceToOthers(obj) {
    const obstacles = obj.scene.obstacles;
    let min = Infinity;
    for (const obs of obstacles.children.entries) {
        if (obs === obj) {
            continue;
        }
        const dist = distance(obj, obs);
        if (dist < min) {
            min = dist;
        }
    }
    return min;
}

function registerObject(factory, obj) {
    factory.displayList.add(obj);
    factory.scene.obstacles.add(obj);
    return obj;
}

class MovingDeathMachine extends Phaser.GameObjects.Text {
    constructor(scene, y) {
        const x = (CONFIG.LANES.TRACKS + 1) * GRID_SIZE;
        const colour = randomColour(COLOURS['VEHICLES']);
        super(scene, x, y, '', artConfig(colour));
        setupArtObject(this, DARLINGS.MOVINGDEATHMACHINE.art);
        setupPhysics(scene, this);
        this.minDistance = Math.floor(Math.random() * 4);
    }


    move() {
        this.y -= 1.5 * GRID_SIZE;
        if (this.y < -1 * this.height) {
            this.destroy();
        }
    }
}

Phaser.GameObjects.GameObjectFactory.register('movingdeathmachine', function (y) {
    return registerObject(this, new MovingDeathMachine(this.scene, y));
});

class Wanderer extends Phaser.GameObjects.Text {
    constructor(scene, y) {
        const x = (CONFIG.LANES.SIDEWALK) * GRID_SIZE;
        const colour = 'white';
        super(scene, x, y, '', artConfig(colour));
        setupArtObject(this, DARLINGS.WANDERER.UP.art);
        setupPhysics(scene, this);
        this.minDistance = Math.floor(Math.random() * 1);
    }

    move() {
        this.y += 0.5 * GRID_SIZE;
        if (this.y > GAME_HEIGHT) {
            this.destroy();
        }
    }
}

Phaser.GameObjects.GameObjectFactory.register('wanderer', function (y) {
    return registerObject(this, new Wanderer(this.scene, y));
});




class ParkedDeathMachine extends Phaser.GameObjects.Text {
    constructor(scene, y) {
        const x = (CONFIG.LANES.PARKED) * GRID_SIZE;
        const colour = randomColour(COLOURS['VEHICLES']);
        super(scene, x, y, '', artConfig(colour));
        setupArtObject(this, DARLINGS.PARKED_DEATHMACHINE_STATES[0])
        setupPhysics(scene, this);
        this.state = 0;
        this.minDistance = Math.floor(Math.random() * 4);
    }

    move() {
        this.y -= GRID_SIZE;
        if (this.y < -1 * this.height) {
            this.destroy();
        }
    }
}

Phaser.GameObjects.GameObjectFactory.register('parkeddeathmachine', function (y) {
    return registerObject(this, new ParkedDeathMachine(this.scene, y));
});

class TTC extends Phaser.GameObjects.Text {
    constructor(scene, y) {
        const x = (CONFIG.LANES.TRACKS - 1) * GRID_SIZE;
        super(scene, x, y, '', artConfig('red'));
        setupArtObject(this, DARLINGS.TTC.art);
        setupPhysics(scene, this);
        this.minDistance = Math.floor(Math.random() * 4);
    }

    move() {
        this.y -= 1.5 * GRID_SIZE;
        if (this.y < -1 * this.height) {
            this.destroy();
        }
    }
}
Phaser.GameObjects.GameObjectFactory.register('ttc', function (y) {
    return registerObject(this, new TTC(this.scene, y));
});

function randomColour(list) {
    return list[Math.floor(Math.random() * list.length)];
}

class OncomingDeathMachine extends Phaser.GameObjects.Text {
    constructor (scene, y) {
        const x = (CONFIG.LANES.ONCOMING + 3) * GRID_SIZE;
        const colour = randomColour(COLOURS['VEHICLES']);
        super(scene, x, y, '', artConfig(colour));
        setupArtObject(this, DARLINGS.ONCOMINGDEATHMACHINE.art);
        setupPhysics(scene, this);
        this.minDistance = Math.floor(Math.random() * 3);
    }

    move() {
        this.y += GRID_SIZE;
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
        this.bicycle = this.add.bicycle(18 * GRID_SIZE, 12 * GRID_SIZE);
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

        this.moveTimer = this.time.addEvent({
            delay: MOVEMENT_INTERVAL,
            callback: this.moveObstacles,
            callbackScope: this,
            loop: true
        });

        // Controls
        this.spaceKey = this.input.keyboard.addKey('SPACE');

        this.setupTracks();

        // Game loop
        this.time.addEvent({
            delay: 1000 / GAME_SPEED,
            callback: this.gameLoop,
            callbackScope: this,
            loop: true
        });
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
        createSpawns(this);
        this.scoreText.setText(`Score: ${this.score}`);
    }

    setupTracks() {
        // Create road lines
        this.tracksContainer = this.add.container();
        const roadLinePositions = [(CONFIG.LANES.DIVIDER + 0.5) * GRID_SIZE, (CONFIG.LANES.DIVIDER + 1) * GRID_SIZE];
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
    }
}

function trySpawning(spawn) {
    if (distanceToOthers(spawn) < (spawn.minDistance + 1) * GRID_SIZE) {
        spawn.destroy()
    }
}

function createSpawns(scene) {
    if (Math.random() < 0.8) {
        trySpawning(scene.add.ttc(GAME_HEIGHT))
    } else {
        trySpawning(scene.add.movingdeathmachine(GAME_HEIGHT))
    }
    trySpawning(scene.add.parkeddeathmachine(GAME_HEIGHT))
    trySpawning(scene.add.oncomingdeathmachine(-GRID_SIZE * 5))
    trySpawning(scene.add.wanderer(-GRID_SIZE * 1))
}


// Initialize and start the game
window.addEventListener('load', () => new BicycleGame());
