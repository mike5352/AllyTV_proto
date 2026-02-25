/**
 * Game 13: 머리 더 길어! (Whose hair is longer?)
 * - TV: Two castles with princesses (Orange hair - Long, Brown hair - Short)
 * - Mobile: Two tower bases, Prince in the middle asking question
 * - User touches the tower with longer hair (Orange hair braids showing on mobile)
 * - Success: Result shown on TV with effects
 */
class Game13Hair {
    constructor() {
        this.ctx = null;
        this.canvas = null;
        this.tvCtx = null;
        this.tvCanvas = null;
        this.isActive = false;
        this.gameEnded = false;
        this.inSuccessSequence = false;
        this.inFailSequence = false;
        this.animationId = null;

        this.princesses = [];
        this.animationFrame = 0;
        this.successFrame = 0;
        this.failFrame = 0;
        this.cloudX = 0;

        // Image assets
        this.images = {
            // TV assets
            tv_bg: null,
            tv_castle: null,
            tv_p_long: null,
            tv_p_short: null,

            // Mobile assets
            mob_bg: null,
            mob_castle: null,
            mob_castle_princess: null,
            mob_prince: null,

            // Shared assets
            cloud_bg: null,
            question1: null,
            question2: null,

            // Success effects (3-5 to 3-9)
            success_effects: [],
            // Failure effects (3-10 to 3-12)
            fail_hero: null,    // 3-10
            fail_fire: null,    // 3-11
            fail_dragon: null   // 3-12
        };
        this.imagesLoaded = false;
    }

    loadImages() {
        return new Promise((resolve) => {
            let loaded = 0;
            const interactionPath = './assets/Ally3_princess/Ally3_interaction/';
            const resourcePath = './assets/Ally3_princess/Ally3_resource/';

            const imageSources = {
                tv_bg: resourcePath + 'tv/tv_Ally3_princess_bg.png',
                // Explicitly use the filenames with leading spaces as seen in the filesystem
                tv_p_long: resourcePath + 'tv/ tv_princess 1-3.png',
                tv_p_short: resourcePath + 'tv/ tv_princess 2-4.png',

                mob_bg: resourcePath + 'mobile/mob_Ally3_princess_bg.png',
                mob_castle: resourcePath + 'mobile/mob_castle.png',
                mob_castle_princess: resourcePath + 'mobile/mob_castle_princess.png',
                mob_prince: resourcePath + 'mobile/mob_prince.png',

                cloud_bg: resourcePath + 'Ally3_princess_bg1-2.png',
                question1: resourcePath + 'interaction 3-1.png',
                question2: resourcePath + 'interaction 3-2.png',

                // Effects
                s5: interactionPath + 'interaction 3-5.png',
                s6: interactionPath + 'interaction 3-6.png',
                s7: interactionPath + 'interaction 3-7.png',
                s8: interactionPath + 'interaction 3-8.png',
                s9: interactionPath + 'interaction 3-9.png',
                f10: interactionPath + 'interaction 3-10.png',
                f11: interactionPath + 'interaction 3-11.png',
                f12: interactionPath + 'interaction 3-12.png'
            };

            const total = Object.keys(imageSources).length;

            Object.entries(imageSources).forEach(([key, src]) => {
                const img = new Image();
                img.onload = () => {
                    if (key.startsWith('s')) {
                        const idx = parseInt(key.substring(1)) - 5;
                        this.images.success_effects[idx] = img;
                    } else if (key === 'f10') {
                        this.images.fail_hero = img;
                    } else if (key === 'f11') {
                        this.images.fail_fire = img;
                    } else if (key === 'f12') {
                        this.images.fail_dragon = img;
                    } else {
                        this.images[key] = img;
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
        this.inSuccessSequence = false;
        this.inFailSequence = false;
        this.animationFrame = 0;
        this.successFrame = 0;
        this.failFrame = 0;
        this.cloudX = 0;

        // 2 types of princesses on TV: 0: Orange (Long - Target), 1: Brown (Short)
        const types = [0, 1];
        if (Math.random() > 0.5) types.reverse();

        const width = this.canvas.width;
        const height = this.canvas.height;

        this.princesses = types.map((type, index) => {
            return {
                id: index,
                type: type, // 0: Orange hair (target), 1: Brown hair
                x: index === 0 ? width * 0.25 : width * 0.75, // Mobile positions
                tvX: index === 0 ? this.tvCanvas.width * 0.31 : this.tvCanvas.width * 0.69, // TV positions
                isTarget: type === 0,
                img: type === 0 ? this.images.tv_p_long : this.images.tv_p_short
            };
        });

        this.animate();
    }

    animate() {
        if (!this.isActive && !this.inSuccessSequence && !this.inFailSequence) return;

        this.animationFrame++;
        this.cloudX -= 0.5; // Slow movement to the left
        if (this.cloudX <= -this.canvas.width) this.cloudX = 0;

        if (this.inSuccessSequence) {
            this.successFrame++;
        }
        if (this.inFailSequence) {
            this.failFrame++;
        }

        // Standard draw logic for mobile
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.drawScene();

        // renderTV is called by gameController mirror loop, but we can also trigger it here to be safe
        // if gameController doesn't have the logic to skip mirroring when renderTV exists.
        // Actually gameController.js clearly checks for this.currentGame.renderTV

        this.animationId = requestAnimationFrame(() => this.animate());
    }

    drawScene() {
        // --- Mobile Rendering ---
        const w = this.canvas.width;
        const h = this.canvas.height;

        // 1. Background
        if (this.images.mob_bg) {
            this.ctx.drawImage(this.images.mob_bg, 0, 0, w, h);
        }

        // 2. Clouds (Scrolling)
        if (this.images.cloud_bg) {
            // Draw clouds only (clip the top part of the bg image if needed, but here we just draw it scrolled)
            // The cloud image contains sky and grass. Let's just draw it.
            this.ctx.drawImage(this.images.cloud_bg, this.cloudX, 0, w, h);
            this.ctx.drawImage(this.images.cloud_bg, this.cloudX + w, 0, w, h);
        }

        // 3. Tower Bases
        this.princesses.forEach(p => {
            const towerImg = p.isTarget ? this.images.mob_castle_princess : this.images.mob_castle;
            if (towerImg) {
                const tw = w * 0.35;
                const th = h * 0.95;
                this.ctx.drawImage(towerImg, p.x - tw / 2, h - th, tw, th);
            }
        });

        // 4. Prince
        if (this.images.mob_prince) {
            const pw = 120;
            const ph = 142;
            this.ctx.drawImage(this.images.mob_prince, w / 2 - pw / 2, h - ph - 20, pw, ph);

            // Questions
            if (!this.inSuccessSequence && !this.inFailSequence) {
                const showFirst = Math.floor(this.animationFrame / 30) % 2 === 0;
                const qImg = showFirst ? this.images.question1 : this.images.question2;
                if (qImg) {
                    this.ctx.drawImage(qImg, w / 2 - 25, h - ph - 100, 70, 70);
                }
            }
        }
    }

    renderTV() {
        if (!this.tvCtx || !this.tvCanvas) return;

        const w = this.tvCanvas.width;
        const h = this.tvCanvas.height;
        this.tvCtx.clearRect(0, 0, w, h);

        // 1. Background
        if (this.images.tv_bg && this.images.tv_bg.complete) {
            this.tvCtx.drawImage(this.images.tv_bg, 0, 0, w, h);
        }

        // 2. Clouds (Scrolling)
        if (this.images.cloud_bg && this.images.cloud_bg.complete) {
            this.tvCtx.drawImage(this.images.cloud_bg, this.cloudX, 0, w, h);
            this.tvCtx.drawImage(this.images.cloud_bg, this.cloudX + w, 0, w, h);
        }

        // 3. Princesses (Combined with Castle images)
        this.princesses.forEach(p => {
            // Re-assign image if it was null during start() due to slow loading
            if (!p.img) {
                p.img = p.type === 0 ? this.images.tv_p_long : this.images.tv_p_short;
            }

            if (p.img && p.img.complete) {
                const pw = w * 0.22;
                const ph = h * 0.95;
                this.tvCtx.drawImage(p.img, p.tvX - pw / 2, h - ph, pw, ph);
            }
        });

        // 4. Interaction Overlays on the Target
        if (this.inSuccessSequence) {
            this.drawTVSuccessEffects();
        } else if (this.inFailSequence) {
            this.drawTVFailEffects();
        }
    }

    drawTVSuccessEffects() {
        const w = this.tvCanvas.width;
        const h = this.tvCanvas.height;
        const target = this.princesses.find(p => p.isTarget);
        if (!target) return;

        const tx = target.tvX;
        const ty = h * 0.52; // Castle window level
        const isLeft = tx < w / 2;
        const side = isLeft ? 1 : -1;

        // config: image index (0-4 for 3-5 to 3-9), dx, dy, delay
        // dx is mirrored by 'side'
        const configs = [
            { idx: 0, dx: -150, dy: 50, delay: 0 },   // 3-5: Castle Side/Bottom Left
            { idx: 1, dx: 150, dy: 80, delay: 15 },  // 3-6: Castle Side/Bottom Right
            { idx: 2, dx: -140, dy: -140, delay: 30 },  // 3-7: Top of 3-5
            { idx: 3, dx: 140, dy: -200, delay: 45 },  // 3-8: Top of 3-6
            { idx: 4, dx: 120, dy: -60, delay: 60 }   // 3-9: Passing between 6 and 8
        ];

        configs.forEach((conf) => {
            if (this.successFrame >= conf.delay) {
                const img = this.images.success_effects[conf.idx];
                if (img && img.complete) {
                    const x = tx + conf.dx * side;
                    const y = ty + conf.dy;

                    this.tvCtx.save();
                    this.tvCtx.translate(x, y);

                    // Mirroring logic
                    if (!isLeft) {
                        this.tvCtx.scale(-1, 1);
                    }

                    // Use original image dimensions (3-argument drawImage)
                    this.tvCtx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);
                    this.tvCtx.restore();
                }
            }
        });
    }

    drawTVFailEffects() {
        const w = this.tvCanvas.width;
        const h = this.tvCanvas.height;

        // 3-10: Knight (용사) - On the left side
        if (this.images.fail_hero) {
            const size = 180;
            this.tvCtx.drawImage(this.images.fail_hero, w * 0.1 - size / 2, h * 0.35 - size / 2, size, size);
        }

        // 3-12: Dragon (용) - On the right side
        if (this.images.fail_dragon) {
            const size = 450;
            // The dragon faces left by default in the asset
            this.tvCtx.drawImage(this.images.fail_dragon, w * 0.78 - size / 2, h * 0.45 - size / 2, size, size);
        }

        // 3-11: Fire (불) - Between dragon and knight, original orientation
        if (this.images.fail_fire) {
            const showFire = Math.floor(this.failFrame / 30) % 2 === 0; // Blink faster (0.5s)
            if (showFire) {
                const size = 350;
                const fx = w * 0.45;
                const fy = h * 0.45;
                this.tvCtx.drawImage(this.images.fail_fire, fx - size / 2, fy - size / 2, size, size);
            }
        }
    }

    onButtonDown(x, y) {
        if (!this.isActive || this.gameEnded || this.inSuccessSequence || this.inFailSequence) return;

        // Check collision with tower bases on mobile
        const w = this.canvas.width;
        const h = this.canvas.height;
        const tw = w * 0.35;
        const th = h * 0.95;

        for (const p of this.princesses) {
            if (x > p.x - tw / 2 && x < p.x + tw / 2 &&
                y > h - th && y < h) {

                if (p.isTarget) {
                    // Success
                    gameTimer.stop(); // Stop timer immediately on success
                    audioManager.playSFX('ding');
                    audioManager.playSuccess();
                    this.inSuccessSequence = true;
                    this.gameEnded = true;
                    setTimeout(() => {
                        this.isActive = false;
                        gameController.endGame(true);
                    }, 2500); // Sequence time
                } else {
                    // Fail
                    audioManager.playSFX('click');
                    audioManager.playFail();
                    this.inFailSequence = true;
                    this.gameEnded = true;
                    setTimeout(() => {
                        this.isActive = false;
                        gameController.endGame(false);
                    }, 3000); // Sequence time
                }
                break;
            }
        }
    }

    onButtonUp() { }
    onTimeout() {
        if (!this.gameEnded && !this.inSuccessSequence && !this.inFailSequence) {
            this.inFailSequence = true;
            this.gameEnded = true;
            audioManager.playFail();
            setTimeout(() => {
                this.isActive = false;
                gameController.endGame(false);
            }, 3000);
        }
    }

    cleanup() {
        this.isActive = false;
        this.inSuccessSequence = false;
        this.inFailSequence = false;
        if (this.animationId) cancelAnimationFrame(this.animationId);
    }
}

const game13Hair = new Game13Hair();
// Start loading images immediately
game13Hair.loadImages();

document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        if (typeof gameController !== 'undefined') gameController.registerGame(13, game13Hair);
    }, 100);
});
