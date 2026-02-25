/**
 * Game 14: 꽃병에 꽃 2송이를 찾아보자! (Find the vase with 2 flowers)
 *
 * Mobile / TV split rendering:
 *  - Phone canvas: during game → drawScene(); after user taps → drawMobileResult()
 *  - TV canvas: always renderTV() which draws the game scene (bg + vases + animations)
 *    so the fail/success interaction images still play on TV while mobile shows custom view.
 *  - After animation ends → endGame() → home/retry buttons appear on mobile.
 */
class Game14Flower {
    constructor() {
        this.ctx = null;
        this.canvas = null;
        this.tvCtx = null;
        this.tvCanvas = null;
        this.isActive = false;
        this.gameEnded = false;
        this.animationId = null;

        this.vases = [];
        this.successStep = 0;   // 0: none, 1: interaction 4_1, 2: interaction 4_2
        this.successTimer = 0;
        this.failStep = 0;   // 0: none, 1: 4-6, 2: 4-7, 3: 4-8
        this.failTimer = 0;
        this.targetVase = null;

        // When true, phone canvas shows mob bg + selected vase + count number
        this.showMobileResult = false;

        // Image assets
        this.images = {
            background: null,
            mobBackground: null,
            flower1_1: null,
            flower1_2: null,
            flower2_1: null,
            flower2_2: null,
            flower3: null,
            interaction1: null,  // 4_1 (success step 1)
            interaction2: null,  // 4_2 (success step 2)
            fail1: null,  // 4-6
            fail2: null,  // 4-7
            fail3: null,  // 4-8
            no1: null,  // mob count overlay 1
            no2: null,  // mob count overlay 2
            no3: null   // mob count overlay 3
        };
        this.imagesLoaded = false;
    }

    // ─────────────────────────────────────────────
    // Asset loading
    // ─────────────────────────────────────────────
    loadImages() {
        return new Promise((resolve) => {
            let loaded = 0;
            const imageSources = {
                background: './assets/Ally4_flower/Ally4_flower_bg.png',
                mobBackground: './assets/Ally4_flower/Ally4_resource/mobile/mob_Ally4_flower_bg.png',
                flower1_1: './assets/Ally4_flower/Ally4_resource/flower1_1.png',
                flower1_2: './assets/Ally4_flower/Ally4_resource/flower1_2.png',
                flower2_1: './assets/Ally4_flower/Ally4_resource/flower2_1.png',
                flower2_2: './assets/Ally4_flower/Ally4_resource/flower2_2.png',
                flower3: './assets/Ally4_flower/Ally4_resource/flower3.png',
                interaction1: './assets/Ally4_flower/Ally4_resource/interaction 4_1.png',
                interaction2: './assets/Ally4_flower/Ally4_resource/interaction 4_2.png',
                fail1: './assets/Ally4_flower/Ally4_interaction/interaction 4-6.png',
                fail2: './assets/Ally4_flower/Ally4_interaction/interaction 4-7.png',
                fail3: './assets/Ally4_flower/Ally4_interaction/interaction 4-8.png',
                no1: './assets/Ally4_flower/Ally4_interaction/mob_interaction no_1.png',
                no2: './assets/Ally4_flower/Ally4_interaction/mob_interaction no_2.png',
                no3: './assets/Ally4_flower/Ally4_interaction/mob_interaction no_3.png',
                int5_1: './assets/Ally4_flower/Ally4_interaction/interaction 5-1.png',
                int5_2: './assets/Ally4_flower/Ally4_interaction/interaction 5-2.png',
                int5_3: './assets/Ally4_flower/Ally4_interaction/interaction 5-3.png'
            };

            const total = Object.keys(imageSources).length;
            Object.entries(imageSources).forEach(([key, src]) => {
                const img = new Image();
                img.onload = () => {
                    this.images[key] = img;
                    if (++loaded === total) { this.imagesLoaded = true; resolve(); }
                };
                img.onerror = () => {
                    console.error(`Failed to load: ${src}`);
                    if (++loaded === total) { this.imagesLoaded = true; resolve(); }
                };
                img.src = src;
            });
        });
    }

    // ─────────────────────────────────────────────
    // Lifecycle
    // ─────────────────────────────────────────────
    init(ctx, canvas, container, tvCtx, tvCanvas) {
        this.ctx = ctx;
        this.canvas = canvas;
        this.tvCtx = tvCtx;
        this.tvCanvas = tvCanvas;
        if (!this.imagesLoaded) this.loadImages();
    }

    start() {
        this.isActive = true;
        this.gameEnded = false;
        this.successStep = 0;
        this.successTimer = 0;
        this.failStep = 0;
        this.failTimer = 0;
        this.targetVase = null;
        this.showMobileResult = false;

        // Define 3 vase types
        const vase1ImgKey = Math.random() > 0.5 ? 'flower1_1' : 'flower1_2';
        const vase2ImgKey = Math.random() > 0.5 ? 'flower2_1' : 'flower2_2';

        const vaseTypes = [
            { id: 1, count: 1, imgKey: vase1ImgKey, isTarget: false },
            { id: 2, count: 2, imgKey: vase2ImgKey, isTarget: true },
            { id: 3, count: 3, imgKey: 'flower3', isTarget: false }
        ];

        // Shuffle slot positions: 20%, 50%, 80%
        const positions = [0.2, 0.5, 0.8];
        for (let i = positions.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [positions[i], positions[j]] = [positions[j], positions[i]];
        }

        const w = this.canvas.width;
        const h = this.canvas.height;

        this.vases = vaseTypes.map((vase, i) => ({
            ...vase,
            xFrac: positions[i],   // store as fraction for renderTV scaling
            yFrac: 0.65,
            x: w * positions[i],
            y: h * 0.65,
            width: 140,
            height: 200,
            scale: 1,
            visible: true
        }));

        this.animate();
    }

    cleanup() {
        this.isActive = false;
        if (this.animationId) cancelAnimationFrame(this.animationId);
    }

    // ─────────────────────────────────────────────
    // Animation loop
    // ─────────────────────────────────────────────
    animate() {
        const w = this.canvas.width;

        // ── Success sequence ──
        if (this.successStep > 0) {
            this.successTimer++;
            if (this.targetVase) {
                if (this.successStep === 3) {
                    this.targetVase.scale = 1; // Reset scale for final step
                } else {
                    this.targetVase.scale = 1.1 + Math.sin(this.successTimer * 0.15) * 0.1;
                }
            }
            if (this.successStep === 1 && this.successTimer > 40) {
                this.successStep = 2; this.successTimer = 0;
            } else if (this.successStep === 2 && this.successTimer > 90) {
                this.successStep = 3; this.successTimer = 0; // New step: Show counts
            } else if (this.successStep === 3 && this.successTimer > 60) {
                this.isActive = false;
                gameController.endGame(true);
                return;
            }
        }

        // ── Fail sequence ──
        if (this.failStep > 0) {
            this.failTimer++;
            if (this.targetVase) {
                if (this.failStep === 4) {
                    this.targetVase.x = w * this.targetVase.xFrac; // Reset position for final step
                } else {
                    // Shake relative to original X
                    const baseX = w * this.targetVase.xFrac;
                    this.targetVase.x = baseX + Math.sin(this.failTimer * 0.5) * 3;
                }
            }
            if (this.failStep === 1 && this.failTimer > 30) { this.failStep = 2; this.failTimer = 0; }
            else if (this.failStep === 2 && this.failTimer > 30) { this.failStep = 3; this.failTimer = 0; }
            else if (this.failStep === 3 && this.failTimer > 40) {
                this.failStep = 4; this.failTimer = 0; // New step: Show counts
            }
            else if (this.failStep === 4 && this.failTimer > 60) {
                this.isActive = false;
                gameController.endGame(false);
                return;
            }
        }

        // ── Draw ──
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        if (this.showMobileResult) {
            this.drawMobileResult(this.ctx, this.canvas);
        } else {
            this.drawScene(this.ctx, this.canvas);
        }

        this.animationId = requestAnimationFrame(() => this.animate());
    }

    // ─────────────────────────────────────────────
    // TV independent rendering (called by game.js mirror loop)
    // Always shows the game scene (bg + vases + interactions)
    // ─────────────────────────────────────────────
    renderTV() {
        if (!this.tvCtx || !this.tvCanvas || !this.canvas) return;
        this.tvCtx.clearRect(0, 0, this.tvCanvas.width, this.tvCanvas.height);
        this.tvCtx.save();
        // Scale phone-canvas coordinates to TV-canvas size
        this.tvCtx.scale(
            this.tvCanvas.width / this.canvas.width,
            this.tvCanvas.height / this.canvas.height
        );
        this.drawScene(this.tvCtx, this.canvas); // use phone canvas dimensions for coords
        this.tvCtx.restore();
    }

    // ─────────────────────────────────────────────
    // Drawing: game scene (vases + interactions)
    // ─────────────────────────────────────────────
    drawScene(ctx, canvas) {
        const w = canvas.width;
        const h = canvas.height;

        // Background
        if (this.images.background) {
            ctx.drawImage(this.images.background, 0, 0, w, h);
        } else {
            ctx.fillStyle = '#FFF9C4';
            ctx.fillRect(0, 0, w, h);
        }

        // Vases
        this.vases.forEach(vase => {
            if (!vase.visible) return;
            const img = this.images[vase.imgKey];
            if (!img) return;
            ctx.save();
            ctx.translate(vase.x, vase.y);
            ctx.scale(vase.scale, vase.scale);
            ctx.drawImage(img, -vase.width / 2, -vase.height / 2, vase.width, vase.height);
            ctx.restore();

            // Draw count number OUTSIDE scale transform → fixed size & position regardless of animation
            const isRevealStep = (this.successStep === 3 || this.failStep === 4);
            if (isRevealStep) {
                const int5Key = `int5_${vase.count}`;
                const int5Img = this.images[int5Key];
                if (int5Img) {
                    const i5W = 80, i5H = 80;
                    const i5X = vase.x - i5W / 2;
                    const i5Y = vase.y - vase.height / 2 - i5H - 15;
                    ctx.globalAlpha = 0.2;
                    ctx.drawImage(int5Img, i5X, i5Y, i5W, i5H);
                    ctx.globalAlpha = 1.0;
                }
            }
        });

        // Success interaction (only during steps 1 and 2)
        if ((this.successStep === 1 || this.successStep === 2) && this.targetVase) {
            const img = this.successStep === 1 ? this.images.interaction1 : this.images.interaction2;
            if (img) {
                ctx.save();
                ctx.translate(this.targetVase.x, this.targetVase.y);
                const iW = img.naturalWidth * 0.5, iH = img.naturalHeight * 0.5;
                ctx.drawImage(img, -iW / 2, -iH / 2, iW, iH);
                ctx.restore();
            }
        }

        // Fail interaction (only during steps 1, 2, and 3)
        if ((this.failStep >= 1 && this.failStep <= 3) && this.targetVase) {
            const failImgs = [null, this.images.fail1, this.images.fail2, this.images.fail3];
            const img = failImgs[this.failStep];
            if (img) {
                ctx.save();
                ctx.translate(this.targetVase.x, this.targetVase.y);
                const iW = img.naturalWidth * 0.5, iH = img.naturalHeight * 0.5;
                ctx.drawImage(img, -iW / 2, -iH / 2, iW, iH);
                ctx.restore();
            }
        }
    }

    // ─────────────────────────────────────────────
    // Drawing: custom mobile result screen
    // mob background + selected vase + count number image
    // ─────────────────────────────────────────────
    drawMobileResult(ctx, canvas) {
        const w = canvas.width;
        const h = canvas.height;

        // Background
        if (this.images.mobBackground) {
            ctx.drawImage(this.images.mobBackground, 0, 0, w, h);
        } else {
            ctx.fillStyle = '#FFF9C4';
            ctx.fillRect(0, 0, w, h);
        }

        if (!this.targetVase) return;

        const vaseImg = this.images[this.targetVase.imgKey];
        const count = this.targetVase.count;

        // Vase: between slot 1 (20%) and slot 2 (50%) → 35%
        if (vaseImg) {
            const vW = 160, vH = 220;
            const vX = w * 0.35, vY = h * 0.6;
            ctx.drawImage(vaseImg, vX - vW / 2, vY - vH / 2, vW, vH);
        }

        // Count number image: between slot 2 (50%) and slot 3 (80%) → 65%
        const noImg = [null, this.images.no1, this.images.no2, this.images.no3][count];
        if (noImg) {
            const nW = 160, nH = 160;
            const nX = w * 0.65, nY = h * 0.6;
            ctx.drawImage(noImg, nX - nW / 2, nY - nH / 2, nW, nH);
        }
    }

    // ─────────────────────────────────────────────
    // Input
    // ─────────────────────────────────────────────
    checkCollision(x, y) {
        for (const vase of this.vases) {
            const hw = (vase.width / 2) * vase.scale;
            const hh = (vase.height / 2) * vase.scale;
            if (x > vase.x - hw && x < vase.x + hw &&
                y > vase.y - hh && y < vase.y + hh) return vase;
        }
        return null;
    }

    onButtonDown(x, y) {
        if (!this.isActive || this.gameEnded || this.successStep > 0 || this.failStep > 0) return;

        const vase = this.checkCollision(x, y);
        if (!vase) return;

        this.gameEnded = true;
        this.targetVase = vase;
        // Immediately switch mobile to custom result view
        this.showMobileResult = true;

        if (vase.isTarget) {
            vase.scale = 1.1;
            gameTimer.stop(); // Stop timer immediately on success
            audioManager.playSFX('ding');
            audioManager.playSuccess();
            this.successStep = 1;
            this.successTimer = 0;
        } else {
            vase.scale = 0.9;
            audioManager.playFail();
            this.failStep = 1;
            this.failTimer = 0;
        }
    }

    onButtonUp() { }

    onTimeout() {
        if (this.gameEnded || this.successStep > 0 || this.failStep > 0) return;
        this.gameEnded = true;
        this.showMobileResult = true;

        // Pick the vase that would have been correct (or random for timeout)
        if (!this.targetVase) {
            this.targetVase = this.vases[Math.floor(Math.random() * this.vases.length)];
        }

        audioManager.playFail();
        this.failStep = 1;
        this.failTimer = 0;
    }
}

const game14Flower = new Game14Flower();
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        if (typeof gameController !== 'undefined') gameController.registerGame(14, game14Flower);
    }, 100);
});
