/**
 * Game 27: 별을 세어봐! (Count the stars)
 * - Stars appear one by one, then pick the correct count
 */
class Game27StarCount {
    constructor() {
        this.ctx = null; this.canvas = null; this.tvCtx = null; this.tvCanvas = null;
        this.isActive = false; this.gameEnded = false; this.animationId = null; this.animationFrame = 0;
        this.starCount = 0; this.stars = []; this.revealedCount = 0;
        this.showChoices = false; this.selectedIdx = -1;
        this.successStep = 0; this.failStep = 0; this.stepTimer = 0;
    }

    init(ctx, canvas, container, tvCtx, tvCanvas) {
        this.ctx = ctx; this.canvas = canvas; this.tvCtx = tvCtx; this.tvCanvas = tvCanvas;
    }

    start() {
        this.isActive = true; this.gameEnded = false; this.selectedIdx = -1;
        this.successStep = 0; this.failStep = 0; this.stepTimer = 0; this.animationFrame = 0;
        this.showChoices = false; this.revealedCount = 0;

        this.starCount = Math.floor(Math.random() * 5) + 1; // 1-5

        // Generate star positions
        const w = this.canvas.width; const h = this.canvas.height;
        this.stars = [];
        for (let i = 0; i < this.starCount; i++) {
            this.stars.push({
                x: 60 + Math.random() * (w - 120),
                y: 80 + Math.random() * (h * 0.45 - 80),
                size: 18 + Math.random() * 12,
                phase: Math.random() * Math.PI * 2,
                revealed: false,
                revealFrame: i * 25 // Stagger reveal
            });
        }

        // Generate number choices
        this.choices = [this.starCount];
        while (this.choices.length < 5) {
            const n = Math.floor(Math.random() * 5) + 1;
            if (!this.choices.includes(n)) this.choices.push(n);
        }
        this.choices.sort((a, b) => a - b);

        this.animate();
    }

    animate() {
        if (!this.isActive && this.successStep === 0 && this.failStep === 0) return;
        this.animationFrame++;

        // Reveal stars one by one
        this.stars.forEach(s => {
            if (!s.revealed && this.animationFrame >= s.revealFrame) {
                s.revealed = true;
                this.revealedCount++;
            }
        });

        // Show choices after all stars revealed + small delay
        if (this.revealedCount >= this.starCount && this.animationFrame > this.starCount * 25 + 30) {
            this.showChoices = true;
        }

        if (this.successStep > 0 || this.failStep > 0) {
            this.stepTimer++;
            if (this.successStep === 1 && this.stepTimer > 90) { this.isActive = false; gameController.endGame(true); return; }
            if (this.failStep === 1 && this.stepTimer > 60) { this.isActive = false; gameController.endGame(false); return; }
        }

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.drawScene(this.ctx, this.canvas);
        this.animationId = requestAnimationFrame(() => this.animate());
    }

    drawStar(ctx, x, y, size, phase, frame) {
        const twinkle = 0.7 + Math.sin(frame * 0.08 + phase) * 0.3;
        ctx.save();
        ctx.globalAlpha = twinkle;
        ctx.fillStyle = '#FFD700';
        ctx.strokeStyle = '#FFA000';
        ctx.lineWidth = 1.5;

        ctx.beginPath();
        for (let i = 0; i < 10; i++) {
            const r = i % 2 === 0 ? size : size * 0.4;
            const angle = (Math.PI * i) / 5 - Math.PI / 2;
            const px = x + r * Math.cos(angle);
            const py = y + r * Math.sin(angle);
            if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Glow
        ctx.shadowColor = '#FFD700';
        ctx.shadowBlur = 15;
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.restore();
    }

    drawScene(ctx, canvas) {
        const w = canvas.width; const h = canvas.height;

        // Night sky
        const grad = ctx.createLinearGradient(0, 0, 0, h);
        grad.addColorStop(0, '#0D1B2A');
        grad.addColorStop(0.7, '#1B2838');
        grad.addColorStop(1, '#2D4059');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);

        // Small background stars
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        for (let i = 0; i < 30; i++) {
            const sx = (i * 37) % w;
            const sy = (i * 23) % h;
            ctx.beginPath(); ctx.arc(sx, sy, 0.8, 0, Math.PI * 2); ctx.fill();
        }

        // Moon
        ctx.beginPath(); ctx.arc(w * 0.15, h * 0.12, 22, 0, Math.PI * 2);
        ctx.fillStyle = '#FFF8E1'; ctx.fill();
        ctx.beginPath(); ctx.arc(w * 0.15 + 8, h * 0.12 - 5, 18, 0, Math.PI * 2);
        ctx.fillStyle = '#0D1B2A'; ctx.fill();

        ctx.fillStyle = '#E0E0E0';
        ctx.font = 'bold 18px "ONE Mobile POP", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('⭐ 별이 몇 개일까?', w / 2, 30);

        // Draw revealed stars
        this.stars.forEach(s => {
            if (s.revealed) {
                this.drawStar(ctx, s.x, s.y, s.size, s.phase, this.animationFrame);
            }
        });

        // Number choices
        if (this.showChoices) {
            const choiceY = h * 0.78;
            const spacing = w / (this.choices.length + 1);

            this.choices.forEach((num, i) => {
                const cx = spacing * (i + 1);
                const bounce = Math.sin(this.animationFrame * 0.04 + i) * 2;

                // Circle button
                ctx.fillStyle = 'rgba(255,255,255,0.15)';
                ctx.beginPath(); ctx.arc(cx, choiceY + bounce, 28, 0, Math.PI * 2); ctx.fill();
                ctx.strokeStyle = 'rgba(255,255,255,0.4)'; ctx.lineWidth = 2; ctx.stroke();

                ctx.fillStyle = '#FFF';
                ctx.font = 'bold 24px "ONE Mobile POP", sans-serif';
                ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                ctx.fillText(num, cx, choiceY + bounce);

                if (this.selectedIdx === i && this.successStep > 0) {
                    ctx.strokeStyle = '#4CAF50'; ctx.lineWidth = 3;
                    ctx.beginPath(); ctx.arc(cx, choiceY + bounce, 32, 0, Math.PI * 2); ctx.stroke();
                    ctx.fillStyle = '#4CAF50'; ctx.font = '22px sans-serif';
                    ctx.fillText('⭐', cx, choiceY - 40);
                }
                if (this.selectedIdx === i && this.failStep > 0) {
                    ctx.strokeStyle = '#F44336'; ctx.lineWidth = 3;
                    ctx.beginPath(); ctx.arc(cx, choiceY + bounce, 32, 0, Math.PI * 2); ctx.stroke();
                    ctx.fillStyle = '#F44336'; ctx.font = '22px sans-serif';
                    ctx.fillText('✖', cx, choiceY - 40);
                }
            });
            ctx.textBaseline = 'alphabetic';
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
        if (!this.isActive || this.gameEnded || !this.showChoices) return;
        const w = this.canvas.width; const h = this.canvas.height;
        const choiceY = h * 0.78;
        const spacing = w / (this.choices.length + 1);

        this.choices.forEach((num, i) => {
            const cx = spacing * (i + 1);
            const dx = x - cx; const dy = y - choiceY;
            if (dx * dx + dy * dy <= 32 * 32) {
                this.gameEnded = true; this.selectedIdx = i;
                if (num === this.starCount) { gameTimer.stop(); audioManager.playSFX('ding'); audioManager.playSuccess(); this.successStep = 1; }
                else { audioManager.playFail(); this.failStep = 1; }
                this.stepTimer = 0;
            }
        });
    }

    onButtonUp() { }
    onTimeout() { if (!this.gameEnded) { this.gameEnded = true; this.failStep = 1; this.stepTimer = 0; audioManager.playFail(); } }
    cleanup() { this.isActive = false; if (this.animationId) cancelAnimationFrame(this.animationId); }
}

const game27StarCount = new Game27StarCount();
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => { if (typeof gameController !== 'undefined') gameController.registerGame(27, game27StarCount); }, 100);
});
