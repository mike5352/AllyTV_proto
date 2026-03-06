/**
 * Game 28: 같은 모양 간식 찾기! (Find the Same Shape Snack!)
 * - Line-drawing matching game
 * - Left donuts (1,2,3) match to right shapes (a,b,c)
 * - Correct answers: donut_1↔donut_a, donut_2↔donut_b, donut_3↔donut_c
 * - Lines appear 1/3 at a time with animation
 * - Left items fixed, right items selectable
 * - Positions randomized within each side
 */
class Game28Donut {
    constructor() {
        this.ctx = null;
        this.canvas = null;
        this.tvCtx = null;
        this.tvCanvas = null;
        this.isActive = false;
        this.gameEnded = false;

        // Game state
        this.selectedLeft = null; // index of selected left donut
        this.matches = []; // completed matches: [{leftIdx, rightIdx, progress}]
        this.currentLineProgress = 0; // 0~3 animation steps for current line
        this.lineAnimTimer = null;

        // Positions (will be randomized)
        this.leftOrder = []; // shuffled indices [0,1,2] for donut_1,2,3
        this.rightOrder = []; // shuffled indices [0,1,2] for donut_a,b,c

        // Layout constants (percentages)
        this.leftX = 0.22;
        this.rightX = 0.78;
        this.yPositions = [0.28, 0.52, 0.76];
        this.itemSize = 0.13; // percentage of canvas width (decreased by 10% from 0.18)
        this.dotSize = 12; // dot pixel size
        this.dotGap = 0.04; // gap between item edge and dot (percentage of canvas width)

        // TV state
        this.tvCharacterState = 'normal'; // 'normal', 'success', 'fail'
        this.showInteraction1 = false;
        this.showInteraction2 = false;

        // Waddle state
        this.waddleTimers = {
            left: [0, 0, 0],
            right: [0, 0, 0]
        };

        // TV bottle wobble
        this.bottleWobblePhases = [0, 0, 0, 0]; // bottle_l1, r1, r2, r3
        this.wobbleActive = true;

        // Images
        this.images = {};
        this.imagesLoaded = false;
    }

    loadImages() {
        return new Promise((resolve) => {
            const basePath = 'assets/Ally8_donut/Ally8_resource/';
            const interactionPath = 'assets/Ally8_donut/Ally8_interaction/';

            const toLoad = {
                // Mobile
                mobBg: basePath + 'mobile/mob_Ally8_donut_bg 01.png',
                mob_donut_1: basePath + 'mobile/mob_donut_1.png',
                mob_donut_2: basePath + 'mobile/mob_donut_2.png',
                mob_donut_3: basePath + 'mobile/mob_donut_3.png',
                mob_donut_a: basePath + 'mobile/mob_donut_a.png',
                mob_donut_b: basePath + 'mobile/mob_donut_b.png',
                mob_donut_c: basePath + 'mobile/mob_donut_c.png',
                mob_ellipse: basePath + 'mobile/mob_ellipse.png',
                // Also load the "donut - Group" versions for display
                mob_donut_1g: basePath + 'mobile/donut - Group/mob_donut_1.png',
                mob_donut_2g: basePath + 'mobile/donut - Group/mob_donut_2.png',
                mob_donut_3g: basePath + 'mobile/donut - Group/mob_donut_3.png',
                mob_donut_ag: basePath + 'mobile/donut - Group/mob_donut_a.png',
                mob_donut_bg: basePath + 'mobile/donut - Group/mob_donut_b.png',
                mob_donut_cg: basePath + 'mobile/donut - Group/mob_donut_c.png',
                // TV
                tvBg: basePath + 'tv/tv_Ally8_donut_bg1.png',
                tvCharNormal: basePath + 'tv/tv_character 1_1.png',
                tvCharSuccess: basePath + 'tv/tv_character 1_2.png',
                tvCharFail: basePath + 'tv/tv_character 1_3.png',
                bottle_l1: basePath + 'tv/bottle_l1.png',
                bottle_r1: basePath + 'tv/bottle_r1.png',
                bottle_r2: basePath + 'tv/bottle_r2.png',
                bottle_r3: basePath + 'tv/bottle_r3.png',
                // Interactions
                interaction1: interactionPath + 'interaction 8-1.png',
                interaction2: interactionPath + 'interaction 8-2.png'
            };

            let loaded = 0;
            const total = Object.keys(toLoad).length;

            Object.entries(toLoad).forEach(([key, src]) => {
                const img = new Image();
                img.src = src;
                img.onload = () => {
                    this.images[key] = img;
                    loaded++;
                    if (loaded >= total) {
                        this.imagesLoaded = true;
                        resolve();
                    }
                };
                img.onerror = () => {
                    console.warn(`Failed to load: ${src}`);
                    loaded++;
                    if (loaded >= total) {
                        this.imagesLoaded = true;
                        resolve();
                    }
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
        this.selectedLeft = null;
        this.matches = [];
        this.currentLineProgress = 0;
        this.tvCharacterState = 'normal';
        this.showInteraction1 = false;
        this.showInteraction2 = false;
        this.wobbleActive = true;
        this.waddleTimers = { left: [0, 0, 0], right: [0, 0, 0] };
        this.bottleWobblePhases = [
            Math.random() * Math.PI * 2,
            Math.random() * Math.PI * 2,
            Math.random() * Math.PI * 2,
            Math.random() * Math.PI * 2
        ];

        // Randomize positions
        this.leftOrder = this.shuffle([0, 1, 2]);
        this.rightOrder = this.shuffle([0, 1, 2]);

        if (!this.imagesLoaded) {
            await this.loadImages();
        }

        this.animate();
    }

    shuffle(arr) {
        const a = [...arr];
        for (let i = a.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [a[i], a[j]] = [a[j], a[i]];
        }
        return a;
    }

    animate() {
        if (!this.isActive) return;

        // Update waddle timers
        for (let i = 0; i < 3; i++) {
            if (this.waddleTimers.left[i] > 0) this.waddleTimers.left[i]--;
            if (this.waddleTimers.right[i] > 0) this.waddleTimers.right[i]--;
        }

        this.drawScene();
        this.renderTV();

        requestAnimationFrame(() => this.animate());
    }

    getLeftDonutImage(donutIndex) {
        // donutIndex: 0=donut_1, 1=donut_2, 2=donut_3
        const keys = ['mob_donut_1', 'mob_donut_2', 'mob_donut_3'];
        return this.images[keys[donutIndex]] || null;
    }

    getRightDonutImage(donutIndex) {
        // donutIndex: 0=donut_a, 1=donut_b, 2=donut_c
        const keys = ['mob_donut_a', 'mob_donut_b', 'mob_donut_c'];
        return this.images[keys[donutIndex]] || null;
    }

    // Get dot position for left item (right side of donut)
    getLeftDotPos(w, h, posIdx) {
        return {
            x: w * (this.leftX + this.itemSize / 2 + this.dotGap),
            y: h * this.yPositions[posIdx]
        };
    }

    // Get dot position for right item (left side of shape)
    getRightDotPos(w, h, posIdx) {
        return {
            x: w * (this.rightX - this.itemSize / 2 - this.dotGap),
            y: h * this.yPositions[posIdx]
        };
    }

    drawScene() {
        if (!this.ctx) return;
        const w = this.canvas.width;
        const h = this.canvas.height;

        this.ctx.clearRect(0, 0, w, h);

        // Background
        if (this.images.mobBg) {
            this.ctx.drawImage(this.images.mobBg, 0, 0, w, h);
        } else {
            this.ctx.fillStyle = '#F8BBD0';
            this.ctx.fillRect(0, 0, w, h);
        }

        const itemW = w * this.itemSize;
        const ds = this.dotSize;

        // Draw completed match lines (behind dots and items)
        this.matches.forEach(match => {
            this.drawLine(this.ctx, w, h, match.leftIdx, match.rightIdx, match.progress);
        });

        // Draw left donuts + their right-side dots
        for (let i = 0; i < 3; i++) {
            const donutIdx = this.leftOrder[i];
            const img = this.getLeftDonutImage(donutIdx);
            const x = w * this.leftX;
            const y = h * this.yPositions[i];

            // Draw donut image
            if (img) {
                const drawW = itemW;
                const ratio = img.height / img.width;
                const drawH = drawW * ratio;

                this.ctx.save();
                this.ctx.translate(x, y);

                // Waddle effect
                if (this.waddleTimers.left[i] > 0) {
                    const rotation = Math.sin(this.waddleTimers.left[i] * 0.5) * 0.15;
                    this.ctx.rotate(rotation);
                }

                // Highlight if selected
                if (this.selectedLeft === i) {
                    this.ctx.shadowColor = '#FFFF00';
                    this.ctx.shadowBlur = 15;
                }

                this.ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
                this.ctx.restore();
            }

            // Draw dot on right side of donut
            const dotPos = this.getLeftDotPos(w, h, i);
            if (this.images.mob_ellipse) {
                this.ctx.drawImage(this.images.mob_ellipse, dotPos.x - ds / 2, dotPos.y - ds / 2, ds, ds);
            } else {
                this.ctx.beginPath();
                this.ctx.arc(dotPos.x, dotPos.y, 5, 0, Math.PI * 2);
                this.ctx.fillStyle = '#000';
                this.ctx.fill();
            }
        }

        // Draw right shapes + their left-side dots
        for (let i = 0; i < 3; i++) {
            const donutIdx = this.rightOrder[i];
            const img = this.getRightDonutImage(donutIdx);
            const x = w * this.rightX;
            const y = h * this.yPositions[i];

            // Draw shape image
            if (img) {
                const drawW = itemW;
                const ratio = img.height / img.width;
                const drawH = drawW * ratio;

                this.ctx.save();
                this.ctx.translate(x, y);

                // Waddle effect
                if (this.waddleTimers.right[i] > 0) {
                    const rotation = Math.sin(this.waddleTimers.right[i] * 0.5) * 0.15;
                    this.ctx.rotate(rotation);
                }

                this.ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
                this.ctx.restore();
            }

            // Draw dot on left side of shape
            const dotPos = this.getRightDotPos(w, h, i);
            if (this.images.mob_ellipse) {
                this.ctx.drawImage(this.images.mob_ellipse, dotPos.x - ds / 2, dotPos.y - ds / 2, ds, ds);
            } else {
                this.ctx.beginPath();
                this.ctx.arc(dotPos.x, dotPos.y, 5, 0, Math.PI * 2);
                this.ctx.fillStyle = '#000';
                this.ctx.fill();
            }
        }
    }

    drawLine(ctx, w, h, leftPositionIdx, rightPositionIdx, progress) {
        // progress: 1=1/3, 2=2/3, 3=full
        if (progress <= 0) return;

        // Line connects from left dot to right dot
        const startPos = this.getLeftDotPos(w, h, leftPositionIdx);
        const endPos = this.getRightDotPos(w, h, rightPositionIdx);

        const totalDx = endPos.x - startPos.x;
        const totalDy = endPos.y - startPos.y;

        let drawEndX, drawEndY;
        if (progress >= 3) {
            drawEndX = endPos.x;
            drawEndY = endPos.y;
        } else if (progress === 2) {
            drawEndX = startPos.x + totalDx * (2 / 3);
            drawEndY = startPos.y + totalDy * (2 / 3);
        } else {
            drawEndX = startPos.x + totalDx * (1 / 3);
            drawEndY = startPos.y + totalDy * (1 / 3);
        }

        ctx.save();
        ctx.strokeStyle = '#FFFF00';
        ctx.lineWidth = 7;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(startPos.x, startPos.y);
        ctx.lineTo(drawEndX, drawEndY);
        ctx.stroke();
        ctx.restore();
    }

    renderTV() {
        if (!this.tvCtx || !this.tvCanvas) return;
        const w = this.tvCanvas.width;
        const h = this.tvCanvas.height;

        this.tvCtx.clearRect(0, 0, w, h);

        // TV Background
        if (this.images.tvBg) {
            this.tvCtx.drawImage(this.images.tvBg, 0, 0, w, h);
        }

        // Bottles with wobble
        const time = Date.now() * 0.003;

        // bottle_l1 - left shelf (small shelf, upper-left area)
        if (this.images.bottle_l1) {
            this.tvCtx.save();
            const bw = w * 0.12;
            const ratio = this.images.bottle_l1.height / this.images.bottle_l1.width;
            const bh = bw * ratio;
            const bx = w * 0.06;
            const by = h * 0.24;
            this.tvCtx.translate(bx + bw / 2, by + bh);
            if (this.wobbleActive) {
                this.tvCtx.rotate(Math.sin(time + this.bottleWobblePhases[0]) * 0.04);
            }
            this.tvCtx.drawImage(this.images.bottle_l1, -bw / 2, -bh, bw, bh);
            this.tvCtx.restore();
        }

        // bottle_r1 - right shelf top (first item on upper right shelf)
        if (this.images.bottle_r1) {
            this.tvCtx.save();
            const bw = w * 0.10;
            const ratio = this.images.bottle_r1.height / this.images.bottle_r1.width;
            const bh = bw * ratio;
            const bx = w * 0.73;
            const by = h * 0.26;
            this.tvCtx.translate(bx + bw / 2, by + bh);
            if (this.wobbleActive) {
                this.tvCtx.rotate(Math.sin(time * 0.8 + this.bottleWobblePhases[1]) * 0.04);
            }
            this.tvCtx.drawImage(this.images.bottle_r1, -bw / 2, -bh, bw, bh);
            this.tvCtx.restore();
        }

        // bottle_r2 - right shelf top (second item, next to r1)
        if (this.images.bottle_r2) {
            this.tvCtx.save();
            const bw = w * 0.12;
            const ratio = this.images.bottle_r2.height / this.images.bottle_r2.width;
            const bh = bw * ratio;
            const bx = w * 0.82;
            const by = h * 0.19;
            this.tvCtx.translate(bx + bw / 2, by + bh);
            if (this.wobbleActive) {
                this.tvCtx.rotate(Math.sin(time * 1.1 + this.bottleWobblePhases[2]) * 0.05);
            }
            this.tvCtx.drawImage(this.images.bottle_r2, -bw / 2, -bh, bw, bh);
            this.tvCtx.restore();
        }

        // bottle_r3 - right shelf bottom (below upper shelf)
        if (this.images.bottle_r3) {
            this.tvCtx.save();
            const bw = w * 0.18;
            const ratio = this.images.bottle_r3.height / this.images.bottle_r3.width;
            const bh = bw * ratio;
            const bx = w * 0.72;
            const by = h * 0.45;
            this.tvCtx.translate(bx + bw / 2, by + bh);
            if (this.wobbleActive) {
                this.tvCtx.rotate(Math.sin(time * 0.7 + this.bottleWobblePhases[3]) * 0.04);
            }
            this.tvCtx.drawImage(this.images.bottle_r3, -bw / 2, -bh, bw, bh);
            this.tvCtx.restore();
        }

        // Character - large, centered
        let charImg = this.images.tvCharNormal;
        if (this.tvCharacterState === 'success') charImg = this.images.tvCharSuccess;
        if (this.tvCharacterState === 'fail') charImg = this.images.tvCharFail;

        if (charImg) {
            const cw = w * 0.45;
            const ratio = charImg.height / charImg.width;
            const ch = cw * ratio;
            const cx = (w - cw) / 2;  // centered horizontally
            const cy = h * 0.06;
            this.tvCtx.drawImage(charImg, cx, cy, cw, ch);

            // Success interactions (sparkles around character)
            if (this.showInteraction1 && this.images.interaction1) {
                const iw = w * 0.55;
                const ir = this.images.interaction1.height / this.images.interaction1.width;
                const ih = iw * ir;
                this.tvCtx.drawImage(this.images.interaction1, cx - w * 0.05, cy, iw, ih);
            }
            if (this.showInteraction2 && this.images.interaction2) {
                const iw = w * 0.60;
                const ir = this.images.interaction2.height / this.images.interaction2.width;
                const ih = iw * ir;
                this.tvCtx.drawImage(this.images.interaction2, cx - w * 0.08, cy - h * 0.02, iw, ih);
            }
        }

        // TV is independent from phone - no game board mirroring
    }

    // Rectangular hit test: check if (x,y) is within the item's drawn bounds
    hitTestItem(x, y, centerX, centerY, img, itemW) {
        if (!img) return false;
        const drawW = itemW;
        const ratio = img.height / img.width;
        const drawH = drawW * ratio;
        const left = centerX - drawW / 2;
        const top = centerY - drawH / 2;
        return x >= left && x <= left + drawW && y >= top && y <= top + drawH;
    }

    onButtonDown(x, y) {
        if (!this.isActive || this.gameEnded) return;

        const w = this.canvas.width;
        const h = this.canvas.height;
        const itemW = w * this.itemSize;

        // Check if clicking on a left donut (rectangular hit test)
        for (let i = 0; i < 3; i++) {
            const lx = w * this.leftX;
            const ly = h * this.yPositions[i];
            const donutIdx = this.leftOrder[i];
            const img = this.getLeftDonutImage(donutIdx);

            if (this.hitTestItem(x, y, lx, ly, img, itemW)) {
                // Check if this left position is already matched
                const alreadyMatched = this.matches.some(m => m.leftIdx === i);
                if (alreadyMatched) return;

                // Allow changing left selection at any time (even during line animation)
                this.selectedLeft = i;
                this.waddleTimers.left[i] = 30;
                audioManager.playSFX('click');
                return;
            }
        }

        // Check if clicking on a right shape (rectangular hit test)
        for (let i = 0; i < 3; i++) {
            const rx = w * this.rightX;
            const ry = h * this.yPositions[i];
            const donutIdx = this.rightOrder[i];
            const img = this.getRightDonutImage(donutIdx);

            if (this.hitTestItem(x, y, rx, ry, img, itemW)) {
                // Check if this right position is already matched
                const alreadyMatched = this.matches.some(m => m.rightIdx === i);
                if (alreadyMatched) return;

                this.waddleTimers.right[i] = 30;

                if (this.selectedLeft === null) {
                    // No left selected yet - ignore right click
                    return;
                }

                // Check if the match is correct
                const leftDonutId = this.leftOrder[this.selectedLeft]; // 0, 1, or 2
                const rightDonutId = this.rightOrder[i]; // 0, 1, or 2

                if (leftDonutId === rightDonutId) {
                    // Correct match!
                    audioManager.playSFX('ding');
                    this.startLineAnimation(this.selectedLeft, i);
                    this.selectedLeft = null;
                } else {
                    // Wrong match - fail!
                    audioManager.playFail();
                    this.fail();
                }
                return;
            }
        }
    }

    startLineAnimation(leftIdx, rightIdx) {
        const match = { leftIdx, rightIdx, progress: 0 };
        this.matches.push(match);

        // Animate line in 3 steps: 1/3 → 2/3 → 3/3
        const animateStep = (step) => {
            if (!this.isActive) return;
            match.progress = step;
            if (step < 3) {
                setTimeout(() => animateStep(step + 1), 80);
            } else {
                // Line complete - check if all 3 pairs matched
                if (this.matches.length === 3 && this.matches.every(m => m.progress === 3)) {
                    this.succeed();
                }
            }
        };

        animateStep(1);
    }

    succeed() {
        if (this.gameEnded) return;
        this.gameEnded = true;
        this.wobbleActive = false;
        gameTimer.stop();

        this.tvCharacterState = 'success';
        audioManager.playSFX('ding');
        audioManager.playSuccess();

        // Interaction animation sequence
        setTimeout(() => { this.showInteraction1 = true; }, 300);
        setTimeout(() => { this.showInteraction2 = true; }, 1000);

        setTimeout(() => gameController.endGame(true), 2500);
    }

    fail() {
        if (this.gameEnded) return;
        this.gameEnded = true;
        this.wobbleActive = false;
        this.tvCharacterState = 'fail';

        audioManager.playFail();
        setTimeout(() => gameController.endGame(false), 1000);
    }

    onButtonUp() { }

    onTimeout() {
        if (!this.gameEnded) {
            this.fail();
        }
    }

    cleanup() {
        this.isActive = false;
        this.wobbleActive = false;
        this.showInteraction1 = false;
        this.showInteraction2 = false;
    }
}

// Instantiate and register
const game28Donut = new Game28Donut();
if (typeof gameController !== 'undefined') {
    gameController.registerGame(28, game28Donut);
} else {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => {
            if (typeof gameController !== 'undefined') {
                gameController.registerGame(28, game28Donut);
            }
        }, 100);
    });
}
