/**
 * Game 18: 어항에 물고기를 넣어줘! (Find the fishbowl with 3 fish)
 * - 3 fishbowls with different fish counts (1~5)
 * - Touch the bowl with exactly 3 fish to win
 */
class Game18Fish {
    constructor() {
        this.ctx = null;
        this.canvas = null;
        this.tvCtx = null;
        this.tvCanvas = null;
        this.isActive = false;
        this.gameEnded = false;
        this.animationId = null;
        this.animationFrame = 0;

        this.bowls = [];
        this.selectedBowl = null;
        this.successStep = 0;
        this.failStep = 0;
        this.stepTimer = 0;

        // Fish colors pool
        this.fishColors = ['#FF6347', '#FF8C00', '#FFD700', '#32CD32', '#1E90FF', '#9370DB', '#FF69B4'];
    }

    init(ctx, canvas, container, tvCtx, tvCanvas) {
        this.ctx = ctx;
        this.canvas = canvas;
        this.tvCtx = tvCtx;
        this.tvCanvas = tvCanvas;
    }

    start() {
        this.isActive = true;
        this.gameEnded = false;
        this.selectedBowl = null;
        this.successStep = 0;
        this.failStep = 0;
        this.stepTimer = 0;
        this.animationFrame = 0;

        // Generate 3 bowls: one has 3 fish, others have 1,2,4 or 5
        const counts = [3];
        const others = [1, 2, 4, 5];
        counts.push(others[Math.floor(Math.random() * others.length)]);
        let remaining = others.filter(n => n !== counts[1]);
        counts.push(remaining[Math.floor(Math.random() * remaining.length)]);

        // Shuffle
        for (let i = counts.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [counts[i], counts[j]] = [counts[j], counts[i]];
        }

        const w = this.canvas.width;
        const h = this.canvas.height;
        const positions = [0.2, 0.5, 0.8];

        this.bowls = counts.map((count, i) => {
            const fish = [];
            for (let f = 0; f < count; f++) {
                fish.push({
                    color: this.fishColors[Math.floor(Math.random() * this.fishColors.length)],
                    xOff: (Math.random() - 0.5) * 60,
                    yOff: (Math.random() - 0.5) * 30,
                    phase: Math.random() * Math.PI * 2,
                    size: 12 + Math.random() * 6
                });
            }
            return {
                x: w * positions[i],
                y: h * 0.55,
                count: count,
                fish: fish,
                isTarget: count === 3,
                radius: 70
            };
        });

        this.animate();
    }

    animate() {
        if (!this.isActive && this.successStep === 0 && this.failStep === 0) return;
        this.animationFrame++;

        if (this.successStep > 0 || this.failStep > 0) {
            this.stepTimer++;
            if (this.successStep === 1 && this.stepTimer > 90) {
                this.isActive = false;
                gameController.endGame(true);
                return;
            }
            if (this.failStep === 1 && this.stepTimer > 60) {
                this.isActive = false;
                gameController.endGame(false);
                return;
            }
        }

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.drawScene(this.ctx, this.canvas);

        this.animationId = requestAnimationFrame(() => this.animate());
    }

    drawScene(ctx, canvas) {
        const w = canvas.width;
        const h = canvas.height;

        // Background: soft aqua gradient
        const grad = ctx.createLinearGradient(0, 0, 0, h);
        grad.addColorStop(0, '#E0F7FA');
        grad.addColorStop(1, '#B2EBF2');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);

        // Draw bowls
        this.bowls.forEach(bowl => {
            // Bowl shape (ellipse)
            ctx.save();
            ctx.beginPath();
            ctx.ellipse(bowl.x, bowl.y, 65, 50, 0, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(173, 216, 230, 0.4)';
            ctx.fill();
            ctx.strokeStyle = '#4FC3F7';
            ctx.lineWidth = 3;
            ctx.stroke();

            // Water
            ctx.beginPath();
            ctx.ellipse(bowl.x, bowl.y + 5, 58, 40, 0, 0, Math.PI);
            ctx.fillStyle = 'rgba(100, 181, 246, 0.3)';
            ctx.fill();

            // Fish
            bowl.fish.forEach(fish => {
                const swimX = Math.sin(this.animationFrame * 0.05 + fish.phase) * 8;
                const fx = bowl.x + fish.xOff + swimX;
                const fy = bowl.y + fish.yOff;

                ctx.beginPath();
                ctx.ellipse(fx, fy, fish.size, fish.size * 0.6, 0, 0, Math.PI * 2);
                ctx.fillStyle = fish.color;
                ctx.fill();

                // Tail
                const dir = Math.sin(this.animationFrame * 0.05 + fish.phase) > 0 ? 1 : -1;
                ctx.beginPath();
                ctx.moveTo(fx + dir * fish.size, fy);
                ctx.lineTo(fx + dir * (fish.size + 8), fy - 5);
                ctx.lineTo(fx + dir * (fish.size + 8), fy + 5);
                ctx.closePath();
                ctx.fill();

                // Eye
                ctx.beginPath();
                ctx.arc(fx - dir * 4, fy - 2, 2, 0, Math.PI * 2);
                ctx.fillStyle = '#000';
                ctx.fill();
            });

            ctx.restore();

            // Success/Fail highlight
            if (this.selectedBowl === bowl && this.successStep > 0) {
                ctx.strokeStyle = '#4CAF50';
                ctx.lineWidth = 4;
                ctx.beginPath();
                ctx.ellipse(bowl.x, bowl.y, 70, 55, 0, 0, Math.PI * 2);
                ctx.stroke();
                ctx.fillStyle = '#4CAF50';
                ctx.font = 'bold 28px sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('3마리! ⭐', bowl.x, bowl.y - 60);
            }
            if (this.selectedBowl === bowl && this.failStep > 0) {
                ctx.strokeStyle = '#F44336';
                ctx.lineWidth = 4;
                ctx.beginPath();
                ctx.ellipse(bowl.x, bowl.y, 70, 55, 0, 0, Math.PI * 2);
                ctx.stroke();
                ctx.fillStyle = '#F44336';
                ctx.font = 'bold 28px sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText(bowl.count + '마리 ✖', bowl.x, bowl.y - 60);
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
        for (const bowl of this.bowls) {
            const dx = x - bowl.x;
            const dy = y - bowl.y;
            if (dx * dx / (70 * 70) + dy * dy / (55 * 55) <= 1) {
                this.gameEnded = true;
                this.selectedBowl = bowl;
                if (bowl.isTarget) {
                    gameTimer.stop();
                    audioManager.playSFX('ding');
                    audioManager.playSuccess();
                    this.successStep = 1;
                    this.stepTimer = 0;
                } else {
                    audioManager.playFail();
                    this.failStep = 1;
                    this.stepTimer = 0;
                }
                return;
            }
        }
    }

    onButtonUp() { }
    onTimeout() { if (!this.gameEnded) { this.gameEnded = true; this.failStep = 1; this.stepTimer = 0; audioManager.playFail(); } }
    cleanup() { this.isActive = false; if (this.animationId) cancelAnimationFrame(this.animationId); }
}

const game18Fish = new Game18Fish();
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => { if (typeof gameController !== 'undefined') gameController.registerGame(18, game18Fish); }, 100);
});
