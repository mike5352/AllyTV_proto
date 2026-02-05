/**
 * Game 15: 새콤 달콤 포도를 채워보자! (Fill the Grapes)
 * - Base image: grape 0.png (Empty grape bunch with 10 white circles)
 * - Click anywhere to fill the next empty spot.
 * - Animation: interaction 5-1.png (Shake for 0.5s)
 * - Result: interaction 5-2.png (Fixed)
 * - Success: Fill all 10 spots within time limit.
 */
class Game15Grape {
    constructor() {
        this.ctx = null;
        this.canvas = null;
        this.isActive = false;
        this.gameEnded = false;
        this.animationId = null;

        this.grapeCount = 0;
        this.totalGrapes = 10;
        this.successState = false;

        // Active animations: { index, x, y, startTime }
        this.animations = [];
        // Filled spots: indices that are fully collected
        this.filledIndices = new Set();
        // Indices that are currently processing (animating)
        this.processingIndices = new Set();

        // Image assets
        this.images = {
            // Will become grape0, grape1... grape10, bgEnd, interaction1, interactionFail
        };
        this.imagesLoaded = false;

        // Coordinates for the 10 grape spots (Relative to center)
        // Adjust these to match the "grape 0.png" white circles
        // Assuming a standard 4-3-2-1 pyramid or similar cluster
        // Using approximate offsets based on visual estimation of a standard clipart
        this.grapePositions = [
            { x: -60, y: -80 }, { x: 0, y: -85 }, { x: 60, y: -80 }, { x: 30, y: -130 }, // Top/Upper
            { x: -90, y: -30 }, { x: -30, y: -30 }, { x: 30, y: -30 }, { x: 90, y: -30 }, // Middle
            { x: -45, y: 30 }, { x: 45, y: 30 } // Bottom
            // Note: These are placeholders. 
            // Without seeing the image, I'll arrange them in a generic bunch shape.
            // We'll fill them sequentially 0 to 9.
        ];

        // Let's refine the positions to better fit a "10 grape" bunch. 
        // Typically: 4 (top), 3, 2, 1 (bottom) = 10.
        // Let's invert y to match canvas (y down).
        // Row 1 (Top, y smallest): 4 grapes
        // Row 2: 3 grapes
        // Row 3: 2 grapes
        // Row 4 (Bottom): 1 grape

        // Coordinates provided by user
        // Coordinates provided by user
        this.grapePositions = [
            { x: -31, y: -77 },
            { x: 5, y: -25 },
            { x: 40, y: 36 },
            { x: -53, y: 0 },
            { x: -90, y: 129 },
            { x: 23, y: 89 },
            { x: -23, y: 108 },
            { x: -7, y: 43 },
            { x: 83, y: 79 },
            { x: -71, y: 63 }
        ];

        // Failure animation state
        this.failAnimX = -200;
        this.isFailing = false;

        // Debug
        this.lastDebugCoord = null;
    }

    loadImages() {
        return new Promise((resolve) => {
            let loaded = 0;
            const imageSources = {
                bgEnd: './assets/Ally5_grape/grape end.png',
                interaction1: './assets/Ally5_grape/Ally5_resource/interaction 5-1.png',
                interactionFail: './assets/Ally5_grape/Ally5_resource/interaction 5-6.png'
            };

            // Add grape backgrounds 00-10
            for (let i = 0; i <= 10; i++) {
                const num = i.toString().padStart(2, '0');
                imageSources[`grape${i}`] = `./assets/Ally5_grape/grape ${num}.png`;
            }

            const total = Object.keys(imageSources).length;

            Object.entries(imageSources).forEach(([key, src]) => {
                const img = new Image();
                img.onload = () => {
                    this.images[key] = img;
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
        if (!this.imagesLoaded) {
            this.loadImages();
        }
    }

    start() {
        this.isActive = true;
        this.gameEnded = false;
        this.grapeCount = 0;
        this.successState = false;
        this.successState = false;
        this.isFailing = false;
        this.failAnimX = -200;

        this.animate();
    }

    animate() {
        if (!this.isActive) return;

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.drawScene();

        // Failure animation logic
        if (this.isFailing) {
            this.failAnimX += 5; // Move right
            if (this.failAnimX > this.canvas.width + 100) {
                // Animation ended, trigger real fail end
                this.isActive = false;
                gameController.endGame(false);
            }
        }

        this.animationId = requestAnimationFrame(() => this.animate());
    }

    drawScene() {
        const cx = this.canvas.width / 2;
        const cy = this.canvas.height / 2;

        // 1. Determine Background
        let bgImage = this.images[`grape${this.grapeCount}`];
        if (this.successState && this.images.bgEnd) {
            bgImage = this.images.bgEnd;
        } else if (this.isFailing) {
            // Keep at current state or restart? "실패할 경우 interaction 5-6가 좌에서 우로 움직이게 해줘"
            // Usually we keep the background static or revert. Let's keep current state or grape0.
            // Assumption: Keep current state showing where they failed, or grape0.
            // Let's use current state.
        }

        if (bgImage) {
            this.ctx.drawImage(bgImage, 0, 0, this.canvas.width, this.canvas.height);
        } else {
            this.ctx.fillStyle = '#F3E5F5';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        }

        // 2. Draw Interaction 5-1 at specific coordinates
        // "사용자가 클릭할 떄마다 interaction 5-1가 아래 좌표에 뜨게 만들어줘"
        // Should we draw ALL previous ones or just the current/latest one as a feedback?
        // Usually if the background changes to "grape 01" (which presumably has the grape), we don't need to draw permanent grapes on top.
        // So interaction 5-1 acts likely as a "pop" effect or temporary overlay OR persistent if the BG logic is different.
        // Given specific coordinates, I will draw them for ALL filled steps to be safe, assuming the BG might not have them or they are decorations.
        if (this.images.interaction1 && !this.successState && this.grapeCount > 0) {
            // Draw only one interaction at the current position (latest filled spot)
            const index = this.grapeCount - 1;
            if (index < this.grapePositions.length) {
                const pos = this.grapePositions[index];

                const drawW = this.images.interaction1.width * 0.5;
                const drawH = this.images.interaction1.height * 0.5;

                this.ctx.drawImage(this.images.interaction1,
                    cx + pos.x - drawW / 2,
                    cy + pos.y - drawH / 2,
                    drawW, drawH
                );
            }
        }

        // 3. Draw Failure Animation
        if (this.isFailing && this.images.interactionFail) {
            this.ctx.drawImage(this.images.interactionFail, this.failAnimX, cy - 50);
        }


    }

    onButtonDown(x, y) {
        if (!this.isActive || this.gameEnded || this.isFailing) return;

        // Increment count
        if (this.grapeCount < this.totalGrapes) {
            this.grapeCount++;
            audioManager.playSFX('click');
        }

        // Check success
        if (this.grapeCount >= this.totalGrapes) {
            this.succeed();
        }
    }

    onButtonUp() { }

    onTimeout() {
        if (!this.gameEnded) {
            // If time runs out and count < 10, fail
            if (this.grapeCount < this.totalGrapes) {
                this.fail();
            } else {
                // Should have succeeded already, but just in case
                this.succeed();
            }
        }
    }

    succeed() {
        if (this.gameEnded) return;
        this.gameEnded = true;
        this.successState = true;

        audioManager.playSFX('ding');
        audioManager.playSuccess();

        // Wait 1s then end
        setTimeout(() => {
            this.isActive = false;
            gameController.endGame(true);
        }, 1000);
    }

    fail() {
        if (this.gameEnded) return;
        this.gameEnded = true; // Stop inputs
        this.isFailing = true; // Start fail animation
        this.failAnimX = -200; // Reset start position

        audioManager.playFail();
        // Animation loop handles the endGame call
    }

    cleanup() {
        this.isActive = false;
        if (this.animationId) cancelAnimationFrame(this.animationId);
    }
}

const game15Grape = new Game15Grape();
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        if (typeof gameController !== 'undefined') gameController.registerGame(15, game15Grape);
    }, 100);
});
