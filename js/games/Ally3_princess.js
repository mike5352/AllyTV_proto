/**
 * Game 13: 머리 더 길어! (Whose hair is longer?)
 * - Two princesses in towers (Assets act as full towers)
 * - Prince in the middle asking the question
 * - Alternating Question Marks (interaction 3-1, 3-2) next to Prince
 * - User touches the princess with longer hair (Princess 2 - Yellow hair)
 * - Success: Questions disappear, hearts/stars (3-3, 3-4, 3-5) allow appear near the target princess
 */
class Game13Hair {
    constructor() {
        this.ctx = null;
        this.canvas = null;
        this.isActive = false;
        this.gameEnded = false; // logic ended
        this.inSuccessSequence = false;
        this.animationId = null;

        this.princesses = [];
        this.hairSway = 0;
        this.animationFrame = 0;
        this.successFrame = 0;

        // Image assets
        this.images = {
            background: null,
            princess1: null, // Short hair (Brunette)
            princess2: null, // Long hair (Blonde) - Target
            prince: null,     // Prince
            question1: null,  // interaction 3-1
            question2: null,  // interaction 3-2
            effect1: null,    // interaction 3-3
            effect2: null,    // interaction 3-4
            effect3: null     // interaction 3-5
        };
        this.imagesLoaded = false;
    }

    loadImages() {
        return new Promise((resolve) => {
            let loaded = 0;
            const imageSources = {
                background: './assets/Ally3_princess/Ally3_princess_bg.png',
                princess1: './assets/Ally3_princess/Ally3_resource/princess 1.png',
                princess2: './assets/Ally3_princess/Ally3_resource/princess 2.png',
                prince: './assets/Ally3_princess/Ally3_resource/prince.png',
                question1: './assets/Ally3_princess/Ally3_resource/interaction 3-1.png',
                question2: './assets/Ally3_princess/Ally3_resource/interaction 3-2.png',
                effect1: './assets/Ally3_princess/Ally3_resource/interaction 3-3.png',
                effect2: './assets/Ally3_princess/Ally3_resource/interaction 3-4.png',
                effect3: './assets/Ally3_princess/Ally3_resource/interaction 3-5.png'
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
        // Preload images
        if (!this.imagesLoaded) {
            this.loadImages();
        }
    }

    start() {
        this.isActive = true;
        this.gameEnded = false;
        this.inSuccessSequence = false;
        this.hairSway = 0;
        this.animationFrame = 0;
        this.successFrame = 0;

        // 2 Princesses: Short (0), Long (1)
        const types = [0, 1];
        // Shuffle left/right position
        if (Math.random() > 0.5) types.reverse();

        const width = this.canvas.width;
        const height = this.canvas.height;

        this.princesses = types.map((type, index) => ({
            id: index,
            type: type, // 0: Princess 1 (Target), 1: Princess 2
            // Position: Left (~28%) and Right (~72%)
            x: index === 0 ? width * 0.28 : width * 0.72,
            // Lower the Y position since we reduced height, to keep them on ground
            y: height * 0.57,
            width: 70, // Reduced from 140 (50%)
            height: 243.5, // Reduced from 487 (50%)
            scale: 1,
            // Target is now type 0 (Princess 1)
            isTarget: type === 0
        }));

        this.animate();
    }

    animate() {
        // Continue animation loop even during success sequence
        if (!this.isActive && !this.inSuccessSequence) return;

        this.animationFrame++;
        this.hairSway = Math.sin(Date.now() / 300) * 3;

        if (this.inSuccessSequence) {
            this.successFrame++;
        }

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.drawScene();
        this.animationId = requestAnimationFrame(() => this.animate());
    }

    drawScene() {
        // Draw background image
        if (this.images.background) {
            this.ctx.drawImage(this.images.background, 0, 0, this.canvas.width, this.canvas.height);
        } else {
            this.ctx.fillStyle = '#E1F5FE';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        }

        // Draw Princesses
        this.princesses.forEach(princess => {
            this.drawPrincess(princess);
        });

        // Draw Prince
        if (this.images.prince) {
            const princeX = this.canvas.width / 2;
            const princeY = this.canvas.height * 0.80; // Slightly lower
            const princeWidth = 75; // Increased by 50% from 50
            const princeHeight = 89.1; // Increased by 50% from 59.4

            this.ctx.drawImage(
                this.images.prince,
                princeX - princeWidth / 2,
                princeY - princeHeight / 2,
                princeWidth,
                princeHeight
            );

            // Draw Question Marks ONLY if NOT in success sequence
            if (!this.inSuccessSequence) {
                const showFirst = Math.floor(this.animationFrame / 30) % 2 === 0;
                const questionImg = showFirst ? this.images.question1 : this.images.question2;

                if (questionImg) {
                    const qX = princeX + 10; // Moved left
                    const qY = princeY - 90; // Higher up
                    const qSize = 50; // Reduced from 80

                    this.ctx.drawImage(questionImg, qX, qY, qSize, qSize);
                }
            }
        }

        // Draw Success Effects (3-3, 3-4, 3-5)
        if (this.inSuccessSequence) {
            this.drawSuccessEffects();
        }
    }

    drawSuccessEffects() {
        // Find target princess
        const target = this.princesses.find(p => p.isTarget);
        if (!target) return;

        // Base coordinates relative to the target tower
        // target.x is center of tower, target.y is bottom of tower (height * 0.65)
        // Tower is ~200px wide, ~430px tall. Top is around y - 430/2 = y - 215? 
        // No, drawImage uses center, so top is y - height/2.

        const towerTopY = target.y - target.height / 2;
        const towerLeftX = target.x - target.width / 2;
        const towerRightX = target.x + target.width / 2;

        // Effect 1 (3-3): Left side stars/hearts (Pink/Green stars on left)
        if (this.successFrame > 0 && this.images.effect1) {
            const alpha = Math.max(0, 1 - (this.successFrame / 80));
            const yOffset = this.successFrame * 1.2;
            if (alpha > 0) {
                this.ctx.globalAlpha = alpha;
                // Position to the left of the tower, rising. Reduced to 50% size.
                const img = this.images.effect1;
                const w = img.width * 0.5;
                const h = img.height * 0.5;
                this.ctx.drawImage(img, towerLeftX - 100, towerTopY + 50 - yOffset, w, h);
                this.ctx.globalAlpha = 1.0;
            }
        }

        // Effect 2 (3-4): Top/Right hearts/stars (Colorful stars above)
        if (this.successFrame > 15 && this.images.effect2) {
            const localFrame = this.successFrame - 15;
            const alpha = Math.max(0, 1 - (localFrame / 80));
            const yOffset = localFrame * 1.0;
            if (alpha > 0) {
                this.ctx.globalAlpha = alpha;
                // Position above the tower and slightly right. Reduced to 50% size.
                const img = this.images.effect2;
                const w = img.width * 0.5;
                const h = img.height * 0.5;
                this.ctx.drawImage(img, towerLeftX, towerTopY - 100 - yOffset, w, h);
                this.ctx.globalAlpha = 1.0;
            }
        }

        // Effect 3 (3-5): Center/Right hearts (Pink hearts on right)
        if (this.successFrame > 30 && this.images.effect3) {
            const localFrame = this.successFrame - 30;
            const alpha = Math.max(0, 1 - (localFrame / 80));
            const yOffset = localFrame * 0.8;
            if (alpha > 0) {
                this.ctx.globalAlpha = alpha;
                // Position to the right of the tower. Reduced to 50% size.
                const img = this.images.effect3;
                const w = img.width * 0.5;
                const h = img.height * 0.5;
                this.ctx.drawImage(img, towerRightX - 50, towerTopY - yOffset, w, h);
                this.ctx.globalAlpha = 1.0;
            }
        }
    }

    drawPrincess(p) {
        const x = p.x;
        const y = p.y;
        const s = p.scale;
        const image = p.type === 0 ? this.images.princess1 : this.images.princess2;

        if (image) {
            this.ctx.save();
            this.ctx.translate(x, y);
            this.ctx.scale(s, s);
            this.ctx.drawImage(image, -p.width / 2, -p.height / 2, p.width, p.height);
            this.ctx.restore();
        }
    }

    checkCollision(x, y) {
        for (const p of this.princesses) {
            const halfWidth = (p.width / 2) * p.scale;
            const halfHeight = (p.height / 2) * p.scale;
            if (x > p.x - halfWidth && x < p.x + halfWidth &&
                y > p.y - halfHeight && y < p.y + halfHeight) {
                return p;
            }
        }
        return null;
    }

    onButtonDown(x, y) {
        // Block input if game ended or in success sequence
        if (!this.isActive || this.gameEnded || this.inSuccessSequence) return;

        const princess = this.checkCollision(x, y);
        if (princess) {
            if (princess.isTarget) {
                // Success
                princess.scale = 1.05;
                audioManager.playSFX('ding');
                audioManager.playSuccess();

                // Start success sequence
                this.inSuccessSequence = true;
                this.gameEnded = true; // Stop timer logic if any

                // End game after sequence (approx 2 seconds)
                setTimeout(() => {
                    this.isActive = false; // Stop animation loop
                    gameController.endGame(true);
                }, 2000);

            } else {
                // Fail
                princess.scale = 0.95;
                this.fail();
                audioManager.playSFX('click');
            }
        }
    }

    onButtonUp() { }
    onTimeout() {
        if (!this.gameEnded && !this.inSuccessSequence) this.fail();
    }

    fail() {
        if (this.gameEnded) return;
        this.gameEnded = true;
        this.isActive = false;

        audioManager.playFail();
        setTimeout(() => gameController.endGame(false), 500);
        this.drawScene(); // Draw final frame
    }

    cleanup() {
        this.isActive = false;
        this.inSuccessSequence = false;
        if (this.animationId) cancelAnimationFrame(this.animationId);
    }
}

const game13Hair = new Game13Hair();
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        if (typeof gameController !== 'undefined') gameController.registerGame(13, game13Hair);
    }, 100);
});
