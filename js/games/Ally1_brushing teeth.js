/**
 * Game 11: 양치질 (Brushing Teeth)
 * - Show interaction 1-1.png at sink area on right side with angle
 * - After 1st touch: Start alternating between 1-3 and 1-4
 * - On success: show Ally1_bg_results.png background only (no interaction image)
 * Success: Random 5~10 touches within time limit
 */
class Game11BrushingTeeth {
    constructor() {
        this.ctx = null;
        this.canvas = null;
        this.isActive = false;
        this.gameEnded = false;
        this.animationId = null;

        this.touchCount = 0;
        this.requiredTouches = 0;
        this.currentStage = 0; // 0: initial, 2: brushing (alternating 1-3/1-4), 4: success

        // Image assets
        this.images = {
            background: null,
            backgroundResults: null, // Success background
            interactions: new Array(4) // Fixed size for [1-1, 1-2, 1-3, 1-4]
        };
        this.imagesLoaded = false;
    }

    loadImages() {
        return new Promise((resolve) => {
            let loaded = 0;
            const imageSources = {
                background: './assets/Ally1_brushing teeth/Ally1_bg.png',
                backgroundResults: './assets/Ally1_brushing teeth/Ally1_bg_results.png',
                progress5: './assets/Ally1_brushing teeth/Ally1_progress 5.png',
                interaction1: './assets/Ally1_brushing teeth/Ally1_resource/interaction 1-1.png',
                interaction2: './assets/Ally1_brushing teeth/Ally1_resource/interaction 1-2.png',
                interaction3: './assets/Ally1_brushing teeth/Ally1_resource/interaction 1-3.png',
                interaction4: './assets/Ally1_brushing teeth/Ally1_resource/interaction 1-4.png'
            };

            const total = Object.keys(imageSources).length;

            Object.entries(imageSources).forEach(([key, src]) => {
                const img = new Image();
                img.onload = () => {
                    if (key === 'background') {
                        this.images.background = img;
                    } else if (key === 'backgroundResults') {
                        this.images.backgroundResults = img;
                    } else if (key === 'progress5') {
                        this.images.progress5 = img;
                    } else if (key.startsWith('interaction')) {
                        // Extract number and map to index (1 -> 0, 2 -> 1, etc.)
                        const index = parseInt(key.replace('interaction', '')) - 1;
                        if (index >= 0 && index < 4) {
                            this.images.interactions[index] = img;
                        }
                    }
                    loaded++;
                    if (loaded === total) {
                        this.imagesLoaded = true;
                        resolve();
                    }
                };
                img.onerror = () => {
                    console.error(`Failed to load image: ${src}`);
                    loaded++;
                    if (loaded === total) {
                        this.imagesLoaded = true;
                        resolve();
                    }
                };
                img.src = src;
            });
        });
    }

    init(ctx, canvas, container) {
        this.ctx = ctx;
        this.canvas = canvas;
        // Preload images
        if (!this.imagesLoaded) {
            this.loadImages();
        }
    }

    start() {
        this.isActive = true;
        this.gameEnded = false;
        this.touchCount = 0;
        this.currentStage = 0; // Start with stage 0 (interaction 1-1)

        // Random required touches between 5 and 10
        this.requiredTouches = Math.floor(Math.random() * 6) + 5;
        console.log('Game started - Required touches:', this.requiredTouches);

        this.animate();
    }

    animate() {
        if (!this.isActive) return;

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.drawScene();
        this.animationId = requestAnimationFrame(() => this.animate());
    }

    drawScene() {
        // Draw background image
        if (this.currentStage === 3 && this.images.progress5) {
            // Success step 1: show Ally1_progress 5
            this.ctx.drawImage(this.images.progress5, 0, 0, this.canvas.width, this.canvas.height);
        } else if (this.currentStage === 4 && this.images.backgroundResults) {
            // Success step 2: show Ally1_bg_results.png
            this.ctx.drawImage(this.images.backgroundResults, 0, 0, this.canvas.width, this.canvas.height);
        } else if (this.images.background) {
            // Normal (Stage 0, 2) or Fail (Stage 5): show Ally1_bg.png
            this.ctx.drawImage(this.images.background, 0, 0, this.canvas.width, this.canvas.height);
        } else {
            // Fallback background color
            this.ctx.fillStyle = '#E0F7FA';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        }

        // Draw toothbrush only in active stages
        if (this.currentStage !== 0 && this.currentStage !== 2) return;

        // Draw appropriate interaction image based on stage
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;

        if (this.currentStage === 0) {
            // Initial stage: interaction 1-1.png at sink area (right side, angled)
            // Ensure index 0 is used for 1-1
            const toothbrushX = centerX + 120; // Right side of sink
            const toothbrushY = centerY + 80; // At sink level
            this.drawInteractionImage(0, toothbrushX, toothbrushY, 125, 50, -25); // Smaller, angled
        } else if (this.currentStage === 2) {
            // Interaction: alternate between 1-3 and 1-4 based on touch count
            const teethY = centerY + 5; // Inside teeth area
            // 1st touch (count=1): should show 1-3 (index 2)
            // 2nd touch (count=2): should show 1-4 (index 3)
            // 3rd touch (count=3): should show 1-3 (index 2)
            const imageIndex = this.touchCount % 2 !== 0 ? 2 : 3;
            this.drawInteractionImage(imageIndex, centerX + 20, teethY, 150, 63, 0);
        } else if (this.currentStage === 4) {
            // Success: show only the results background (no interaction image)
        }
    }

    drawInteractionImage(index, x, y, width, height, angle = 0) {
        if (!this.images.interactions[index]) return;

        const image = this.images.interactions[index];
        this.ctx.save();
        this.ctx.translate(x, y);
        if (angle !== 0) {
            this.ctx.rotate((angle * Math.PI) / 180);
        }
        // Draw image centered
        this.ctx.drawImage(image, -width / 2, -height / 2, width, height);
        this.ctx.restore();
    }

    onButtonDown(x, y) {
        if (!this.isActive || this.gameEnded) return;

        // Increment touch count
        this.touchCount++;
        audioManager.playSFX('click');

        console.log('Touch:', this.touchCount, '/', this.requiredTouches, 'Stage:', this.currentStage);

        // Check success first
        if (this.touchCount >= this.requiredTouches) {
            // Trigger success sequence
            this.succeed();
            return;
        }

        // Update stage: Start brushing immediately (Stage 2) on first touch
        if (this.touchCount >= 1) {
            this.currentStage = 2; // Directly go to brushing stage
        }

        // Redraw immediately
        this.drawScene();
    }

    onButtonUp() { }

    onTimeout() {
        if (!this.gameEnded) this.fail();
    }

    succeed() {
        if (this.gameEnded) return;
        this.gameEnded = true;
        // Keep active for sequence drawing

        audioManager.playSFX('ding');
        audioManager.playSuccess();

        // 1. Show Ally1_progress 5
        this.currentStage = 3;
        this.drawScene();

        setTimeout(() => {
            // 2. Show Ally1_results (after 1 second)
            this.currentStage = 4;
            this.drawScene();

            // 3. End game shortly after results appear
            setTimeout(() => {
                this.isActive = false;
                gameController.endGame(true);
            }, 1000);
        }, 1000);
    }

    fail() {
        if (this.gameEnded) return;
        this.gameEnded = true;

        // Show clean background (Ally1_bg)
        this.currentStage = 5;
        this.drawScene();

        audioManager.playFail();
        setTimeout(() => {
            this.isActive = false;
            gameController.endGame(false);
        }, 500);
    }

    cleanup() {
        this.isActive = false;
        if (this.animationId) cancelAnimationFrame(this.animationId);
    }
}

const game11BrushingTeeth = new Game11BrushingTeeth();
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        if (typeof gameController !== 'undefined') gameController.registerGame(11, game11BrushingTeeth);
    }, 100);
});
