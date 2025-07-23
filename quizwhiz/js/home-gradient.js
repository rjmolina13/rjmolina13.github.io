/**
 * Advanced Interactive Gradient Backdrop for Home Page
 * Based on gradients-bg-main morphing gradient system
 */

class HomeGradientBackdrop {
    constructor() {
        this.tgX = 0;
        this.tgY = 0;
        this.curX = 0;
        this.curY = 0;
        this.animationId = null;
        this.interactiveElement = null;
        this.lastMouseUpdate = 0;
        this.mouseThrottle = 16; // ~60fps throttling
        this.isVisible = true;
        this.performanceMode = false;
        this.frameCount = 0;
        this.targetFPS = 30; // Reduced from 60fps to save GPU
        this.frameInterval = 1000 / this.targetFPS;
        this.lastFrameTime = 0;
        this.gpuMemoryOptimized = false;
        
        this.init();
    }
    
    init() {
        this.createGradientStructure();
        this.setupEventListeners();
        this.animate();
    }
    
    createGradientStructure() {
        // Create main gradient background container
        const gradientBg = document.createElement('div');
        gradientBg.className = 'gradient-bg';
        
        // Create SVG with goo filter
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
        const filter = document.createElementNS('http://www.w3.org/2000/svg', 'filter');
        filter.setAttribute('id', 'goo');
        
        const feGaussianBlur = document.createElementNS('http://www.w3.org/2000/svg', 'feGaussianBlur');
        feGaussianBlur.setAttribute('in', 'SourceGraphic');
        feGaussianBlur.setAttribute('stdDeviation', '10');
        feGaussianBlur.setAttribute('result', 'blur');
        
        const feColorMatrix = document.createElementNS('http://www.w3.org/2000/svg', 'feColorMatrix');
        feColorMatrix.setAttribute('in', 'blur');
        feColorMatrix.setAttribute('mode', 'matrix');
        feColorMatrix.setAttribute('values', '1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -8');
        feColorMatrix.setAttribute('result', 'goo');
        
        const feBlend = document.createElementNS('http://www.w3.org/2000/svg', 'feBlend');
        feBlend.setAttribute('in', 'SourceGraphic');
        feBlend.setAttribute('in2', 'goo');
        
        filter.appendChild(feGaussianBlur);
        filter.appendChild(feColorMatrix);
        filter.appendChild(feBlend);
        defs.appendChild(filter);
        svg.appendChild(defs);
        
        // Create gradients container
        const gradientsContainer = document.createElement('div');
        gradientsContainer.className = 'gradients-container';
        
        // Create individual gradient elements
        const gradientElements = ['g1', 'g2', 'g3', 'g4', 'g5'];
        gradientElements.forEach(className => {
            const element = document.createElement('div');
            element.className = className;
            gradientsContainer.appendChild(element);
        });
        
        // Create interactive element
        const interactive = document.createElement('div');
        interactive.className = 'interactive';
        gradientsContainer.appendChild(interactive);
        this.interactiveElement = interactive;
        
        // Assemble structure
        gradientBg.appendChild(svg);
        gradientBg.appendChild(gradientsContainer);
        
        // Append to body instead of hero section for full page coverage
        document.body.appendChild(gradientBg);
        
        this.gradientBg = gradientBg;
        this.gradientsContainer = gradientsContainer;
    }
    
    setupEventListeners() {
        // Throttled mouse movement tracking for better performance
        document.addEventListener('mousemove', (e) => {
            const now = performance.now();
            if (now - this.lastMouseUpdate >= this.mouseThrottle) {
                this.tgX = e.clientX;
                this.tgY = e.clientY;
                this.lastMouseUpdate = now;
            }
        }, { passive: true });
        
        // Handle window resize with debouncing
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                this.updateInteractivePosition();
                this.checkPerformanceMode();
            }, 150);
        }, { passive: true });
        
        // Handle visibility changes for performance
        document.addEventListener('visibilitychange', () => {
            this.isVisible = !document.hidden;
            if (!this.isVisible && this.animationId) {
                cancelAnimationFrame(this.animationId);
                this.animationId = null;
            } else if (this.isVisible && !this.animationId) {
                this.animate();
            }
        });
        
        // Handle theme changes
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        mediaQuery.addEventListener('change', () => {
            this.updateTheme();
        });
        
        // Handle reduced motion preference
        const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
        motionQuery.addEventListener('change', () => {
            this.updateMotionPreference();
        });
        
        // Performance monitoring
        this.checkPerformanceMode();
    }
    
    animate() {
        if (!this.isVisible) return;
        
        const now = performance.now();
        const deltaTime = now - this.lastFrameTime;
        
        // Frame rate limiting to reduce GPU usage
        if (deltaTime < this.frameInterval) {
            this.animationId = requestAnimationFrame(() => this.animate());
            return;
        }
        
        this.lastFrameTime = now - (deltaTime % this.frameInterval);
        this.frameCount++;
        
        // Adaptive interpolation based on performance mode
        const lerpFactor = this.performanceMode ? 12 : 18; // Reduced for smoother GPU usage
        const deltaX = (this.tgX - this.curX) / lerpFactor;
        const deltaY = (this.tgY - this.curY) / lerpFactor;
        
        // Only update if movement is significant enough (increased threshold)
        if (Math.abs(deltaX) > 0.5 || Math.abs(deltaY) > 0.5) {
            this.curX += deltaX;
            this.curY += deltaY;
            this.updateInteractivePosition();
        }
        
        // GPU memory optimization every 300 frames (~10 seconds at 30fps)
        if (this.frameCount % 300 === 0) {
            this.optimizeGPUMemory();
        }
        
        this.animationId = requestAnimationFrame(() => this.animate());
    }
    
    updateInteractivePosition() {
        if (this.interactiveElement) {
            // Constrain position to prevent overflow
            const maxX = window.innerWidth * 0.7; // Allow some movement but prevent overflow
            const maxY = window.innerHeight * 0.7;
            const minX = window.innerWidth * -0.3;
            const minY = window.innerHeight * -0.3;
            
            const constrainedX = Math.max(minX, Math.min(maxX, this.curX));
            const constrainedY = Math.max(minY, Math.min(maxY, this.curY));
            
            // Use transform3d for hardware acceleration
            this.interactiveElement.style.transform = `translate3d(${constrainedX}px, ${constrainedY}px, 0)`;
        }
    }
    
    checkPerformanceMode() {
        // More aggressive performance mode detection for GPU optimization
        const isLowEnd = navigator.hardwareConcurrency <= 6 || 
                        window.innerWidth < 1024 || 
                        /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
                        navigator.deviceMemory && navigator.deviceMemory < 4;
        
        this.performanceMode = isLowEnd;
        
        if (this.performanceMode) {
            this.targetFPS = 20; // Further reduce FPS for low-end devices
            this.frameInterval = 1000 / this.targetFPS;
            this.mouseThrottle = 50; // Reduce to ~20fps on low-end devices
            if (this.gradientsContainer) {
                this.gradientsContainer.style.filter = 'blur(15px)'; // Remove goo filter to save GPU
            }
        }
    }
    
    optimizeGPUMemory() {
        if (this.gpuMemoryOptimized) return;
        
        // Force garbage collection if available
        if (window.gc && typeof window.gc === 'function') {
            window.gc();
        }
        
        // Temporarily reduce animation complexity
        if (this.gradientsContainer) {
            const gradients = this.gradientsContainer.querySelectorAll('.g1, .g2, .g3, .g4, .g5');
            gradients.forEach((gradient, index) => {
                if (index > 2 && this.performanceMode) {
                    gradient.style.opacity = '0.3'; // Reduce opacity of extra gradients
                }
            });
        }
        
        this.gpuMemoryOptimized = true;
        
        // Reset optimization flag after 5 seconds
        setTimeout(() => {
            this.gpuMemoryOptimized = false;
            if (this.gradientsContainer && !this.performanceMode) {
                const gradients = this.gradientsContainer.querySelectorAll('.g1, .g2, .g3, .g4, .g5');
                gradients.forEach(gradient => {
                    gradient.style.opacity = '';
                });
            }
        }, 5000);
    }
    
    updateTheme() {
        const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        
        if (this.gradientBg) {
            this.gradientBg.style.opacity = isDark ? '1' : '1';
        }
    }
    
    updateMotionPreference() {
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        
        if (prefersReducedMotion) {
            // Disable animations and reduce effects
            if (this.animationId) {
                cancelAnimationFrame(this.animationId);
                this.animationId = null;
            }
            if (this.gradientsContainer) {
                this.gradientsContainer.style.filter = 'blur(10px)';
            }
        } else {
            // Re-enable animations
            if (!this.animationId && this.isVisible) {
                this.animate();
            }
            if (this.gradientsContainer) {
                const blurAmount = this.performanceMode ? '20px' : '40px';
                this.gradientsContainer.style.filter = `url(#goo) blur(${blurAmount})`;
            }
        }
    }
    
    destroy() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        
        if (this.gradientBg) {
            this.gradientBg.remove();
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const gradientBackdrop = new HomeGradientBackdrop();
    
    // Store reference for potential cleanup
    window.homeGradientBackdrop = gradientBackdrop;
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = HomeGradientBackdrop;
}