/**
 * Game 20: 빠진 조각을 찾아줘! (Find the missing puzzle piece)
 * - Simple shape puzzle: a shape is shown with a missing piece
 * - 3 choices, pick the correct one
 */
class Game20Puzzle {
    constructor() {
        this.ctx = null; this.canvas = null; this.tvCtx = null; this.tvCanvas = null;
        this.isActive = false; this.gameEnded = false; this.animationId = null; this.animationFrame = 0;
        this.puzzle = null; this.choices = []; this.selectedIdx = -1;
        this.successStep = 0; this.failStep = 0; this.stepTimer = 0;

        // Puzzle definitions: shape, missing piece shape, wrong pieces
        this.puzzleSets = [
            { name: '하트', mainColor: '#FF6B6B', drawMain: 'heart', missingPart: 'circle', wrongParts: ['triangle', 'square'], holePos: { dx: 0.25, dy: -0.45 } },
            { name: '별', mainColor: '#FFD700', drawMain: 'star', missingPart: 'triangle', wrongParts: ['circle', 'diamond'], holePos: { dx: 0, dy: -0.5 } },
            { name: '집', mainColor: '#A1887F', drawMain: 'house', missingPart: 'square', wrongParts: ['triangle', 'circle'], holePos: { dx: 0, dy: 0.2 } },
            { name: '나무', mainColor: '#4CAF50', drawMain: 'tree', missingPart: 'diamond', wrongParts: ['square', 'circle'], holePos: { dx: 0, dy: -0.2 } },
            { name: '달', mainColor: '#FFD54F', drawMain: 'moon', missingPart: 'circle', wrongParts: ['square', 'triangle'], holePos: { dx: 0, dy: 0 } }
        ];
    }

    init(ctx, canvas, container, tvCtx, tvCanvas) {
        this.ctx = ctx; this.canvas = canvas; this.tvCtx = tvCtx; this.tvCanvas = tvCanvas;
    }

    start() {
        this.isActive = true; this.gameEnded = false; this.selectedIdx = -1;
        this.successStep = 0; this.failStep = 0; this.stepTimer = 0; this.animationFrame = 0;

        this.puzzle = this.puzzleSets[Math.floor(Math.random() * this.puzzleSets.length)];

        // Build choices: correct + 2 wrong, shuffled
        this.choices = [
            { type: this.puzzle.missingPart, isCorrect: true },
            { type: this.puzzle.wrongParts[0], isCorrect: false },
            { type: this.puzzle.wrongParts[1], isCorrect: false }
        ];
        for (let i = this.choices.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.choices[i], this.choices[j]] = [this.choices[j], this.choices[i]];
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

    drawPieceShape(ctx, x, y, type, size, color) {
        ctx.save();
        ctx.fillStyle = color;
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;

        switch (type) {
            case 'triangle':
                ctx.beginPath();
                ctx.moveTo(x, y - size / 2); ctx.lineTo(x + size * 0.55, y + size / 2); ctx.lineTo(x - size * 0.55, y + size / 2);
                ctx.closePath(); ctx.fill(); ctx.stroke();
                break;
            case 'circle':
                ctx.beginPath(); ctx.arc(x, y, size * 0.55, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
                break;
            case 'square':
                ctx.beginPath(); ctx.roundRect(x - size * 0.5, y - size * 0.5, size, size, 5); ctx.fill(); ctx.stroke();
                break;
            case 'diamond':
                ctx.beginPath();
                ctx.moveTo(x, y - size * 0.6); ctx.lineTo(x + size * 0.6, y); ctx.lineTo(x, y + size * 0.6); ctx.lineTo(x - size * 0.6, y);
                ctx.closePath(); ctx.fill(); ctx.stroke();
                break;
        }
        ctx.restore();
    }

    drawMainPuzzle(ctx, cx, cy, puzzle) {
        const s = 100;
        ctx.save();
        ctx.fillStyle = puzzle.mainColor;
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 4;

        switch (puzzle.drawMain) {
            case 'heart':
                const hs = s * 0.9;
                ctx.beginPath();
                ctx.moveTo(cx, cy + hs * 0.5);
                ctx.bezierCurveTo(cx - hs, cy - hs * 0.4, cx - hs * 0.6, cy - hs * 1.2, cx, cy - hs * 0.5);
                ctx.bezierCurveTo(cx + hs * 0.6, cy - hs * 1.2, cx + hs, cy - hs * 0.4, cx, cy + hs * 0.5);
                ctx.fill(); ctx.stroke();
                break;
            case 'star':
                this.drawStar(ctx, cx, cy, 5, s * 0.8, s * 0.4);
                ctx.fill(); ctx.stroke();
                break;
            case 'house':
                // Body
                ctx.fillStyle = '#D7CCC8';
                ctx.beginPath(); ctx.roundRect(cx - s * 0.6, cy - s * 0.2, s * 1.2, s, 5); ctx.fill(); ctx.stroke();
                // Roof
                ctx.fillStyle = puzzle.mainColor;
                ctx.beginPath();
                ctx.moveTo(cx - s * 0.8, cy - s * 0.2); ctx.lineTo(cx, cy - s); ctx.lineTo(cx + s * 0.8, cy - s * 0.2);
                ctx.closePath(); ctx.fill(); ctx.stroke();
                break;
            case 'tree':
                // Trunk
                ctx.fillStyle = '#5D4037';
                ctx.fillRect(cx - 15, cy + 20, 30, 60);
                // Leaves
                ctx.fillStyle = puzzle.mainColor;
                ctx.beginPath(); ctx.arc(cx, cy - 20, 60, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
                break;
            case 'moon':
                ctx.beginPath();
                ctx.arc(cx, cy, s * 0.7, 0, Math.PI * 2);
                ctx.fill(); ctx.stroke();
                // "Crescent" effect - subtract a circle if we wanted a real crescent, 
                // but for simplicity let's keep it a full moon or a circle-based puzzle
                break;
        }

        // Draw missing piece hole (centered at holePos)
        const holeX = cx + s * puzzle.holePos.dx;
        const holeY = cy + s * puzzle.holePos.dy;
        const holeSize = 35;

        ctx.save();
        ctx.globalCompositeOperation = 'destination-out';
        this.fillPieceShape(ctx, holeX, holeY, puzzle.missingPart, holeSize);
        ctx.restore();

        // Draw dotted outline for the hole
        ctx.save();
        ctx.setLineDash([4, 4]);
        ctx.strokeStyle = 'rgba(0,0,0,0.4)';
        ctx.lineWidth = 2;
        this.strokePieceShape(ctx, holeX, holeY, puzzle.missingPart, holeSize);
        ctx.restore();

        ctx.restore();
    }

    fillPieceShape(ctx, x, y, type, size) {
        ctx.beginPath();
        if (type === 'circle') ctx.arc(x, y, size * 0.55, 0, Math.PI * 2);
        else if (type === 'triangle') {
            ctx.moveTo(x, y - size / 2); ctx.lineTo(x + size * 0.55, y + size / 2); ctx.lineTo(x - size * 0.55, y + size / 2);
        } else if (type === 'square') {
            ctx.roundRect(x - size * 0.5, y - size * 0.5, size, size, 5);
        } else if (type === 'diamond') {
            ctx.moveTo(x, y - size * 0.6); ctx.lineTo(x + size * 0.6, y); ctx.lineTo(x, y + size * 0.6); ctx.lineTo(x - size * 0.6, y);
        }
        ctx.closePath();
        ctx.fill();
    }

    strokePieceShape(ctx, x, y, type, size) {
        ctx.beginPath();
        if (type === 'circle') ctx.arc(x, y, size * 0.55, 0, Math.PI * 2);
        else if (type === 'triangle') {
            ctx.moveTo(x, y - size / 2); ctx.lineTo(x + size * 0.55, y + size / 2); ctx.lineTo(x - size * 0.55, y + size / 2);
        } else if (type === 'square') {
            ctx.roundRect(x - size * 0.5, y - size * 0.5, size, size, 5);
        } else if (type === 'diamond') {
            ctx.moveTo(x, y - size * 0.6); ctx.lineTo(x + size * 0.6, y); ctx.lineTo(x, y + size * 0.6); ctx.lineTo(x - size * 0.6, y);
        }
        ctx.closePath();
        ctx.stroke();
    }

    drawStar(ctx, cx, cy, points, outerR, innerR) {
        ctx.beginPath();
        for (let i = 0; i < points * 2; i++) {
            const r = i % 2 === 0 ? outerR : innerR;
            const angle = (Math.PI * i) / points - Math.PI / 2;
            const x = cx + r * Math.cos(angle);
            const y = cy + r * Math.sin(angle);
            if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.closePath();
    }

    drawScene(ctx, canvas) {
        const w = canvas.width; const h = canvas.height;

        // Background
        const grad = ctx.createLinearGradient(0, 0, 0, h);
        grad.addColorStop(0, '#FFF9C4');
        grad.addColorStop(1, '#FFF59D');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);

        // Main puzzle shape
        if (this.puzzle) {
            this.drawMainPuzzle(ctx, w / 2, h * 0.42, this.puzzle);
        }

        // Choices at bottom
        const positions = [0.22, 0.5, 0.78];
        const choiceY = h * 0.8;
        const choiceSize = 45;

        this.choices.forEach((c, i) => {
            const cx = w * positions[i];
            // All choices same color to force shape matching
            const color = '#CFD8DC';

            // Draw a subtle card behind
            ctx.fillStyle = 'white';
            ctx.beginPath(); ctx.roundRect(cx - 45, choiceY - 45, 90, 90, 15); ctx.fill();
            ctx.strokeStyle = '#B0BEC5'; ctx.lineWidth = 1; ctx.stroke();

            this.drawPieceShape(ctx, cx, choiceY, c.type, choiceSize, color);

            if (this.selectedIdx === i && this.successStep > 0) {
                ctx.fillStyle = '#4CAF50'; ctx.font = 'bold 30px sans-serif'; ctx.textAlign = 'center';
                ctx.fillText('⭐', cx, choiceY - 55);
            }
            if (this.selectedIdx === i && this.failStep > 0) {
                ctx.fillStyle = '#F44336'; ctx.font = 'bold 30px sans-serif'; ctx.textAlign = 'center';
                ctx.fillText('✖', cx, choiceY - 55);
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
        const positions = [0.2, 0.5, 0.8];
        const choiceY = h * 0.78;

        this.choices.forEach((c, i) => {
            const cx = w * positions[i];
            if (Math.abs(x - cx) < 30 && Math.abs(y - choiceY) < 30) {
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

const game20Puzzle = new Game20Puzzle();
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => { if (typeof gameController !== 'undefined') gameController.registerGame(20, game20Puzzle); }, 100);
});
