
// Application state
    const AppState = {
      img: null,
      canvas: null,
      ctx: null,
      imgW: 0,
      imgH: 0,
      finalW: 0,
      finalH: 0,
      initialScale: null
    };

    // Configuration
    const Config = {
      imageUrl: "assets/img/bb.jpg",
      baseText: "ILOVEYOUSOMUCH",
      buttonPosition: { x: 0.14, y: 0.65 },
      textSettings: { lineHeight: 1, fontWidth: 6 }
    };

    // DOM elements
    const Elements = {
      paragraph: null,
      invisibleBtn: null,
      popup: null,
      envelopeContainer: null,
      backgroundMusic: null,
      playPauseBtn: null,
      volumeSlider: null
    };

    // Initialize application
    function initializeApp() {
      Elements.paragraph = document.getElementById('text');
      Elements.invisibleBtn = document.getElementById('invisible-btn');
      Elements.popup = document.getElementById('popup');
      Elements.backgroundMusic = document.getElementById('background-music');
      Elements.playPauseBtn = document.getElementById('play-pause-btn');
      Elements.volumeSlider = document.getElementById('volume-slider');
      
      createEnvelopeElement();
      setupImage();
      setupEventListeners();
      setupAudioControls();
    }

    // Image setup and loading
    function setupImage() {
      AppState.img = new Image();
      AppState.img.src = Config.imageUrl;
      
      AppState.img.onerror = function() {
        console.error('Error loading image:', Config.imageUrl);
      };
      
      AppState.img.onload = function() {
        AppState.imgW = AppState.img.naturalWidth;
        AppState.imgH = AppState.img.naturalHeight;
        
        AppState.canvas = document.createElement('canvas');
        AppState.ctx = AppState.canvas.getContext('2d');
        
        applyImageEffect();
        updateLayout();
      };
    }

    // Apply image effect
    function applyImageEffect() {
      if (!AppState.canvas || !AppState.ctx || !AppState.img) return;

      AppState.canvas.width = AppState.img.width;
      AppState.canvas.height = AppState.img.height;
      AppState.ctx.drawImage(AppState.img, 0, 0);

      Elements.paragraph.style.backgroundImage = `url(${AppState.canvas.toDataURL()})`;
    }

    // Update layout and positioning
    function updateLayout() {
      if (!AppState.imgW || !AppState.imgH) return;
      
      // Use visual viewport if available to prevent zoom-based resizing
      const viewW = window.visualViewport ? window.visualViewport.width : window.innerWidth;
      const viewH = window.visualViewport ? window.visualViewport.height : window.innerHeight;

      // On mobile, maintain fixed scale to prevent auto-resizing during zoom
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      
      let scale;
      if (isMobile && AppState.initialScale) {
        // Use the initial scale calculated on first load
        scale = AppState.initialScale;
      } else {
        scale = Math.min(viewW / AppState.imgW, viewH / AppState.imgH);
        // Store initial scale for mobile devices
        if (isMobile && !AppState.initialScale) {
          AppState.initialScale = scale;
        }
      }
      
      AppState.finalW = AppState.imgW * scale;
      AppState.finalH = AppState.imgH * scale;

      Elements.paragraph.style.width = AppState.finalW + "px";
      Elements.paragraph.style.height = AppState.finalH + "px";
      Elements.paragraph.style.backgroundSize = `${AppState.finalW}px ${AppState.finalH}px`;

      updateButtonPosition();
      updateTextContent();
    }

    // Update button position
    function updateButtonPosition() {
      const buttonLeft = (window.innerWidth - AppState.finalW) / 2 + (AppState.finalW * Config.buttonPosition.x);
      const buttonTop = (window.innerHeight - AppState.finalH) / 2 + (AppState.finalH * Config.buttonPosition.y);
      
      Elements.invisibleBtn.style.left = buttonLeft + "px";
      Elements.invisibleBtn.style.top = buttonTop + "px";
      Elements.invisibleBtn.style.transform = "translate(-50%, -50%)";
    }

    // Update text content
    function updateTextContent() {
      const lines = Math.floor(AppState.finalH / Config.textSettings.lineHeight);
      const charsPerLine = Math.floor(AppState.finalW / Config.textSettings.fontWidth);
      const totalChars = lines * charsPerLine;
      const repeatCount = Math.ceil(totalChars / Config.baseText.length);
      
      Elements.paragraph.textContent = Config.baseText.repeat(repeatCount);
    }

    // Setup all event listeners
    function setupEventListeners() {
      document.addEventListener('keydown', handleKeydown);
      Elements.invisibleBtn.addEventListener('click', openPopup);
      window.addEventListener('click', handleWindowClick);
      window.addEventListener('resize', updateLayout);
    }

    // Handle keydown events
    function handleKeydown(e) {
      if (e.key === 'd') {
        Elements.invisibleBtn.classList.toggle('debug');
      }
    }

    // Open popup dialog
    function openPopup() {
      playEnvelopeAnimation();
    }

    // Close popup dialog
    function closePopup() {
      Elements.popup.style.display = 'none';
      Elements.popup.classList.remove('envelope-opening');
      document.body.classList.add('not-loaded');
      stopBackgroundMusic();
    }

    // Handle window click events
    function handleWindowClick(e) {
      if (e.target === Elements.popup) {
        closePopup();
      }
    }

    // Create envelope element
    function createEnvelopeElement() {
      Elements.envelopeContainer = document.createElement('div');
      Elements.envelopeContainer.className = 'envelope-container hidden';
      Elements.envelopeContainer.innerHTML = `
        <div class="envelope">
          <div class="envelope-base"></div>
          <div class="letter"></div>
          <div class="envelope-flap"></div>
        </div>
      `;
      document.body.appendChild(Elements.envelopeContainer);
    }

    // Play envelope opening animation
    function playEnvelopeAnimation() {
      // Get button position
      const buttonRect = Elements.invisibleBtn.getBoundingClientRect();
      const buttonCenterX = buttonRect.left + buttonRect.width / 2;
      const buttonCenterY = buttonRect.top + buttonRect.height / 2;
      
      // Position envelope at button location initially
      Elements.envelopeContainer.style.left = buttonCenterX + 'px';
      Elements.envelopeContainer.style.top = buttonCenterY + 'px';
      Elements.envelopeContainer.classList.add('from-button');
      
      // Show envelope
      Elements.envelopeContainer.classList.remove('hidden');
      
      // Animate envelope from button to center
      setTimeout(() => {
        Elements.envelopeContainer.style.left = '50%';
        Elements.envelopeContainer.style.top = '50%';
        Elements.envelopeContainer.classList.remove('from-button');
        Elements.envelopeContainer.style.opacity = '1';
        Elements.envelopeContainer.style.transform = 'translate(-50%, -50%) scale(1)';
      }, 50);
      
      // Create hearts after envelope starts moving
      setTimeout(() => {
        createFloatingHearts();
      }, 400);
      
      // Start envelope opening animation
      setTimeout(() => {
        const envelope = Elements.envelopeContainer.querySelector('.envelope');
        envelope.classList.add('opening');
      }, 800);
      
      // Show popup with animation
      setTimeout(() => {
        Elements.popup.style.display = 'block';
        Elements.popup.classList.add('envelope-opening');
        loadFlowerAnimation();
      }, 1800);
      
      // Hide envelope
      setTimeout(() => {
        const envelope = Elements.envelopeContainer.querySelector('.envelope');
        envelope.classList.add('disappearing');
        
        setTimeout(() => {
          Elements.envelopeContainer.classList.add('hidden');
          envelope.classList.remove('opening', 'disappearing');
          // Reset envelope position for next time
          Elements.envelopeContainer.style.left = '50%';
          Elements.envelopeContainer.style.top = '50%';
          Elements.envelopeContainer.style.transform = 'translate(-50%, -50%)';
          Elements.envelopeContainer.style.opacity = '';
        }, 800);
      }, 2800);
    }

    // Create floating hearts
    function createFloatingHearts() {
      const heartsContainer = document.createElement('div');
      heartsContainer.className = 'hearts-container';
      
      // Create multiple hearts
      for (let i = 0; i < 15; i++) {
        const heart = document.createElement('div');
        heart.className = 'heart';
        heart.innerHTML = '♥';
        
        // Random positioning
        heart.style.left = Math.random() * 100 + 'vw';
        heart.style.top = Math.random() * 100 + 'vh';
        heart.style.animationDelay = (Math.random() * 2) + 's';
        
        heartsContainer.appendChild(heart);
      }
      
      document.body.appendChild(heartsContainer);
      
      // Remove hearts after animation
      setTimeout(() => {
        document.body.removeChild(heartsContainer);
      }, 5000);
    }

    // Device detection
    function detectDevice() {
      const userAgent = navigator.userAgent.toLowerCase();
      const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/.test(userAgent);
      const isIOS = /iphone|ipad|ipod/.test(userAgent);
      const isAndroid = /android/.test(userAgent);
      const isSafari = /safari/.test(userAgent) && !/chrome/.test(userAgent);
      
      return {
        isMobile,
        isIOS,
        isAndroid,
        isSafari,
        supportsVolumeControl: !isIOS && !isSafari // iOS and Safari don't support programmatic volume control
      };
    }

    // Setup audio controls with device-specific handling
    function setupAudioControls() {
      if (!Elements.backgroundMusic || !Elements.playPauseBtn || !Elements.volumeSlider) return;
      
      const device = detectDevice();
      
      // Set initial volume
      if (device.supportsVolumeControl) {
        Elements.backgroundMusic.volume = Elements.volumeSlider.value / 100;
      } else {
        // Hide volume controls on devices that don't support it
        Elements.volumeSlider.style.display = 'none';
        document.querySelector('.volume-label').style.display = 'none';
        
        // Add a note for iOS/Safari users
        const volumeNote = document.createElement('span');
        volumeNote.textContent = 'Use device volume buttons';
        volumeNote.className = 'volume-note';
        volumeNote.style.fontSize = '12px';
        volumeNote.style.opacity = '0.7';
        volumeNote.style.marginLeft = '10px';
        Elements.volumeSlider.parentNode.appendChild(volumeNote);
      }
      
      // Enhanced Play/Pause button functionality
      Elements.playPauseBtn.addEventListener('click', togglePlayPause);
      
      // Add touch event support for mobile
      if (device.isMobile) {
        Elements.playPauseBtn.addEventListener('touchstart', function(e) {
          e.preventDefault();
          this.style.transform = 'scale(0.95)';
        });
        
        Elements.playPauseBtn.addEventListener('touchend', function(e) {
          e.preventDefault();
          this.style.transform = 'scale(1)';
          togglePlayPause();
        });
      }
      
      // Volume slider functionality with enhanced mobile support
      if (device.supportsVolumeControl) {
        // Standard input event
        Elements.volumeSlider.addEventListener('input', function() {
          Elements.backgroundMusic.volume = this.value / 100;
        });
        
        // Additional change event for better mobile compatibility
        Elements.volumeSlider.addEventListener('change', function() {
          Elements.backgroundMusic.volume = this.value / 100;
        });
        
        // Touch events for mobile devices
        if (device.isMobile) {
          Elements.volumeSlider.addEventListener('touchstart', function(e) {
            e.stopPropagation();
          });
          
          Elements.volumeSlider.addEventListener('touchmove', function(e) {
            e.stopPropagation();
            // Update volume in real-time during touch drag
            setTimeout(() => {
              Elements.backgroundMusic.volume = this.value / 100;
            }, 10);
          });
          
          Elements.volumeSlider.addEventListener('touchend', function(e) {
            e.stopPropagation();
            Elements.backgroundMusic.volume = this.value / 100;
          });
        }
      }
      
      // Enhanced audio loading with device-specific handling
      Elements.backgroundMusic.addEventListener('canplaythrough', function() {
        // Music is ready to play
        console.log('Audio ready for device:', device);
      });
      
      // Handle audio context issues on mobile
      if (device.isMobile) {
        Elements.backgroundMusic.addEventListener('loadstart', function() {
          // Ensure audio context is resumed on mobile
          if (typeof AudioContext !== 'undefined' || typeof webkitAudioContext !== 'undefined') {
            const AudioContextClass = AudioContext || webkitAudioContext;
            if (AudioContextClass && AudioContextClass.prototype.resume) {
              const audioContext = new AudioContextClass();
              if (audioContext.state === 'suspended') {
                audioContext.resume();
              }
            }
          }
        });
      }
    }
    
    // Enhanced toggle play/pause functionality with mobile support
    function togglePlayPause() {
      const device = detectDevice();
      
      if (Elements.backgroundMusic.paused) {
        // Attempt to play with enhanced error handling
        const playPromise = Elements.backgroundMusic.play();
        
        if (playPromise !== undefined) {
          playPromise.then(() => {
            Elements.playPauseBtn.textContent = '⏸️';
            console.log('Audio playback started successfully');
          }).catch(error => {
            console.log('Audio play failed:', error);
            
            // Handle different types of play failures
            if (error.name === 'NotAllowedError') {
              // User interaction required
              showAudioError('Please tap to enable audio');
            } else if (error.name === 'NotSupportedError') {
              // Audio format not supported
              showAudioError('Audio format not supported on this device');
            } else if (device.isMobile && error.name === 'AbortError') {
              // Common on mobile - try again after a short delay
              setTimeout(() => {
                Elements.backgroundMusic.play().then(() => {
                  Elements.playPauseBtn.textContent = '⏸️';
                }).catch(() => {
                  showAudioError('Audio playback unavailable');
                });
              }, 100);
            } else {
              showAudioError('Audio playback failed');
            }
          });
        }
      } else {
        Elements.backgroundMusic.pause();
        Elements.playPauseBtn.textContent = '▶️';
        console.log('Audio playback paused');
      }
    }
    
    // Show audio error message
    function showAudioError(message) {
      // Create or update error message
      let errorMsg = document.querySelector('.audio-error');
      if (!errorMsg) {
        errorMsg = document.createElement('div');
        errorMsg.className = 'audio-error';
        errorMsg.style.cssText = `
          font-size: 11px;
          color: #ff6b6b;
          text-align: center;
          margin-top: 5px;
          opacity: 0.8;
        `;
        Elements.playPauseBtn.parentNode.appendChild(errorMsg);
      }
      
      errorMsg.textContent = message;
      
      // Auto-hide after 3 seconds
      setTimeout(() => {
        if (errorMsg && errorMsg.parentNode) {
          errorMsg.remove();
        }
      }, 3000);
    }
    
    // Start background music when popup opens with enhanced mobile support
    function startBackgroundMusic() {
      if (Elements.backgroundMusic) {
        const device = detectDevice();
        
        // Prepare audio for mobile devices
        if (device.isMobile) {
          // Load the audio first on mobile
          Elements.backgroundMusic.load();
          
          // Set volume if supported
          if (device.supportsVolumeControl) {
            Elements.backgroundMusic.volume = Elements.volumeSlider.value / 100;
          }
        }
        
        const playPromise = Elements.backgroundMusic.play();
        
        if (playPromise !== undefined) {
          playPromise.then(() => {
            Elements.playPauseBtn.textContent = '⏸️';
            console.log('Auto-play started successfully');
          }).catch(error => {
            console.log('Auto-play prevented by browser:', error);
            
            // Handle auto-play restrictions more gracefully
            if (error.name === 'NotAllowedError') {
              // Show user that they need to manually start audio
              Elements.playPauseBtn.textContent = '▶️';
              
              // Add visual indicator for user interaction needed
              Elements.playPauseBtn.style.animation = 'pulse 2s infinite';
              
              // Add pulse animation if not already defined
              if (!document.querySelector('#pulse-animation')) {
                const style = document.createElement('style');
                style.id = 'pulse-animation';
                style.textContent = `
                  @keyframes pulse {
                    0% { transform: scale(1); }
                    50% { transform: scale(1.1); }
                    100% { transform: scale(1); }
                  }
                `;
                document.head.appendChild(style);
              }
              
              // Remove animation after user interacts
              Elements.playPauseBtn.addEventListener('click', function removeAnimation() {
                Elements.playPauseBtn.style.animation = '';
                Elements.playPauseBtn.removeEventListener('click', removeAnimation);
              }, { once: true });
              
            } else {
              // Other errors - keep play button as play icon
              Elements.playPauseBtn.textContent = '▶️';
            }
          });
        }
      }
    }
    
    // Stop background music when popup closes
    function stopBackgroundMusic() {
      if (Elements.backgroundMusic) {
        Elements.backgroundMusic.pause();
        Elements.backgroundMusic.currentTime = 0;
        Elements.playPauseBtn.textContent = '▶️';
      }
    }

    function loadFlowerAnimation() {
      setTimeout(() => {
        document.body.classList.remove("not-loaded");
        // Start background music after animation loads
        setTimeout(() => {
          startBackgroundMusic();
        }, 500);
      }, 1000);
    }

    window.closePopup = closePopup;

    // Initialize when DOM is loaded
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initializeApp);
    } else {
      initializeApp();
    }
  