/**
 * Game 19: 같은 색 풍선을 찾아봐! (Find the matching balloon)
 */
class Game19Balloon {
    constructor() {
        this.ctx = null; this.canvas = null; this.tvCtx = null; this.tvCanvas = null;
        this.isActive = false; this.gameEnded = false; this.animationId = null; this.animationFrame = 0;
        this.targetColor = null; this.balloons = []; this.selectedIdx = -1;
        this.successStep = 0; this.failStep = 0; this.stepTimer = 0;
        this.colorSet = [
            { name: '빨강', hex: '#FF4444', light: '#FF8888' },
            { name: '파랑', hex: '#4488FF', light: '#88BBFF' },
            { name: '초록', hex: '#44BB44', light: '#88DD88' },
            { name: '노랑', hex: '#FFCC00', light: '#FFEE66' },
            { name: '보라', hex: '#AA44FF', light: '#CC88FF' }
        ];
    }

    init(ctx, canvas, container, tvCtx, tvCanvas) {
        this.ctx = ctx; this.canvas = canvas; this.tvCtx = tvCtx; this.tvCanvas = tvCanvas;
    }

    start() {
        this.isActive = true; this.gameEnded = false; this.selectedIdx = -1;
        this.successStep = 0; this.failStep = 0; this.stepTimer = 0; this.animationFrame = 0;

        const targetIdx = Math.floor(Math.random() * this.colorSet.length);
        this.targetColor = this.colorSet[targetIdx];

        // Create 4 balloons: 1 correct, 3 wrong
        const available = this.colorSet.filter((_, i) => i !== targetIdx);
        const wrongColors = [];
        while (wrongColors.length < 3) {
            const r = Math.floor(Math.random() * available.length);
            if (!wrongColors.includes(available[r])) wrongColors.push(available[r]);
        }

        const colors = [this.targetColor, ...wrongColors];
        // Shuffle
        for (let i = colors.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [colors[i], colors[j]] = [colors[j], colors[i]];
        }

        const w = this.canvas.width;
        const positions = [0.15, 0.38, 0.62, 0.85];
        this.balloons = colors.map((c, i) => ({
            color: c,
            x: w * positions[i],
            y: this.canvas.height * 0.6,
            isTarget: c === this.targetColor,
            phase: Math.random() * Math.PI * 2,
            pop: false
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

    drawBalloon(ctx, x, y, color, size, phase, frame) {
        const float = Math.sin(frame * 0.03 + phase) * 6;
        const by = y + float;

        // String
        ctx.beginPath();
        ctx.moveTo(x, by + size);
        ctx.quadraticCurveTo(x + 5, by + size + 25, x, by + size + 45);
        ctx.strokeStyle = '#999';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Balloon body
        ctx.beginPath();
        ctx.ellipse(x, by, size * 0.75, size, 0, 0, Math.PI * 2);
        ctx.fillStyle = color.hex;
        ctx.fill();

        // Highlight
        ctx.beginPath();
        ctx.ellipse(x - size * 0.2, by - size * 0.3, size * 0.2, size * 0.3, -0.3, 0, Math.PI * 2);
        ctx.fillStyle = color.light;
        ctx.globalAlpha = 0.5;
        ctx.fill();
        ctx.globalAlpha = 1;

        // Knot
        ctx.beginPath();
        ctx.moveTo(x - 4, by + size);
        ctx.lineTo(x, by + size + 6);
        ctx.lineTo(x + 4, by + size);
        ctx.fillStyle = color.hex;
        ctx.fill();
    }

    drawScene(ctx, canvas) {
        const w = canvas.width; const h = canvas.height;

        // Sky gradient
        const grad = ctx.createLinearGradient(0, 0, 0, h);
        grad.addColorStop(0, '#87CEEB');
        grad.addColorStop(1, '#E0F0FF');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);

        // Clouds
        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        const cx = (this.animationFrame * 0.3) % (w + 100) - 50;
        ctx.beginPath(); ctx.arc(cx, 60, 25, 0, Math.PI * 2); ctx.arc(cx + 25, 55, 30, 0, Math.PI * 2); ctx.arc(cx + 50, 60, 25, 0, Math.PI * 2); ctx.fill();

        // Target balloon (smaller, centered top)
        this.drawBalloon(ctx, w / 2, 90, this.targetColor, 30, 0, this.animationFrame);

        // Choice balloons
        this.balloons.forEach((b, i) => {
            if (b.pop) return;
            const size = 35;
            this.drawBalloon(ctx, b.x, b.y, b.color, size, b.phase, this.animationFrame);

            if (this.selectedIdx === i && this.successStep > 0) {
                ctx.strokeStyle = '#4CAF50'; ctx.lineWidth = 3;
                ctx.beginPath(); ctx.ellipse(b.x, b.y + Math.sin(this.animationFrame * 0.03 + b.phase) * 6, size * 0.75 + 8, size + 8, 0, 0, Math.PI * 2); ctx.stroke();
                ctx.fillStyle = '#4CAF50'; ctx.font = 'bold 24px sans-serif';
                ctx.fillText('⭐', b.x, b.y - 50);
            }
            if (this.selectedIdx === i && this.failStep > 0) {
                ctx.fillStyle = '#F44336'; ctx.font = 'bold 24px sans-serif';
                ctx.fillText('✖', b.x, b.y - 50);
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
        this.balloons.forEach((b, i) => {
            const float = Math.sin(this.animationFrame * 0.03 + b.phase) * 6;
            const by = b.y + float;
            const dx = x - b.x; const dy = y - by;
            if (dx * dx / (30 * 30) + dy * dy / (40 * 40) <= 1) {
                this.gameEnded = true; this.selectedIdx = i;
                if (b.isTarget) { gameTimer.stop(); audioManager.playSFX('ding'); audioManager.playSuccess(); this.successStep = 1; }
                else { audioManager.playFail(); this.failStep = 1; }
                this.stepTimer = 0;
            }
        });
    }

    onButtonUp() { }
    onTimeout() { if (!this.gameEnded) { this.gameEnded = true; this.failStep = 1; this.stepTimer = 0; audioManager.playFail(); } }
    cleanup() { this.isActive = false; if (this.animationId) cancelAnimationFrame(this.animationId); }
}

const game19Balloon = new Game19Balloon();
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => { if (typeof gameController !== 'undefined') gameController.registerGame(19, game19Balloon); }, 100);
});
