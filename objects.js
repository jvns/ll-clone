function pickRandom(list) {
    return list[Math.floor(Math.random() * list.length)];
}

function artConfig(color) {
    return {
        fontFamily: FONT,
        fontSize: FONT_SIZE,
        color: color,
        lineSpacing: FONT_SIZE * 0.2,
    };
}

function setupPhysics(scene, textObject) {
    scene.physics.world.enable(textObject);
    textObject.body.setSize(textObject.width - grid(0.6), textObject.height);
    textObject.body.setOffset(grid(0.3), 0);
}

class MovingDeathMachine extends Phaser.GameObjects.Text {
    constructor(scene, y) {
        const x = grid(CONFIG.LANES.TRACKS + 1 );
        const colour = pickRandom(COLOURS['VEHICLES']);
        const art = DARLINGS.MOVINGDEATHMACHINE.art.join("\n");
        super(scene, x, y, art, artConfig(colour));
        setupPhysics(scene, this);
        this.minDistance = Math.floor(Math.random() * 4);
    }


    move() {
        this.y -= grid(2)
        if (this.y < -1 * this.height) {
            this.destroy();
        }
    }
}

class Wanderer extends Phaser.GameObjects.Text {
    constructor(scene, y) {
        const x = grid(CONFIG.LANES.SIDEWALK + .2);
        const colour = 'white';
        const art = DARLINGS.WANDERER.UP.art.join("\n");
        super(scene, x, y, art,grid(0.2),artConfig(colour));
        setupPhysics(scene, this);
        this.minDistance = Math.floor(Math.random() * 1);
    }

    move() {
        this.y += grid(0.5);
        if (this.y > GAME_HEIGHT) {
            this.destroy();
        }
    }
}

class Building extends Phaser.GameObjects.Text {
    constructor(scene, y) {
        const x = grid(CONFIG.LANES.BUILDINGS);
        const colour = pickRandom(COLOURS['BUILDINGS']);
        const art = pickRandom(TORONTO_BUILDINGS).art.join("\n");
        super(scene, x, y, art, artConfig(colour));
        setupPhysics(scene, this);
        this.minDistance = 0;
    }

    move() {
        this.y += grid(2);
        if (this.y > GAME_HEIGHT) {
            this.destroy();
        }
    }
}

class ParkedDeathMachine extends Phaser.GameObjects.Text {
    constructor(scene, y) {
        const x = grid(CONFIG.LANES.PARKED);
        const colour = pickRandom(COLOURS['VEHICLES']);
        const art = DARLINGS.PARKED_DEATHMACHINE_STATES[0].join("\n");
        super(scene, x, y, art, artConfig(colour));
        setupPhysics(scene, this);
        this.state = 0;
        this.minDistance = Math.floor(Math.random() * 4);
    }

    move() {
        this.y += grid(2);
        if (this.y > GAME_HEIGHT) {
            this.destroy();
        }
    }
}

class TTC extends Phaser.GameObjects.Text {
    constructor(scene, y) {
        const x = grid(CONFIG.LANES.TRACKS);
        const art = DARLINGS.TTC.art.join("\n");
        super(scene, x, y, art, artConfig('red'));
        setupPhysics(scene, this);
        this.minDistance = Math.floor(Math.random() * 4);
    }

    move() {
        this.y -= grid(2);
        if (this.y < -1 * this.height) {
            this.destroy();
        }
    }
}

class OncomingDeathMachine extends Phaser.GameObjects.Text {
    constructor (scene, y) {
        const x = grid(CONFIG.LANES.ONCOMING);
        const colour = pickRandom(COLOURS['VEHICLES']);
        const art = DARLINGS.ONCOMINGDEATHMACHINE.art.join("\n");
        super(scene, x, y, art, artConfig(colour));
        setupPhysics(scene, this);
        this.minDistance = Math.floor(Math.random() * 3);
    }

    move() {
        this.y += grid(2.5);
        if (this.y > GAME_HEIGHT) {
            this.destroy();
        }
    }
}

class Bicycle extends Phaser.GameObjects.Text {
    constructor (scene, x, y) {
        const art = DARLINGS.BIKE.art.join("\n");
        super(scene, x, y, art, artConfig('#00FF00'));
        this.leftMoveTimer = 0;
        this.rightMoveTimer = 0;
        this.cursors = scene.input.keyboard.createCursorKeys();
    }

    preUpdate (time, _delta) {
        if (time > this.leftMoveTimer) {
            this.leftMoveTimer = time + this.moveDelay;
            if (this.cursors.left.isDown && this.x > 0) {
                this.x -= grid(1);
            }
        }
        if (time > this.rightMoveTimer) {
            if (this.cursors.right.isDown && this.x < GAME_WIDTH - GRID_SIZE) {
                this.x += grid(1);
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
