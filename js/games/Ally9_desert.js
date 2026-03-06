/**
 * Game 29: 오아시스에 비춰진 틀린 그림 찾기! (Find the differences reflected in the oasis!)
 * - Find 3 differences between top half and bottom half on screen.
 */
class Game29Desert {
    constructor() {
        this.ctx = null;
        this.canvas = null;
        this.tvCtx = null;
        this.tvCanvas = null;
        this.isActive = false;
        this.gameEnded = false;

        // Points
        this.targetPoints = [];
        this.wrongTaps = []; // Only the latest wrong tap is kept
        this.tvState = 'playing'; // 'playing', 'success', 'fail'

        // Touch tolerance
        this.hitRadius = 0.08;

        // Animation timing
        this.animationStartTime = 0;

        // Images
        this.images = {};
        this.imagesLoaded = false;
    }

    loadImages() {
        return new Promise((resolve) => {
            const path = 'assets/Ally9_desert/';
            const interPath = path + 'Ally9_interaction/';
            const tvPath = path + 'Ally9_resource/tv/';
            const mobPath = path + 'Ally9_resource/mobile/';

            const toLoad = {
                // TV Images
                tvBg: tvPath + 'tv_Ally9_desert_bg.png',
                tvSuccess: tvPath + 'tv_Ally9_success.png',
                tvFail: tvPath + 'tv_Ally9_fail.png',

                // Mobile Images
                mobBg: mobPath + 'mob_Ally9_desert_bg.png',

                // Interactions
                inter1: interPath + 'interaction 9-1.png',
                inter2: interPath + 'interaction 9-2.png'
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
        this.tvState = 'playing';
        this.animationStartTime = Date.now();

        // Target points given by user
        this.targetPoints = [
            { x: 0.423, y: 0.542, found: false },
            { x: 0.725, y: 0.522, found: false },
            { x: 0.216, y: 0.600, found: false }
        ];
        this.wrongTaps = [];

        if (!this.imagesLoaded) {
            await this.loadImages();
        }

        this.animate();
    }

    animate() {
        if (!this.isActive) return;

        this.drawScene();
        this.renderTV();

        requestAnimationFrame(() => this.animate());
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
            this.ctx.fillStyle = '#FFE0B2';
            this.ctx.fillRect(0, 0, w, h);
        }

        // Sun layers removed from mobile.

        // Draw wrong taps (only the latest one)
        if (this.images.inter2) {
            const size = w * 0.06; // reduced size by 50%
            const ratio = this.images.inter2.height / this.images.inter2.width;
            const drawH = size * ratio;

            const now = Date.now();
            // Filter out old taps and draw active ones (disappear after 400ms)
            this.wrongTaps = this.wrongTaps.filter(tap => tap.time && now - tap.time < 400);

            this.wrongTaps.forEach(tap => {
                const elapsed = now - tap.time;
                // Shake effect: left and right
                const shakeOffset = Math.sin(elapsed * 0.05) * (w * 0.008);

                this.ctx.drawImage(
                    this.images.inter2,
                    tap.x * w - size / 2 + shakeOffset,
                    tap.y * h - drawH / 2,
                    size,
                    drawH
                );
            });
        }

        // Draw right taps
        if (this.images.inter1) {
            const size = w * 0.18;
            const ratio = this.images.inter1.height / this.images.inter1.width;
            const drawH = size * ratio;
            this.targetPoints.forEach(pt => {
                if (pt.found) {
                    this.ctx.drawImage(this.images.inter1, pt.x * w - size / 2, pt.y * h - drawH / 2, size, drawH);
                }
            });
        }
    }

    renderTV() {
        if (!this.tvCtx || !this.tvCanvas) return;
        const w = this.tvCanvas.width;
        const h = this.tvCanvas.height;

        this.tvCtx.clearRect(0, 0, w, h);

        // TV Background depending on state
        let bgImg = this.images.tvBg;
        if (this.tvState === 'success' && this.images.tvSuccess) {
            bgImg = this.images.tvSuccess;
        } else if (this.tvState === 'fail' && this.images.tvFail) {
            bgImg = this.images.tvFail;
        }

        if (bgImg) {
            this.tvCtx.drawImage(bgImg, 0, 0, w, h);
        }

        // Draw sun layers (animated via canvas, no images)
        // Only draw during playing state or if you want it always
        if (this.tvState === 'playing') {
            const elapsed = Date.now() - this.animationStartTime;
            const state = Math.floor(elapsed / 500) % 4;

            const sunX = w * 0.613;
            const sunY = h * 0.325;
            const r1 = w * 0.0325; // reduced by 50%
            const r2 = w * 0.0475; // reduced by 50%
            const r3 = w * 0.0625; // reduced by 50%

            this.tvCtx.save();
            this.tvCtx.lineWidth = w * 0.003; // reduced by 50%
            this.tvCtx.lineCap = 'round';
            this.tvCtx.setLineDash([w * 0.0075, w * 0.01]); // reduced by 50%

            // 1. 숨긴 layer: 전부, 표시된 layer: x (state 0)
            // 2. 숨긴 layer: 먼 2개, 표시된 layer: 가까운 1개 (state 1)
            if (state >= 1) {
                this.tvCtx.strokeStyle = '#F28A2E'; // 안쪽 점선
                this.tvCtx.beginPath();
                this.tvCtx.arc(sunX, sunY, r1, 0, Math.PI * 2);
                this.tvCtx.stroke();
            }
            // 3. 숨긴 layer: 먼 1개, 표시된 layer: 가까운 2개 (state 2)
            if (state >= 2) {
                this.tvCtx.strokeStyle = '#EF5C35'; // 중간 점선
                this.tvCtx.beginPath();
                this.tvCtx.arc(sunX, sunY, r2, 0, Math.PI * 2);
                this.tvCtx.stroke();
            }
            // 4. 숨긴 layer: x, 표시된 layer: 전부 (state 3)
            if (state >= 3) {
                this.tvCtx.strokeStyle = '#F2CD49'; // 바깥쪽 점선
                this.tvCtx.beginPath();
                this.tvCtx.arc(sunX, sunY, r3, 0, Math.PI * 2);
                this.tvCtx.stroke();
            }
            this.tvCtx.restore();
        }
    }

    onButtonDown(x, y) {
        if (!this.isActive || this.gameEnded) return;

        const w = this.canvas.width;
        const h = this.canvas.height;
        const relX = x / w;
        const relY = y / h;

        let hit = false;
        let alreadyFound = false;

        const radiusPx = w * this.hitRadius;

        // Check if hit a target
        for (let i = 0; i < this.targetPoints.length; i++) {
            const pt = this.targetPoints[i];
            const ptX = pt.x * w;
            const ptY = pt.y * h;

            const dist = Math.sqrt((x - ptX) ** 2 + (y - ptY) ** 2);

            if (dist < radiusPx) {
                if (pt.found) {
                    alreadyFound = true;
                } else {
                    pt.found = true;
                }
                hit = true;
                break;
            }
        }

        if (hit) {
            if (!alreadyFound) {
                if (typeof audioManager !== 'undefined') audioManager.playSFX('ding');

                // check win
                if (this.targetPoints.every(p => p.found)) {
                    this.succeed();
                }
            }
        } else {
            // wrong tap
            if (typeof audioManager !== 'undefined') audioManager.playSFX('click');
            // Store only the latest with timestamp
            this.wrongTaps = [{ x: relX, y: relY, time: Date.now() }];
        }
    }

    succeed() {
        if (this.gameEnded) return;
        this.gameEnded = true;

        if (typeof gameTimer !== 'undefined') gameTimer.stop();

        this.tvState = 'success';
        if (typeof audioManager !== 'undefined') audioManager.playSuccess();

        setTimeout(() => {
            if (typeof gameController !== 'undefined') gameController.endGame(true);
        }, 2000); // 2 second delay to let user see final interactions
    }

    fail() {
        if (this.gameEnded) return;
        this.gameEnded = true;

        this.tvState = 'fail';
        if (typeof audioManager !== 'undefined') audioManager.playFail();

        setTimeout(() => {
            if (typeof gameController !== 'undefined') gameController.endGame(false);
        }, 1500); // 1.5 second delay
    }

    onButtonUp() { }

    onTimeout() {
        if (!this.gameEnded) {
            this.fail();
        }
    }

    cleanup() {
        this.isActive = false;
    }
}

// Instantiate and register
const game29Desert = new Game29Desert();
if (typeof gameController !== 'undefined') {
    gameController.registerGame(29, game29Desert);
} else {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => {
            if (typeof gameController !== 'undefined') {
                gameController.registerGame(29, game29Desert);
            }
        }, 100);
    });
}
