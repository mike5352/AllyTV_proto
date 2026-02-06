/**
 * Main Game Controller for Antigravity Petit Game
 * Handles state machine, input, and screen transitions
 */

// Polyfill for roundRect (for older environments)
if (!CanvasRenderingContext2D.prototype.roundRect) {
    CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, radii) {
        if (typeof radii === 'undefined') radii = 0;
        let r = typeof radii === 'number' ? radii : (Array.isArray(radii) ? (radii[0] || 0) : 0);

        // Ensure radius doesn't exceed dimensions
        r = Math.min(r, w / 2, h / 2);

        this.moveTo(x + r, y);
        this.lineTo(x + w - r, y);
        this.quadraticCurveTo(x + w, y, x + w, y + r);
        this.lineTo(x + w, y + h - r);
        this.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        this.lineTo(x + r, y + h);
        this.quadraticCurveTo(x, y + h, x, y + h - r);
        this.lineTo(x, y + r);
        this.quadraticCurveTo(x, y, x + r, y);
    };
}

// Polyfill for ellipse (for older environments)
if (!CanvasRenderingContext2D.prototype.ellipse) {
    CanvasRenderingContext2D.prototype.ellipse = function (x, y, radiusX, radiusY, rotation, startAngle, endAngle, anticlockwise) {
        this.save();
        this.translate(x, y);
        this.rotate(rotation);
        this.scale(radiusX, radiusY);
        this.arc(0, 0, 1, startAngle, endAngle, anticlockwise);
        this.restore();
    }
}

class GameController {
    constructor() {
        this.currentState = 'HOME';
        this.currentGame = null;
        this.currentGameId = null;
        this.lastGameSuccess = null;
        this.isPaused = false;

        // Game instances
        this.games = {};

        // Input state
        this.isButtonPressed = false;
        this.buttonPressStart = 0;

        // DOM elements - Phone
        this.gameScreen = document.getElementById('game-screen');
        this.gameContainer = document.getElementById('game-container');
        this.phoneFrame = document.getElementById('phone-frame');
        this.gameCanvas = document.getElementById('game-canvas');
        this.homeScreen = document.getElementById('home-screen');
        this.resultScreen = document.getElementById('result-screen');

        // DOM elements - TV
        this.tvCanvas = document.getElementById('tv-canvas');
        this.tvHomeScreen = document.getElementById('tv-home-screen');
        this.tvGameScreen = document.getElementById('tv-game-screen');
        this.tvResultScreen = document.getElementById('tv-result-screen');
        this.tvTimerContainer = document.getElementById('tv-timer-container');
        this.tvResultText = document.getElementById('tv-result-text');
        this.tvResultText = document.getElementById('tv-result-text');
        this.tvResultIcon = document.getElementById('tv-result-icon');
        this.tvGameTitleBar = document.getElementById('tv-game-title-bar');
        this.tvGameTitleText = document.getElementById('tv-game-title-text');

        // Game Titles Configuration
        this.gameTitles = {
            11: { text: "치카치카 양치질 빨리하기!", bg: "assets/Ally title_font/Ally1_title_bg.png" },
            12: { text: "접시 위에 맛있는 빵 4개를 찾아라!", bg: "assets/Ally title_font/Ally2_title_bg.png" },
            13: { text: "머리가 긴~ 공주를 찾아서 구해줘!", bg: "assets/Ally title_font/Ally3_title_bg.png" },
            14: { text: "꽃병에 꽃 2송이를 찾아보자!", bg: "assets/Ally title_font/Ally4_title_bg.png" },
            15: { text: "새콤 달콤 포도를 채워보자!", bg: "assets/Ally title_font/Ally5_title_bg.png" }
        };

        // Canvas contexts
        this.ctx = this.gameCanvas.getContext('2d');
        this.tvCtx = this.tvCanvas.getContext('2d');

        this.init();
    }

    init() {
        // Setup canvas sizes
        this.resizeCanvases();
        window.addEventListener('resize', () => this.resizeCanvases());

        // Setup phone frame input (touch anywhere on phone frame = A button)
        this.setupInput();

        // Initialize game instances
        this.initGames();

        // Start animation loop for TV canvas mirroring
        this.startMirrorLoop();
    }

    resizeCanvases() {
        const phoneFrame = document.getElementById('phone-frame');
        const tvFrame = document.getElementById('tv-frame');

        if (phoneFrame) {
            this.gameCanvas.width = phoneFrame.clientWidth;
            this.gameCanvas.height = phoneFrame.clientHeight;
        }

        if (tvFrame) {
            this.tvCanvas.width = tvFrame.clientWidth;
            this.tvCanvas.height = tvFrame.clientHeight;
        }
    }

    setupInput() {
        // Phone frame touch/click acts as A button (only in game state)
        // Mouse events
        this.phoneFrame.addEventListener('mousedown', (e) => {
            if (this.currentState === 'GAME') {
                this.onButtonDown(e);
            }
        });
        this.phoneFrame.addEventListener('mouseup', (e) => {
            if (this.currentState === 'GAME') {
                this.onButtonUp(e);
            }
        });
        this.phoneFrame.addEventListener('mouseleave', (e) => {
            if (this.currentState === 'GAME' && this.isButtonPressed) {
                this.onButtonUp(e);
            }
        });

        // Touch events
        this.phoneFrame.addEventListener('touchstart', (e) => {
            if (this.currentState === 'GAME') {
                e.preventDefault();
                this.onButtonDown(e);
            }
        }, { passive: false });
        this.phoneFrame.addEventListener('touchend', (e) => {
            if (this.currentState === 'GAME') {
                e.preventDefault();
                this.onButtonUp(e);
            }
        }, { passive: false });
        this.phoneFrame.addEventListener('touchcancel', (e) => {
            if (this.currentState === 'GAME') {
                e.preventDefault();
                this.onButtonUp(e);
            }
        }, { passive: false });

        // Keyboard support (Space or A key)
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space' || e.code === 'KeyA') {
                e.preventDefault();
                if (!this.isButtonPressed && this.currentState === 'GAME') {
                    this.onButtonDown(e);
                }
            }
        });
        document.addEventListener('keyup', (e) => {
            if (e.code === 'Space' || e.code === 'KeyA') {
                e.preventDefault();
                if (this.currentState === 'GAME') {
                    this.onButtonUp(e);
                }
            }
        });
    }



    getEventPos(e) {
        const rect = this.gameCanvas.getBoundingClientRect();
        let clientX, clientY;

        if (e.changedTouches && e.changedTouches.length > 0) {
            clientX = e.changedTouches[0].clientX;
            clientY = e.changedTouches[0].clientY;
        } else {
            clientX = e.clientX;
            clientY = e.clientY;
        }

        // Return relative coordinates, or null if no coordinates (e.g. keyboard)
        if (typeof clientX === 'number') {
            return {
                x: (clientX - rect.left) * (this.gameCanvas.width / rect.width),
                y: (clientY - rect.top) * (this.gameCanvas.height / rect.height)
            };
        }
        return null;
    }

    onButtonDown(e) {
        if (this.isPaused) return; // Ignore input when paused

        this.isButtonPressed = true;
        this.buttonPressStart = Date.now();
        this.phoneFrame.classList.add('pressed');

        // Notify current game of button press
        if (this.currentGame && this.currentGame.onButtonDown) {
            const pos = this.getEventPos(e);
            this.currentGame.onButtonDown(pos ? pos.x : 0, pos ? pos.y : 0);
        }
    }

    onButtonUp(e) {
        if (!this.isButtonPressed) return;
        if (this.isPaused) return; // Ignore input when paused

        const holdDuration = Date.now() - this.buttonPressStart;
        this.isButtonPressed = false;
        this.phoneFrame.classList.remove('pressed');

        // Notify current game of button release
        if (this.currentGame && this.currentGame.onButtonUp) {
            const pos = this.getEventPos(e);
            this.currentGame.onButtonUp(holdDuration, pos ? pos.x : 0, pos ? pos.y : 0);
        }
    }

    initGames() {
        // Games will be instantiated when their scripts load
        this.games = {
            1: null,
            2: null,
            3: null,
            4: null,
            5: null,
            6: null,
            7: null,
            8: null,
            9: null,
            10: null
        };
    }

    registerGame(id, gameInstance) {
        this.games[id] = gameInstance;
    }

    /**
     * Start mirroring the game canvas to TV canvas
     */
    startMirrorLoop() {
        const mirror = () => {
            if (this.currentState === 'GAME') {
                if (this.currentGame && typeof this.currentGame.renderTV === 'function') {
                    this.currentGame.renderTV();
                } else {
                    // Mirror game canvas to TV canvas
                    this.tvCtx.clearRect(0, 0, this.tvCanvas.width, this.tvCanvas.height);
                    this.tvCtx.drawImage(
                        this.gameCanvas,
                        0, 0,
                        this.tvCanvas.width,
                        this.tvCanvas.height
                    );
                }
            }
            requestAnimationFrame(mirror);
        };
        requestAnimationFrame(mirror);
    }

    /**
     * Sync TV screens with phone screens
     */
    syncTVScreens() {
        // Hide all TV screens first
        this.tvHomeScreen.classList.remove('active');
        this.tvGameScreen.classList.remove('active');
        this.tvResultScreen.classList.remove('active');
        this.tvTimerContainer.style.display = 'none';

        switch (this.currentState) {
            case 'HOME':
                this.tvHomeScreen.classList.add('active');
                break;
            case 'GAME':
                this.tvGameScreen.classList.add('active');
                this.tvTimerContainer.style.display = 'block';
                break;
            case 'RESULT':
                this.tvResultScreen.classList.add('active');
                // Result content is handled by resultScreen.js for mirroring
                break;
        }
    }

    /**
     * Navigate to home screen
     */
    goHome() {
        this.currentState = 'HOME';
        this.currentGame = null;
        this.currentGameId = null;

        // Hide other screens
        this.gameScreen.classList.remove('active');
        resultScreen.hide();
        gameTimer.hide();

        // Clear canvas
        this.ctx.clearRect(0, 0, this.gameCanvas.width, this.gameCanvas.height);

        // Show home screen
        homeScreen.show();

        // Sync TV
        this.syncTVScreens();
    }

    /**
     * Start a specific game
     * @param {number} gameId - The game ID (1-5)
     */
    startGame(gameId) {
        try {
            this.currentState = 'GAME';
            this.currentGameId = gameId;

            // Hide home screen
            homeScreen.hide();
            resultScreen.hide();

            // Show game screen
            this.gameScreen.classList.add('active');

            // Clear canvas
            this.ctx.clearRect(0, 0, this.gameCanvas.width, this.gameCanvas.height);

            // Get game instance
            this.currentGame = this.games[gameId];

            // Sync TV
            this.syncTVScreens();

            // Reset pause state
            this.isPaused = false;

            // Set TV Title
            if (this.gameTitles[gameId] && this.tvGameTitleBar && this.tvGameTitleText) {
                this.tvGameTitleText.textContent = this.gameTitles[gameId].text;
                this.tvGameTitleBar.style.backgroundImage = `url('${this.gameTitles[gameId].bg}')`;
                this.tvGameTitleBar.style.display = 'flex';
                this.tvGameTitleBar.dataset.gameId = gameId;
            } else if (this.tvGameTitleBar) {
                this.tvGameTitleBar.style.display = 'none';
            }

            if (this.currentGame) {
                // Initialize and start the game
                // Pass TV context/canvas effectively if the game supports it
                this.currentGame.init(this.ctx, this.gameCanvas, this.gameContainer, this.tvCtx, this.tvCanvas);
                this.currentGame.start();

                // Start timer
                gameTimer.start(5, () => {
                    // Timer completed - check if game handles timeout
                    if (this.currentGame && this.currentGame.onTimeout) {
                        this.currentGame.onTimeout();
                    }
                });
            } else {
                console.error(`Game ${gameId} not found!`);
                this.endGame(false);
            }
        } catch (err) {
            console.error('Error starting game:', err);
            this.endGame(false);
        }
    }

    /**
     * End the current game
     * @param {boolean} success - Whether the player succeeded
     */
    endGame(success) {
        this.currentState = 'RESULT';
        this.lastGameSuccess = success;

        // Stop and hide timer
        gameTimer.hide();

        // Reset pause state
        this.isPaused = false;

        // Clean up current game
        if (this.currentGame && this.currentGame.cleanup) {
            this.currentGame.cleanup();
        }

        // Delay before showing result
        setTimeout(() => {
            // Hide game screen
            this.gameScreen.classList.remove('active');

            // Show result screen
            resultScreen.show(success, this.currentGameId);

            // Sync TV
            this.syncTVScreens();
        }, 500);
    }

    /**
     * Check if button is currently pressed
     * @returns {boolean}
     */
    isPressed() {
        return this.isButtonPressed;
    }

    /**
     * Get how long the button has been held
     * @returns {number} Duration in milliseconds
     */
    getHoldDuration() {
        if (!this.isButtonPressed) return 0;
        return Date.now() - this.buttonPressStart;
    }
}

// Global game controller instance
let gameController;

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    gameController = new GameController();
    homeScreen = new HomeScreen();
    resultScreen = new ResultScreen();

    // Register all games (they are already instantiated by their scripts)
    if (typeof game1Nose !== 'undefined') gameController.registerGame(1, game1Nose);
    if (typeof game2Candle !== 'undefined') gameController.registerGame(2, game2Candle);
    if (typeof game3Photo !== 'undefined') gameController.registerGame(3, game3Photo);
    if (typeof game4Dog !== 'undefined') gameController.registerGame(4, game4Dog);
    if (typeof game5Coin !== 'undefined') gameController.registerGame(5, game5Coin);
    if (typeof game6Swallow !== 'undefined') gameController.registerGame(6, game6Swallow);
    if (typeof game7Lightning !== 'undefined') gameController.registerGame(7, game7Lightning);
    if (typeof game8Hat !== 'undefined') gameController.registerGame(8, game8Hat);
    if (typeof game9Sneeze !== 'undefined') gameController.registerGame(9, game9Sneeze);
    if (typeof game10Door !== 'undefined') gameController.registerGame(10, game10Door);
    if (typeof game11BrushingTeeth !== 'undefined') gameController.registerGame(11, game11BrushingTeeth);
    if (typeof game12Bread !== 'undefined') gameController.registerGame(12, game12Bread);
    if (typeof game13Hair !== 'undefined') gameController.registerGame(13, game13Hair);
    if (typeof game14Apple !== 'undefined') gameController.registerGame(14, game14Apple);
    if (typeof game15Grape !== 'undefined') gameController.registerGame(15, game15Grape);

    // Show home screen
    homeScreen.show();

    // Initial TV sync
    gameController.syncTVScreens();
});

