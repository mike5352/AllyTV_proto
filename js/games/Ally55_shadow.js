/**
 * Game 22: 그림자를 맞춰봐! (Match the shadow)
 * - A silhouette is shown, pick the matching original from 3 choices
 */
class Game22Shadow {
    constructor() {
        this.ctx = null; this.canvas = null; this.tvCtx = null; this.tvCanvas = null;
        this.isActive = false; this.gameEnded = false; this.animationId = null; this.animationFrame = 0;
        this.targetItem = null; this.choices = []; this.selectedIdx = -1;
        this.successStep = 0; this.failStep = 0; this.stepTimer = 0;

        this.items = [
            { emoji: '🐱', name: '고양이' }, { emoji: '🐶', name: '강아지' },
            { emoji: '🌳', name: '나무' }, { emoji: '⭐', name: '별' },
            { emoji: '🏠', name: '집' }, { emoji: '🚗', name: '자동차' },
            { emoji: '🍎', name: '사과' }, { emoji: '🌙', name: '달' }
        ];
    }

    init(ctx, canvas, container, tvCtx, tvCanvas) {
        this.ctx = ctx; this.canvas = canvas; this.tvCtx = tvCtx; this.tvCanvas = tvCanvas;
    }

    start() {
        this.isActive = true; this.gameEnded = false; this.selectedIdx = -1;
        this.successStep = 0; this.failStep = 0; this.stepTimer = 0; this.animationFrame = 0;

        const shuffled = [...this.items];
        for (let i = shuffled.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1));[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]; }

        this.targetItem = shuffled[0];
        this.choices = [
            { ...shuffled[0], isCorrect: true },
            { ...shuffled[1], isCorrect: false },
            { ...shuffled[2], isCorrect: false }
        ];
        for (let i = this.choices.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1));[this.choices[i], this.choices[j]] = [this.choices[j], this.choices[i]]; }

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

        // Night sky background
        const grad = ctx.createLinearGradient(0, 0, 0, h);
        grad.addColorStop(0, '#1a1a3e');
        grad.addColorStop(1, '#2d2d6e');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);

        // Stars
        ctx.fillStyle = '#FFF';
        for (let i = 0; i < 15; i++) {
            const sx = ((i * 47 + this.animationFrame * 0.1) % w);
            const sy = (i * 31) % (h * 0.4);
            const ss = 1 + Math.sin(this.animationFrame * 0.05 + i) * 0.5;
            ctx.beginPath(); ctx.arc(sx, sy, ss, 0, Math.PI * 2); ctx.fill();
        }

        // Shadow (target emoji rendered in pure black)
        const shadowY = h * 0.35;

        ctx.save();
        ctx.font = '80px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Use filter to create a pure black silhouette
        ctx.filter = 'brightness(0)';
        ctx.fillText(this.targetItem.emoji, w / 2, shadowY);
        ctx.filter = 'none';
        ctx.restore();

        // "?" label
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 30px "ONE Mobile POP", sans-serif';
        ctx.fillText('?', w / 2 + 50, shadowY - 20);

        // Choices
        const positions = [0.2, 0.5, 0.8];
        const choiceY = h * 0.75;

        this.choices.forEach((c, i) => {
            const cx = w * positions[i];
            const bounce = Math.sin(this.animationFrame * 0.04 + i * 2) * 3;

            // Card
            ctx.fillStyle = 'rgba(255,255,255,0.15)';
            ctx.beginPath(); ctx.roundRect(cx - 50, choiceY - 55 + bounce, 100, 110, 15); ctx.fill();
            ctx.strokeStyle = this.selectedIdx === i ? (this.successStep > 0 ? '#4CAF50' : '#F44336') : 'rgba(255,255,255,0.4)';
            ctx.lineWidth = this.selectedIdx === i ? 4 : 2;
            ctx.stroke();

            // Emoji and Name alignment
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            // Emoji (Original colored emoji)
            ctx.font = '50px sans-serif';
            ctx.fillText(c.emoji, cx, choiceY - 8 + bounce);

            // Name
            ctx.fillStyle = '#FFFFFF';
            ctx.font = 'bold 15px "ONE Mobile POP", sans-serif';
            ctx.fillText(c.name, cx, choiceY + 38 + bounce);

            if (this.selectedIdx === i && this.successStep > 0) {
                ctx.fillStyle = '#4CAF50'; ctx.font = 'bold 24px sans-serif'; ctx.fillText('⭐', cx, choiceY - 70 + bounce);
            }
            if (this.selectedIdx === i && this.failStep > 0) {
                ctx.fillStyle = '#F44336'; ctx.font = 'bold 24px sans-serif'; ctx.fillText('✖', cx, choiceY - 70 + bounce);
            }
        });
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
        const w = this.canvas.width; const h = this.canvas.height;
        const positions = [0.2, 0.5, 0.8]; const choiceY = h * 0.75;

        this.choices.forEach((c, i) => {
            const cx = w * positions[i];
            if (Math.abs(x - cx) < 45 && Math.abs(y - choiceY) < 50) {
                this.gameEnded = true; this.selectedIdx = i;
                if (c.isCorrect) { gameTimer.stop(); audioManager.playSFX('ding'); audioManager.playSuccess(); this.successStep = 1; }
                else { audioManager.playFail(); this.failStep = 1; }
                this.stepTimer = 0;
            }
        });
    }

    onButtonUp() { }
    onTimeout() { if (!this.gameEnded) { this.gameEnded = true; this.failStep = 1; this.stepTimer = 0; audioManager.playFail(); } }
    cleanup() { this.isActive = false; if (this.animationId) cancelAnimationFrame(this.animationId); }
}

const game22Shadow = new Game22Shadow();
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => { if (typeof gameController !== 'undefined') gameController.registerGame(22, game22Shadow); }, 100);
});
