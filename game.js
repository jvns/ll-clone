// Game configuration
const GAME_WIDTH = 800;
const GRID_SIZE = 24;
const GAME_HEIGHT = GRID_SIZE * 30;
const GAME_SPEED = 16; // ms per frame

class BicycleGame {
    constructor() {
        this.app = new PIXI.Application();
        this.gameState = {
            position: { x: 5, y: 15 },
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

        // Create game container
        this.gameContainer = new PIXI.Container();
        this.app.stage.addChild(this.gameContainer);

        // Load font
        await this.loadFont();

        // Setup game elements
        this.setupGame();

        // Start game loop
        this.app.ticker.add(() => this.gameLoop());
    }

    async loadFont() {
        // Load Inconsolata font
        const webFontLoader = {
            google: {
                families: ['Inconsolata:400']
            }
        };

        return new Promise((resolve) => {
            WebFont.load({
                ...webFontLoader,
                active: resolve
            });
        });
    }

    setupTracks() {
        // Create road lines
        this.roadLines = [];
        const roadLinePositions = [GRID_SIZE * 8, GRID_SIZE * 9];

        for (let x of roadLinePositions) {
            const roadLine = new PIXI.Text('‖\n'.repeat(30), {
                fontFamily: 'Inconsolata',
                fontSize: GRID_SIZE,
                fill: '#fbfb00',
                align: 'center',
                lineHeight: 16  // Reduce this number to bring lines closer together
            });
            roadLine.position.set(x, 0);
            this.tracksContainer.addChild(roadLine);
            this.roadLines.push(roadLine);
        }

        // Create TTC tracks (double lines with ties)
        this.ttcTracks = [];
        const ttcTrackPositions = [GRID_SIZE * 11, GRID_SIZE * 14];

        for (let x of ttcTrackPositions) {
            const track = new PIXI.Text('‖\n'.repeat(30), {
                fontFamily: 'Inconsolata',
                fontSize: GRID_SIZE,
                fill: '#444',
                align: 'center',
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
            fontFamily: 'Inconsolata',
            fontSize: 24,
            fill: '#00FF00',
            align: 'left'
        });
        this.gridContainer.addChild(this.bicycle);

        this.tracksContainer = new PIXI.Container();
        this.gameContainer.addChild(this.tracksContainer);
        this.setupTracks();

        // Create score display
        this.scoreText = new PIXI.Text('Score: 0', {
            fontFamily: 'Inconsolata',
            fontSize: 24,
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
                    if (this.gameState.position.x < GRID_SIZE - 4) {
                        this.gameState.position.x++;
                    }
                    break;
            }
        });
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

        // Move bicycle up (scrolling effect)
        this.gameState.position.y -= 0.1;
        if (this.gameState.position.y < 5) {
            this.gameState.position.y = 15;
            this.gameState.score += 10;
            this.scoreText.text = `Score: ${this.gameState.score}`;
        }
    }

    gameLoop() {
        this.updateBicycle();
    }
}

// Initialize and start the game
const game = new BicycleGame();
window.addEventListener('load', () => game.init());
