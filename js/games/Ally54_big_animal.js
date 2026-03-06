/**
 * Game 21: 큰 동물을 찾아보자! (Find the biggest animal)
 * - 3 animals shown same size on screen
 * - Pick the one that is biggest in real life
 */
class Game21BigAnimal {
    constructor() {
        this.ctx = null; this.canvas = null; this.tvCtx = null; this.tvCanvas = null;
        this.isActive = false; this.gameEnded = false; this.animationId = null; this.animationFrame = 0;
        this.animals = []; this.selectedIdx = -1;
        this.successStep = 0; this.failStep = 0; this.stepTimer = 0;

        this.animalSets = [
            [{ emoji: '🐘', name: '코끼리', rank: 3 }, { emoji: '🐕', name: '강아지', rank: 2 }, { emoji: '🐜', name: '개미', rank: 1 }],
            [{ emoji: '🐋', name: '고래', rank: 3 }, { emoji: '🐓', name: '닭', rank: 2 }, { emoji: '🐛', name: '벌레', rank: 1 }],
            [{ emoji: '🦒', name: '기린', rank: 3 }, { emoji: '🐈', name: '고양이', rank: 2 }, { emoji: '🐸', name: '개구리', rank: 1 }],
            [{ emoji: '🐻', name: '곰', rank: 3 }, { emoji: '🐰', name: '토끼', rank: 2 }, { emoji: '🐝', name: '벌', rank: 1 }],
            [{ emoji: '🦁', name: '사자', rank: 3 }, { emoji: '🦊', name: '여우', rank: 2 }, { emoji: '🐢', name: '거북이', rank: 1 }]
        ];
    }

    init(ctx, canvas, container, tvCtx, tvCanvas) {
        this.ctx = ctx; this.canvas = canvas; this.tvCtx = tvCtx; this.tvCanvas = tvCanvas;
    }

    start() {
        this.isActive = true; this.gameEnded = false; this.selectedIdx = -1;
        this.successStep = 0; this.failStep = 0; this.stepTimer = 0; this.animationFrame = 0;

        const set = this.animalSets[Math.floor(Math.random() * this.animalSets.length)];
        this.animals = [...set];
        for (let i = this.animals.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.animals[i], this.animals[j]] = [this.animals[j], this.animals[i]];
        }
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

        // Background: grassland
        ctx.fillStyle = '#87CEEB';
        ctx.fillRect(0, 0, w, h * 0.6);
        ctx.fillStyle = '#7CCD7C';
        ctx.fillRect(0, h * 0.6, w, h * 0.4);

        // Sun
        ctx.beginPath(); ctx.arc(w * 0.85, h * 0.12, 25, 0, Math.PI * 2);
        ctx.fillStyle = '#FFD700'; ctx.fill();

        const positions = [0.2, 0.5, 0.8];
        const cardY = h * 0.5;

        this.animals.forEach((a, i) => {
            const cx = w * positions[i];
            const bounce = Math.sin(this.animationFrame * 0.04 + i) * 4;

            // Card background
            ctx.fillStyle = 'rgba(255,255,255,0.85)';
            ctx.beginPath();
            ctx.roundRect(cx - 55, cardY - 55 + bounce, 110, 120, 15);
            ctx.fill();
            ctx.strokeStyle = '#DDD';
            ctx.lineWidth = 2;
            ctx.stroke();

            // Emoji (same size for all)
            ctx.font = '55px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(a.emoji, cx, cardY + 15 + bounce);

            // Name
            ctx.fillStyle = '#555';
            ctx.font = '14px "ONE Mobile POP", sans-serif';
            ctx.fillText(a.name, cx, cardY + 55 + bounce);

            // Selection feedback
            if (this.selectedIdx === i && this.successStep > 0) {
                ctx.strokeStyle = '#4CAF50'; ctx.lineWidth = 3;
                ctx.beginPath(); ctx.roundRect(cx - 58, cardY - 58 + bounce, 116, 126, 15); ctx.stroke();
                ctx.fillStyle = '#4CAF50'; ctx.font = 'bold 22px sans-serif';
                ctx.fillText('⭐ 정답!', cx, cardY - 65);
            }
            if (this.selectedIdx === i && this.failStep > 0) {
                ctx.strokeStyle = '#F44336'; ctx.lineWidth = 3;
                ctx.beginPath(); ctx.roundRect(cx - 58, cardY - 58 + bounce, 116, 126, 15); ctx.stroke();
                ctx.fillStyle = '#F44336'; ctx.font = 'bold 22px sans-serif';
                ctx.fillText('✖', cx, cardY - 65);
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
        const positions = [0.2, 0.5, 0.8]; const cardY = h * 0.5;

        this.animals.forEach((a, i) => {
            const cx = w * positions[i];
            if (Math.abs(x - cx) < 55 && Math.abs(y - cardY) < 60) {
                this.gameEnded = true; this.selectedIdx = i;
                if (a.rank === 3) { gameTimer.stop(); audioManager.playSFX('ding'); audioManager.playSuccess(); this.successStep = 1; }
                else { audioManager.playFail(); this.failStep = 1; }
                this.stepTimer = 0;
            }
        });
    }

    onButtonUp() { }
    onTimeout() { if (!this.gameEnded) { this.gameEnded = true; this.failStep = 1; this.stepTimer = 0; audioManager.playFail(); } }
    cleanup() { this.isActive = false; if (this.animationId) cancelAnimationFrame(this.animationId); }
}

const game21BigAnimal = new Game21BigAnimal();
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => { if (typeof gameController !== 'undefined') gameController.registerGame(21, game21BigAnimal); }, 100);
});
