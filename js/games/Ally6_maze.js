/**
 * Game 16: 편지 부치러 우체국 꼬불꼬불 길 찾기!
 * - Mobile: maze background + random maze (1-3) + 4 characters at bottom
 * - TV: post office background + matching maze
 * - User selects a character; success depends on maze number
 * - Success: character shown on TV center 1s, then interaction slides R→L 2s
 * - Fail: character shown on TV center 1s, CLOSED sign + ribbon
 */
class Game16Maze {
    constructor() {
        this.ctx = null;
        this.canvas = null;
        this.tvCtx = null;
        this.tvCanvas = null;
        this.isActive = false;
        this.gameEnded = false;
        this.inSuccessSequence = false;
        this.inFailSequence = false;
        this.animationId = null;

        // Game state
        this.mazeIndex = 0; // 0-based index for maze 1-3
        this.characters = []; // shuffled character order
        this.correctPosition = 0; // 0-based position of correct answer
        this.selectedCharIdx = -1; // which character index was selected
        this.selectedPosition = -1; // which position was selected

        // Animation timers
        this.sequenceStartTime = 0;
        this.animationFrame = 0;

        // Image assets
        this.images = {
            // Mobile
            mob_bg: null,
            mob_maze: [null, null, null],
            // TV
            tv_bg: null,
            tv_maze: [null, null, null],
            // Characters (1-4)
            characters: [null, null, null, null],
            // Interactions (success 6-1 to 6-4)
            interactions: [null, null, null, null],
            // Fail assets
            fail_closed: null,   // 6-5
            fail_ribbon: null    // 6-6
        };
        this.imagesLoaded = false;
    }

    loadImages() {
        return new Promise((resolve) => {
            let loaded = 0;
            const resPath = './assets/Ally6_maze/Ally6_resource/';
            const intPath = './assets/Ally6_maze/Ally6_interaction/';

            const imageSources = {
                mob_bg: resPath + 'mobile/mob_Ally6_maze_bg.png',
                mob_maze1: resPath + 'mobile/mob_maze 1.png',
                mob_maze2: resPath + 'mobile/mob_maze 2.png',
                mob_maze3: resPath + 'mobile/mob_maze 3.png',
                tv_bg: resPath + 'tv/tv_Ally6_maze_bg.png',
                tv_maze1: resPath + 'tv/tv_maze 1.png',
                tv_maze2: resPath + 'tv/tv_maze 2.png',
                tv_maze3: resPath + 'tv/tv_maze 3.png',
                char1: resPath + 'character 1.png',
                char2: resPath + 'character 2.png',
                char3: resPath + 'character 3.png',
                char4: resPath + 'character 4.png',
                int1: intPath + 'interaction 6-1.png',
                int2: intPath + 'interaction 6-2.png',
                int3: intPath + 'interaction 6-3.png',
                int4: intPath + 'interaction 6-4.png',
                fail_closed: intPath + 'interaction 6-5.png',
                fail_ribbon: intPath + 'interaction 6-6.png'
            };

            const total = Object.keys(imageSources).length;

            Object.entries(imageSources).forEach(([key, src]) => {
                const img = new Image();
                img.onload = () => {
                    // Route to correct storage
                    if (key.startsWith('mob_maze')) {
                        const idx = parseInt(key.replace('mob_maze', '')) - 1;
                        this.images.mob_maze[idx] = img;
                    } else if (key.startsWith('tv_maze')) {
                        const idx = parseInt(key.replace('tv_maze', '')) - 1;
                        this.images.tv_maze[idx] = img;
                    } else if (key.startsWith('char')) {
                        const idx = parseInt(key.replace('char', '')) - 1;
                        this.images.characters[idx] = img;
                    } else if (key.startsWith('int')) {
                        const idx = parseInt(key.replace('int', '')) - 1;
                        this.images.interactions[idx] = img;
                    } else if (key === 'fail_closed') {
                        this.images.fail_closed = img;
                    } else if (key === 'fail_ribbon') {
                        this.images.fail_ribbon = img;
                    } else {
                        this.images[key] = img;
                    }

                    loaded++;
                    if (loaded === total) {
                        this.imagesLoaded = true;
                        resolve();
                    }
                };
                img.onerror = () => {
                    console.error(`Failed to load image: ${src}`);
                    loaded++;
                    if (loaded === total) {
                        this.imagesLoaded = true;
                        resolve();
                    }
                };
                img.src = src;
            });
        });
    }

    init(ctx, canvas, container, tvCtx, tvCanvas) {
        this.ctx = ctx;
        this.canvas = canvas;
        this.tvCtx = tvCtx;
        this.tvCanvas = tvCanvas;

        if (!this.imagesLoaded) {
            this.loadImages();
        }
    }

    start() {
        this.isActive = true;
        this.gameEnded = false;
        this.inSuccessSequence = false;
        this.inFailSequence = false;
        this.animationFrame = 0;
        this.sequenceStartTime = 0;
        this.selectedCharIdx = -1;
        this.selectedPosition = -1;

        // Pick random maze (0, 1, or 2)
        this.mazeIndex = Math.floor(Math.random() * 3);

        // Success condition: which position (0-based) is correct
        // mob_maze 1 → 2nd position (index 1)
        // mob_maze 2 → 3rd position (index 2)
        // mob_maze 3 → 1st position (index 0)
        const correctPositions = [1, 2, 0];
        this.correctPosition = correctPositions[this.mazeIndex];

        // Shuffle character order: create array [0,1,2,3] and shuffle
        this.characters = [0, 1, 2, 3];
        for (let i = this.characters.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.characters[i], this.characters[j]] = [this.characters[j], this.characters[i]];
        }

        this.animate();
    }

    animate() {
        if (!this.isActive && !this.inSuccessSequence && !this.inFailSequence) return;

        this.animationFrame++;

        // Draw mobile scene
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.drawScene();

        this.animationId = requestAnimationFrame(() => this.animate());
    }

    drawScene() {
        const w = this.canvas.width;
        const h = this.canvas.height;

        // 1. Background
        if (this.images.mob_bg) {
            this.ctx.drawImage(this.images.mob_bg, 0, 0, w, h);
        }

        // 2. Maze overlay (keep original aspect ratio, fill width, center vertically)
        const mazeImg = this.images.mob_maze[this.mazeIndex];
        if (mazeImg && mazeImg.complete) {
            const origW = mazeImg.naturalWidth;
            const origH = mazeImg.naturalHeight;
            const scale = w / origW;
            const drawW = w * 0.9;
            const drawH = origH * (drawW / origW);
            // Position maze to fill the top portion - same proportion as design
            const mazeY = h * 0.02;
            this.ctx.drawImage(mazeImg, (w - drawW) / 2, mazeY, drawW, drawH);
        }

        // 3. Characters at bottom (4 characters evenly spaced)
        const charAreaY = h * 0.64; // Characters moved up further from 0.69
        const charAreaH = h * 0.36; // Increased to maintain bottom space if needed
        const charSpacing = w / 4;

        for (let i = 0; i < 4; i++) {
            const charIdx = this.characters[i];

            // Hide selected character during success/fail sequence
            if ((this.inSuccessSequence || this.inFailSequence) && i === this.selectedPosition) {
                continue;
            }

            const charImg = this.images.characters[charIdx];
            if (charImg && charImg.complete) {
                const origW = charImg.naturalWidth;
                const origH = charImg.naturalHeight;
                // Scale to fit within the character area
                const maxCharH = charAreaH * 1
                const scale = maxCharH / origH;
                const drawW = origW * scale;
                const drawH = origH * scale;
                let cx = charSpacing * i + charSpacing / 2;
                if (i === 0) cx += w * 0.03;
                if (i === 3) cx -= w * 0.03; // Shift last character slightly left
                this.ctx.drawImage(charImg, cx - drawW / 2, charAreaY + (charAreaH - drawH) / 2, drawW, drawH);
            }
        }
    }

    renderTV() {
        if (!this.tvCtx || !this.tvCanvas) return;

        const w = this.tvCanvas.width;
        const h = this.tvCanvas.height;
        this.tvCtx.clearRect(0, 0, w, h);

        // 1. TV Background (post office)
        if (this.images.tv_bg && this.images.tv_bg.complete) {
            this.tvCtx.drawImage(this.images.tv_bg, 0, 0, w, h);
        }

        // 2. TV Maze overlay (keep aspect ratio, center)
        const tvMazeImg = this.images.tv_maze[this.mazeIndex];
        if (tvMazeImg && tvMazeImg.complete) {
            const origW = tvMazeImg.naturalWidth;
            const origH = tvMazeImg.naturalHeight;
            const scale = w / origW;
            const drawW = w * 0.9;
            const drawH = origH * (drawW / origW);
            // Position maze in the lower portion of TV
            const mazeY = h - drawH - h * 0.02;
            this.tvCtx.drawImage(tvMazeImg, (w - drawW) / 2, mazeY, drawW, drawH);
        }

        // 3. Success/Fail effects
        if (this.inSuccessSequence) {
            this.drawTVSuccessEffects();
        } else if (this.inFailSequence) {
            this.drawTVFailEffects();
        }
    }

    drawTVSuccessEffects() {
        const w = this.tvCanvas.width;
        const h = this.tvCanvas.height;
        const elapsed = Date.now() - this.sequenceStartTime;

        const selectedCharIdx = this.characters[this.selectedPosition];
        const charImg = this.images.characters[selectedCharIdx];

        // Phase 1: Show character at center for 1 second
        if (elapsed < 1000) {
            if (charImg && charImg.complete) {
                const origW = charImg.naturalWidth;
                const origH = charImg.naturalHeight;
                const scale = Math.min(h * 0.44 / origH, w * 0.33 / origW); // Increased from 0.4 and 0.3
                const drawW = origW * scale;
                const drawH = origH * scale;
                this.tvCtx.drawImage(charImg, w / 2 - drawW / 2, h / 2 - drawH / 2, drawW, drawH);
            }
        }
        // Phase 2: Interaction slides from right to left (2 seconds)
        else if (elapsed < 3000) {
            const intImg = this.images.interactions[selectedCharIdx];
            if (intImg && intImg.complete) {
                const progress = (elapsed - 1000) / 2000; // 0 to 1
                const origW = intImg.naturalWidth;
                const origH = intImg.naturalHeight;
                const scale = Math.min(h * 0.6 / origH, w * 0.5 / origW);
                const drawW = origW * scale;
                const drawH = origH * scale;
                // Slide from right edge to left edge
                const startX = w;
                const endX = -drawW;
                const x = startX + (endX - startX) * progress;
                const y = h / 2 - drawH / 2;
                this.tvCtx.drawImage(intImg, x, y, drawW, drawH);
            }
        }
    }

    drawTVFailEffects() {
        const w = this.tvCanvas.width;
        const h = this.tvCanvas.height;
        const elapsed = Date.now() - this.sequenceStartTime;

        const selectedCharIdx = this.characters[this.selectedPosition];
        const charImg = this.images.characters[selectedCharIdx];

        // Phase 1: Show character at center for 1 second
        if (elapsed < 1000) {
            if (charImg && charImg.complete) {
                const origW = charImg.naturalWidth;
                const origH = charImg.naturalHeight;
                const scale = Math.min(h * 0.44 / origH, w * 0.33 / origW); // Increased from 0.4 and 0.3
                const drawW = origW * scale;
                const drawH = origH * scale;
                this.tvCtx.drawImage(charImg, w / 2 - drawW / 2, h / 2 - drawH / 2, drawW, drawH);
            }
        }
        // Phase 2 & 3: CLOSED sign (6-5) appears first, then ribbon (6-6) below it
        else if (elapsed < 3000) {
            // Draw CLOSED sign (interaction 6-5) - starts from 1s
            if (this.images.fail_closed && this.images.fail_closed.complete) {
                const img = this.images.fail_closed;
                const origW = img.naturalWidth;
                const origH = img.naturalHeight;
                const scale = Math.min(h * 0.25 / origH, w * 0.35 / origW);
                const drawW = origW * scale;
                const drawH = origH * scale;
                this.tvCtx.drawImage(img, w / 2 - drawW / 2, h * 0.3 - drawH / 2, drawW, drawH);
            }

            // Draw ribbon below (interaction 6-6) - starts from 2s
            if (elapsed >= 2000 && this.images.fail_ribbon && this.images.fail_ribbon.complete) {
                const img = this.images.fail_ribbon;
                const origW = img.naturalWidth;
                const origH = img.naturalHeight;
                const scale = Math.min(h * 0.2 / origH, w * 0.4 / origW);
                const drawW = origW * scale;
                const drawH = origH * scale;
                this.tvCtx.drawImage(img, w / 2 - drawW / 2, h * 0.55 - drawH / 2, drawW, drawH);
            }
        }
    }

    onButtonDown(x, y) {
        if (!this.isActive || this.gameEnded || this.inSuccessSequence || this.inFailSequence) return;

        const w = this.canvas.width;
        const h = this.canvas.height;

        // Character touch area
        const charAreaY = h * 0.64; // Characters moved up further from 0.69
        const charAreaH = h * 0.36;
        const charSpacing = w / 4;

        for (let i = 0; i < 4; i++) {
            let cx = charSpacing * i + charSpacing / 2;
            if (i === 0) cx += w * 0.03;
            if (i === 3) cx -= w * 0.03; // Shift last character slightly left
            const charIdx = this.characters[i];
            const charImg = this.images.characters[charIdx];

            if (!charImg || !charImg.complete) continue;

            const origW = charImg.naturalWidth;
            const origH = charImg.naturalHeight;
            const maxCharH = charAreaH * 0.935; // Increased from 0.85
            const scale = maxCharH / origH;
            const drawW = origW * scale;
            const drawH = origH * scale;
            const charX = cx - drawW / 2;
            const charY = charAreaY + (charAreaH - drawH) / 2;

            if (x >= charX && x <= charX + drawW && y >= charY && y <= charY + drawH) {
                this.selectedPosition = i;
                this.selectedCharIdx = charIdx;
                this.gameEnded = true;
                this.sequenceStartTime = Date.now();

                if (i === this.correctPosition) {
                    // Success
                    gameTimer.stop(); // Stop timer immediately on success
                    audioManager.playSFX('ding');
                    audioManager.playSuccess();
                    this.inSuccessSequence = true;
                    setTimeout(() => {
                        this.isActive = false;
                        gameController.endGame(true);
                    }, 3500); // 1s character + 2s interaction + 0.5s buffer
                } else {
                    // Fail
                    audioManager.playSFX('click');
                    audioManager.playFail();
                    this.inFailSequence = true;
                    setTimeout(() => {
                        this.isActive = false;
                        gameController.endGame(false);
                    }, 3500); // 1s character + 2s (CLOSED + ribbon) + 0.5s buffer
                }
                break;
            }
        }
    }

    onButtonUp() { }

    onTimeout() {
        if (!this.gameEnded && !this.inSuccessSequence && !this.inFailSequence) {
            this.inFailSequence = true;
            this.gameEnded = true;
            this.sequenceStartTime = Date.now();
            audioManager.playFail();
            setTimeout(() => {
                this.isActive = false;
                gameController.endGame(false);
            }, 3500);
        }
    }

    cleanup() {
        this.isActive = false;
        this.inSuccessSequence = false;
        this.inFailSequence = false;
        if (this.animationId) cancelAnimationFrame(this.animationId);
    }
}

const game16Maze = new Game16Maze();
// Start loading images immediately
game16Maze.loadImages();

document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        if (typeof gameController !== 'undefined') gameController.registerGame(16, game16Maze);
    }, 100);
});
