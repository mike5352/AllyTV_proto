/**
 * Game 12: 접시 위에 맛있는 빵 4개를 찾아라! (Find the plate with 4 items)
 * - Background: Ally2_bg.png
 * - Assets: cake 1.png ~ cake 9.png
 * - Logic: 4 plates. One has 4 items (Target). Others have 1-3 items.
 * - Interaction: Touch the plate with 4 items to win. Else fail.
 */
class Game12Bread {
    constructor() {
        this.ctx = null;
        this.canvas = null;
        this.isActive = false;
        this.gameEnded = false;


        // Plate positions (Percentage-based for 4 plates in a row at bottom)
        // Based on the visual layout of Ally2_bg.png
        this.platePositions = [
            { id: 0, xPercent: 0.14, yPercent: 0.85, radius: 120 }, // Left (Moved left)
            { id: 1, xPercent: 0.38, yPercent: 0.85, radius: 120 }, // Center-Left
            { id: 2, xPercent: 0.62, yPercent: 0.85, radius: 120 }, // Center-Right
            { id: 3, xPercent: 0.86, yPercent: 0.85, radius: 120 }  // Right (Moved right)
        ];

        this.plates = []; // Will hold { x, y, count, cakeImages: [] }

        // Image assets
        this.images = {
            background: null,
            cakes: [] // Array of 9 cake images
        };
        this.imagesLoaded = false;
    }

    loadImages() {
        return new Promise((resolve) => {
            let loaded = 0;
            // Background
            const bgImg = new Image();
            bgImg.src = './assets/Ally2_cake/Ally2_bg.png';
            bgImg.onload = () => {
                this.images.background = bgImg;
                checkLoad();
            };
            bgImg.onerror = () => {
                console.error("Failed to load Ally2_bg.png");
                checkLoad(); // Proceed even if fail
            };

            // Cake images (1 to 9)
            // Ensure array index 0-8 matches cake 1-9
            for (let i = 1; i <= 9; i++) {
                const img = new Image();
                img.src = `./assets/Ally2_cake/Ally2_resource/cake ${i}.png`;
                img.onload = () => {
                    this.images.cakes[i - 1] = img;
                    checkLoad();
                };
                img.onerror = () => {
                    console.error(`Failed to load cake ${i}.png`);
                    checkLoad();
                };
            }

            const total = 1 + 9; // BG + 9 Cakes

            const checkLoad = () => {
                loaded++;
                if (loaded >= total) {
                    this.imagesLoaded = true;
                    resolve();
                }
            };
        });
    }

    init(ctx, canvas, container) {
        this.ctx = ctx;
        this.canvas = canvas;
        if (!this.imagesLoaded) {
            this.loadImages();
        }
    }

    async start() {
        this.isActive = true;
        this.gameEnded = false;

        // Wait for images to load if not already loaded
        if (!this.imagesLoaded) {
            await this.loadImages();
        }

        this.generateLevel();
        this.drawScene();

        // Start animation loop (mostly for maintaining render if needed, or static draw)
        // Static draw is sufficient if no animations, but we might want clear/redraw on resize
        this.animate();
    }

    generateLevel() {
        // 1. Assign counts to plates
        // One plate must have 4. Others have 1-3.
        const counts = [4];
        for (let i = 0; i < 3; i++) {
            // Random 1 to 3
            counts.push(Math.floor(Math.random() * 3) + 1);
        }

        // Shuffle counts
        this.shuffleArray(counts);

        // 2. Setup plates
        this.plates = this.platePositions.map((pos, index) => {
            const count = counts[index];
            const cakeImages = [];

            // Select 'count' random images from the 9 available
            const selectedCakes = [];
            for (let c = 0; c < count; c++) {
                const randIndex = Math.floor(Math.random() * 9);
                if (this.images.cakes[randIndex]) {
                    selectedCakes.push(this.images.cakes[randIndex]);
                } else {
                    console.warn(`Ally2 - Cake image at index ${randIndex} not loaded`);
                }
            }

            // Horizontal & Vertical alignment based on count
            // Define positions (x, y) for each cake
            let positions = [];

            switch (count) {
                case 1:
                    // 1 Row: 1 Center
                    positions = [{ x: 0, y: 0 }];
                    break;
                case 2:
                    // 1 Row: 2 Items
                    positions = [{ x: -25, y: 0 }, { x: 25, y: 0 }];
                    break;
                case 3:
                    // 2 Rows: 1 Top, 2 Bottom
                    // Draw order: Top first (behind), then Bottom
                    positions = [
                        { x: 0, y: -45 },  // Top Row (Center)
                        { x: -25, y: 10 }, // Bottom Row (Left)
                        { x: 25, y: 10 }   // Bottom Row (Right)
                    ];
                    break;
                case 4:
                    // 2 Rows: 2 Top, 2 Bottom
                    positions = [
                        { x: -25, y: -45 }, // Top Row (Left)
                        { x: 25, y: -45 },  // Top Row (Right)
                        { x: -25, y: 10 },  // Bottom Row (Left)
                        { x: 25, y: 10 }    // Bottom Row (Right)
                    ];
                    break;
                default:
                    positions = [{ x: 0, y: 0 }];
            }

            // Create cake items with calculated positions
            selectedCakes.forEach((img, cakeIndex) => {
                const pos = positions[cakeIndex] || { x: 0, y: 0 };
                cakeImages.push({
                    img: img,
                    ox: pos.x,
                    oy: pos.y
                });
            });

            return {
                ...pos,
                count: count,
                items: cakeImages,
                waddleTimer: 0 // For animation
            };
        });
    }

    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    animate() {
        if (!this.isActive) return;

        // Update animation logic
        if (this.plates) {
            this.plates.forEach(plate => {
                if (plate.waddleTimer > 0) {
                    plate.waddleTimer--;
                }
            });
        }

        this.drawScene();
        requestAnimationFrame(() => this.animate());
    }

    drawScene() {
        if (!this.ctx) return;
        const width = this.canvas.width;
        const height = this.canvas.height;
        const cx = width / 2;
        const cy = height / 2;

        this.ctx.clearRect(0, 0, width, height);

        // 1. Background
        if (this.images.background) {
            this.ctx.drawImage(this.images.background, 0, 0, width, height);
        } else {
            this.ctx.fillStyle = '#FFEBEE';
            this.ctx.fillRect(0, 0, width, height);
        }

        // 2. Plates & Cakes
        // Iterate plates
        this.plates.forEach((plate, plateIndex) => {
            // Plate center using percentage-based positioning
            const px = width * plate.xPercent;
            const py = height * plate.yPercent;

            // Debug: Draw hit area
            // this.ctx.beginPath();
            // this.ctx.arc(px, py, plate.radius, 0, Math.PI * 2);
            // this.ctx.strokeStyle = 'red';
            // this.ctx.stroke();

            // Draw items
            plate.items.forEach((item, itemIndex) => {
                const img = item.img;
                if (img && img.complete && img.naturalWidth > 0) {
                    // Calculate cake dimensions
                    const drawW = 75;
                    const ratio = img.height / img.width;
                    const drawH = drawW * ratio;

                    // Pivot point (Bottom Center of Cake)
                    // px, py is plate center. item.ox, item.oy are offsets.
                    const centerX = px + item.ox;
                    const bottomY = py + item.oy;

                    this.ctx.save();
                    this.ctx.translate(centerX, bottomY);

                    // Waddle animation
                    if (plate.waddleTimer > 0) {
                        // Quick back-and-forth rotation
                        const rotation = Math.sin(plate.waddleTimer * 0.5) * 0.15;
                        this.ctx.rotate(rotation);
                    }

                    // Draw image (bottom-center at 0,0)
                    this.ctx.drawImage(img, -drawW / 2, -drawH, drawW, drawH);
                    this.ctx.restore();

                } else {
                    // console.warn(`Ally2 - Plate ${plateIndex}, item ${itemIndex}: image not ready`, img);
                }
            });
        });
    }

    onButtonDown(x, y) {
        if (!this.isActive || this.gameEnded) return;

        // Check if touched a plate
        // x, y are relative to canvas 0,0
        const width = this.canvas.width;
        const height = this.canvas.height;

        for (const plate of this.plates) {
            const px = width * plate.xPercent;
            const py = height * plate.yPercent;

            // Distance check
            const dx = x - px;
            const dy = y - py;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist <= plate.radius) {
                // Touched this plate
                plate.waddleTimer = 40; // Trigger waddle animation (approx 0.6s)

                if (plate.count === 4) {
                    this.succeed();
                } else {
                    this.fail();
                }
                return; // Only handle one plate touch
            }
        }
    }

    onButtonUp() { }

    onTimeout() {
        if (!this.gameEnded) {
            this.fail();
        }
    }

    succeed() {
        if (this.gameEnded) return;
        this.gameEnded = true;
        // this.isActive = false; // Keep active for animation

        audioManager.playSFX('ding');
        audioManager.playSuccess();
        setTimeout(() => gameController.endGame(true), 1000);
    }

    fail() {
        if (this.gameEnded) return;
        this.gameEnded = true;
        // this.isActive = false; // Keep active for animation

        audioManager.playFail(); // Assuming this method (or 'wrong')
        setTimeout(() => gameController.endGame(false), 1000);
    }

    cleanup() {
        this.isActive = false;
        // Clean up logic
    }
}

// Instantiate and register
const game12Bread = new Game12Bread();
// Check if gameController exists (it might be loaded later)
if (typeof gameController !== 'undefined') {
    gameController.registerGame(12, game12Bread);
} else {
    // Wait for DOMContentLoaded or gameController to be ready
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => {
            if (typeof gameController !== 'undefined') {
                gameController.registerGame(12, game12Bread);
            }
        }, 100);
    });
}
