/**
 * Game 17: 농부 할아버지를 도와주자!
 * - Mobile: background with carrot field, tap to pick carrots (10 taps to win)
 * - TV: farmer character + speech bubble (blinking), basket with carrots accumulating
 * - Success: mobile shows numbered positions, TV changes background
 * - Fail: screens freeze
 */
class Game17Carrot {
    constructor() {
        this.ctx = null;
        this.canvas = null;
        this.tvCtx = null;
        this.tvCanvas = null;
        this.isActive = false;
        this.gameEnded = false;
        this.animationId = null;

        // Game state
        this.carrotCount = 10;       // starts at 10, decrements on each tap
        this.touchCount = 0;         // number of taps so far
        this.phase = 'waiting';      // 'waiting' | 'playing' | 'success' | 'fail'

        // TV state
        this.tvCharFrame = 1;        // alternates 1/2 on each tap
        this.tvCarrots = [];         // array of carrot image keys in basket
        this.speechBubbleVisible = true;
        this.speechBubbleTimer = 0;

        // Success state - carrot positions for number display
        this.carrotPositions = [];

        // Animation
        this.animationFrame = 0;
        this.successStartTime = 0;

        // Image assets
        this.images = {
            mob_bg: null,
            mob_interactions: [],     // 0-10 index = mob_interaction 8-0 to 8-10
            tv_bg: null,
            tv_bg2: null,
            tv_char1_1: null,
            tv_char1_2: null,
            tv_char2_1: null,
            tv_char2_2: null,
            tv_char2_3: null,
            tv_char3: null,
            tv_basket: null,
            tv_int7_1: null,
            tv_int7_2: null
        };
        this.imagesLoaded = false;
    }

    loadImages() {
        return new Promise((resolve) => {
            let loaded = 0;
            const resPath = './assets/Ally7_carrot/Ally7_resource/';
            const intPath = './assets/Ally7_carrot/Ally7_interaction/';

            const imageSources = {
                mob_bg: resPath + 'mobile/mob_Ally7_carrot_bg.png',
                mob_int_0: intPath + 'mob_interaction 8-0.png',
                mob_int_1: intPath + 'mob_interaction 8-1.png',
                mob_int_2: intPath + 'mob_interaction 8-2.png',
                mob_int_3: intPath + 'mob_interaction 8-3.png',
                mob_int_4: intPath + 'mob_interaction 8-4.png',
                mob_int_5: intPath + 'mob_interaction 8-5.png',
                mob_int_6: intPath + 'mob_interaction 8-6.png',
                mob_int_7: intPath + 'mob_interaction 8-7.png',
                mob_int_8: intPath + 'mob_interaction 8-8.png',
                mob_int_9: intPath + 'mob_interaction 8-9.png',
                mob_int_10: intPath + 'mob_interaction 8-10.png',
                tv_bg: resPath + 'tv/tv_Ally7_carrot 4_bg.png',
                tv_bg2: resPath + 'tv/tv_Ally7_carrot 4_bg2.png',
                tv_char1_1: resPath + 'tv/tv_character 1-1.png',
                tv_char1_2: resPath + 'tv/tv_character 1-2.png',
                tv_char2_1: resPath + 'tv/tv_character 2-1.png',
                tv_char2_2: resPath + 'tv/tv_character 2-2.png',
                tv_char2_3: resPath + 'tv/tv_character 2-3.png',
                tv_char3: resPath + 'tv/tv_character 3.png',
                tv_basket: resPath + 'tv/tv_basket.png',
                tv_int7_1: intPath + 'tv_interaction 7-1.png',
                tv_int7_2: intPath + 'tv_interaction 7-2.png'
            };

            const total = Object.keys(imageSources).length;

            Object.entries(imageSources).forEach(([key, src]) => {
                const img = new Image();
                img.onload = () => {
                    // Route to correct storage
                    if (key.startsWith('mob_int_')) {
                        const idx = parseInt(key.replace('mob_int_', ''));
                        this.images.mob_interactions[idx] = img;
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
        this.carrotCount = 10;
        this.touchCount = 0;
        this.phase = 'waiting';
        this.tvCharFrame = 1;
        this.tvCarrots = [];
        this.speechBubbleVisible = true;
        this.speechBubbleTimer = 0;
        this.animationFrame = 0;
        this.successStartTime = 0;
        this.carrotPositions = [];

        this.animate();
    }

    animate() {
        if (!this.isActive && this.phase !== 'success' && this.phase !== 'fail') return;

        this.animationFrame++;

        // Speech bubble blinking (0.5s interval = 30 frames at ~60fps)
        this.speechBubbleTimer++;
        if (this.speechBubbleTimer >= 30) {
            this.speechBubbleTimer = 0;
            this.speechBubbleVisible = !this.speechBubbleVisible;
        }

        // Draw mobile scene
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.drawScene();

        this.animationId = requestAnimationFrame(() => this.animate());
    }

    drawScene() {
        const w = this.canvas.width;
        const h = this.canvas.height;

        // Background
        if (this.images.mob_bg) {
            this.ctx.drawImage(this.images.mob_bg, 0, 0, w, h);
        }

        if (this.phase === 'success') {
            // Draw final carrot state (8-10)
            const successImg = this.images.mob_interactions[10];
            if (successImg && successImg.complete) {
                const origW = successImg.naturalWidth;
                const origH = successImg.naturalHeight;
                const scale = w / origW;
                const drawW = w;
                const drawH = origH * scale;
                const drawY = (h - drawH) / 2;
                this.ctx.drawImage(successImg, 0, drawY, drawW, drawH);
            }
            return;
        }

        // Draw current carrot state image
        // carrotCount 10 = index 0, carrotCount 9 = index 1, ... carrotCount 0 = index 10
        const interactionIdx = 10 - this.carrotCount;
        const interactionImg = this.images.mob_interactions[interactionIdx];
        if (interactionImg && interactionImg.complete) {
            // Keep original size, scale to fit canvas width
            const origW = interactionImg.naturalWidth;
            const origH = interactionImg.naturalHeight;
            const scale = w / origW;
            const drawW = w;
            const drawH = origH * scale;
            // Center vertically
            const drawY = (h - drawH) / 2;
            this.ctx.drawImage(interactionImg, 0, drawY, drawW, drawH);
        }
    }

    renderTV() {
        if (!this.tvCtx || !this.tvCanvas) return;

        const w = this.tvCanvas.width;
        const h = this.tvCanvas.height;
        this.tvCtx.clearRect(0, 0, w, h);

        // Background (Use bg1 for success per request)
        const bgImg = this.images.tv_bg;
        if (bgImg && bgImg.complete) {
            this.tvCtx.drawImage(bgImg, 0, 0, w, h);
        }

        if (this.phase === 'success' || this.phase === 'fail') {
            // Draw background elements
            if (this.phase === 'success') {
                // For success, draw the big basket and carrots over bg2
                this.drawTVGameElements(w, h);
            } else if (this.phase === 'fail') {
                this.drawTVFailState(w, h);
            }
            return;
        }

        this.drawTVGameElements(w, h);
    }

    drawTVGameElements(w, h) {
        // Compute basket dimensions first (needed for both carrot and basket draw)
        if (this.images.tv_basket && this.images.tv_basket.complete) {
            const basketImg = this.images.tv_basket;
            const origW = basketImg.naturalWidth;
            const origH = basketImg.naturalHeight;
            const maxH = h * 0.55;
            const scale = maxH / origH;
            const drawW = origW * scale;
            const drawH = origH * scale;
            const bx = w * 0.15;
            const by = h - drawH - h * 0.02;

            // 1. Draw carrots FIRST (so basket frame renders on top)
            this.drawTVBasketCarrots(bx, by, drawW, drawH);

            // 2. Draw basket ON TOP (frame covers carrot edges → looks inside)
            this.tvCtx.drawImage(basketImg, bx, by, drawW, drawH);
        }

        if (this.phase === 'waiting') {
            // Show farmer (character 1-1) next to basket on the right (much larger)
            if (this.images.tv_char1_1 && this.images.tv_char1_1.complete) {
                const charImg = this.images.tv_char1_1;
                const origW = charImg.naturalWidth;
                const origH = charImg.naturalHeight;
                const maxH = h * 0.85;
                const scale = maxH / origH;
                const drawW = origW * scale;
                const drawH = origH * scale;
                const cx = w * 0.74 - drawW / 2;
                const cy = h - drawH - h * 0.06;
                this.tvCtx.drawImage(charImg, cx, cy, drawW, drawH);

                // Speech bubble (blinking) twice as big and lowered
                if (this.speechBubbleVisible && this.images.tv_char1_2 && this.images.tv_char1_2.complete) {
                    const bubbleImg = this.images.tv_char1_2;
                    const bOrigW = bubbleImg.naturalWidth;
                    const bOrigH = bubbleImg.naturalHeight;
                    const bScale = (h * 0.70) / bOrigH;
                    const bDrawW = bOrigW * bScale;
                    const bDrawH = bOrigH * bScale;
                    const bx2 = cx + drawW * 0.15;
                    const by2 = cy - bDrawH * 0.05;
                    this.tvCtx.drawImage(bubbleImg, bx2, by2, bDrawW, bDrawH);
                }
            }
        } else if (this.phase === 'playing') {
            // Show alternating farmer character 2-1 / 2-2 (much larger)
            const charKey = this.tvCharFrame === 1 ? 'tv_char2_1' : 'tv_char2_2';
            const charImg = this.images[charKey];
            if (charImg && charImg.complete) {
                const origW = charImg.naturalWidth;
                const origH = charImg.naturalHeight;
                const maxH = h * 0.85;
                const scale = maxH / origH;
                const drawW = origW * scale;
                const drawH = origH * scale;
                const cx = w * 0.74 - drawW / 2;
                const cy = h - drawH - h * 0.06;
                this.tvCtx.drawImage(charImg, cx, cy, drawW, drawH);
            }
        } else if (this.phase === 'success') {
            // Success farmer (character 3)
            const charImg = this.images.tv_char3;
            if (charImg && charImg.complete) {
                const origW = charImg.naturalWidth;
                const origH = charImg.naturalHeight;
                const maxH = h * 1.2;
                const scale = maxH / origH;
                const drawW = origW * scale;
                const drawH = origH * scale;
                const cx = w * 0.74 - drawW / 2;
                const cy = h - drawH + h * 0.15;
                this.tvCtx.drawImage(charImg, cx, cy, drawW, drawH);
            }
        }
    }

    drawTVFailState(w, h) {
        // Compute basket dimensions
        if (this.images.tv_basket && this.images.tv_basket.complete) {
            const basketImg = this.images.tv_basket;
            const origW = basketImg.naturalWidth;
            const origH = basketImg.naturalHeight;
            const maxH = h * 0.55;
            const scale = maxH / origH;
            const drawW = origW * scale;
            const drawH = origH * scale;
            const bx = w * 0.15;
            const by = h - drawH - h * 0.02;

            // Carrots first, basket frame on top
            this.drawTVBasketCarrots(bx, by, drawW, drawH);
            this.tvCtx.drawImage(basketImg, bx, by, drawW, drawH);
        }

        // Show fail character (2-3) next to basket (much larger)
        const charImg = this.images.tv_char2_3;
        if (charImg && charImg.complete) {
            const origW = charImg.naturalWidth;
            const origH = charImg.naturalHeight;
            const maxH = h * 0.80;
            const scale = maxH / origH;
            const drawW = origW * scale;
            const drawH = origH * scale;
            const cx = w * 0.70 - drawW / 2;
            const cy = h - drawH - h * 0.01;
            this.tvCtx.drawImage(charImg, cx, cy, drawW, drawH);
        }
    }

    drawTVBasketCarrots(basketX, basketY, basketW, basketH) {
        if (this.tvCarrots.length === 0) return;

        for (let i = 0; i < this.tvCarrots.length; i++) {
            const carrotObj = this.tvCarrots[i];
            const carrotImg = this.images[carrotObj.key];
            if (!carrotImg || !carrotImg.complete) continue;

            const origW = carrotImg.naturalWidth;
            const origH = carrotImg.naturalHeight;

            // Original size: 75~85% of basket height
            const scaleFactor = 0.75 + (carrotObj.rndScale || 0) * 0.10;
            const maxCarrotH = basketH * scaleFactor;
            const scale = maxCarrotH / origH;
            const drawW = origW * scale;
            const drawH = origH * scale;

            // X: distributed within basket width
            const carrotAreaX = basketX + basketW * 0.05;
            const carrotAreaW = basketW * 0.90;
            const cx = carrotAreaX + carrotObj.xPos * (carrotAreaW - drawW);

            // Y: stack from basket bottom upward, 2 rows
            const row = Math.floor(i / 5);
            const cy = basketY + basketH * 0.95 - drawH
                - (row * drawH * 0.40);

            this.tvCtx.save();
            this.tvCtx.translate(cx + drawW / 2, cy + drawH / 2);
            this.tvCtx.rotate(carrotObj.rotation);
            this.tvCtx.drawImage(carrotImg, -drawW / 2, -drawH / 2, drawW, drawH);
            this.tvCtx.restore();
        }
    }


    onButtonDown(x, y) {
        if (!this.isActive || this.gameEnded) return;

        // First touch transitions from waiting to playing
        if (this.phase === 'waiting') {
            this.phase = 'playing';
        }

        if (this.phase !== 'playing') return;

        // Decrement carrot count
        this.carrotCount--;
        this.touchCount++;

        // Toggle TV character frame
        this.tvCharFrame = this.tvCharFrame === 1 ? 2 : 1;

        // Add carrot to TV basket with structured but varied positions (Column/Row pattern)
        const carrotKey = (this.tvCarrots.length % 2 === 0) ? 'tv_int7_1' : 'tv_int7_2';
        const col = this.tvCarrots.length % 5;
        const row = Math.floor(this.tvCarrots.length / 5);

        this.tvCarrots.push({
            key: carrotKey,
            xPos: (col / 4) * 0.85 + 0.075 + (Math.random() - 0.5) * 0.05, // Spread across width
            yPos: row * 0.4 + (Math.random() * 0.15), // Two distinct layers
            rotation: (Math.random() - 0.5) * 0.5, // Natural tilt
            rndScale: Math.random()
        });

        // Play tap sound
        audioManager.playSFX('click');

        // Check if all carrots picked
        if (this.carrotCount <= 0) {
            // Success!
            this.phase = 'success';
            this.gameEnded = true;
            this.successStartTime = Date.now();
            gameTimer.stop(); // Stop timer immediately on success
            audioManager.playSuccess();

            setTimeout(() => {
                this.isActive = false;
                gameController.endGame(true);
            }, 2000);
        }
    }

    onButtonUp() { }

    onTimeout() {
        if (this.gameEnded) return;

        this.phase = 'fail';
        this.gameEnded = true;
        audioManager.playFail();

        setTimeout(() => {
            this.isActive = false;
            gameController.endGame(false);
        }, 1500);
    }

    cleanup() {
        this.isActive = false;
        if (this.animationId) cancelAnimationFrame(this.animationId);
    }
}

const game17Carrot = new Game17Carrot();
// Start loading images immediately
game17Carrot.loadImages();

document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        if (typeof gameController !== 'undefined') gameController.registerGame(17, game17Carrot);
    }, 100);
});
