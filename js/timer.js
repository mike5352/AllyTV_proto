/**
 * Timer Component for Antigravity Petit Game
 * PNG image-based countdown timer with circular progress gauge
 * Syncs between phone and TV timers
 */
class GameTimer {
    constructor() {
        // Phone timer elements
        this.container = document.getElementById('timer-container');
        this.timerImage = document.getElementById('timer-image');
        this.timerText = document.getElementById('timer-text');
        this.progressCircle = document.getElementById('timer-progress-circle');

        // TV timer elements
        this.tvContainer = document.getElementById('tv-timer-container');
        this.tvTimerImage = document.getElementById('tv-timer-image');
        this.tvTimerText = document.getElementById('tv-timer-text');
        this.tvProgressCircle = document.getElementById('tv-timer-progress-circle');

        this.duration = 5; // Default 5 seconds
        this.remaining = this.duration;
        this.isRunning = false;
        this.isPaused = false;
        this.intervalId = null;
        this.onComplete = null;
        this.onWarning = null;
        this.startTime = null;
        this.pausedTime = 0;

        // Circle circumference for stroke-dashoffset animation (r = 32)
        this.circumference = 2 * Math.PI * 32;
        if (this.progressCircle) {
            this.progressCircle.style.strokeDasharray = this.circumference;
        }
        if (this.tvProgressCircle) {
            this.tvProgressCircle.style.strokeDasharray = this.circumference;
        }
    }

    /**
     * Get the timer image path based on remaining seconds
     * @param {number} seconds - Remaining seconds
     * @returns {string} Image path
     */
    getTimerImagePath(seconds) {
        const displayTime = Math.ceil(seconds);
        // Map: 5,4 -> timer 3.png, 3 -> timer 3.png, 2 -> timer 2.png, 1 -> timer 1.png, 0 -> timer 0.png
        if (displayTime >= 3) {
            return 'assets/Ally_UI/timer 3.png';
        } else if (displayTime === 2) {
            return 'assets/Ally_UI/timer 2.png';
        } else if (displayTime === 1) {
            return 'assets/Ally_UI/timer 1.png';
        } else {
            return 'assets/Ally_UI/timer 0.png';
        }
    }

    /**
     * Get the text color based on remaining seconds
     * @param {number} seconds - Remaining seconds
     * @returns {string} Hex color code
     */
    getTextColor(seconds) {
        const displayTime = Math.ceil(seconds);
        if (displayTime === 5) {
            return '#000000'; // Black
        } else if (displayTime === 4 || displayTime === 3) {
            return '#00A3E0'; // Blue
        } else if (displayTime === 2) {
            return '#FF9F1C'; // Orange/Yellow
        } else if (displayTime === 1) {
            return '#FF3B3B'; // Red
        } else {
            return '#FFFFFF'; // White
        }
    }

    /**
     * Get the progress circle stroke color based on remaining seconds
     * @param {number} seconds - Remaining seconds
     * @returns {string} Hex color code
     */
    getProgressColor(seconds) {
        const displayTime = Math.ceil(seconds);
        if (displayTime === 5) {
            return '#E0E0E0'; // Gray for 5
        } else if (displayTime === 4 || displayTime === 3) {
            return '#00A3E0'; // Blue
        } else if (displayTime === 2) {
            return '#FF9F1C'; // Orange
        } else if (displayTime === 1) {
            return '#FF3B3B'; // Red
        } else {
            return '#E0E0E0'; // Gray for 0
        }
    }

    /**
     * Start the timer countdown
     * @param {number} duration - Timer duration in seconds
     * @param {Function} onComplete - Callback when timer reaches 0
     * @param {Function} onWarning - Callback when timer reaches warning threshold
     */
    start(duration = 5, onComplete = null, onWarning = null) {
        this.duration = duration;
        this.remaining = duration;
        this.onComplete = onComplete;
        this.onWarning = onWarning;
        this.isRunning = true;

        // Reset visual state - Phone
        this.container.style.display = 'block';
        const initialImage = this.getTimerImagePath(this.remaining);
        this.timerImage.src = initialImage;
        this.timerText.textContent = Math.ceil(this.remaining);
        this.timerText.style.color = this.getTextColor(this.remaining);

        // Set initial progress circle
        if (this.progressCircle) {
            this.progressCircle.style.stroke = this.getProgressColor(this.remaining);
            this.progressCircle.style.strokeDashoffset = this.circumference; // Start empty
        }

        // Reset visual state - TV
        if (this.tvContainer) {
            this.tvContainer.style.display = 'block';
            this.tvTimerImage.src = initialImage;
            this.tvTimerText.textContent = Math.ceil(this.remaining);
            this.tvTimerText.style.color = this.getTextColor(this.remaining);

            if (this.tvProgressCircle) {
                this.tvProgressCircle.style.stroke = this.getProgressColor(this.remaining);
                this.tvProgressCircle.style.strokeDashoffset = this.circumference;
            }
        }

        // Start BGM
        audioManager.startTickBGM(1.0);

        this.startTime = Date.now();
        this.pausedTime = 0;
        const updateInterval = 50; // Update every 50ms for smooth animation

        this.intervalId = setInterval(() => {
            if (!this.isRunning || this.isPaused) return;

            const elapsed = (Date.now() - this.startTime - this.pausedTime) / 1000;
            this.remaining = Math.max(0, this.duration - elapsed);

            // Update visual
            this.updateVisual();

            // Check for warning (2 seconds remaining)
            if (this.remaining <= 2 && this.remaining > 0) {
                if (!this.hasWarned) {
                    this.hasWarned = true;
                    audioManager.setTempo(1.5);
                    if (this.onWarning) this.onWarning();
                }
            }

            // Check for completion
            if (this.remaining <= 0) {
                this.stop();
                if (this.onComplete) this.onComplete();
            }
        }, updateInterval);

        this.hasWarned = false;
    }

    /**
     * Update the timer visual (image, text, and progress) for both phone and TV
     */
    updateVisual() {
        const imagePath = this.getTimerImagePath(this.remaining);
        const displayTime = Math.ceil(this.remaining);
        const textColor = this.getTextColor(this.remaining);
        const progressColor = this.getProgressColor(this.remaining);

        // Calculate progress (0 to 1, where 1 is complete)
        const progress = 1 - (this.remaining / this.duration);
        const offset = this.circumference * (1 - progress);

        // Update phone timer
        if (this.timerImage.src.indexOf(imagePath) === -1) {
            this.timerImage.src = imagePath;
        }
        this.timerText.textContent = displayTime;
        this.timerText.style.color = textColor;

        if (this.progressCircle) {
            this.progressCircle.style.stroke = progressColor;
            this.progressCircle.style.strokeDashoffset = offset;
        }

        // Update TV timer
        if (this.tvTimerImage && this.tvTimerImage.src.indexOf(imagePath) === -1) {
            this.tvTimerImage.src = imagePath;
        }
        if (this.tvTimerText) {
            this.tvTimerText.textContent = displayTime;
            this.tvTimerText.style.color = textColor;
        }
        if (this.tvProgressCircle) {
            this.tvProgressCircle.style.stroke = progressColor;
            this.tvProgressCircle.style.strokeDashoffset = offset;
        }
    }

    /**
     * Stop the timer
     */
    stop() {
        this.isRunning = false;
        this.isPaused = false;
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        audioManager.stopTickBGM();
    }

    /**
     * Pause the timer
     */
    pause() {
        if (!this.isRunning || this.isPaused) return;
        this.isPaused = true;
        this.pauseStartTime = Date.now();
        audioManager.stopTickBGM();
    }

    /**
     * Resume the timer
     */
    resume() {
        if (!this.isRunning || !this.isPaused) return;
        this.isPaused = false;
        this.pausedTime += Date.now() - this.pauseStartTime;

        // Resume BGM with appropriate tempo
        const tempo = this.remaining <= 2 ? 1.5 : 1.0;
        audioManager.startTickBGM(tempo);
    }

    /**
     * Hide the timer
     */
    hide() {
        this.stop();
        this.container.style.display = 'none';
        if (this.tvContainer) {
            this.tvContainer.style.display = 'none';
        }
    }

    /**
     * Get remaining time
     * @returns {number} Remaining time in seconds
     */
    getRemaining() {
        return this.remaining;
    }

    /**
     * Check if timer is running
     * @returns {boolean}
     */
    isActive() {
        return this.isRunning;
    }
}

// Global timer instance
const gameTimer = new GameTimer();
