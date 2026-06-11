// ========== DARK RETRO PIXEL PLAYER ==========
class RetroPlayer {
    constructor() {
        this.audio = document.getElementById('audioPlayer');
        this.playlist = [];
        this.currentIndex = -1;
        this.isPlaying = false;
        this.shuffle = false;
        this.repeatMode = 0;

        // DOM - Main Player
        this.playBtn = document.getElementById('playBtn');
        this.playIcon = document.getElementById('playIcon');
        this.prevBtn = document.getElementById('prevBtn');
        this.nextBtn = document.getElementById('nextBtn');
        this.shuffleBtn = document.getElementById('shuffleBtn');
        this.repeatBtn = document.getElementById('repeatBtn');
        this.progressBar = document.getElementById('progressBar');
        this.progressFill = document.getElementById('progressFill');
        this.volumeSlider = document.getElementById('volumeSlider');
        this.volValue = document.getElementById('volValue');
        this.trackTitle = document.getElementById('trackTitle');
        this.trackArtist = document.getElementById('trackArtist');
        this.cassetteImg = document.getElementById('cassetteImg');
        this.playlistItems = document.getElementById('playlistItems');
        this.musicUpload = document.getElementById('musicUpload');
        this.currentTimeEl = document.getElementById('currentTime');
        this.durationEl = document.getElementById('duration');
        
        // ویژوالایزر
        this.visualizerBars = document.querySelectorAll('.viz-bar');
        this.vizInterval = null;
        this.audioContext = null;
        this.analyser = null;
        this.source = null;

        this.loadSettings();
        this.init();
    }

    init() {
        this.audio.volume = this.volumeSlider.value / 100;

        this.playBtn.addEventListener('click', () => this.togglePlay());
        this.prevBtn.addEventListener('click', () => this.prev());
        this.nextBtn.addEventListener('click', () => this.next());
        this.shuffleBtn.addEventListener('click', () => this.toggleShuffle());
        this.repeatBtn.addEventListener('click', () => this.toggleRepeat());
        this.volumeSlider.addEventListener('input', () => this.setVolume());
        this.musicUpload.addEventListener('change', (e) => this.addFiles(e.target.files));
        this.audio.addEventListener('timeupdate', () => this.updateProgress());
        this.audio.addEventListener('loadedmetadata', () => this.updateDuration());
        this.audio.addEventListener('ended', () => this.onEnd());
        this.progressBar.addEventListener('click', (e) => this.seek(e));
        document.addEventListener('keydown', (e) => this.keyboard(e));
        this.setupDragDrop();
        
        const pintoImg = document.getElementById('pintoImg');
        if (pintoImg) {
            pintoImg.style.pointerEvents = 'auto';
            pintoImg.style.cursor = 'pointer';
            pintoImg.addEventListener('click', () => {
                pintoImg.style.transform = 'scale(1.3)';
                setTimeout(() => { pintoImg.style.transform = 'scale(1)'; }, 150);
                this.showPintoMeow();
            });
        }
        
        window.addEventListener('beforeunload', () => this.saveSettings());
    }

    showPintoMeow() {
        const existing = document.querySelector('.pinto-meow');
        if (existing) existing.remove();
        
        const meow = document.createElement('div');
        meow.className = 'pinto-meow';
        meow.textContent = 'Meow! 🐱';
        meow.style.cssText = `
            position: fixed;
            top: 25px;
            right: 110px;
            font-family: 'Press Start 2P', cursive;
            font-size: 8px;
            color: #d4a5e5;
            z-index: 101;
            pointer-events: none;
            animation: meowFade 1.5s ease-out forwards;
            text-shadow: 0 0 8px rgba(212, 165, 229, 0.6);
        `;
        
        document.body.appendChild(meow);
        setTimeout(() => meow.remove(), 1500);
    }

    saveSettings() {
        const settings = {
            volume: this.audio.volume,
            shuffle: this.shuffle,
            repeatMode: this.repeatMode,
            currentIndex: this.currentIndex,
            playlistNames: this.playlist.map(t => t.title)
        };
        localStorage.setItem('pixelPlayerSettings', JSON.stringify(settings));
    }

    loadSettings() {
        const saved = localStorage.getItem('pixelPlayerSettings');
        if (!saved) return;
        
        try {
            const settings = JSON.parse(saved);
            
            this.volumeSlider.value = settings.volume * 100;
            this.volValue.textContent = Math.round(settings.volume * 100);
            this.audio.volume = settings.volume;
            
            this.shuffle = settings.shuffle || false;
            if (this.shuffle) this.shuffleBtn.classList.add('active');
            
            this.repeatMode = settings.repeatMode || 0;
            if (this.repeatMode > 0) this.repeatBtn.classList.add('active');
            if (this.repeatMode === 2) this.repeatBtn.style.filter = 'hue-rotate(180deg)';
            
            this.currentIndex = settings.currentIndex || -1;
            
            if (settings.playlistNames && settings.playlistNames.length > 0) {
                const needsScroll = settings.playlistNames.length > 6;
                
                this.playlistItems.innerHTML = `
                    <div class="empty-msg" style="${needsScroll ? 'max-height: 20vh; overflow-y: auto;' : ''}">
                        <p style="color: #d4a5e5; margin-bottom: 10px;">📼 PREVIOUS TAPES:</p>
                        ${settings.playlistNames.map(name => 
                            `<p class="small" style="color: #7a6b9e;">◈ ${name}</p>`
                        ).join('')}
                        <p style="margin-top: 15px; color: #b886c4;">⬆ RE-ADD YOUR FILES ⬆</p>
                    </div>
                `;
                
                if (needsScroll) {
                    this.playlistItems.classList.add('scrollable');
                }
            }
        } catch(e) {}
    }

    setupDragDrop() {
        const body = document.body;
        body.addEventListener('dragover', e => { e.preventDefault(); body.classList.add('drag-active'); });
        body.addEventListener('dragleave', () => body.classList.remove('drag-active'));
        body.addEventListener('drop', e => {
            e.preventDefault();
            body.classList.remove('drag-active');
            const files = [...e.dataTransfer.files].filter(f => 
                f.type.startsWith('audio/') || 
                f.name.match(/\.(mp3|wav|ogg|flac|aac|m4a|wma|opus|webm)$/i)
            );
            this.addFiles(files);
        });
    }

    addFiles(files) {
        if (!files || files.length === 0) return;
        
        const supportedFormats = [
            'audio/mpeg', 'audio/mp3',
            'audio/wav', 'audio/wave',
            'audio/ogg', 'audio/vorbis',
            'audio/flac', 'audio/x-flac',
            'audio/aac', 'audio/x-aac',
            'audio/mp4', 'audio/x-m4a',
            'audio/webm',
            'audio/x-ms-wma',
            'audio/opus',
        ];
        
        let skippedFiles = [];
        
        [...files].forEach(file => {
            if (supportedFormats.includes(file.type) || 
                file.name.match(/\.(mp3|wav|ogg|flac|aac|m4a|wma|opus|webm)$/i)) {
                const url = URL.createObjectURL(file);
                this.playlist.push({
                    id: Date.now() + Math.random(),
                    title: file.name.replace(/\.[^/.]+$/, ''),
                    file, url, duration: null
                });
            } else {
                skippedFiles.push(file.name);
            }
        });
        
        this.renderPlaylist();
        if (this.currentIndex === -1 && this.playlist.length > 0) this.loadTrack(0);
        this.saveSettings();
        
        if (skippedFiles.length > 0) {
            const fileList = skippedFiles.map(f => `• ${f}`).join('\n');
            window.showError(
                `Unsupported format!\n\nSkipped:\n${fileList}\n\nSupported: MP3, WAV, OGG, FLAC, AAC, M4A, WMA, Opus, WebM`
            );
        }
    }

    removeTrack(index) {
        if (this.currentIndex === index) {
            this.pause();
            this.audio.src = '';
            this.trackTitle.textContent = '♪ DROP YOUR TAPE ♪';
            this.trackArtist.textContent = '── ✦ ──';
        }
        if (index < this.currentIndex) this.currentIndex--;
        this.playlist.splice(index, 1);
        
        if (this.playlist.length === 0) {
            this.currentIndex = -1;
            this.trackTitle.textContent = '♪ DROP YOUR TAPE ♪';
            this.trackArtist.textContent = '── ✦ ──';
        }
        else if (this.currentIndex === index && this.playlist.length > 0) {
            this.loadTrack(Math.min(this.currentIndex, this.playlist.length - 1));
        }
        else if (this.currentIndex >= this.playlist.length) {
            this.currentIndex = this.playlist.length - 1;
        }
        
        this.renderPlaylist();
        this.saveSettings();
    }

    renderPlaylist() {
        this.playlistItems.innerHTML = '';
        if (this.playlist.length === 0) {
            this.playlistItems.innerHTML = '<div class="empty-msg"><p>DROP TAPES HERE</p><p class="small">or click +</p></div>';
            this.playlistItems.classList.remove('scrollable');
            return;
        }
        
        if (this.playlist.length > 3) {
            this.playlistItems.classList.add('scrollable');
        } else {
            this.playlistItems.classList.remove('scrollable');
        }
        
        this.playlist.forEach((t, i) => {
            const div = document.createElement('div');
            div.className = `track-item ${i === this.currentIndex ? 'active' : ''}`;
            div.innerHTML = `
                <span class="track-num">${String(i+1).padStart(2,'0')}</span>
                <span class="track-title-text">${t.title}</span>
                <span class="track-len">${t.duration ? this.fmt(t.duration) : '--:--'}</span>
                <button class="track-del">×</button>
            `;
            div.addEventListener('click', e => { if (!e.target.classList.contains('track-del')) this.loadTrack(i); });
            div.querySelector('.track-del').addEventListener('click', e => { e.stopPropagation(); this.removeTrack(i); });
            this.playlistItems.appendChild(div);
        });
    }

    loadTrack(i) {
        if (i < 0 || i >= this.playlist.length) return;
        this.currentIndex = i;
        this.audio.src = this.playlist[i].url;
        
        this.trackTitle.textContent = this.playlist[i].title;
        this.trackArtist.textContent = '── ✦ ──';
        
        this.renderPlaylist();
        this.play();
        this.saveSettings();
    }

    togglePlay() { this.isPlaying ? this.pause() : this.play(); }

    play() {
        if (this.playlist.length === 0 || this.currentIndex === -1) return;
        this.audio.play().then(() => {
            this.isPlaying = true;
            this.playIcon.src = '/static/img/btn-pause.png';
            this.cassetteImg.classList.add('playing');
            this.startVisualizer();
            this.saveSettings();
        }).catch(() => {});
    }

    pause() {
        this.audio.pause();
        this.isPlaying = false;
        this.playIcon.src = '/static/img/btn-play.png';
        this.cassetteImg.classList.remove('playing');
        this.stopVisualizer();
    }

    prev() {
        if (!this.playlist.length) return;
        if (this.audio.currentTime > 3) { this.audio.currentTime = 0; return; }
        const idx = this.shuffle ? this.randIdx() : this.currentIndex - 1;
        this.loadTrack(idx < 0 ? this.playlist.length - 1 : idx);
    }

    next() {
        if (!this.playlist.length) return;
        const idx = this.shuffle ? this.randIdx() : this.currentIndex + 1;
        this.loadTrack(idx >= this.playlist.length ? 0 : idx);
    }

    randIdx() {
        if (this.playlist.length <= 1) return 0;
        let r;
        do { r = Math.floor(Math.random() * this.playlist.length); } while (r === this.currentIndex && this.playlist.length > 1);
        return r;
    }

    toggleShuffle() {
        this.shuffle = !this.shuffle;
        this.shuffleBtn.classList.toggle('active', this.shuffle);
        this.saveSettings();
    }

    toggleRepeat() {
        this.repeatMode = (this.repeatMode + 1) % 3;
        this.repeatBtn.classList.toggle('active', this.repeatMode > 0);
        if (this.repeatMode === 2) this.repeatBtn.style.filter = 'hue-rotate(180deg)';
        else this.repeatBtn.style.filter = 'none';
        this.saveSettings();
    }

    onEnd() {
        if (this.repeatMode === 2) { this.audio.currentTime = 0; this.play(); }
        else if (this.repeatMode === 1 || this.currentIndex < this.playlist.length - 1) this.next();
        else { 
            this.isPlaying = false; 
            this.playIcon.src = '/static/img/btn-play.png';
            this.cassetteImg.classList.remove('playing');
            this.stopVisualizer();
        }
    }

    updateProgress() {
        const pct = (this.audio.currentTime / this.audio.duration) * 100 || 0;
        this.progressFill.style.width = `${pct}%`;
        this.currentTimeEl.textContent = this.fmt(this.audio.currentTime);
    }

    updateDuration() {
        this.durationEl.textContent = this.fmt(this.audio.duration || 0);
        if (this.currentIndex >= 0) { 
            this.playlist[this.currentIndex].duration = this.audio.duration; 
            this.renderPlaylist(); 
        }
    }

    seek(e) {
        const rect = this.progressBar.getBoundingClientRect();
        this.audio.currentTime = ((e.clientX - rect.left) / rect.width) * this.audio.duration;
    }

    setVolume() {
        this.audio.volume = this.volumeSlider.value / 100;
        this.volValue.textContent = this.volumeSlider.value;
        this.saveSettings();
    }

    keyboard(e) {
        if (e.target.tagName === 'INPUT') return;
        if (e.code === 'Space') { e.preventDefault(); this.togglePlay(); }
        if (e.code === 'ArrowLeft') { e.preventDefault(); this.prev(); }
        if (e.code === 'ArrowRight') { e.preventDefault(); this.next(); }
    }

    setupVisualizer() {
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.analyser = this.audioContext.createAnalyser();
            this.analyser.fftSize = 64;
            this.source = this.audioContext.createMediaElementSource(this.audio);
            this.source.connect(this.analyser);
            this.analyser.connect(this.audioContext.destination);
        }
    }

    startVisualizer() {
        if (!this.audioContext) this.setupVisualizer();
        
        const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
        
        const update = () => {
            if (!this.isPlaying) return;
            
            this.analyser.getByteFrequencyData(dataArray);
            
            const step = Math.floor(dataArray.length / 16);
            
            this.visualizerBars.forEach((bar, i) => {
                let value = 0;
                for (let j = 0; j < step; j++) {
                    value += dataArray[i * step + j] || 0;
                }
                value = value / step;
                const height = Math.max(3, (value / 255) * 28);
                bar.style.height = `${height}px`;
            });
            
            this.vizInterval = requestAnimationFrame(update);
        };
        
        update();
    }

    stopVisualizer() {
        if (this.vizInterval) {
            cancelAnimationFrame(this.vizInterval);
            this.vizInterval = null;
        }
        this.visualizerBars.forEach(bar => bar.style.height = '3px');
    }

    fmt(s) { 
        if (isNaN(s)) return '--:--';
        return `${String(Math.floor(s/60)).padStart(2,'0')}:${String(Math.floor(s%60)).padStart(2,'0')}`; 
    }
}

// ========== PIXEL PARTICLE SYSTEM ==========
class PixelParticles {
    constructor() {
        this.canvas = document.getElementById('particleCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.particles = [];
        this.mouseX = -100;
        this.mouseY = -100;
        this.lastEmit = 0;
        this.emitInterval = 35;
        
        if (window.innerWidth <= 768) return;
        this.init();
    }
    
    init() {
        this.resize();
        window.addEventListener('resize', () => this.resize());
        document.addEventListener('mousemove', (e) => this.onMouseMove(e));
        this.animate();
    }
    
    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }
    
    onMouseMove(e) {
        const now = Date.now();
        if (now - this.lastEmit > this.emitInterval) {
            this.lastEmit = now;
            const count = 2 + Math.floor(Math.random() * 2);
            for (let i = 0; i < count; i++) {
                this.emit(e.clientX, e.clientY);
            }
        }
        this.mouseX = e.clientX;
        this.mouseY = e.clientY;
    }
    
    emit(x, y) {
        const colors = [
            '#b886c4', '#d4a5e5', '#c4736b',
            '#9b8ec4', '#a78bbf', '#8b7aaa'
        ];
        const shapes = ['•', '▪', '✦', '▫'];
        
        const particle = {
            x: x + (Math.random() - 0.5) * 14,
            y: y + (Math.random() - 0.5) * 14,
            vx: (Math.random() - 0.5) * 2,
            vy: (Math.random() - 0.5) * 2 - 1.2,
            life: 1,
            decay: 0.018 + Math.random() * 0.025,
            size: 5 + Math.floor(Math.random() * 7),
            color: colors[Math.floor(Math.random() * colors.length)],
            shape: shapes[Math.floor(Math.random() * shapes.length)],
            rotation: Math.random() * 360,
            rotSpeed: (Math.random() - 0.5) * 5
        };
        
        this.particles.push(particle);
        if (this.particles.length > 100) this.particles.shift();
    }
    
    animate() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.particles = this.particles.filter(p => {
            p.life -= p.decay;
            if (p.life <= 0) return false;
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.018;
            p.rotation += p.rotSpeed;
            this.drawParticle(p);
            return true;
        });
        
        requestAnimationFrame(() => this.animate());
    }
    
    drawParticle(p) {
        const ctx = this.ctx;
        ctx.save();
        ctx.globalAlpha = p.life * 0.85;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation * Math.PI / 180);
        
        const scale = p.life * p.size;
        ctx.font = `${scale}px "Press Start 2P", monospace`;
        ctx.fillStyle = p.color;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 5 * p.life;
        ctx.fillText(p.shape, 0, 0);
        
        if (p.shape === '✦' && p.life > 0.5) {
            ctx.shadowBlur = 10 * p.life;
            ctx.globalAlpha = p.life * 0.4;
            ctx.fillText(p.shape, 0, 0);
        }
        
        ctx.restore();
    }
}

// ========== CRT ENGINE ==========
class CRTEngine {
    constructor() {
        this.tear = document.getElementById('crtTear');
        this.flicker = document.getElementById('crtFlicker');
        if (window.innerWidth <= 768) return;
        this.init();
    }
    
    init() {
        setInterval(() => this.triggerTear(), 2000 + Math.random() * 5000);
        setInterval(() => this.triggerFlicker(), 1500 + Math.random() * 4000);
    }
    
    triggerTear() {
        if (Math.random() > 0.6) return;
        this.tear.style.setProperty('--tear-y', Math.random() * 80 + 10 + '%');
        this.tear.classList.add('active');
        setTimeout(() => this.tear.classList.remove('active'), 80);
    }
    
    triggerFlicker() {
        if (Math.random() > 0.3) return;
        this.flicker.classList.add('active');
        setTimeout(() => this.flicker.classList.remove('active'), 30 + Math.random() * 80);
    }
}

// ========== DUST PARTICLES SYSTEM ==========
class DustParticles {
    constructor() {
        this.container = document.getElementById('dustContainer');
        this.particles = [];
        this.maxParticles = window.innerWidth <= 768 ? 8 : 25;
        this.init();
    }
    
    init() {
        for (let i = 0; i < this.maxParticles; i++) this.createParticle();
        setInterval(() => this.recycleParticle(), 2000);
    }
    
    createParticle() {
        const shapes = ['•', '·', '◦', '▪', '▫', '✦'];
        const colors = ['#b886c4', '#d4a5e5', '#9b8ec4', '#c4a8d4', '#8b7aaa', '#a390c4'];
        
        const particle = document.createElement('div');
        particle.className = 'dust-particle';
        
        const size = 3 + Math.random() * 5;
        const color = colors[Math.floor(Math.random() * colors.length)];
        const duration = 6 + Math.random() * 14;
        const delay = Math.random() * 10;
        const startX = Math.random() * window.innerWidth;
        const startY = Math.random() * window.innerHeight;
        const endX = startX + (Math.random() - 0.5) * 300;
        const endY = startY - 50 - Math.random() * 250;
        const maxOpacity = 0.15 + Math.random() * 0.35;
        const glow = 2 + Math.random() * 6;
        
        particle.style.cssText = `
            --shape: "${shapes[Math.floor(Math.random() * shapes.length)]}";
            --size: ${size}px;
            --color: ${color};
            --duration: ${duration}s;
            --delay: ${delay}s;
            --start-x: 0px;
            --start-y: 0px;
            --end-x: ${endX - startX}px;
            --end-y: ${endY - startY}px;
            --max-opacity: ${maxOpacity};
            --glow: ${glow}px;
            left: ${startX}px;
            top: ${startY}px;
        `;
        
        if (startY < window.innerHeight * 0.4) particle.classList.add('glowing');
        
        this.container.appendChild(particle);
        this.particles.push({ element: particle, startX, startY, endX, endY });
    }
    
    recycleParticle() {
        if (this.particles.length === 0) return;
        this.particles.shift().element.remove();
        this.createParticle();
    }
}

// ========== NIGHT SKY ==========
class NightSky {
    constructor() {
        this.container = document.getElementById('nightSky');
        this.stars = [];
        this.maxStars = window.innerWidth <= 768 ? 10 : 40;
        this.meteorTimeout = null;
        this.init();
    }
    
    init() {
        for (let i = 0; i < this.maxStars; i++) this.createStar();
        this.scheduleMeteor();
        this.createClouds();
    }
    
    createStar() {
        const star = document.createElement('div');
        star.className = 'star';
        star.style.cssText = `
            left: ${Math.random() * 100}%;
            top: ${Math.random() * 70}%;
            --star-size: ${4 + Math.random() * 8}px;
            --star-opacity: ${0.4 + Math.random() * 0.6};
            --twinkle-duration: ${2 + Math.random() * 5}s;
            --twinkle-delay: ${Math.random() * 5}s;
        `;
        this.container.appendChild(star);
        this.stars.push(star);
    }
    
    createMeteor() {
        const meteor = document.createElement('div');
        meteor.className = 'meteor';
        const duration = 1 + Math.random() * 2;
        meteor.style.cssText = `
            left: ${Math.random() * 80}%;
            top: ${Math.random() * 40}%;
            --meteor-length: ${20 + Math.random() * 40}px;
            --meteor-height: ${2 + Math.random() * 4}px;
            --meteor-angle: ${-35 - Math.random() * 20}deg;
            --meteor-duration: ${duration}s;
        `;
        this.container.appendChild(meteor);
        setTimeout(() => { if (meteor.parentNode) meteor.remove(); }, duration * 1000 + 500);
    }
    
    scheduleMeteor() {
        const create = () => {
            if (Math.random() > 0.4) {
                this.createMeteor();
                if (Math.random() > 0.7) setTimeout(() => this.createMeteor(), 200);
            }
            this.meteorTimeout = setTimeout(create, 3000 + Math.random() * 8000);
        };
        this.meteorTimeout = setTimeout(create, 2000 + Math.random() * 3000);
    }
    
    createClouds() {
        for (let i = 0; i < 2 + Math.floor(Math.random() * 2); i++) {
            const cloud = document.createElement('div');
            cloud.className = 'pixel-cloud';
            cloud.style.cssText = `
                top: ${10 + Math.random() * 30}%;
                --cloud-size: ${40 + Math.random() * 60}px;
                --cloud-opacity: ${0.15 + Math.random() * 0.2};
                --cloud-duration: ${25 + Math.random() * 35}s;
                --cloud-delay: -${Math.random() * 20}s;
            `;
            this.container.appendChild(cloud);
        }
    }
}

// ========== NOTEBOOK ==========
class PixelNotebook {
    constructor() {
        this.overlay = document.getElementById('notebookOverlay');
        this.toggleBtn = document.getElementById('notebookToggle');
        this.closeBtn = document.getElementById('notebookClose');
        this.clearBtn = document.getElementById('notebookClear');
        this.textarea = document.getElementById('notebookText');
        this.status = document.getElementById('notebookStatus');
        this.saveTimeout = null;
        this.init();
    }
    
    init() {
        this.loadNote();
        this.toggleBtn.addEventListener('click', () => this.open());
        this.closeBtn.addEventListener('click', () => this.close());
        this.clearBtn.addEventListener('click', () => this.clear());
        this.textarea.addEventListener('input', () => this.onInput());
        
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.overlay.classList.contains('visible')) this.close();
        });
        
        this.overlay.addEventListener('click', (e) => {
            if (e.target === this.overlay) this.close();
        });
    }
    
    open() { this.overlay.classList.add('visible'); this.textarea.focus(); }
    
    close() { this.overlay.classList.remove('visible'); this.saveNote(); }
    
    onInput() {
        this.status.textContent = '... Saving';
        this.status.className = 'notebook-status saving';
        clearTimeout(this.saveTimeout);
        this.saveTimeout = setTimeout(() => this.saveNote(), 1000);
    }
    
    saveNote() {
        localStorage.setItem('pixelNotebook', this.textarea.value);
        this.status.textContent = '✓ Saved';
        this.status.className = 'notebook-status saved';
    }
    
    loadNote() {
        const saved = localStorage.getItem('pixelNotebook');
        if (saved) this.textarea.value = saved;
    }
    
    clear() {
        if (confirm('Clear all notes?')) {
            this.textarea.value = '';
            this.saveNote();
        }
    }
}

// ========== ERROR BOX ==========
window.showError = function(message) {
    const overlay = document.getElementById('errorOverlay');
    const messageEl = document.getElementById('errorMessage');
    const closeBtn = document.getElementById('errorClose');
    const okBtn = document.getElementById('errorOk');
    
    if (!overlay || !messageEl) return;
    
    messageEl.textContent = message;
    overlay.classList.add('visible');
    
    const hideError = () => {
        overlay.classList.remove('visible');
        closeBtn.removeEventListener('click', hideError);
        okBtn.removeEventListener('click', hideError);
    };
    
    closeBtn.addEventListener('click', hideError);
    okBtn.addEventListener('click', hideError);
    
    const escHandler = (e) => {
        if (e.key === 'Escape') {
            hideError();
            document.removeEventListener('keydown', escHandler);
        }
    };
    document.addEventListener('keydown', escHandler);
    
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) hideError();
    });
};
// ========== CUSTOM SCROLLBAR ==========
class CustomScrollbar {
    constructor() {
        this.scrollbar = document.getElementById('customScrollbar');
        this.thumb = document.getElementById('scrollbarThumb');
        this.isDragging = false;
        this.startY = 0;
        this.startScroll = 0;
        
        if (window.innerWidth <= 768) return;
        
        this.init();
    }
    
    init() {
        this.update();
        
        window.addEventListener('scroll', () => this.update());
        window.addEventListener('resize', () => this.update());
        
        this.thumb.addEventListener('mousedown', (e) => this.onDragStart(e));
        document.addEventListener('mousemove', (e) => this.onDragMove(e));
        document.addEventListener('mouseup', () => this.onDragEnd());
        
        // هاور روی کل صفحه
        document.addEventListener('mousemove', (e) => {
            if (e.clientX > window.innerWidth - 20) {
                this.scrollbar.classList.add('visible');
            } else if (!this.isDragging) {
                this.scrollbar.classList.remove('visible');
            }
        });
        
        // کلیک روی track
        this.scrollbar.addEventListener('click', (e) => {
            if (e.target === this.scrollbar) {
                const pct = e.clientY / window.innerHeight;
                window.scrollTo({
                    top: pct * (document.documentElement.scrollHeight - window.innerHeight),
                    behavior: 'smooth'
                });
            }
        });
    }
    
    update() {
        const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
        const scrollTop = window.scrollY || document.documentElement.scrollTop;
        const thumbHeight = Math.max(40, (window.innerHeight / document.documentElement.scrollHeight) * (window.innerHeight - 10));
        const thumbTop = (scrollTop / scrollHeight) * (window.innerHeight - thumbHeight - 10) + 5;
        
        if (scrollHeight <= 0) {
            this.scrollbar.style.display = 'none';
        } else {
            this.scrollbar.style.display = 'block';
            this.thumb.style.height = `${thumbHeight}px`;
            this.thumb.style.top = `${thumbTop}px`;
        }
    }
    
    onDragStart(e) {
        this.isDragging = true;
        this.startY = e.clientY;
        this.startScroll = window.scrollY;
        this.thumb.style.background = '#d4a5e5';
        document.body.style.userSelect = 'none';
    }
    
    onDragMove(e) {
        if (!this.isDragging) return;
        
        const deltaY = e.clientY - this.startY;
        const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
        const thumbTrackHeight = window.innerHeight - parseFloat(this.thumb.style.height) - 10;
        const scrollDelta = (deltaY / thumbTrackHeight) * scrollHeight;
        
        window.scrollTo(0, this.startScroll + scrollDelta);
    }
    
    onDragEnd() {
        this.isDragging = false;
        this.thumb.style.background = '';
        document.body.style.userSelect = '';
        this.scrollbar.classList.remove('visible');
    }
}
// ========== راه‌اندازی همه ==========
document.addEventListener('DOMContentLoaded', () => {
    window.player = new RetroPlayer();
    window.particles = new PixelParticles();
    window.crtEngine = new CRTEngine();
    window.dustParticles = new DustParticles();
    window.nightSky = new NightSky();
    window.notebook = new PixelNotebook();
    window.customScrollbar = new CustomScrollbar();  // ← اضافه کن
});