/**
 * Game 26: 동물 친구를 집에 데려다줘! (Match animal to home)
 * - 3 animals + 3 homes. Touch animal then matching home.
 * - Success = 1 correct match within time
 */
class Game26AnimalHome {
    constructor() {
        this.ctx = null; this.canvas = null; this.tvCtx = null; this.tvCanvas = null;
        this.isActive = false; this.gameEnded = false; this.animationId = null; this.animationFrame = 0;
        this.pairs = []; this.selectedAnimal = null;
        this.successStep = 0; this.failStep = 0; this.stepTimer = 0;
        this.matchedPair = null;

        this.pairSets = [
            { animal: '🐦', aName: '새', home: '🪹', hName: '둥지' },
            { animal: '🐟', aName: '물고기', home: '🐚', hName: '바다' },
            { animal: '🐕', aName: '강아지', home: '🏠', hName: '집' },
            { animal: '🐻', aName: '곰', home: '🏔️', hName: '동굴' },
            { animal: '🐝', aName: '벌', home: '🍯', hName: '벌집' }
        ];
    }

    init(ctx, canvas, container, tvCtx, tvCanvas) {
        this.ctx = ctx; this.canvas = canvas; this.tvCtx = tvCtx; this.tvCanvas = tvCanvas;
    }

    start() {
        this.isActive = true; this.gameEnded = false; this.selectedAnimal = null;
        this.successStep = 0; this.failStep = 0; this.stepTimer = 0; this.animationFrame = 0;
        this.matchedPair = null;

        const shuffled = [...this.pairSets];
        for (let i = shuffled.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1));[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]; }
        this.pairs = shuffled.slice(0, 3);

        // Shuffle home order independently
        this.homeOrder = [...this.pairs];
        for (let i = this.homeOrder.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1));[this.homeOrder[i], this.homeOrder[j]] = [this.homeOrder[j], this.homeOrder[i]]; }

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
        grad.addColorStop(0, '#E8F5E9');
        grad.addColorStop(1, '#C8E6C9');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);

        // Animals (top row)
        const positions = [0.2, 0.5, 0.8];
        const animalY = h * 0.35;

        this.pairs.forEach((p, i) => {
            const ax = w * positions[i];
            const bounce = Math.sin(this.animationFrame * 0.04 + i) * 3;
            const isSelected = this.selectedAnimal === p;

            ctx.fillStyle = isSelected ? 'rgba(76,175,80,0.3)' : 'rgba(255,255,255,0.7)';
            ctx.beginPath(); ctx.roundRect(ax - 38, animalY - 35 + bounce, 76, 70, 12); ctx.fill();
            if (isSelected) { ctx.strokeStyle = '#4CAF50'; ctx.lineWidth = 3; ctx.stroke(); }

            ctx.font = '38px sans-serif'; ctx.textAlign = 'center';
            ctx.fillText(p.animal, ax, animalY + 10 + bounce);
            ctx.fillStyle = '#555'; ctx.font = '11px "ONE Mobile POP", sans-serif';
            ctx.fillText(p.aName, ax, animalY + 30 + bounce);
        });

        // Arrow
        ctx.fillStyle = '#888'; ctx.font = '28px sans-serif'; ctx.textAlign = 'center';
        ctx.fillText('⬇️', w / 2, h * 0.55);

        // Homes (bottom row)
        const homeY = h * 0.75;

        this.homeOrder.forEach((p, i) => {
            const hx = w * positions[i];
            const bounce = Math.sin(this.animationFrame * 0.04 + i + 3) * 3;

            ctx.fillStyle = 'rgba(255,255,255,0.7)';
            ctx.beginPath(); ctx.roundRect(hx - 38, homeY - 35 + bounce, 76, 70, 12); ctx.fill();
            ctx.strokeStyle = '#DDD'; ctx.lineWidth = 1.5; ctx.stroke();

            ctx.font = '38px sans-serif'; ctx.textAlign = 'center';
            ctx.fillText(p.home, hx, homeY + 10 + bounce);
            ctx.fillStyle = '#555'; ctx.font = '11px "ONE Mobile POP", sans-serif';
            ctx.fillText(p.hName, hx, homeY + 30 + bounce);
        });

        // Match success line
        if (this.matchedPair && this.successStep > 0) {
            const ai = this.pairs.indexOf(this.matchedPair);
            const hi = this.homeOrder.indexOf(this.matchedPair);
            if (ai >= 0 && hi >= 0) {
                ctx.strokeStyle = '#4CAF50'; ctx.lineWidth = 3; ctx.setLineDash([5, 5]);
                ctx.beginPath();
                ctx.moveTo(w * positions[ai], animalY + 35);
                ctx.lineTo(w * positions[hi], homeY - 35);
                ctx.stroke();
                ctx.setLineDash([]);
            }
            ctx.fillStyle = '#4CAF50'; ctx.font = 'bold 24px sans-serif';
            ctx.fillText('⭐ 잘했어!', w / 2, h * 0.55);
        }
        if (this.failStep > 0) {
            ctx.fillStyle = '#F44336'; ctx.font = 'bold 24px sans-serif';
            ctx.fillText('✖ 맞지 않아!', w / 2, h * 0.55);
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
        const w = this.canvas.width; const h = this.canvas.height;
        const positions = [0.2, 0.5, 0.8];
        const animalY = h * 0.35; const homeY = h * 0.75;

        // Check animal selection
        if (!this.selectedAnimal) {
            this.pairs.forEach((p, i) => {
                const ax = w * positions[i];
                if (Math.abs(x - ax) < 40 && Math.abs(y - animalY) < 40) {
                    this.selectedAnimal = p;
                    audioManager.playSFX('click');
                }
            });
            return;
        }

        // Check home selection
        this.homeOrder.forEach((p, i) => {
            const hx = w * positions[i];
            if (Math.abs(x - hx) < 40 && Math.abs(y - homeY) < 40) {
                this.gameEnded = true;
                if (p === this.selectedAnimal) {
                    this.matchedPair = p;
                    gameTimer.stop(); audioManager.playSFX('ding'); audioManager.playSuccess();
                    this.successStep = 1; this.stepTimer = 0;
                } else {
                    audioManager.playFail(); this.failStep = 1; this.stepTimer = 0;
                }
            }
        });
    }

    onButtonUp() { }
    onTimeout() { if (!this.gameEnded) { this.gameEnded = true; this.failStep = 1; this.stepTimer = 0; audioManager.playFail(); } }
    cleanup() { this.isActive = false; if (this.animationId) cancelAnimationFrame(this.animationId); }
}

const game26AnimalHome = new Game26AnimalHome();
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => { if (typeof gameController !== 'undefined') gameController.registerGame(26, game26AnimalHome); }, 100);
});
