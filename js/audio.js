/**
 * Audio Manager for Antigravity Petit Game
 * Handles BGM and SFX with tempo control
 */
class AudioManager {
    constructor() {
        this.audioContext = null;
        this.tickInterval = null;
        this.currentTempo = 1.0;
        this.isPlaying = false;
        
        // Initialize Web Audio API on first user interaction
        this.initialized = false;
    }

    init() {
        if (this.initialized) return;
        
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.initialized = true;
        } catch (e) {
            console.warn('Web Audio API not supported:', e);
        }
    }

    /**
     * Play a beep sound for the tick-tock effect
     */
    playTick() {
        if (!this.audioContext) return;

        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        oscillator.frequency.value = 800;
        oscillator.type = 'sine';

        gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);

        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 0.1);
    }

    /**
     * Start the tick-tock BGM
     * @param {number} tempo - Playback rate (1.0 = normal, 1.5 = fast)
     */
    startTickBGM(tempo = 1.0) {
        this.init();
        this.stopTickBGM();
        
        this.currentTempo = tempo;
        this.isPlaying = true;
        
        const interval = 500 / tempo; // Base interval is 500ms (2 ticks per second)
        
        this.playTick();
        this.tickInterval = setInterval(() => {
            if (this.isPlaying) {
                this.playTick();
            }
        }, interval);
    }

    /**
     * Change the tempo of the tick BGM
     * @param {number} tempo - New tempo multiplier
     */
    setTempo(tempo) {
        if (this.isPlaying) {
            this.startTickBGM(tempo);
        }
    }

    /**
     * Stop the tick-tock BGM
     */
    stopTickBGM() {
        this.isPlaying = false;
        if (this.tickInterval) {
            clearInterval(this.tickInterval);
            this.tickInterval = null;
        }
    }

    /**
     * Play a success sound effect
     */
    playSuccess() {
        this.init();
        if (!this.audioContext) return;

        // Play a pleasant ascending tone
        const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
        notes.forEach((freq, i) => {
            setTimeout(() => {
                const oscillator = this.audioContext.createOscillator();
                const gainNode = this.audioContext.createGain();

                oscillator.connect(gainNode);
                gainNode.connect(this.audioContext.destination);

                oscillator.frequency.value = freq;
                oscillator.type = 'sine';

                gainNode.gain.setValueAtTime(0.2, this.audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);

                oscillator.start(this.audioContext.currentTime);
                oscillator.stop(this.audioContext.currentTime + 0.3);
            }, i * 100);
        });
    }

    /**
     * Play a failure sound effect
     */
    playFail() {
        this.init();
        if (!this.audioContext) return;

        // Play a descending "wah wah" tone
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        oscillator.frequency.setValueAtTime(400, this.audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(200, this.audioContext.currentTime + 0.5);
        oscillator.type = 'sawtooth';

        gainNode.gain.setValueAtTime(0.15, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.5);

        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 0.5);
    }

    /**
     * Play a custom sound effect
     * @param {string} type - Type of sound ('pop', 'click', 'ding', 'whoosh')
     */
    playSFX(type) {
        this.init();
        if (!this.audioContext) return;

        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        switch(type) {
            case 'pop':
                oscillator.frequency.value = 600;
                oscillator.type = 'sine';
                gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);
                oscillator.start(this.audioContext.currentTime);
                oscillator.stop(this.audioContext.currentTime + 0.1);
                break;
                
            case 'click':
                oscillator.frequency.value = 1000;
                oscillator.type = 'square';
                gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.05);
                oscillator.start(this.audioContext.currentTime);
                oscillator.stop(this.audioContext.currentTime + 0.05);
                break;
                
            case 'ding':
                oscillator.frequency.value = 880;
                oscillator.type = 'sine';
                gainNode.gain.setValueAtTime(0.2, this.audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.4);
                oscillator.start(this.audioContext.currentTime);
                oscillator.stop(this.audioContext.currentTime + 0.4);
                break;
                
            case 'whoosh':
                oscillator.frequency.setValueAtTime(200, this.audioContext.currentTime);
                oscillator.frequency.exponentialRampToValueAtTime(800, this.audioContext.currentTime + 0.2);
                oscillator.type = 'sawtooth';
                gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.2);
                oscillator.start(this.audioContext.currentTime);
                oscillator.stop(this.audioContext.currentTime + 0.2);
                break;
        }
    }
}

// Global audio manager instance
const audioManager = new AudioManager();
