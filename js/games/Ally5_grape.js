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
        this.tvCtx = null;
        this.tvCanvas = null;
        this.isActive = false;
        this.gameEnded = false;
        this.animationId = null;

        this.grapeCount = 0;
        this.totalGrapes = 10;
        this.successState = false;

        this.animations = [];
        this.filledIndices = new Set();
        this.processingIndices = new Set();

        this.images = {};
        this.showMobileResult = false;
        this.finalScore = 0;
        this.imagesLoaded = false;

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

        this.failAnimX = -200;
        this.isFailing = false;
        this.lastDebugCoord = null;
    }

    loadImages() {
        return new Promise((resolve) => {
            let loaded = 0;
            const imageSources = {
                mainBg: './assets/Ally5_grape/Ally5_grape_bg.png',
                bgEnd: './assets/Ally5_grape/grape end.png',
                interaction1: './assets/Ally5_grape/Ally5_resource/interaction 5-1.png',
                interactionFail: './assets/Ally5_grape/Ally5_resource/interaction 5-6.png'
            };

            for (let i = 0; i <= 10; i++) {
                const num = i.toString().padStart(2, '0');
                imageSources[`grape${i}`] = `./assets/Ally5_grape/grape ${num}.png`;
            }

            for (let i = 0; i <= 9; i++) {
                imageSources[`num${i}`] = `./assets/Ally5_grape/Ally_interaction/number_${i}.png`;
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

    init(ctx, canvas, container, tvCtx, tvCanvas) {
        this.ctx = ctx;
        this.canvas = canvas;
        this.tvCtx = tvCtx;
        this.tvCanvas = tvCanvas;
        if (!this.imagesLoaded) {
            this.loadImages();
        }
    }

    start() {
        this.isActive = true;
        this.gameEnded = false;
        this.grapeCount = 0;
        this.successState = false;
        this.isFailing = false;
        this.showMobileResult = false;
        this.failAnimX = -200;
        this.finalScore = 0;

        this.animate();
    }

    animate() {
        if (!this.isActive && !this.showMobileResult) return;

        // Draw Mobile
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        if (this.showMobileResult) {
            this.drawMobileResult(this.ctx, this.canvas);
        } else {
            this.drawScene(this.ctx, this.canvas);
        }

        // Draw TV
        if (this.tvCtx && this.tvCanvas) {
            this.tvCtx.clearRect(0, 0, this.tvCanvas.width, this.tvCanvas.height);
            this.tvCtx.save();
            this.tvCtx.scale(this.tvCanvas.width / this.canvas.width, this.tvCanvas.height / this.canvas.height);
            this.drawScene(this.tvCtx, this.canvas);
            this.tvCtx.restore();
        }

        // Failure animation logic
        if (this.isFailing) {
            this.failAnimX += 7; // Slightly faster movement for TV interaction
            if (this.failAnimX > this.canvas.width + 150) {
                this.isFailing = false;
                // TV animation done, but mobile result is already showing
            }
        }

        this.animationId = requestAnimationFrame(() => this.animate());
    }

    drawScene(ctx, canvas) {
        const cx = canvas.width / 2;
        const cy = canvas.height / 2;

        // 1. Determine Background
        let bgImage = this.images[`grape${this.grapeCount}`];
        if (this.successState && this.images.bgEnd) {
            bgImage = this.images.bgEnd;
        }

        if (bgImage) {
            ctx.drawImage(bgImage, 0, 0, canvas.width, canvas.height);
        } else {
            ctx.fillStyle = '#F3E5F5';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        // 2. Draw Interaction 5-1 at specific coordinates
        if (this.images.interaction1 && !this.successState && !this.gameEnded && this.grapeCount > 0) {
            const index = this.grapeCount - 1;
            if (index < this.grapePositions.length) {
                const pos = this.grapePositions[index];
                const drawW = this.images.interaction1.width * 0.5;
                const drawH = this.images.interaction1.height * 0.5;
                ctx.drawImage(this.images.interaction1, cx + pos.x - drawW / 2, cy + pos.y - drawH / 2, drawW, drawH);
            }
        }

        // 3. Draw Failure Animation
        if (this.isFailing && this.images.interactionFail) {
            const fImg = this.images.interactionFail;
            const fW = fImg.naturalWidth * 0.8;
            const fH = fImg.naturalHeight * 0.8;
            // Draw at the exact vertical center
            ctx.drawImage(fImg, this.failAnimX, cy - fH / 2, fW, fH);
        }
    }

    drawMobileResult(ctx, canvas) {
        const w = canvas.width;
        const h = canvas.height;

        // 1. Draw main background over everything first
        if (this.images.mainBg) {
            ctx.drawImage(this.images.mainBg, 0, 0, w, h);
        } else {
            ctx.fillStyle = '#F3E5F5';
            ctx.fillRect(0, 0, w, h);
        }

        // 2. Draw current grape bunch shifted to the left
        let bgImage = this.images[`grape${this.grapeCount}`];
        if (bgImage) {
            // Shift background to the left (draw at -20% width)
            ctx.drawImage(bgImage, -w * 0.2, 0, w, h);
        }

        // Draw (Click Count + 3) to the right
        const score = this.finalScore;
        const digits = score.toString().split('').map(Number);
        const digitW = 120;
        const spacing = 10;
        const totalW = digits.length * digitW + (digits.length - 1) * spacing;

        let startX = w * 0.75 - totalW / 2;
        const startY = h * 0.5 - digitW / 2;

        digits.forEach(digit => {
            const img = this.images[`num${digit}`];
            if (img) {
                ctx.drawImage(img, startX, startY, digitW, digitW);
            }
            startX += digitW + spacing;
        });
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
        this.finalScore = this.grapeCount + 3;
        gameTimer.stop(); // Stop timer immediately on success

        audioManager.playSFX('ding');
        audioManager.playSuccess();

        // Switch to result view IMMEDIATELY on mobile
        this.showMobileResult = true;

        // End game after showing result for 2 seconds
        setTimeout(() => {
            this.isActive = false;
            gameController.endGame(true);
        }, 2000);
    }

    fail() {
        if (this.gameEnded) return;
        this.gameEnded = true;
        this.isFailing = true; // Start fail animation on TV
        this.failAnimX = -200;
        this.finalScore = this.grapeCount + 3;

        audioManager.playFail();

        // Switch to result view IMMEDIATELY on mobile
        this.showMobileResult = true;

        // End game after animation and result display
        setTimeout(() => {
            this.isActive = false;
            gameController.endGame(false);
        }, 2000);
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
