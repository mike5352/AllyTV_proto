/**
 * Game 23: 기차에 순서대로 태워줘! (Board the train in order 1→2→3)
 */
class Game23Train {
    constructor() {
        this.ctx = null; this.canvas = null; this.tvCtx = null; this.tvCanvas = null;
        this.isActive = false; this.gameEnded = false; this.animationId = null; this.animationFrame = 0;
        this.passengers = []; this.nextNumber = 1; this.boarded = [];
        this.successStep = 0; this.failStep = 0; this.stepTimer = 0;
        this.trainX = 0;

        this.animalEmojis = ['🐻', '🐰', '🦊', '🐸', '🐧', '🐷'];
    }

    init(ctx, canvas, container, tvCtx, tvCanvas) {
        this.ctx = ctx; this.canvas = canvas; this.tvCtx = tvCtx; this.tvCanvas = tvCanvas;
    }

    start() {
        this.isActive = true; this.gameEnded = false; this.nextNumber = 1; this.boarded = [];
        this.successStep = 0; this.failStep = 0; this.stepTimer = 0; this.animationFrame = 0;
        this.trainX = 0;

        const shuffledAnimals = [...this.animalEmojis];
        for (let i = shuffledAnimals.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1));[shuffledAnimals[i], shuffledAnimals[j]] = [shuffledAnimals[j], shuffledAnimals[i]]; }

        this.passengers = [
            { number: 1, emoji: shuffledAnimals[0], boarded: false },
            { number: 2, emoji: shuffledAnimals[1], boarded: false },
            { number: 3, emoji: shuffledAnimals[2], boarded: false }
        ];
        // Shuffle positions
        for (let i = this.passengers.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.passengers[i], this.passengers[j]] = [this.passengers[j], this.passengers[i]];
        }
        this.animate();
    }

    animate() {
        if (!this.isActive && this.successStep === 0 && this.failStep === 0) return;
        this.animationFrame++;
        if (this.successStep > 0) {
            this.stepTimer++;
            this.trainX += 3;
            if (this.stepTimer > 120) { this.isActive = false; gameController.endGame(true); return; }
        }
        if (this.failStep > 0) {
            this.stepTimer++;
            if (this.stepTimer > 60) { this.isActive = false; gameController.endGame(false); return; }
        }
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.drawScene(this.ctx, this.canvas);
        this.animationId = requestAnimationFrame(() => this.animate());
    }

    drawScene(ctx, canvas) {
        const w = canvas.width; const h = canvas.height;

        // Background
        ctx.fillStyle = '#87CEEB';
        ctx.fillRect(0, 0, w, h * 0.65);
        ctx.fillStyle = '#8BC34A';
        ctx.fillRect(0, h * 0.65, w, h * 0.35);

        // Rail track
        ctx.fillStyle = '#795548';
        ctx.fillRect(0, h * 0.58, w, 8);
        for (let i = 0; i < w; i += 20) {
            ctx.fillStyle = '#5D4037';
            ctx.fillRect(i, h * 0.58 + 8, 12, 5);
        }

        // Train engine
        const engineX = w * 0.15 + this.trainX;
        const trainY = h * 0.42;
        ctx.fillStyle = '#D32F2F';
        ctx.beginPath(); ctx.roundRect(engineX - 35, trainY, 70, 50, 8); ctx.fill();
        ctx.fillStyle = '#B71C1C';
        ctx.beginPath(); ctx.roundRect(engineX - 25, trainY - 20, 50, 25, 5); ctx.fill();
        // Chimney
        ctx.fillStyle = '#333';
        ctx.fillRect(engineX - 20, trainY - 35, 15, 18);
        // Smoke
        if (this.successStep > 0) {
            ctx.fillStyle = 'rgba(200,200,200,0.5)';
            ctx.beginPath(); ctx.arc(engineX - 15 - this.stepTimer * 0.5, trainY - 40 - this.stepTimer * 0.3, 8, 0, Math.PI * 2); ctx.fill();
        }
        // Wheels
        ctx.fillStyle = '#333';
        ctx.beginPath(); ctx.arc(engineX - 15, trainY + 50, 10, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(engineX + 15, trainY + 50, 10, 0, Math.PI * 2); ctx.fill();

        // Train cars (for boarded passengers)
        this.boarded.forEach((p, i) => {
            const carX = engineX + 80 + i * 80;
            ctx.fillStyle = '#4CAF50';
            ctx.beginPath(); ctx.roundRect(carX - 30, trainY + 5, 60, 42, 6); ctx.fill();
            ctx.strokeStyle = '#388E3C'; ctx.lineWidth = 2; ctx.stroke();
            ctx.fillStyle = '#333'; ctx.beginPath(); ctx.arc(carX - 12, trainY + 50, 8, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(carX + 12, trainY + 50, 8, 0, Math.PI * 2); ctx.fill();
            ctx.font = '28px sans-serif'; ctx.textAlign = 'center';
            ctx.fillText(p.emoji, carX, trainY + 35);
        });

        // Waiting passengers
        const positions = [0.25, 0.5, 0.75];
        const passY = h * 0.82;

        this.passengers.forEach((p, i) => {
            if (p.boarded) return;
            const px = w * positions[i];
            const bounce = Math.sin(this.animationFrame * 0.05 + i * 2) * 4;

            // Platform
            ctx.fillStyle = 'rgba(255,255,255,0.8)';
            ctx.beginPath(); ctx.roundRect(px - 40, passY - 40 + bounce, 80, 85, 10); ctx.fill();
            ctx.strokeStyle = '#DDD'; ctx.lineWidth = 2; ctx.stroke();

            // Number badge
            ctx.fillStyle = '#FF5722';
            ctx.beginPath(); ctx.arc(px + 25, passY - 30 + bounce, 14, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#FFF'; ctx.font = 'bold 16px sans-serif'; ctx.textAlign = 'center';
            ctx.fillText(p.number, px + 25, passY - 25 + bounce);

            // Animal
            ctx.font = '40px sans-serif';
            ctx.fillText(p.emoji, px, passY + 10 + bounce);

            // Fail highlight
            if (this.failStep > 0 && this.selectedFail === i) {
                ctx.strokeStyle = '#F44336'; ctx.lineWidth = 3;
                ctx.beginPath(); ctx.roundRect(px - 43, passY - 43 + bounce, 86, 91, 10); ctx.stroke();
                ctx.fillStyle = '#F44336'; ctx.font = 'bold 20px sans-serif'; ctx.fillText('✖', px, passY - 50);
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
        const positions = [0.25, 0.5, 0.75]; const passY = h * 0.82;

        this.passengers.forEach((p, i) => {
            if (p.boarded) return;
            const px = w * positions[i];
            if (Math.abs(x - px) < 40 && Math.abs(y - passY) < 45) {
                if (p.number === this.nextNumber) {
                    audioManager.playSFX('click');
                    p.boarded = true;
                    this.boarded.push(p);
                    this.nextNumber++;
                    if (this.nextNumber > 3) {
                        gameTimer.stop(); audioManager.playSuccess();
                        this.gameEnded = true; this.successStep = 1; this.stepTimer = 0;
                    }
                } else {
                    this.gameEnded = true; this.selectedFail = i;
                    audioManager.playFail(); this.failStep = 1; this.stepTimer = 0;
                }
            }
        });
    }

    onButtonUp() { }
    onTimeout() { if (!this.gameEnded) { this.gameEnded = true; this.failStep = 1; this.stepTimer = 0; audioManager.playFail(); } }
    cleanup() { this.isActive = false; if (this.animationId) cancelAnimationFrame(this.animationId); }
}

const game23Train = new Game23Train();
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => { if (typeof gameController !== 'undefined') gameController.registerGame(23, game23Train); }, 100);
});
