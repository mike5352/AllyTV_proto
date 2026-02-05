/**
 * Home Screen Controller for Antigravity Petit Game
 * Handles game card selection and transitions
 */
class HomeScreen {
    constructor() {
        this.screen = document.getElementById('home-screen');
        this.cards = document.querySelectorAll('.game-card');
        this.isTransitioning = false;

        this.init();
    }

    init() {
        // Add click/touch handlers to each card
        this.cards.forEach(card => {
            card.addEventListener('click', (e) => this.handleCardClick(e, card));
            card.addEventListener('touchend', (e) => {
                e.preventDefault();
                this.handleCardClick(e, card);
            });
        });
    }

    handleCardClick(e, card) {
        if (this.isTransitioning) return;

        const gameId = parseInt(card.dataset.game);
        this.transitionToGame(card, gameId);
    }

    /**
     * Animate card expansion and transition to game
     * @param {HTMLElement} card - The clicked card element
     * @param {number} gameId - The game ID to start
     */
    transitionToGame(card, gameId) {
        this.isTransitioning = true;

        // Play click sound
        audioManager.playSFX('click');

        // Get phone frame element
        const phoneFrame = document.getElementById('phone-frame');
        const phoneRect = phoneFrame.getBoundingClientRect();

        // Get TV frame element
        const tvFrame = document.getElementById('tv-frame');
        const tvRect = tvFrame.getBoundingClientRect();

        // Create dim overlay inside phone frame
        const overlay = document.createElement('div');
        overlay.className = 'card-transition-overlay';
        overlay.style.position = 'absolute';
        phoneFrame.appendChild(overlay);

        // Create dim overlay inside TV frame (mirror)
        const tvOverlay = document.createElement('div');
        tvOverlay.className = 'card-transition-overlay';
        tvOverlay.style.position = 'absolute';
        tvFrame.appendChild(tvOverlay);

        // Get card position for animation
        const rect = card.getBoundingClientRect();
        const clone = card.cloneNode(true);

        // Calculate center position relative to phone frame
        const phoneCenterX = phoneRect.left + phoneRect.width / 2;
        const phoneCenterY = phoneRect.top + phoneRect.height / 2;
        const targetX = phoneCenterX - rect.width / 2;
        const targetY = phoneCenterY - rect.height / 2;
        const deltaX = targetX - rect.left;
        const deltaY = targetY - rect.top;

        // Style the clone for animation
        clone.style.position = 'fixed';
        clone.style.left = rect.left + 'px';
        clone.style.top = rect.top + 'px';
        clone.style.width = rect.width + 'px';
        clone.style.height = rect.height + 'px';
        clone.style.margin = '0';
        clone.style.setProperty('--target-x', deltaX + 'px');
        clone.style.setProperty('--target-y', deltaY + 'px');

        clone.classList.add('card-animating');
        document.body.appendChild(clone);

        // Create TV mirror card clone
        const tvClone = card.cloneNode(true);
        const tvCenterX = tvRect.left + tvRect.width / 2;
        const tvCenterY = tvRect.top + tvRect.height / 2;
        const tvTargetX = tvCenterX - rect.width / 2;
        const tvTargetY = tvCenterY - rect.height / 2;
        const tvDeltaX = tvTargetX - rect.left;
        const tvDeltaY = tvTargetY - rect.top;

        // Style the TV clone
        tvClone.style.position = 'fixed';
        tvClone.style.left = rect.left + 'px';
        tvClone.style.top = rect.top + 'px';
        tvClone.style.width = rect.width + 'px';
        tvClone.style.height = rect.height + 'px';
        tvClone.style.margin = '0';
        tvClone.style.setProperty('--target-x', tvDeltaX + 'px');
        tvClone.style.setProperty('--target-y', tvDeltaY + 'px');

        tvClone.classList.add('card-animating');
        document.body.appendChild(tvClone);

        // Create star particles for both frames
        this.createStarParticles(phoneCenterX, phoneCenterY, phoneRect);
        this.createStarParticles(tvCenterX, tvCenterY, tvRect);

        // After animation, start the game
        setTimeout(() => {
            overlay.remove();
            tvOverlay.remove();
            clone.remove();
            tvClone.remove();
            this.isTransitioning = false;
            gameController.startGame(gameId);
        }, 1200);
    }

    /**
     * Create floating star particles
     * @param {number} centerX - Center X position
     * @param {number} centerY - Center Y position
     */
    createStarParticles(centerX, centerY, frameRect) {
        const stars = ['⭐', '✨', '🌟', '💫', '⚡'];
        const particleCount = 15;

        for (let i = 0; i < particleCount; i++) {
            setTimeout(() => {
                const particle = document.createElement('div');
                particle.className = 'star-particle';
                particle.textContent = stars[Math.floor(Math.random() * stars.length)];

                // Random position around the center
                const angle = (Math.PI * 2 * i) / particleCount;
                const radius = 50 + Math.random() * 50;
                const startX = centerX + Math.cos(angle) * radius;
                const startY = frameRect.bottom; // Start from frame bottom

                particle.style.left = startX + 'px';
                particle.style.top = startY + 'px';

                // Random animation delay and duration variation
                particle.style.animationDelay = (Math.random() * 0.2) + 's';
                particle.style.animationDuration = (1.2 + Math.random() * 0.6) + 's';

                document.body.appendChild(particle);

                // Remove particle after animation
                setTimeout(() => particle.remove(), 2000);
            }, i * 50); // Stagger particle creation
        }
    }


    /**
     * Show the home screen
     */
    show() {
        this.screen.classList.add('active');
        gameTimer.hide();
    }

    /**
     * Hide the home screen
     */
    hide() {
        this.screen.classList.remove('active');
    }
}

// Will be initialized after DOM loads
let homeScreen;
