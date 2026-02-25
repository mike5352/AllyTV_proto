/**
 * Result Screen Controller for Antigravity Petit Game
 * NEW: Shows dim overlay + result card + buttons over the game canvas
 * (Both TV and mobile overlays are shown simultaneously)
 */
class ResultScreen {
    constructor() {
        // Legacy result screen (kept for compatibility)
        this.screen = document.getElementById('result-screen');
        this.resultIcon = document.getElementById('result-icon');
        this.btnHome = document.getElementById('btn-home');
        this.btnRetry = document.getElementById('btn-retry');

        // TV mirror elements
        this.tvResultIcon = document.getElementById('tv-result-icon');

        // NEW: Overlay elements - Mobile
        this.mobOverlay = document.getElementById('mob-result-overlay');
        this.overlayBtnHome = document.getElementById('overlay-btn-home');
        this.overlayBtnRetry = document.getElementById('overlay-btn-retry');

        // NEW: Overlay elements - TV
        this.tvOverlay = document.getElementById('tv-result-overlay');
        this.tvOverlayIcon = document.getElementById('tv-overlay-icon');

        this.lastGameId = null;

        this.init();
    }

    init() {
        // Legacy buttons
        if (this.btnHome) {
            this.btnHome.addEventListener('click', () => this.goHome());
            this.btnHome.addEventListener('touchend', (e) => {
                e.preventDefault();
                this.goHome();
            });
        }
        if (this.btnRetry) {
            this.btnRetry.addEventListener('click', () => this.retry());
            this.btnRetry.addEventListener('touchend', (e) => {
                e.preventDefault();
                this.retry();
            });
        }

        // NEW: Overlay buttons
        if (this.overlayBtnHome) {
            this.overlayBtnHome.addEventListener('click', () => this.goHome());
            this.overlayBtnHome.addEventListener('touchend', (e) => {
                e.preventDefault();
                this.goHome();
            });
        }
        if (this.overlayBtnRetry) {
            this.overlayBtnRetry.addEventListener('click', () => this.retry());
            this.overlayBtnRetry.addEventListener('touchend', (e) => {
                e.preventDefault();
                this.retry();
            });
        }
    }

    /**
     * Show the result overlay over the game canvas (NEW method)
     * Used for Ally games (11-17): keeps game canvas visible, dims it, shows result
     * @param {boolean} success - Whether the game was successful
     * @param {number} gameId - The game that was just played
     */
    showOverlay(success, gameId) {
        this.lastGameId = gameId;

        // Pick result image
        const randomIndex = Math.floor(Math.random() * 2) + 1; // 1 or 2
        const iconUrl = success
            ? `assets/Ally_UI/success 1-${randomIndex}.png`
            : `assets/Ally_UI/fail 1-${randomIndex}.png`;

        // Play audio
        if (success) {
            audioManager.playSuccess();
        } else {
            audioManager.playFail();
        }

        // Apply icon to TV overlay only
        if (this.tvOverlayIcon) {
            this.tvOverlayIcon.style.backgroundImage = `url('${iconUrl}')`;
        }

        // Show overlays
        if (this.mobOverlay) this.mobOverlay.classList.add('active');
        if (this.tvOverlay) this.tvOverlay.classList.add('active');
    }

    /**
     * Hide both overlays
     */
    hideOverlay() {
        if (this.mobOverlay) this.mobOverlay.classList.remove('active');
        if (this.tvOverlay) this.tvOverlay.classList.remove('active');
    }

    /**
     * Show the result screen (legacy, for non-Ally games)
     * @param {boolean} success - Whether the game was successful
     * @param {number} gameId - The game that was just played
     */
    show(success, gameId) {
        this.lastGameId = gameId;

        // For Ally games (11+), use the new overlay approach
        if (gameId >= 11) {
            this.showOverlay(success, gameId);
            return;
        }

        // Legacy: show result-screen
        this.screen.classList.add('active');

        let iconUrl;
        if (success) {
            const randomIndex = Math.floor(Math.random() * 2) + 1;
            iconUrl = `assets/Ally_UI/success 1-${randomIndex}.png`;
            this.resultIcon.className = 'result-icon success';
            audioManager.playSuccess();
        } else {
            const randomIndex = Math.floor(Math.random() * 2) + 1;
            iconUrl = `assets/Ally_UI/fail 1-${randomIndex}.png`;
            this.resultIcon.className = 'result-icon fail';
            audioManager.playFail();
        }

        // Hide result card for older games on phone
        const hideOnPhone = gameId >= 11;
        this.resultIcon.style.display = hideOnPhone ? 'none' : 'block';
        if (this.tvResultIcon) this.tvResultIcon.style.display = 'block';

        this.resultIcon.textContent = '';
        this.resultIcon.style.backgroundImage = `url('${iconUrl}')`;
        this.resultIcon.style.backgroundSize = 'contain';
        this.resultIcon.style.backgroundPosition = 'center';
        this.resultIcon.style.backgroundRepeat = 'no-repeat';
        this.resultIcon.style.width = '200px';
        this.resultIcon.style.height = '200px';

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
        if (this.screen) this.screen.classList.remove('active');
        this.hideOverlay();
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
