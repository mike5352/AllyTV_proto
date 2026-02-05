/**
 * Game 14: 꽃병에 꽃 2송이를 찾아보자! (Find the vase with 2 flowers)
 * - Three vases are displayed:
 *   1. Vase with 1 flower (Randomly flower1_1 or flower1_2)
 *   2. Vase with 2 flowers (Randomly flower2_1 or flower2_2) [Target]
 *   3. Vase with 3 flowers (flower3)
 * - Positions are randomized.
 * - Success: Tap vase with 2 flowers.
 *   - Shows interaction 4_1, then interaction 4_2.
 * - Fail: Tap others or timeout.
 */
class Game14Flower {
    constructor() {
        this.ctx = null;
        this.canvas = null;
        this.isActive = false;
        this.gameEnded = false;
        this.animationId = null;

        this.vases = [];
        this.successStep = 0; // 0: none, 1: interaction 4_1, 2: interaction 4_2
        this.successTimer = 0;
        this.targetVase = null;

        // Image assets
        this.images = {
            background: null,
            flower1_1: null,
            flower1_2: null,
            flower2_1: null,
            flower2_2: null,
            flower3: null,
            interaction1: null, // 4_1
            interaction2: null  // 4_2
        };
        this.imagesLoaded = false;
    }

    loadImages() {
        return new Promise((resolve) => {
            let loaded = 0;
            const imageSources = {
                background: './assets/Ally4_flower/Ally4_flower_bg.png',
                flower1_1: './assets/Ally4_flower/Ally4_resource/flower1_1.png',
                flower1_2: './assets/Ally4_flower/Ally4_resource/flower1_2.png',
                flower2_1: './assets/Ally4_flower/Ally4_resource/flower2_1.png',
                flower2_2: './assets/Ally4_flower/Ally4_resource/flower2_2.png',
                flower3: './assets/Ally4_flower/Ally4_resource/flower3.png',
                interaction1: './assets/Ally4_flower/Ally4_resource/interaction 4_1.png',
                interaction2: './assets/Ally4_flower/Ally4_resource/interaction 4_2.png'
            };

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
        this.successStep = 0;
        this.successTimer = 0;
        this.targetVase = null;

        // 1. Define 3 Vases
        // Vase 1: 1 flower
        const vase1ImgKey = Math.random() > 0.5 ? 'flower1_1' : 'flower1_2';
        // Vase 2: 2 flowers (TARGET)
        const vase2ImgKey = Math.random() > 0.5 ? 'flower2_1' : 'flower2_2';
        // Vase 3: 3 flowers
        const vase3ImgKey = 'flower3';

        const vaseTypes = [
            { id: 1, count: 1, imgKey: vase1ImgKey, isTarget: false },
            { id: 2, count: 2, imgKey: vase2ImgKey, isTarget: true },
            { id: 3, count: 3, imgKey: vase3ImgKey, isTarget: false }
        ];

        // 2. Shuffle Positions
        // We'll use 3 slots: Left (20%), Center (50%), Right (80%)
        const positions = [0.2, 0.5, 0.8];
        // Fisher-Yates shuffle positions
        for (let i = positions.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [positions[i], positions[j]] = [positions[j], positions[i]];
        }

        const width = this.canvas.width;
        const height = this.canvas.height;
        const vaseY = height * 0.65; // Ground level

        this.vases = vaseTypes.map((vase, index) => {
            return {
                ...vase,
                x: width * positions[index],
                y: vaseY,
                width: 140, // Approximate size
                height: 200,
                scale: 1,
                visible: true
            };
        });

        this.animate();
    }

    animate() {
        if (!this.isActive && this.successStep === 0) return;

        // Update Success Sequence
        if (this.successStep > 0) {
            this.successTimer++;

            // Pulse animation for target vase
            if (this.targetVase) {
                // Pulse between 1.0 and 1.2
                this.targetVase.scale = 1.1 + Math.sin(this.successTimer * 0.15) * 0.1;
            }

            // Step 1 lasts for 40 frames (~0.7s)
            if (this.successStep === 1 && this.successTimer > 40) {
                this.successStep = 2;
                this.successTimer = 0; // Reset for next step duration
            }
            // Step 2 lasts for 90 frames (~1.5s), then end game
            else if (this.successStep === 2 && this.successTimer > 90) {
                // End game sequence complete
                this.isActive = false;
                gameController.endGame(true);
                return;
            }
        }

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.drawScene();
        this.animationId = requestAnimationFrame(() => this.animate());
    }

    drawScene() {
        // Draw background
        if (this.images.background) {
            this.ctx.drawImage(this.images.background, 0, 0, this.canvas.width, this.canvas.height);
        } else {
            this.ctx.fillStyle = '#FFF9C4';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        }

        // Draw Vases
        this.vases.forEach(vase => {
            if (!vase.visible) return;

            const img = this.images[vase.imgKey];
            if (img) {
                this.ctx.save();
                this.ctx.translate(vase.x, vase.y);
                this.ctx.scale(vase.scale, vase.scale);
                // Draw centered
                this.ctx.drawImage(img, -vase.width / 2, -vase.height / 2, vase.width, vase.height);
                this.ctx.restore();
            }
        });

        // Draw Success Interaction
        if (this.successStep > 0 && this.targetVase) {
            let interactionImg = null;
            if (this.successStep === 1) interactionImg = this.images.interaction1;
            else if (this.successStep === 2) interactionImg = this.images.interaction2;

            if (interactionImg) {
                this.ctx.save();
                // Position relative to target vase
                // Adjust Y based on image contents (particles usually appear above/around)
                this.ctx.translate(this.targetVase.x, this.targetVase.y);

                // Draw centered, maybe scale up slightly
                const iWidth = 350;
                const iHeight = 350;
                this.ctx.drawImage(interactionImg, -iWidth / 2, -iHeight / 2, iWidth, iHeight);
                this.ctx.restore();
            }
        }
    }

    checkCollision(x, y) {
        for (const vase of this.vases) {
            const hw = (vase.width / 2) * vase.scale;
            const hh = (vase.height / 2) * vase.scale;

            if (x > vase.x - hw && x < vase.x + hw &&
                y > vase.y - hh && y < vase.y + hh) {
                return vase;
            }
        }
        return null;
    }

    onButtonDown(x, y) {
        if (!this.isActive || this.gameEnded || this.successStep > 0) return;

        const vase = this.checkCollision(x, y);
        if (vase) {
            if (vase.isTarget) {
                // Success
                this.gameEnded = true; // Logic ended
                this.targetVase = vase;

                // Visual feedback
                vase.scale = 1.1;

                audioManager.playSFX('ding');
                audioManager.playSuccess();

                // Start success sequence
                this.successStep = 1; // Show interaction 4_1
                this.successTimer = 0;
            } else {
                // Fail - Wrong vase
                vase.scale = 0.9;
                this.fail();
            }
        }
    }

    onButtonUp() { }

    onTimeout() {
        if (!this.gameEnded && this.successStep === 0) {
            this.fail();
        }
    }

    fail() {
        if (this.gameEnded) return;
        this.gameEnded = true;
        this.isActive = false;

        audioManager.playFail();
        setTimeout(() => gameController.endGame(false), 500);
        this.drawScene();
    }

    cleanup() {
        this.isActive = false;
        if (this.animationId) cancelAnimationFrame(this.animationId);
    }
}

const game14Flower = new Game14Flower();
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        if (typeof gameController !== 'undefined') gameController.registerGame(14, game14Flower);
    }, 100);
});
