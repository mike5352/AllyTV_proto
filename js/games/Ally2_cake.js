/**
 * Game 12: 접시 위에 맛있는 빵 4개를 찾아라! (Find the plate with 4 items)
 * - Phone Background: Ally2_cake_mob_plate_bg.png
 * - TV Background: Ally2_cake_tv_plate_bg.png
 * - Assets: cake 1.png ~ cake 9.png
 * - Logic: 4 plates. One has 4 items (Target). Others have 1-3 items.
 * - Interaction: Touch the plate with 4 items to win. Else fail.
 * - TV: Separate view. Reacts to success.
 */
class Game12Bread {
    constructor() {
        this.ctx = null;
        this.canvas = null;
        this.tvCtx = null;
        this.tvCanvas = null;
        this.isActive = false;
        this.gameEnded = false;

        // Interaction Animation State
        this.showSuccessAnim = false;
        this.interactionStep = 0; // 0: None, 1: 2-1, 2: 2-2, 3: 2-3
        this.winningPlateItems = []; // To store the 4 cakes for TV display

        // Plate positions (Matching the 2x2 layout in Ally2_cake_mob_plate_bg.png)
        this.platePositions = [
            { id: 0, xPercent: 0.27, yPercent: 0.40, radius: 75 }, // Top Left
            { id: 1, xPercent: 0.74, yPercent: 0.40, radius: 75 }, // Top Right
            { id: 2, xPercent: 0.27, yPercent: 0.86, radius: 75 }, // Bottom Left
            { id: 3, xPercent: 0.74, yPercent: 0.86, radius: 75 }  // Bottom Right
        ];

        this.plates = []; // Will hold { x, y, count, cakeImages: [] }

        // Image assets
        this.images = {
            mobBackground: null,
            tvBackground: null,
            cakes: [], // Array of 9 cake images
            interactions: [] // 2-1, 2-2, 2-3
        };
        this.imagesLoaded = false;
    }

    loadImages() {
        return new Promise((resolve) => {
            let loaded = 0;
            const toLoad = [
                { name: 'mobBackground', src: 'assets/Ally2_cake/Ally2_resource/Ally2_cake_mob_plate_bg.png' },
                { name: 'tvBackground', src: 'assets/Ally2_cake/ally2_resourceTV/Ally2_cake_tv_plate_bg.png' },
                { name: 'int2_1', src: 'assets/Ally2_cake/ally2_cake_0205/Ally2_resource/interaction 2-1.png' },
                { name: 'int2_2', src: 'assets/Ally2_cake/ally2_cake_0205/Ally2_resource/interaction 2-2.png' },
                { name: 'int2_3', src: 'assets/Ally2_cake/ally2_cake_0205/Ally2_resource/interaction 2-3.png' }
            ];

            // Add cake images dynamically
            const cakeSources = [];
            for (let i = 1; i <= 9; i++) {
                // Try both possible paths just in case, but prefer the one I found
                // Found: Ally2_cake\Ally2_resource\cake 1.png AND Ally2_cake\ally2_cake_0205\Ally2_resource\cake 1.png
                // I'll use the Ally2_resource base one as per original code, assuming they are valid
                cakeSources.push({ index: i - 1, src: `assets/Ally2_cake/Ally2_resource/cake ${i}.png` });
            }

            const total = toLoad.length + cakeSources.length;

            const checkLoad = () => {
                loaded++;
                if (loaded >= total) {
                    this.imagesLoaded = true;
                    resolve();
                }
            };

            // Load named assets
            toLoad.forEach(item => {
                const img = new Image();
                img.src = item.src;
                img.onload = () => {
                    if (item.name.startsWith('int')) {
                        this.images.interactions.push({ name: item.name, img: img });
                        // Sort interactions to ensure 2-1, 2-2, 2-3 order
                        this.images.interactions.sort((a, b) => a.name.localeCompare(b.name));
                    } else {
                        this.images[item.name] = img;
                    }
                    checkLoad();
                };
                img.onerror = () => {
                    console.error(`Failed to load ${item.src}`);
                    checkLoad();
                };
            });

            // Load Cakes
            cakeSources.forEach(item => {
                const img = new Image();
                img.src = item.src;
                img.onload = () => {
                    this.images.cakes[item.index] = img;
                    checkLoad();
                };
                img.onerror = () => {
                    console.error(`Failed to load ${item.src}`);
                    checkLoad();
                };
            });
        });
    }

    init(ctx, canvas, container, tvCtx, tvCanvas) {
        this.ctx = ctx;
        this.canvas = canvas;
        this.tvCtx = tvCtx;
        this.tvCanvas = tvCanvas;

        if (!this.imagesLoaded) {
            this.loadImages();
        }
    }

    async start() {
        this.isActive = true;
        this.gameEnded = false;
        this.showSuccessAnim = false;
        this.interactionStep = 0;

        // Wait for images to load if not already loaded
        if (!this.imagesLoaded) {
            await this.loadImages();
        }

        this.generateLevel();
        this.drawScene();
        this.renderTV(); // Initial TV render

        this.animate();
    }

    generateLevel() {
        const counts = [4];
        for (let i = 0; i < 3; i++) {
            counts.push(Math.floor(Math.random() * 3) + 1);
        }
        this.shuffleArray(counts);

        this.plates = this.platePositions.map((pos, index) => {
            const count = counts[index];
            const cakeImages = [];
            const selectedCakes = [];

            for (let c = 0; c < count; c++) {
                const randIndex = Math.floor(Math.random() * 9);
                if (this.images.cakes[randIndex]) {
                    selectedCakes.push(this.images.cakes[randIndex]);
                }
            }

            // Define relative positions for cakes on the plate
            let positions = [];
            switch (count) {
                case 1: positions = [{ x: 0, y: 0 }]; break;
                case 2: positions = [{ x: -25, y: 0 }, { x: 25, y: 0 }]; break;
                case 3: positions = [{ x: 0, y: -45 }, { x: -25, y: 10 }, { x: 25, y: 10 }]; break;
                case 4: positions = [{ x: -25, y: -45 }, { x: 25, y: -45 }, { x: -25, y: 10 }, { x: 25, y: 10 }]; break;
                default: positions = [{ x: 0, y: 0 }];
            }

            selectedCakes.forEach((img, cakeIndex) => {
                const p = positions[cakeIndex] || { x: 0, y: 0 };
                cakeImages.push({ img: img, ox: p.x, oy: p.y });
            });

            return {
                ...pos,
                count: count,
                items: cakeImages,
                waddleTimer: 0
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

        // Update Waddle
        if (this.plates) {
            this.plates.forEach(plate => {
                if (plate.waddleTimer > 0) plate.waddleTimer--;
            });
        }

        // Draw Phone
        this.drawScene();

        // Draw TV (if success animation is active or just refresh background)
        this.renderTV();

        requestAnimationFrame(() => this.animate());
    }

    drawScene() {
        if (!this.ctx) return;
        const width = this.canvas.width;
        const height = this.canvas.height;

        this.ctx.clearRect(0, 0, width, height);

        // Phone Background
        if (this.images.mobBackground) {
            this.ctx.drawImage(this.images.mobBackground, 0, 0, width, height);
        } else {
            this.ctx.fillStyle = '#FFEBEE';
            this.ctx.fillRect(0, 0, width, height);
        }

        // Draw Plates' Cakes
        this.plates.forEach(plate => {
            const px = width * plate.xPercent;
            const py = height * plate.yPercent;

            plate.items.forEach(item => {
                const img = item.img;
                if (img) {
                    const drawW = 75;
                    const ratio = img.height / img.width;
                    const drawH = drawW * ratio;
                    const centerX = px + item.ox;
                    const bottomY = py + item.oy;

                    this.ctx.save();
                    this.ctx.translate(centerX, bottomY);
                    if (plate.waddleTimer > 0) {
                        const rotation = Math.sin(plate.waddleTimer * 0.5) * 0.15;
                        this.ctx.rotate(rotation);
                    }
                    this.ctx.drawImage(img, -drawW / 2, -drawH, drawW, drawH);
                    this.ctx.restore();
                }
            });
        });
    }

    renderTV() {
        if (!this.tvCtx || !this.images.tvBackground) return;
        const width = this.tvCanvas.width;
        const height = this.tvCanvas.height;

        this.tvCtx.clearRect(0, 0, width, height);
        this.tvCtx.drawImage(this.images.tvBackground, 0, 0, width, height);

        // Success Animation
        if (this.showSuccessAnim && this.winningPlateItems.length === 4) {
            const centerX = (width / 2) - 165; // Moved slightly more right
            const centerY = height * 0.77; // Position on the table plate

            // Layout for Center Cluster on TV
            // 2 Top, 2 Bottom
            const positions = [
                { x: -40, y: -60 }, { x: 40, y: -60 },
                { x: -40, y: 20 }, { x: 40, y: 20 }
            ];

            this.winningPlateItems.forEach((item, index) => {
                const img = item.img;
                if (img) {
                    const drawW = 100; // Larger on TV
                    const ratio = img.height / img.width;
                    const drawH = drawW * ratio;
                    const pos = positions[index] || { x: 0, y: 0 };

                    this.tvCtx.save();
                    this.tvCtx.translate(centerX + pos.x, centerY + pos.y);
                    // Add a little pop effect pulse if needed, or consistent
                    this.tvCtx.drawImage(img, -drawW / 2, -drawH, drawW, drawH);
                    this.tvCtx.restore();
                }
            });

            // Draw Interaction text/images over it
            if (this.interactionStep > 0) {
                // Interactions array: 0 -> 2-1, 1 -> 2-2, 2 -> 2-3
                // Draw based on step
                // step 1: show int 2-1
                // step 2: show int 2-2? Or accumulate? User: "interactions... appear in order"
                // Usually sequence means replace or add. I'll overlay them or sequence.
                // Assuming "Interaction 1, then 2, then 3".

                const currentIntIndex = this.interactionStep - 1;
                // Wait, if step 1 -> index 0.
                if (currentIntIndex < this.images.interactions.length) {
                    const intImg = this.images.interactions[currentIntIndex].img;
                    if (intImg) {
                        // Draw interaction centered
                        const intW = 300;
                        const intRatio = intImg.height / intImg.width;
                        const intH = intW * intRatio;
                        this.tvCtx.drawImage(intImg, centerX - intW / 2, centerY - 250, intW, intH);
                    }
                }
            }
        }
    }

    onButtonDown(x, y) {
        if (!this.isActive || this.gameEnded) return;

        const width = this.canvas.width;
        const height = this.canvas.height;

        for (const plate of this.plates) {
            const px = width * plate.xPercent;
            const py = height * plate.yPercent;
            const dx = x - px;
            const dy = y - py;

            if (dx * dx + dy * dy <= plate.radius * plate.radius) {
                plate.waddleTimer = 40;
                if (plate.count === 4) {
                    this.succeed(plate);
                } else {
                    this.fail();
                }
                return;
            }
        }
    }

    onButtonUp() { }

    onTimeout() {
        if (!this.gameEnded) this.fail();
    }

    succeed(winningPlate) {
        if (this.gameEnded) return;
        this.gameEnded = true;

        // Setup TV Animation
        this.showSuccessAnim = true;
        this.winningPlateItems = winningPlate.items;
        this.interactionStep = 0;

        audioManager.playSFX('ding');
        audioManager.playSuccess();

        // Animation Sequence
        // Step 1 (Interaction 2-1): 0ms
        // Step 2 (Interaction 2-2): 800ms
        // Step 3 (Interaction 2-3): 1600ms
        // End Game: 3000ms

        this.interactionStep = 1; // Show first immediately

        setTimeout(() => { this.interactionStep = 2; }, 1000);
        setTimeout(() => { this.interactionStep = 3; }, 2000);

        setTimeout(() => gameController.endGame(true), 3500);
    }

    fail() {
        if (this.gameEnded) return;
        this.gameEnded = true;
        audioManager.playFail();
        setTimeout(() => gameController.endGame(false), 1000);
    }

    cleanup() {
        this.isActive = false;
        this.showSuccessAnim = false;
        this.winningPlateItems = [];
    }
}

// Instantiate
const game12Bread = new Game12Bread();
if (typeof gameController !== 'undefined') {
    gameController.registerGame(12, game12Bread);
} else {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => {
            if (typeof gameController !== 'undefined') {
                gameController.registerGame(12, game12Bread);
            }
        }, 100);
    });
}
