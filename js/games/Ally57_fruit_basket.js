/**
 * Game 24: 과일 바구니에 담아보자! (Pick the correct fruit)
 * - A target fruit shown. Touch only matching fruits (3 needed). Wrong = fail
 */
class Game24FruitBasket {
    constructor() {
        this.ctx = null; this.canvas = null; this.tvCtx = null; this.tvCanvas = null;
        this.isActive = false; this.gameEnded = false; this.animationId = null; this.animationFrame = 0;
        this.targetFruit = null; this.fruits = []; this.collected = 0; this.needed = 3;
        this.successStep = 0; this.failStep = 0; this.stepTimer = 0;
        this.basketFruits = [];

        this.fruitTypes = [
            { emoji: '🍎', name: '사과', color: '#FF4444' },
            { emoji: '🍌', name: '바나나', color: '#FFD700' },
            { emoji: '🍓', name: '딸기', color: '#FF6B81' },
            { emoji: '🍊', name: '오렌지', color: '#FF8C00' },
            { emoji: '🍇', name: '포도', color: '#8B00FF' }
        ];
    }

    init(ctx, canvas, container, tvCtx, tvCanvas) {
        this.ctx = ctx; this.canvas = canvas; this.tvCtx = tvCtx; this.tvCanvas = tvCanvas;
    }

    start() {
        this.isActive = true; this.gameEnded = false; this.collected = 0;
        this.successStep = 0; this.failStep = 0; this.stepTimer = 0; this.animationFrame = 0;
        this.basketFruits = [];

        this.targetFruit = this.fruitTypes[Math.floor(Math.random() * this.fruitTypes.length)];

        // Place 6 fruits: 3 target + 3 random others
        const others = this.fruitTypes.filter(f => f !== this.targetFruit);
        const fruitList = [];
        for (let i = 0; i < 3; i++) fruitList.push({ ...this.targetFruit, isTarget: true });
        for (let i = 0; i < 3; i++) fruitList.push({ ...others[Math.floor(Math.random() * others.length)], isTarget: false });

        for (let i = fruitList.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1));[fruitList[i], fruitList[j]] = [fruitList[j], fruitList[i]]; }

        const w = this.canvas.width; const h = this.canvas.height;
        const cols = 3; const rows = 2;
        this.fruits = fruitList.map((f, i) => ({
            ...f,
            x: w * (0.2 + (i % cols) * 0.3),
            y: h * (0.45 + Math.floor(i / cols) * 0.25),
            collected: false,
            phase: Math.random() * Math.PI * 2
        }));

        this.animate();
    }

    animate() {
        if (!this.isActive && this.successStep === 0 && this.failStep === 0) return;
        this.animationFrame++;
        if (this.successStep > 0 || this.failStep > 0) {
            this.stepTimer++;
            if (this.successStep === 1 && this.stepTimer > 90) { this.isActive = false; gameController.endGame(true); return; }
            if (this.failStep === 1 && this.stepTimer > 60) { this.isActive = false; gameController.endGame(false); return; }
        }
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.drawScene(this.ctx, this.canvas);
        this.animationId = requestAnimationFrame(() => this.animate());
    }

    drawScene(ctx, canvas) {
        const w = canvas.width; const h = canvas.height;

        // Background
        const grad = ctx.createLinearGradient(0, 0, 0, h);
        grad.addColorStop(0, '#FFF3E0');
        grad.addColorStop(1, '#FFE0B2');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);


        // Target display
        ctx.font = '40px sans-serif';
        ctx.fillText(this.targetFruit.emoji, w / 2, 70);

        // Progress
        ctx.fillStyle = '#795548';
        ctx.font = '14px "ONE Mobile POP", sans-serif';
        ctx.fillText(`${this.collected} / ${this.needed}`, w / 2, 95);

        // Fruits
        this.fruits.forEach((f, i) => {
            if (f.collected) return;
            const bounce = Math.sin(this.animationFrame * 0.04 + f.phase) * 4;

            ctx.font = '40px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(f.emoji, f.x, f.y + bounce);
        });

        // Basket at bottom center
        const bx = w / 2; const by = h * 0.92;
        ctx.fillStyle = '#8D6E63';
        ctx.beginPath(); ctx.ellipse(bx, by, 60, 20, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#A1887F';
        ctx.beginPath();
        ctx.moveTo(bx - 55, by - 5);
        ctx.quadraticCurveTo(bx - 50, by - 35, bx - 35, by - 35);
        ctx.lineTo(bx + 35, by - 35);
        ctx.quadraticCurveTo(bx + 50, by - 35, bx + 55, by - 5);
        ctx.fill();

        // Collected items in basket
        this.basketFruits.forEach((emoji, i) => {
            ctx.font = '22px sans-serif';
            ctx.fillText(emoji, bx - 20 + i * 20, by - 15);
        });

        // Success/Fail
        if (this.successStep > 0) {
            ctx.fillStyle = '#4CAF50'; ctx.font = 'bold 28px "ONE Mobile POP", sans-serif';
            ctx.fillText('⭐ 잘했어!', w / 2, h * 0.35);
        }
        if (this.failStep > 0) {
            ctx.fillStyle = '#F44336'; ctx.font = 'bold 28px "ONE Mobile POP", sans-serif';
            ctx.fillText('✖ 다른 과일이야!', w / 2, h * 0.35);
        }
    }

    renderTV() {
        if (!this.tvCtx || !this.tvCanvas) return;
        this.tvCtx.clearRect(0, 0, this.tvCanvas.width, this.tvCanvas.height);
        this.tvCtx.save();
        this.tvCtx.scale(this.tvCanvas.width / this.canvas.width, this.tvCanvas.height / this.canvas.height);
        this.drawScene(this.tvCtx, this.canvas);
        this.tvCtx.restore();
    }

    onButtonDown(x, y) {
        if (!this.isActive || this.gameEnded) return;

        for (const f of this.fruits) {
            if (f.collected) continue;
            if (Math.abs(x - f.x) < 30 && Math.abs(y - f.y) < 30) {
                if (f.isTarget) {
                    audioManager.playSFX('click');
                    f.collected = true;
                    this.collected++;
                    this.basketFruits.push(f.emoji);
                    if (this.collected >= this.needed) {
                        this.gameEnded = true;
                        gameTimer.stop(); audioManager.playSuccess();
                        this.successStep = 1; this.stepTimer = 0;
                    }
                } else {
                    this.gameEnded = true;
                    audioManager.playFail(); this.failStep = 1; this.stepTimer = 0;
                }
                return;
            }
        }
    }

    onButtonUp() { }
    onTimeout() { if (!this.gameEnded) { this.gameEnded = true; this.failStep = 1; this.stepTimer = 0; audioManager.playFail(); } }
    cleanup() { this.isActive = false; if (this.animationId) cancelAnimationFrame(this.animationId); }
}

const game24FruitBasket = new Game24FruitBasket();
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => { if (typeof gameController !== 'undefined') gameController.registerGame(24, game24FruitBasket); }, 100);
});
