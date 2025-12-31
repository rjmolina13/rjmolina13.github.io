// Love Letter Content - Easy to customize
const loveLetter = `Dear Andrea,

As we approach 2026, I just want to take this moment for us to look back about everything that happened this year.

2025 was a year of growth for me. I learned so much in my career and gained so much knowledge, but the most important lesson I learned was how to love you. It’s funny to look back now—I remember when you barely acknowledged my existence, and now you’re the first person I want to talk to (and you get mad if I don’t!). Seeing that shift, from strangers to where we are now, is something I really cherish.

It scares me a little to think about how easily we could have missed each other. Imagine if I hadn't asked Fred about working on his office? Imagine if you had decided not to apply? We would be walking around as strangers right now. It would have been such a loss not to know you.

Mabalos sa gabos beh. Salamat sa pag pasesensya sako buda sa pag sabot mo kung masakit an mga bagay o ang sitwasyon ta. Salamat na maray sa pag laog sa buhay ko buda sa pagtao ng prebehiliyong mamuot saimo.

My prayer for us in 2026 is simple. Let’s fill it with:
- More genuine laughter and happiness.
- Growth and maturity, both individually and together.
- Strength on the sad days, and softness on the happy ones.
- A promise to always hold a safe space for each other in our hearts.

We made it through 2025, so I know we can take on 2026. 
bb, I believe in you. And more than that, I believe in us.
Whatever this next year brings, we’ll handle it together.

I’m not going anywhere. I’ll be right here, loving you a little more every day.

Happy New Year, bb Andrea! ♡`;

// FontAwesome Icon Map
const iconMap = {
    heart: '\uf004',
    star: '\uf005',
    glass: '\uf4e3',
    handHeart: '\uf4c6',
    cloudBolt: '\uf76c',
    warning: '\uf071',
    hands: '\uf2a7',
    sortUp: '\uf0de'
};

// Game State
class Game {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.state = 'start'; // start, playing, gameOver, win
        this.score = 0;
        this.progress = 0;
        this.health = 3;
        this.maxHealth = 3;
        this.items = [];
        this.lastSpawn = 0;
        this.spawnInterval = 2000; // milliseconds
        this.gameTime = 0;
        this.animationId = null;
        this.effectsEnabled = true;
        this.isMobile = (window.matchMedia && (window.matchMedia('(pointer: coarse)').matches || window.matchMedia('(max-width: 768px)').matches));
        this.viewWidth = 0;
        this.viewHeight = 0;
        
        // Canvas setup
        this.setupCanvas();
        
        // Initialize managers
        this.player = new Player(this.viewWidth / 2, this.getPlayerBaseY());
        this.inputManager = new InputManager();
        this.soundManager = new SoundManager();
        this.uiManager = new UIManager();
        this.particleManager = new ParticleManager();
        
        this.bindEvents();
        this.startParticles();
        
        // Start loading assets
        this.preloadAssets();
    }
    
    preloadAssets() {
        const startButton = document.getElementById('start-button');
        const loadingText = document.getElementById('loading-text');
        const loadingBarContainer = document.getElementById('loading-bar-container');
        const loadingBar = document.getElementById('loading-bar');
        const startIcon = document.getElementById('start-icon');
        
        startButton.disabled = true;
        startButton.classList.add('loading');
        startButton.classList.remove('pulse');
        loadingBarContainer.style.display = 'block';
        
        const audioFiles = [
            'hny/assets/sfx/game-music-loop-7-145285.ogg',
            'hny/assets/sfx/losing-horn-313723.ogg',
            'hny/assets/sfx/mixkit-game-success-alert-2039.ogg',
            'hny/assets/sfx/one_beep-99630.ogg',
            'hny/assets/sfx/orchestral-win-331233.ogg',
            'hny/assets/sfx/letter_bgm.ogg'
        ];
        
        let loadedCount = 0;
        const totalAssets = audioFiles.length;
        
        const updateProgress = () => {
            loadedCount++;
            const percent = Math.floor((loadedCount / totalAssets) * 100);
            loadingBar.style.width = `${percent}%`;
            loadingText.textContent = `Loading... ${percent}%`;
            
            if (loadedCount >= totalAssets) {
                setTimeout(() => {
                    loadingText.textContent = "Start Journey";
                    loadingBarContainer.style.display = 'none';
                    startIcon.style.display = 'inline-block';
                    startButton.disabled = false;
                    startButton.classList.remove('loading');
                    startButton.classList.add('pulse');
                }, 500);
            }
        };

        // Preload audio using Howl's preload feature (or just fetching)
        // Since we initialize Howl objects later in SoundManager, we can just fetch them here to ensure they are in browser cache
        // Or better yet, initialize SoundManager here but keep it muted/inactive
        
        audioFiles.forEach(file => {
            const audio = new Audio();
            audio.addEventListener('canplaythrough', updateProgress, { once: true });
            audio.addEventListener('error', () => {
                console.warn(`Failed to load ${file}, continuing anyway.`);
                updateProgress();
            }, { once: true });
            audio.src = file;
            audio.load();
        });
    }
    
    setupCanvas() {
        const resizeCanvas = () => {
            const dpr = window.devicePixelRatio || 1;
            const rect = this.canvas.getBoundingClientRect();
            this.viewWidth = rect.width;
            this.viewHeight = rect.height;
            this.canvas.width = Math.floor(rect.width * dpr);
            this.canvas.height = Math.floor(rect.height * dpr);
            this.ctx.setTransform(1, 0, 0, 1, 0, 0);
            this.ctx.scale(dpr, dpr);
            this.canvas.style.width = rect.width + 'px';
            this.canvas.style.height = rect.height + 'px';
            this.isMobile = (window.matchMedia && (window.matchMedia('(pointer: coarse)').matches || window.matchMedia('(max-width: 768px)').matches));
            if (this.player) {
                this.player.x = Math.max(this.player.width / 2, Math.min(this.viewWidth - this.player.width / 2, this.player.x));
                this.player.y = this.getPlayerBaseY();
            }
        };
        
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);
    }

    getPlayerBaseY() {
        const offset = this.isMobile ? 90 : 120;
        return Math.max(this.player ? this.player.height : 60, this.viewHeight - offset);
    }
    
    bindEvents() {
        document.getElementById('start-button').addEventListener('click', () => this.startGame());
        document.getElementById('retry-button').addEventListener('click', () => this.restartGame());
        document.getElementById('play-again-button').addEventListener('click', () => this.restartGame());
        document.getElementById('close-modal').addEventListener('click', () => this.closeWinModal());
        window.addEventListener('pointerdown', () => {
            if (this.soundManager) this.soundManager.unlock();
        }, { once: true });
        
        // Close modal on outside click
        document.getElementById('win-modal').addEventListener('click', (e) => {
            if (e.target.id === 'win-modal') {
                this.closeWinModal();
            }
        });
    }
    
    startParticles() {
        tsParticles.load("particles-container", {
            particles: {
                number: { value: 90, density: { enable: true, value_area: 800 } },
                color: { value: ["#ff6b9a", "#ffd93d", "#ffffff"] },
                shape: { type: "circle" },
                opacity: { value: 0.5, random: true },
                size: { value: 2, random: true },
                line_linked: { enable: false },
                move: {
                    enable: true,
                    speed: 1,
                    direction: "none",
                    random: true,
                    straight: false,
                    out_mode: "out",
                    bounce: false
                }
            },
            interactivity: { detect_on: "canvas", events: { onhover: { enable: false }, onclick: { enable: false }, resize: true } },
            retina_detect: true
        });
    }
    
    startGame() {
        this.state = 'playing';
        this.score = 0;
        this.progress = 0;
        this.health = this.maxHealth;
        this.items = [];
        this.lastSpawn = 0;
        this.gameTime = 0;
        
        this.uiManager.showGameScreen();
        this.soundManager.unlock().then(() => this.soundManager.playBackgroundMusic());
        this.updateHUD();
        
        this.gameLoop(0);
    }
    
    restartGame() {
        this.startGame();
    }
    
    gameLoop(timestamp) {
        if (this.state !== 'playing') return;
        
        const deltaTime = timestamp - this.gameTime;
        this.gameTime = timestamp;
        
        // Update
        this.update(deltaTime);
        
        // Render
        this.render();
        
        this.animationId = requestAnimationFrame((ts) => this.gameLoop(ts));
    }
    
    update(deltaTime) {
        // Update player
        this.player.update(deltaTime, this.inputManager, this.viewWidth);
        
        // Spawn items
        if (this.gameTime - this.lastSpawn > this.spawnInterval) {
            this.spawnItem();
            this.lastSpawn = this.gameTime;
            
            // Increase difficulty as progress increases
            const difficulty = Math.min(this.progress / 100, 0.8);
            this.spawnInterval = 2000 - (difficulty * 1200); // Faster spawning
        }
        
        // Update items
        for (let i = this.items.length - 1; i >= 0; i--) {
            const item = this.items[i];
            item.update(deltaTime);
            
            // Check collision with player
            if (this.checkCollision(item, this.player)) {
                this.handleItemCollision(item);
                this.items.splice(i, 1);
                continue;
            }
            
            // Remove items that are off screen
        if (item.y > this.viewHeight + 50) {
            this.items.splice(i, 1);
        }
        }
        
        // Check win condition
        if (this.progress >= 100) {
            this.winGame();
        }
        
        // Check game over condition
        if (this.health <= 0) {
            this.gameOver();
        }
    }
    
    spawnItem() {
        const x = Math.random() * (this.viewWidth - 100) + 50;
        const isGood = Math.random() > 0.3; // 70% chance of good items
        
        let type, icon, color;
        if (isGood) {
            const goodTypes = [
                { type: 'heart', icon: iconMap.heart, color: '#ff6b9a' },
                { type: 'star', icon: iconMap.star, color: '#ffd93d' },
                { type: 'handHeart', icon: iconMap.handHeart, color: '#ff8fab' }
            ];
            const selected = goodTypes[Math.floor(Math.random() * goodTypes.length)];
            type = selected.type;
            icon = selected.icon;
            color = selected.color;
        } else {
            const badTypes = [
                { type: 'cloudBolt', icon: iconMap.cloudBolt, color: '#ff4757' },
                { type: 'warning', icon: iconMap.warning, color: '#ffa502' }
            ];
            const selected = badTypes[Math.floor(Math.random() * badTypes.length)];
            type = selected.type;
            icon = selected.icon;
            color = selected.color;
        }
        
        const speed = 2 + Math.random() * 3; // Random speed between 2-5
        this.items.push(new Item(x, -50, type, icon, color, speed, isGood));
    }
    
    checkCollision(item, player) {
        const distance = Math.sqrt(
            Math.pow(item.x - player.x, 2) + Math.pow(item.y - player.y, 2)
        );
        return distance < 40; // Collision threshold
    }
    
    handleItemCollision(item) {
        if (item.isGood) {
            this.progress = Math.min(this.progress + 10, 100);
            this.score += 100;
            this.soundManager.playCollectSound();
        } else {
            this.health = Math.max(this.health - 1, 0);
            this.soundManager.playDamageSound();
        }
        
        this.updateHUD();
    }
    
    updateHUD() {
        document.getElementById('score-text').textContent = this.score;
        document.getElementById('progress-text').textContent = this.progress + '%';
        document.getElementById('progress-fill').style.width = this.progress + '%';
        
        // Update hearts
        const hearts = document.querySelectorAll('#hearts i');
        hearts.forEach((heart, index) => {
            heart.style.opacity = index < this.health ? '1' : '0.3';
        });
    }
    
    render() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Wait for fonts to be ready
        if (document.fonts && document.fonts.ready) {
            document.fonts.ready.then(() => {
                this.drawGame();
            });
        } else {
            this.drawGame();
        }
    }
    
    drawGame() {
        // Draw player
        this.player.draw(this.ctx);
        
        // Draw items
        this.items.forEach(item => item.draw(this.ctx));
    }
    
    gameOver() {
        this.state = 'gameOver';
        cancelAnimationFrame(this.animationId);
        this.soundManager.stopBackgroundMusic();
        this.soundManager.playGameOverSound();
        
        document.getElementById('final-score').textContent = this.score;
        this.uiManager.showGameOver();
    }
    
    winGame() {
        this.state = 'win';
        cancelAnimationFrame(this.animationId);
        this.soundManager.stopBackgroundMusic();
        this.soundManager.playWinSound();
        const c = window.confetti;
        const fireworks = () => {
            if (this.effectsEnabled && typeof c === 'function') {
                c({ particleCount: 80, spread: 60, origin: { x: 0.2, y: 0.7 }, colors: ['#ff6b9a','#ffd93d','#ffffff'] });
                setTimeout(() => c({ particleCount: 80, spread: 60, origin: { x: 0.5, y: 0.6 }, colors: ['#ff6b9a','#ffd93d','#ffffff'] }), 250);
                setTimeout(() => c({ particleCount: 80, spread: 60, origin: { x: 0.8, y: 0.7 }, colors: ['#ff6b9a','#ffd93d','#ffffff'] }), 500);
            }
        };
        fireworks();
        setTimeout(() => this.uiManager.showWinModal(loveLetter), 900);
    }
    
    closeWinModal() {
        this.uiManager.hideWinModal();
    }
}

// Player Class
class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 60;
        this.height = 60;
        this.velocity = { x: 0, y: 0 };
        this.speed = 5;
        this.friction = 0.9;
        this.icon = iconMap.sortUp;
    }
    
    update(deltaTime, inputManager, viewWidth) {
        // Handle input with inertia
        if (inputManager.left) {
            this.velocity.x -= this.speed * 0.1;
        }
        if (inputManager.right) {
            this.velocity.x += this.speed * 0.1;
        }
        
        // Apply friction
        this.velocity.x *= this.friction;
        
        // Limit velocity
        this.velocity.x = Math.max(-this.speed, Math.min(this.speed, this.velocity.x));
        
        // Update position
        this.x += this.velocity.x;
        
        // Keep player in bounds
        this.x = Math.max(this.width / 2, Math.min(viewWidth - this.width / 2, this.x));
    }
    
    setIconByName(name) {
        this.icon = iconMap[name] || iconMap.handHeart;
    }
    
    draw(ctx) {
        ctx.save();
        ctx.font = '900 44px "Font Awesome 6 Free"';
        ctx.fillStyle = '#ff6b9a';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.icon, this.x, this.y);
        ctx.restore();
    }
}

// Item Class
class Item {
    constructor(x, y, type, icon, color, speed, isGood) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.icon = icon;
        this.color = color;
        this.speed = speed;
        this.isGood = isGood;
        this.rotation = 0;
        this.rotationSpeed = (Math.random() - 0.5) * 0.1;
    }
    
    update(deltaTime) {
        this.y += this.speed;
        this.rotation += this.rotationSpeed;
    }
    
    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        ctx.font = '900 30px "Font Awesome 6 Free"';
        ctx.fillStyle = this.color;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.icon, 0, 0);
        ctx.restore();
    }
}

// Input Manager
class InputManager {
    constructor() {
        this.left = false;
        this.right = false;
        this.touchStartX = null;
        this.isTouching = false;
        
        this.bindEvents();
    }
    
    bindEvents() {
        // Keyboard events
        window.addEventListener('keydown', (e) => {
            switch(e.code) {
                case 'ArrowLeft':
                case 'KeyA':
                    this.left = true;
                    break;
                case 'ArrowRight':
                case 'KeyD':
                    this.right = true;
                    break;
            }
        });
        
        window.addEventListener('keyup', (e) => {
            switch(e.code) {
                case 'ArrowLeft':
                case 'KeyA':
                    this.left = false;
                    break;
                case 'ArrowRight':
                case 'KeyD':
                    this.right = false;
                    break;
            }
        });
        
        // Touch events
        window.addEventListener('touchstart', (e) => {
            this.isTouching = true;
            this.touchStartX = e.touches[0].clientX;
        });
        
        window.addEventListener('touchmove', (e) => {
            if (!this.isTouching || this.touchStartX === null) return;
            
            const touchX = e.touches[0].clientX;
            const deltaX = touchX - this.touchStartX;
            
            if (deltaX > 20) {
                this.right = true;
                this.left = false;
            } else if (deltaX < -20) {
                this.left = true;
                this.right = false;
            } else {
                this.left = false;
                this.right = false;
            }
        });
        
        window.addEventListener('touchend', () => {
            this.isTouching = false;
            this.touchStartX = null;
            this.left = false;
            this.right = false;
        });
        
        // Mouse events (for desktop testing)
        window.addEventListener('mousedown', (e) => {
            if (e.clientX < window.innerWidth / 2) {
                this.left = true;
            } else {
                this.right = true;
            }
        });
        
        window.addEventListener('mouseup', () => {
            this.left = false;
            this.right = false;
        });
    }
}

// Sound Manager
class SoundManager {
    constructor() {
        this.sounds = {};
        this.backgroundMusic = null;
        this.isMuted = false;
        this.usingTone = !!window.Tone;
        this.tone = window.Tone || null;
        this.toneNodes = { synth: null, drum: null, poly: null, loop: null, chime: null, metal: null };
        this.unlocked = false;
        this.audioCtx = null;
        this.bgInterval = null;
        this.loadSounds();
    }
    
    loadSounds() {
        if (this.usingTone) {
            const Tone = this.tone;
            this.toneNodes.synth = new Tone.Synth({
                oscillator: { type: 'triangle' },
                envelope: { attack: 0.005, decay: 0.12, sustain: 0.0, release: 0.08 }
            }).toDestination();
            this.toneNodes.drum = new Tone.MembraneSynth({
                octaves: 2,
                pitchDecay: 0.02,
                envelope: { attack: 0.01, decay: 0.3, sustain: 0.0, release: 0.3 }
            }).toDestination();
            this.toneNodes.poly = new Tone.PolySynth(Tone.Synth, {
                oscillator: { type: 'sine' },
                envelope: { attack: 0.05, decay: 0.2, sustain: 0.3, release: 0.8 }
            }).toDestination();
            const reverb = new Tone.Reverb({ decay: 1.6, wet: 0.25 }).toDestination();
            this.toneNodes.chime = new Tone.PluckSynth({ dampening: 1600, resonance: 0.7 }).connect(reverb);
            this.toneNodes.metal = new Tone.MetalSynth({
                frequency: 250,
                envelope: { attack: 0.001, decay: 0.2, release: 0.05 },
                modulationIndex: 32,
                resonance: 4000,
                harmonicity: 7
            }).connect(reverb);
            try {
                this.toneNodes.synth.volume.value = -6;
                this.toneNodes.drum.volume.value = -6;
                this.toneNodes.poly.volume.value = -6;
                this.toneNodes.chime.volume.value = -2;
                this.toneNodes.metal.volume.value = -8;
            } catch (e) {}
            this.toneNodes.loop = new Tone.Loop((time) => {
                this.toneNodes.poly.triggerAttackRelease(['C4','E4','G4'], '8n', time);
                this.toneNodes.poly.triggerAttackRelease(['A4','C5'], '8n', time + 0.5);
            }, '2n');
            Tone.Transport.bpm.value = 70;
        }
        if (window.Howl) {
            this.backgroundMusic = new Howl({ src: ['hny/assets/sfx/game-music-loop-7-145285.ogg'], format: ['ogg'], preload: true, loop: true, volume: 0.56 });
            this.sounds.lose = new Howl({ src: ['hny/assets/sfx/losing-horn-313723.ogg'], format: ['ogg'], preload: true });
            this.sounds.collect = new Howl({ src: ['hny/assets/sfx/mixkit-game-success-alert-2039.ogg'], format: ['ogg'], preload: true });
            this.sounds.damage = new Howl({ src: ['hny/assets/sfx/one_beep-99630.ogg'], format: ['ogg'], preload: true });
            this.sounds.win = new Howl({ src: ['hny/assets/sfx/orchestral-win-331233.ogg'], format: ['ogg'], preload: true });
            this.sounds.letter = new Howl({ src: ['hny/assets/sfx/letter_bgm.ogg'], format: ['ogg'], preload: true, volume: 1.0 });
        }
    }

    async unlock() {
        if (this.usingTone && !this.unlocked) {
            try {
                await this.tone.start();
                this.unlocked = true;
            } catch (e) {}
        } else if (!this.audioCtx) {
            try {
                const AudioCtx = window.AudioContext || window.webkitAudioContext;
                if (AudioCtx) {
                    this.audioCtx = new AudioCtx();
                    await this.audioCtx.resume();
                    this.unlocked = true;
                }
            } catch (e) {}
        }
    }

    
    
    playBackgroundMusic() {
        if (this.backgroundMusic && !this.isMuted) {
            this.backgroundMusic.play();
        } else if (this.usingTone && !this.unlocked && !this.isMuted) {
            const Tone = this.tone;
            try {
                this.tone.start().then(() => { this.unlocked = true; this.toneNodes.loop.start(0); Tone.Transport.start(); }).catch(() => {});
            } catch (e) {}
        } else if (this.usingTone && !this.isMuted) {
            const Tone = this.tone;
            try { this.toneNodes.loop.start(0); Tone.Transport.start(); } catch (e) {}
        } else if (this.audioCtx && !this.isMuted && !this.bgInterval) {
            const ctx = this.audioCtx;
            const playNote = (freq, dur, gainVal) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'sine';
                osc.frequency.value = freq;
                gain.gain.setValueAtTime(gainVal, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
                osc.connect(gain).connect(ctx.destination);
                osc.start();
                osc.stop(ctx.currentTime + dur);
            };
            this.bgInterval = setInterval(() => {
                playNote(392, 0.25, 0.03);
                setTimeout(() => playNote(523.25, 0.25, 0.03), 300);
            }, 2000);
        }
    }
    
    stopBackgroundMusic() {
        if (this.backgroundMusic) {
            try { this.backgroundMusic.stop(); } catch (e) {}
        }
        if (this.sounds.letter) {
            try { this.sounds.letter.stop(); } catch (e) {}
        }
        if (this.usingTone) {
            const Tone = this.tone;
            try { this.toneNodes.loop.stop(0); Tone.Transport.stop(); } catch (e) {}
        }
        if (this.bgInterval) {
            try { clearInterval(this.bgInterval); } catch (e) {}
            this.bgInterval = null;
        }
    }
    
    playCollectSound() {
        if (this.sounds.collect && !this.isMuted) {
            try { this.sounds.collect.play(); } catch (e) {}
        } else if (this.usingTone && !this.isMuted) {
            try {
                const now = this.tone.now();
                this.toneNodes.chime.triggerAttackRelease('C6', 0.14, now);
                this.toneNodes.chime.triggerAttackRelease('E6', 0.14, now + 0.12);
                this.toneNodes.metal.triggerAttackRelease(0.05, now + 0.02);
            } catch (e) {}
        } else if (this.audioCtx && !this.isMuted) {
            const ctx = this.audioCtx;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'square';
            osc.frequency.value = 1000;
            gain.gain.setValueAtTime(0.12, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.14);
            osc.connect(gain).connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + 0.14);
        }
    }
    
    playDamageSound() {
        if (this.sounds.damage && !this.isMuted) {
            try { this.sounds.damage.play(); } catch (e) {}
        } else if (this.usingTone && !this.isMuted) {
            try { this.toneNodes.drum.triggerAttackRelease('E2', '16n'); } catch (e) {}
        } else if (this.audioCtx && !this.isMuted) {
            const ctx = this.audioCtx;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.value = 220;
            gain.gain.setValueAtTime(0.05, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.1);
            osc.connect(gain).connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + 0.1);
        }
    }

    playGameOverSound() {
        if (this.sounds.lose && !this.isMuted) {
            try { this.sounds.lose.play(); } catch (e) {}
        } else if (this.usingTone && !this.isMuted) {
            try { this.toneNodes.poly.triggerAttackRelease(['C3','Eb3','G3'], '4n'); } catch (e) {}
        } else if (this.audioCtx && !this.isMuted) {
            const ctx = this.audioCtx;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.value = 200;
            gain.gain.setValueAtTime(0.06, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.6);
            osc.connect(gain).connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + 0.6);
        }
    }

    playWinSound() {
        if (this.sounds.win && !this.isMuted) {
            try { 
                // Stop any previous instances
                this.sounds.win.stop();
                
                const id = this.sounds.win.play();
                console.log('Win sound started', id);
                
                // Set up the chain
                this.sounds.win.once('end', () => {
                    console.log('Win sound ended, triggering letter sound');
                    this.playLetterSound();
                }, id);
                
                // Fallback: In case 'end' event misses (e.g. slight browser timing issues), 
                // check after expected duration + buffer
                setTimeout(() => {
                    if (this.sounds.letter && !this.sounds.letter.playing()) {
                        console.log('Fallback: Triggering letter sound via timeout');
                        this.playLetterSound();
                    }
                }, 11000); // Win sound is ~10s
                
            } catch (e) {
                console.error('Error in playWinSound:', e);
                // Fallback if win sound fails
                this.playLetterSound();
            }
        } else if (this.usingTone && !this.isMuted) {
            try { this.toneNodes.poly.triggerAttackRelease(['C4','E4','G4','C5'], '2n'); } catch (e) {}
        } else if (this.audioCtx && !this.isMuted) {
            const ctx = this.audioCtx;
            const playNote = (freq, dur, delay) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'sine';
                osc.frequency.value = freq;
                gain.gain.setValueAtTime(0.05, ctx.currentTime + delay);
                gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + delay + dur);
                osc.connect(gain).connect(ctx.destination);
                osc.start(ctx.currentTime + delay);
                osc.stop(ctx.currentTime + delay + dur);
            };
            playNote(523.25, 0.25, 0);
            playNote(659.25, 0.25, 0.15);
            playNote(783.99, 0.4, 0.3);
        }
    }
    playLetterSound() {
        if (this.sounds.letter && !this.isMuted) {
            try { this.sounds.letter.play(); } catch (e) {}
        }
    }
}


// UI Manager
class UIManager {
    constructor() {
        this.screens = {
            start: document.getElementById('start-screen'),
            game: document.getElementById('game-screen'),
            gameOver: document.getElementById('game-over-screen'),
            win: document.getElementById('win-modal')
        };
        this.typed = null;
    }
    
    showGameScreen() {
        this.hideAllScreens();
        this.screens.game.classList.add('active');
        
        // GSAP transition
        gsap.fromTo(this.screens.game, 
            { opacity: 0 },
            { opacity: 1, duration: 0.5 }
        );

        // Ensure canvas sizes update when the game screen becomes visible
        setTimeout(() => {
            window.dispatchEvent(new Event('resize'));
        }, 0);
    }
    
    showGameOver() {
        this.screens.gameOver.classList.add('active');
        
        // GSAP animation
        gsap.fromTo(this.screens.gameOver.querySelector('.overlay-content'),
            { scale: 0.8, opacity: 0 },
            { scale: 1, opacity: 1, duration: 0.5, ease: "back.out(1.7)" }
        );
    }
    
    showWinModal(letterText) {
        this.screens.win.classList.add('active');
        
        // GSAP animation
        gsap.fromTo(this.screens.win.querySelector('.modal-content'),
            { opacity: 0 },
            { opacity: 1, duration: 0.5 }
        );
        
        // Typed.js animation for the letter
        setTimeout(() => {
            const target = document.querySelector('#love-letter');
            if (target) {
                target.innerHTML = '';
            }
            if (this.typed) {
                try { this.typed.destroy(); } catch (e) {}
                this.typed = null;
            }
            if (window.Typed && target) {
                this.typed = new Typed('#love-letter', {
                    strings: [letterText],
                    typeSpeed: 30,
                    showCursor: false,
                    loop: false,
                    backSpeed: 0,
                    smartBackspace: false,
                    startDelay: 100
                });
            } else if (target) {
                target.textContent = letterText;
            }
        }, 500);
    }
    
    hideWinModal() {
        this.screens.win.classList.remove('active');
        const target = document.querySelector('#love-letter');
        if (this.typed) {
            try { this.typed.destroy(); } catch (e) {}
            this.typed = null;
        }
        if (target) target.innerHTML = '';
    }
    
    hideAllScreens() {
        Object.values(this.screens).forEach(screen => {
            screen.classList.remove('active');
        });
        const target = document.querySelector('#love-letter');
        if (this.typed) {
            try { this.typed.destroy(); } catch (e) {}
            this.typed = null;
        }
        if (target) target.innerHTML = '';
    }
}

// Particle Manager (for additional effects)
class ParticleManager {
    constructor() {
        this.particles = [];
    }
    
    createParticle(x, y, color) {
        this.particles.push({
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 4,
            vy: (Math.random() - 0.5) * 4,
            life: 1.0,
            decay: 0.02,
            color: color,
            size: Math.random() * 3 + 1
        });
    }
    
    update() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.life -= particle.decay;
            particle.vy += 0.1; // Gravity
            
            if (particle.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }
    
    draw(ctx) {
        this.particles.forEach(particle => {
            ctx.save();
            ctx.globalAlpha = particle.life;
            ctx.fillStyle = particle.color;
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        });
    }
}

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Set footer year
    const yearEl = document.getElementById('year');
    if (yearEl) {
        yearEl.textContent = new Date().getFullYear();
    }

    // Ensure fonts are loaded before starting
    if (document.fonts) {
        document.fonts.ready.then(() => {
            window.game = new Game();
            (function(){
                const g = () => window.game;
                Object.defineProperty(window, 'win', {
                    configurable: true,
                    get() { const game = g(); if (game) { game.effectsEnabled = true; game.winGame(); } return 'win triggered'; }
                });
                Object.defineProperty(window, 'lose', {
                    configurable: true,
                    get() { const game = g(); if (game) game.gameOver(); return 'lose triggered'; }
                });
                window.winAction = () => { const game = g(); if (game) { game.effectsEnabled = true; game.winGame(); } };
                window.loseAction = () => { const game = g(); if (game) game.gameOver(); };
                window.playerIcon = (name) => { const game = g(); if (game && game.player) game.player.setIconByName(name); return 'player icon set'; };
            })();
        });
    } else {
        // Fallback for browsers that don't support document.fonts
        setTimeout(() => {
            window.game = new Game();
            (function(){
                const g = () => window.game;
                Object.defineProperty(window, 'win', {
                    configurable: true,
                    get() { const game = g(); if (game) { game.effectsEnabled = true; game.winGame(); } return 'win triggered'; }
                });
                Object.defineProperty(window, 'lose', {
                    configurable: true,
                    get() { const game = g(); if (game) game.gameOver(); return 'lose triggered'; }
                });
                window.winAction = () => { const game = g(); if (game) { game.effectsEnabled = true; game.winGame(); } };
                window.loseAction = () => { const game = g(); if (game) game.gameOver(); };
                window.playerIcon = (name) => { const game = g(); if (game && game.player) game.player.setIconByName(name); return 'player icon set'; };
            })();
        }, 1000);
    }
});
