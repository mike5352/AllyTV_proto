/**
 * Game 11: 양치질 (Brushing Teeth)
 * TV와 모바일이 별도 이미지로 렌더됩니다.
 * 터치 횟수에 따라 상태 테이블을 참고하여 각 화면에 맞는 이미지를 표시합니다.
 */
class Game11BrushingTeeth {
    constructor() {
        // Mobile canvas
        this.ctx = null;
        this.canvas = null;

        // TV canvas
        this.tvCtx = null;
        this.tvCanvas = null;

        this.isActive = false;
        this.gameEnded = false;
        this.animationId = null;

        this.touchCount = 0;
        this.requiredTouches = 0;

        // phase: 'playing' | 'success1' | 'success2' | 'fail1' | 'fail2'
        this.phase = 'playing';

        this.images = {};
        this.imagesLoaded = false;
    }

    loadImages() {
        return new Promise((resolve) => {
            const baseMob = './assets/Ally1_brushing teeth/Ally1_resource/Ally1_resource/mobile/';
            const baseTV = './assets/Ally1_brushing teeth/Ally1_resource/Ally1_resource/tv/';
            const baseInt = './assets/Ally1_brushing teeth/Ally1_resource/';

            const imageSources = {
                // Mobile backgrounds
                mob_0: baseMob + 'mob_toothbrush 0.png',
                mob_1_0: baseMob + 'mob_toothbrush 1-0.png',
                mob_1_1: baseMob + 'mob_toothbrush 1-1.png',
                mob_1_2: baseMob + 'mob_toothbrush 1-2.png',
                mob_1_3: baseMob + 'mob_toothbrush 1-3.png',
                mob_1_4: baseMob + 'mob_toothbrush 1-4.png',
                mob_1_5: baseMob + 'mob_toothbrush 1-5.png',
                mob_1_6: baseMob + 'mob_toothbrush 1-6.png',
                mob_fail: baseMob + 'mob_toothbrush fail.png',
                mob_success: baseMob + 'mob_toothbrush success.png',

                // TV backgrounds
                tv_1_0: baseTV + 'tv_toothbrush 1-0.png',
                tv_1_1: baseTV + 'tv_toothbrush 1-1.png',
                tv_1_2: baseTV + 'tv_toothbrush 1-2.png',
                tv_1_3: baseTV + 'tv_toothbrush 1-3.png',
                tv_fail: baseTV + 'tv_toothbrush fail.png',
                tv_final_fail: baseTV + 'tv_toothbrush final(fail).png',
                tv_success: baseTV + 'tv_toothbrush success.png',
                tv_final_success: baseTV + 'tv_toothbrush final(success).png',

                // TV interaction overlays
                tv_int1_1: baseInt + 'tv_interaction 1-1.png',
                tv_int1_2: baseInt + 'tv_interaction 1-2.png',
                tv_int1_3: baseInt + 'tv_interaction 1-3.png',
                tv_int2_1: baseInt + 'tv_interaction 2-1.png',
                tv_int2_2: baseInt + 'tv_interaction 2-2.png',
            };

            const total = Object.keys(imageSources).length;
            let loaded = 0;

            Object.entries(imageSources).forEach(([key, src]) => {
                const img = new Image();
                img.onload = () => {
                    this.images[key] = img;
                    loaded++;
                    if (loaded === total) { this.imagesLoaded = true; resolve(); }
                };
                img.onerror = () => {
                    console.error(`Failed to load: ${src}`);
                    loaded++;
                    if (loaded === total) { this.imagesLoaded = true; resolve(); }
                };
                img.src = src;
            });
        });
    }

    init(ctx, canvas, container, tvCtx, tvCanvas) {
        this.ctx = ctx;
        this.canvas = canvas;
        this.tvCtx = tvCtx || null;
        this.tvCanvas = tvCanvas || null;
        if (!this.imagesLoaded) {
            this.loadImages();
        }
    }

    start() {
        this.isActive = true;
        this.gameEnded = false;
        this.touchCount = 0;
        this.phase = 'playing';
        this.requiredTouches = Math.floor(Math.random() * 4) + 7; // 7~10
        console.log('[Ally1] Required touches:', this.requiredTouches);

        this.renderMobile();
        this.renderTV();
        this.animationId = requestAnimationFrame(() => this.animate());
    }

    animate() {
        if (!this.isActive) return;
        this.renderMobile();
        this.renderTV();
        this.animationId = requestAnimationFrame(() => this.animate());
    }

    // ─────────────────────────────────────────
    // Mobile rendering
    // ─────────────────────────────────────────
    renderMobile() {
        if (!this.ctx || !this.canvas) return;
        const w = this.canvas.width;
        const h = this.canvas.height;
        this.ctx.clearRect(0, 0, w, h);

        let imgKey = null;

        if (this.phase === 'fail1' || this.phase === 'fail2') {
            imgKey = 'mob_fail';
        } else if (this.phase === 'success1' || this.phase === 'success2') {
            imgKey = 'mob_success';
        } else {
            // playing - map touch count to mobile image
            const t = Math.min(this.touchCount, 7);
            const mobMap = {
                0: 'mob_0',
                1: 'mob_1_0',
                2: 'mob_1_1',
                3: 'mob_1_2',
                4: 'mob_1_3',
                5: 'mob_1_4',
                6: 'mob_1_5',
                7: 'mob_1_6',
            };
            imgKey = mobMap[t];
        }

        const img = this.images[imgKey];
        if (img && img.complete) {
            this.ctx.drawImage(img, 0, 0, w, h);
        }
    }

    // ─────────────────────────────────────────
    // TV rendering
    // ─────────────────────────────────────────
    renderTV() {
        if (!this.tvCtx || !this.tvCanvas) return;
        const w = this.tvCanvas.width;
        const h = this.tvCanvas.height;
        this.tvCtx.clearRect(0, 0, w, h);

        let bgKey = null;
        let overlayKeys = [];

        if (this.phase === 'fail1') {
            bgKey = 'tv_fail';
        } else if (this.phase === 'fail2') {
            bgKey = 'tv_final_fail';
        } else if (this.phase === 'success1') {
            bgKey = 'tv_success';
            overlayKeys = ['tv_int2_1'];
        } else if (this.phase === 'success2') {
            bgKey = 'tv_final_success';
            overlayKeys = ['tv_int2_1', 'tv_int2_2'];
        } else {
            // playing - map touch count
            const t = Math.min(this.touchCount, 7);

            // TV background changes at: 0→1-0, 1→1-1, 3→1-2, 5→1-3
            // Even-numbered touches keep previous background
            if (t === 0) { bgKey = 'tv_1_0'; }
            else if (t === 1) { bgKey = 'tv_1_1'; }
            else if (t === 2) { bgKey = 'tv_1_1'; } // retain
            else if (t === 3) { bgKey = 'tv_1_2'; }
            else if (t === 4) { bgKey = 'tv_1_2'; } // retain
            else if (t === 5) { bgKey = 'tv_1_3'; }
            else if (t >= 6) { bgKey = 'tv_1_3'; } // retain

            // TV interaction overlays
            if (t === 2) overlayKeys = ['tv_int1_1'];
            else if (t === 4) overlayKeys = ['tv_int1_1', 'tv_int1_2'];
            else if (t === 7) overlayKeys = ['tv_int1_3'];
        }

        // Draw TV background
        const bgImg = this.images[bgKey];
        if (bgImg && bgImg.complete) {
            this.tvCtx.drawImage(bgImg, 0, 0, w, h);
        }

        // Draw TV interaction overlays
        this._drawTVOverlays(overlayKeys, w, h);
    }

    /**
     * Draw TV interaction overlay images using per-image fixed positions.
     * Positions match the reference screenshots.
     */
    _drawTVOverlays(keys, w, h) {
        if (!keys || keys.length === 0) return;

        // Per-image layout definition:
        // cx, cy = center point as fraction of canvas size
        // pH = height as fraction of canvas height
        const layout = {
            // touch 2,4: moved further left
            'tv_int1_1': { cx: 0.34, cy: 0.25, pH: 0.35 },
            'tv_int1_2': { cx: 0.45, cy: 0.68, pH: 0.60 },
            'tv_int1_3': { cx: 0.32, cy: 0.60, pH: 0.45 },

            // success sparkles restored to original positions
            'tv_int2_1': { cx: 0.22, cy: 0.30, pH: 0.40 },
            'tv_int2_2': { cx: 0.78, cy: 0.55, pH: 0.35 },
        };

        keys.forEach(key => {
            const img = this.images[key];
            if (!img || !img.complete) return;

            const pos = layout[key];
            if (!pos) return;

            const origW = img.naturalWidth;
            const origH = img.naturalHeight;
            const drawH = h * pos.pH;
            const scale = drawH / origH;
            const drawW = origW * scale;

            const x = w * pos.cx - drawW / 2;
            const y = h * pos.cy - drawH / 2;

            this.tvCtx.drawImage(img, x, y, drawW, drawH);
        });
    }

    // ─────────────────────────────────────────
    // Input
    // ─────────────────────────────────────────
    onButtonDown(x, y) {
        if (!this.isActive || this.gameEnded) return;

        this.touchCount++;
        audioManager.playSFX('click');
        console.log('[Ally1] Touch:', this.touchCount, '/ Required:', this.requiredTouches);

        // Check success condition
        if (this.touchCount >= this.requiredTouches) {
            this.succeed();
            return;
        }

        // Update both screens
        this.renderMobile();
        this.renderTV();
    }

    onButtonUp() { }

    onTimeout() {
        if (!this.gameEnded) this.fail();
    }

    // ─────────────────────────────────────────
    // Success / Fail sequences
    // ─────────────────────────────────────────
    succeed() {
        if (this.gameEnded) return;
        this.gameEnded = true;
        gameTimer.stop(); // Stop timer immediately on success
        audioManager.playSuccess();

        // Step 1: success1
        this.phase = 'success1';
        this.renderMobile();
        this.renderTV();

        setTimeout(() => {
            // Step 2: success2
            this.phase = 'success2';
            this.renderMobile();
            this.renderTV();

            setTimeout(() => {
                this.isActive = false;
                gameController.endGame(true);
            }, 1000);
        }, 1000);
    }

    fail() {
        if (this.gameEnded) return;
        this.gameEnded = true;
        audioManager.playFail();

        // Step 1: fail1
        this.phase = 'fail1';
        this.renderMobile();
        this.renderTV();

        setTimeout(() => {
            // Step 2: fail2
            this.phase = 'fail2';
            this.renderMobile();
            this.renderTV();

            setTimeout(() => {
                this.isActive = false;
                gameController.endGame(false);
            }, 1000);
        }, 1000);
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
