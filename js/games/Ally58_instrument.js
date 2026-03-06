/**
 * Game 25: 악기 소리를 맞춰봐! (Match the instrument sound)
 * - Uses Web Audio to generate simple tones representing instruments
 * - Pick the instrument that matches the sound
 */
class Game25Instrument {
    constructor() {
        this.ctx = null; this.canvas = null; this.tvCtx = null; this.tvCanvas = null;
        this.isActive = false; this.gameEnded = false; this.animationId = null; this.animationFrame = 0;
        this.targetInstrument = null; this.choices = []; this.selectedIdx = -1;
        this.successStep = 0; this.failStep = 0; this.stepTimer = 0;
        this.soundPlayed = false;
        this.soundInterval = null;

        this.instruments = [
            { emoji: '🎹', name: '피아노', freq: 523, type: 'sine' },
            { emoji: '🥁', name: '북', freq: 100, type: 'triangle' },
            { emoji: '🎸', name: '기타', freq: 330, type: 'triangle' },
            { emoji: '🎺', name: '나팔', freq: 700, type: 'sawtooth' },
            { emoji: '🔔', name: '종', freq: 880, type: 'sine' },
            { emoji: '🎵', name: '실로폰', freq: 660, type: 'sine' }
        ];
    }

    init(ctx, canvas, container, tvCtx, tvCanvas) {
        this.ctx = ctx; this.canvas = canvas; this.tvCtx = tvCtx; this.tvCanvas = tvCanvas;
    }

    start() {
        this.isActive = true; this.gameEnded = false; this.selectedIdx = -1;
        this.successStep = 0; this.failStep = 0; this.stepTimer = 0; this.animationFrame = 0;
        // this.soundPlayed = false; // Removed as per instruction

        const shuffled = [...this.instruments];
        for (let i = shuffled.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1));[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]; }

        this.targetInstrument = shuffled[0];
        this.choices = [
            { ...shuffled[0], isCorrect: true },
            { ...shuffled[1], isCorrect: false },
            { ...shuffled[2], isCorrect: false }
        ];
        for (let i = this.choices.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1));[this.choices[i], this.choices[j]] = [this.choices[j], this.choices[i]]; }

        // STOP global tick BGM to hear the instrument better
        audioManager.stopTickBGM();

        // Loop the sound
        this.playLoopingSound();
        this.soundInterval = setInterval(() => {
            if (this.isActive && !this.gameEnded) {
                this.playLoopingSound();
            }
        }, 1500);

        this.animate();
    }

    playLoopingSound() {
        this.playTone(this.targetInstrument.freq, 0.7, this.targetInstrument.type);
    }

    playTone(freq, duration, type = 'sine') {
        try {
            const audioCtx = audioManager.audioContext || new (window.AudioContext || window.webkitAudioContext)();
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.frequency.value = freq;
            osc.type = type;
            gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);
            osc.start(); osc.stop(audioCtx.currentTime + duration);
        } catch (e) { console.log('Audio error', e); }
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

        // Stage background
        const grad = ctx.createLinearGradient(0, 0, 0, h);
        grad.addColorStop(0, '#311B92');
        grad.addColorStop(1, '#512DA8');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);

        // Stage floor
        ctx.fillStyle = '#8D6E63';
        ctx.fillRect(0, h * 0.7, w, h * 0.3);

        // Curtains
        ctx.fillStyle = '#9B111E';
        ctx.fillRect(0, 0, 25, h * 0.7);
        ctx.fillRect(w - 25, 0, 25, h * 0.7);

        // Sound waves (animated - sync with loop)
        const waveProgress = (Date.now() % 1500) / 1500;
        ctx.strokeStyle = '#FFEB3B';
        ctx.lineWidth = 3;
        for (let r = 0; r < 2; r++) {
            const radius = 30 + r * 25 + (waveProgress * 40);
            ctx.globalAlpha = Math.max(0, 1 - radius / 100);
            ctx.beginPath();
            ctx.arc(w / 2, h * 0.35, radius, 0, Math.PI * 2);
            ctx.stroke();
        }
        ctx.globalAlpha = 1;

        // Speaker icon
        ctx.font = '60px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🔊', w / 2, h * 0.35);

        // Instruction
        ctx.fillStyle = '#FFF';
        ctx.font = 'bold 16px "ONE Mobile POP", sans-serif';
        ctx.fillText('들리는 소리의 악기를 찾아봐!', w / 2, h * 0.52);

        // Choices
        const positions = [0.22, 0.5, 0.78];
        const choiceY = h * 0.78;

        this.choices.forEach((c, i) => {
            const cx = w * positions[i];
            const bounce = Math.sin(this.animationFrame * 0.05 + i * 2) * 4;

            // Card
            ctx.fillStyle = 'rgba(255,255,255,0.2)';
            ctx.beginPath(); ctx.roundRect(cx - 50, choiceY - 50 + bounce, 100, 100, 15); ctx.fill();
            ctx.strokeStyle = this.selectedIdx === i ? (this.successStep > 0 ? '#4CAF50' : '#F44336') : 'rgba(255,255,255,0.4)';
            ctx.lineWidth = 2.5; ctx.stroke();

            ctx.font = '50px sans-serif'; ctx.textAlign = 'center';
            ctx.fillText(c.emoji, cx, choiceY - 5 + bounce);
            ctx.fillStyle = '#FFF'; ctx.font = 'bold 14px "ONE Mobile POP", sans-serif';
            ctx.fillText(c.name, cx, choiceY + 35 + bounce);

            if (this.selectedIdx === i && (this.successStep > 0 || this.failStep > 0)) {
                ctx.fillStyle = this.successStep > 0 ? '#4CAF50' : '#F44336';
                ctx.font = 'bold 28px sans-serif';
                ctx.fillText(this.successStep > 0 ? '⭐' : '✖', cx, choiceY - 75 + bounce);
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
        const positions = [0.22, 0.5, 0.78]; const choiceY = h * 0.78;

        // Replay sound if tapping speaker area
        if (Math.abs(x - w / 2) < 50 && Math.abs(y - h * 0.35) < 50) {
            this.playTone(this.targetInstrument.freq, 0.7, this.targetInstrument.type);
            return;
        }

        this.choices.forEach((c, i) => {
            const cx = w * positions[i];
            if (Math.abs(x - cx) < 50 && Math.abs(y - choiceY) < 50) {
                this.stopSoundLoop();
                this.gameEnded = true; this.selectedIdx = i;
                if (c.isCorrect) { gameTimer.stop(); audioManager.playSFX('ding'); audioManager.playSuccess(); this.successStep = 1; }
                else { audioManager.playFail(); this.failStep = 1; }
                this.stepTimer = 0;
            }
        });
    }

    stopSoundLoop() {
        if (this.soundInterval) {
            clearInterval(this.soundInterval);
            this.soundInterval = null;
        }
    }

    onButtonUp() { }
    onTimeout() { if (!this.gameEnded) { this.stopSoundLoop(); this.gameEnded = true; this.failStep = 1; this.stepTimer = 0; audioManager.playFail(); } }
    cleanup() { this.isActive = false; this.stopSoundLoop(); if (this.animationId) cancelAnimationFrame(this.animationId); }
}

const game25Instrument = new Game25Instrument();
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => { if (typeof gameController !== 'undefined') gameController.registerGame(25, game25Instrument); }, 100);
});
