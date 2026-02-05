/**
 * Result Screen Controller for Antigravity Petit Game
 * Handles success/failure display and navigation
 */
class ResultScreen {
    constructor() {
        this.screen = document.getElementById('result-screen');
        this.resultIcon = document.getElementById('result-icon');
        this.btnHome = document.getElementById('btn-home');
        this.btnRetry = document.getElementById('btn-retry');

        // TV mirror elements
        this.tvResultIcon = document.getElementById('tv-result-icon');

        this.lastGameId = null;

        this.init();
    }

    init() {
        // Home button handler
        this.btnHome.addEventListener('click', () => this.goHome());
        this.btnHome.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.goHome();
        });

        // Retry button handler
        this.btnRetry.addEventListener('click', () => this.retry());
        this.btnRetry.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.retry();
        });
    }

    /**
     * Show the result screen
     * @param {boolean} success - Whether the game was successful
     * @param {number} gameId - The game that was just played
     */
    show(success, gameId) {
        this.lastGameId = gameId;
        this.screen.classList.add('active');

        // Choose random success or fail image
        let iconUrl;
        if (success) {
            const randomIndex = Math.floor(Math.random() * 2) + 1; // 1 or 2
            iconUrl = `assets/Ally_UI/success 1-${randomIndex}.png`;
            this.resultIcon.className = 'result-icon success';
            audioManager.playSuccess();
        } else {
            const randomIndex = Math.floor(Math.random() * 2) + 1; // 1 or 2
            iconUrl = `assets/Ally_UI/fail 1-${randomIndex}.png`;
            this.resultIcon.className = 'result-icon fail';
            audioManager.playFail();
        }

        // Update phone frame result icon
        this.resultIcon.textContent = '';
        this.resultIcon.style.backgroundImage = `url('${iconUrl}')`;
        this.resultIcon.style.backgroundSize = 'contain';
        this.resultIcon.style.backgroundPosition = 'center';
        this.resultIcon.style.backgroundRepeat = 'no-repeat';
        this.resultIcon.style.width = '200px';
        this.resultIcon.style.height = '200px';

        // Mirror to TV frame result icon
        if (this.tvResultIcon) {
            this.tvResultIcon.textContent = '';
            this.tvResultIcon.style.backgroundImage = `url('${iconUrl}')`;
            this.tvResultIcon.style.backgroundSize = 'contain';
            this.tvResultIcon.style.backgroundPosition = 'center';
            this.tvResultIcon.style.backgroundRepeat = 'no-repeat';
            this.tvResultIcon.style.width = '200px';
            this.tvResultIcon.style.height = '200px';
        }
    }

    /**
     * Hide the result screen
     */
    hide() {
        this.screen.classList.remove('active');
    }

    /**
     * Navigate back to home screen
     */
    goHome() {
        audioManager.playSFX('click');
        this.hide();
        gameController.goHome();
    }

    /**
     * Retry the last game
     */
    retry() {
        audioManager.playSFX('click');
        this.hide();
        gameController.startGame(this.lastGameId);
    }
}

// Will be initialized after DOM loads
let resultScreen;
