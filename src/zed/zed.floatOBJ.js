
// zed.floatOBJ.js - Handling floated objects in Zed framework

const zed = zed || {};

zed.floatOBJ = (function() {
    const FLOAT_TYPES = {
        VIDEO: 'video',
        SOUND: 'sound',
        IMAGE: 'image'
    };

    const DEFAULT_OPTIONS = {
        position: { x: 0, y: 0 },
        size: { width: 100, height: 100 },
        opacity: 1,
        zIndex: 1000,
        rotation: 0,
        scale: 1,
        visible: true
    };

    class FloatObject {
        constructor(type, source, options = {}) {
            this.type = type;
            this.source = source;
            this.options = { ...DEFAULT_OPTIONS, ...options };
            this.element = null;
            this.isPlaying = false;
            this.volume = 1;
            this.playbackRate = 1;
            this.loop = false;
            this.muted = false;
            this.currentTime = 0;
            this.duration = 0;
            this.loadPromise = null;
            this.eventListeners = {};

            this.init();
        }

        init() {
            switch (this.type) {
                case FLOAT_TYPES.VIDEO:
                    this.element = document.createElement('video');
                    break;
                case FLOAT_TYPES.SOUND:
                    this.element = document.createElement('audio');
                    break;
                case FLOAT_TYPES.IMAGE:
                    this.element = document.createElement('img');
                    break;
                default:
                    throw new Error(`Invalid float object type: ${this.type}`);
            }

            this.element.src = this.source;
            this.applyStyles();
            this.setupEventListeners();

            if (this.type !== FLOAT_TYPES.IMAGE) {
                this.loadPromise = new Promise((resolve, reject) => {
                    this.element.addEventListener('loadedmetadata', () => {
                        this.duration = this.element.duration;
                        resolve();
                    });
                    this.element.addEventListener('error', (error) => {
                        reject(error);
                    });
                });
            } else {
                this.loadPromise = new Promise((resolve, reject) => {
                    this.element.addEventListener('load', resolve);
                    this.element.addEventListener('error', reject);
                });
            }

            document.body.appendChild(this.element);
        }

        applyStyles() {
            Object.assign(this.element.style, {
                position: 'absolute',
                left: `${this.options.position.x}px`,
                top: `${this.options.position.y}px`,
                width: `${this.options.size.width}px`,
                height: `${this.options.size.height}px`,
                opacity: this.options.opacity,
                zIndex: this.options.zIndex,
                transform: `rotate(${this.options.rotation}deg) scale(${this.options.scale})`,
                visibility: this.options.visible ? 'visible' : 'hidden'
            });
        }

        setupEventListeners() {
            if (this.type !== FLOAT_TYPES.IMAGE) {
                this.element.addEventListener('play', () => this.onPlay());
                this.element.addEventListener('pause', () => this.onPause());
                this.element.addEventListener('ended', () => this.onEnded());
                this.element.addEventListener('timeupdate', () => this.onTimeUpdate());
                this.element.addEventListener('volumechange', () => this.onVolumeChange());
                this.element.addEventListener('ratechange', () => this.onRateChange());
            }
        }

        onPlay() {
            this.isPlaying = true;
            this.triggerEvent('play');
        }

        onPause() {
            this.isPlaying = false;
            this.triggerEvent('pause');
        }

        onEnded() {
            this.isPlaying = false;
            this.triggerEvent('ended');
        }

        onTimeUpdate() {
            this.currentTime = this.element.currentTime;
            this.triggerEvent('timeupdate');
        }

        onVolumeChange() {
            this.volume = this.element.volume;
            this.muted = this.element.muted;
            this.triggerEvent('volumechange');
        }

        onRateChange() {
            this.playbackRate = this.element.playbackRate;
            this.triggerEvent('ratechange');
        }

        triggerEvent(eventName) {
            if (this.eventListeners[eventName]) {
                this.eventListeners[eventName].forEach(callback => callback());
            }
        }

        addEventListener(eventName, callback) {
            if (!this.eventListeners[eventName]) {
                this.eventListeners[eventName] = [];
            }
            this.eventListeners[eventName].push(callback);
        }

        removeEventListener(eventName, callback) {
            if (this.eventListeners[eventName]) {
                this.eventListeners[eventName] = this.eventListeners[eventName].filter(cb => cb !== callback);
            }
        }

        play() {
            if (this.type !== FLOAT_TYPES.IMAGE) {
                return this.element.play();
            }
        }

        pause() {
            if (this.type !== FLOAT_TYPES.IMAGE) {
                this.element.pause();
            }
        }

        stop() {
            if (this.type !== FLOAT_TYPES.IMAGE) {
                this.element.pause();
                this.element.currentTime = 0;
            }
        }

        seek(time) {
            if (this.type !== FLOAT_TYPES.IMAGE) {
                this.element.currentTime = time;
            }
        }

        setVolume(volume) {
            if (this.type !== FLOAT_TYPES.IMAGE) {
                this.element.volume = Math.max(0, Math.min(1, volume));
            }
        }

        mute() {
            if (this.type !== FLOAT_TYPES.IMAGE) {
                this.element.muted = true;
            }
        }

        unmute() {
            if (this.type !== FLOAT_TYPES.IMAGE) {
                this.element.muted = false;
            }
        }

        setPlaybackRate(rate) {
            if (this.type !== FLOAT_TYPES.IMAGE) {
                this.element.playbackRate = rate;
            }
        }

        setLoop(shouldLoop) {
            if (this.type !== FLOAT_TYPES.IMAGE) {
                this.element.loop = shouldLoop;
                this.loop = shouldLoop;
            }
        }

        setPosition(x, y) {
            this.options.position.x = x;
            this.options.position.y = y;
            this.applyStyles();
        }

        setSize(width, height) {
            this.options.size.width = width;
            this.options.size.height = height;
            this.applyStyles();
        }

        setOpacity(opacity) {
            this.options.opacity = opacity;
            this.applyStyles();
        }

        setZIndex(zIndex) {
            this.options.zIndex = zIndex;
            this.applyStyles();
        }

        setRotation(rotation) {
            this.options.rotation = rotation;
            this.applyStyles();
        }

        setScale(scale) {
            this.options.scale = scale;
            this.applyStyles();
        }

        setVisibility(visible) {
            this.options.visible = visible;
            this.applyStyles();
        }

        getPosition() {
            return { ...this.options.position };
        }

        getSize() {
            return { ...this.options.size };
        }

        getOpacity() {
            return this.options.opacity;
        }

        getZIndex() {
            return this.options.zIndex;
        }

        getRotation() {
            return this.options.rotation;
        }

        getScale() {
            return this.options.scale;
        }

        isVisible() {
            return this.options.visible;
        }

        getDuration() {
            return this.duration;
        }

        getCurrentTime() {
            return this.currentTime;
        }

        getVolume() {
            return this.volume;
        }

        isMuted() {
            return this.muted;
        }

        getPlaybackRate() {
            return this.playbackRate;
        }

        isLooping() {
            return this.loop;
        }

        isReady() {
            return this.loadPromise;
        }

        destroy() {
            if (this.element) {
                this.element.remove();
                this.element = null;
            }
            this.eventListeners = {};
        }
    }

    function createFloatObject(type, source, options) {
        return new FloatObject(type, source, options);
    }

    function createVideoFloat(source, options) {
        return createFloatObject(FLOAT_TYPES.VIDEO, source, options);
    }

    function createSoundFloat(source, options) {
        return createFloatObject(FLOAT_TYPES.SOUND, source, options);
    }

    function createImageFloat(source, options) {
        return createFloatObject(FLOAT_TYPES.IMAGE, source, options);
    }

    // Advanced features

    function createResponsiveFloat(type, source, options) {
        const floatObj = createFloatObject(type, source, options);
        
        const resizeHandler = () => {
            const windowWidth = window.innerWidth;
            const windowHeight = window.innerHeight;
            
            // Example of a responsive behavior
            if (windowWidth < 768) {
                floatObj.setScale(0.5);
            } else if (windowWidth < 1024) {
                floatObj.setScale(0.75);
            } else {
                floatObj.setScale(1);
            }
            
            // Center the float object
            const objSize = floatObj.getSize();
            floatObj.setPosition(
                (windowWidth - objSize.width) / 2,
                (windowHeight - objSize.height) / 2
            );
        };

        window.addEventListener('resize', resizeHandler);
        resizeHandler(); // Initial positioning

        return floatObj;
    }

    function createAnimatedFloat(type, source, options, animationOptions) {
        const floatObj = createFloatObject(type, source, options);
        
        const defaultAnimationOptions = {
            duration: 1000,
            easing: 'linear',
            repeat: 0,
            yoyo: false
        };

        const mergedAnimationOptions = { ...defaultAnimationOptions, ...animationOptions };

        let animationFrame;
        let startTime;
        let currentIteration = 0;

        function animate(timestamp) {
            if (!startTime) startTime = timestamp;
            const elapsed = timestamp - startTime;
            const progress = Math.min(elapsed / mergedAnimationOptions.duration, 1);
            
            const easedProgress = easing[mergedAnimationOptions.easing](progress);
            
            // Apply animation based on animationOptions
            if (animationOptions.scale) {
                const scale = lerp(1, animationOptions.scale, easedProgress);
                floatObj.setScale(scale);
            }
            
            if (animationOptions.rotation) {
                const rotation = lerp(0, animationOptions.rotation, easedProgress);
                floatObj.setRotation(rotation);
            }
            
            if (animationOptions.opacity) {
                const opacity = lerp(1, animationOptions.opacity, easedProgress);
                floatObj.setOpacity(opacity);
            }

            if (progress < 1) {
                animationFrame = requestAnimationFrame(animate);
            } else {
                if (mergedAnimationOptions.yoyo) {
                    // Reverse animation
                    [animationOptions.scale, animationOptions.rotation, animationOptions.opacity] = 
                    [1, 0, 1].map((val, index) => [val, [animationOptions.scale, animationOptions.rotation, animationOptions.opacity][index]]);
                }
                
                currentIteration++;
                
                if (mergedAnimationOptions.repeat === -1 || currentIteration < mergedAnimationOptions.repeat) {
                    startTime = null;
                    animationFrame = requestAnimationFrame(animate);
                }
            }
        }

        animationFrame = requestAnimationFrame(animate);

        // Add method to stop animation
        floatObj.stopAnimation = () => {
            if (animationFrame) {
                cancelAnimationFrame(animationFrame);
            }
        };

        return floatObj;
    }

    // Utility functions

    const easing = {
        linear: t => t,
        easeInQuad: t => t * t,
        easeOutQuad: t => t * (2 - t),
        easeInOutQuad: t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
        easeInCubic: t => t * t * t,
        easeOutCubic: t => (--t) * t * t + 1,
        easeInOutCubic: t => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,
        easeInQuart: t => t * t * t * t,
        easeOutQuart: t => 1 - (--t) * t * t * t,
        easeInOutQuart: t => t < 0.5 ? 8 * t * t * t * t : 1 - 8 * (--t) * t * t * t,
        easeInQuint: t => t * t * t * t * t,
        easeOutQuint: t => 1 + (--t) * t * t * t * t,
        easeInOutQuint: t => t < 0.5 ? 16 * t * t * t * t * t : 1 + 16 * (--t) * t * t * t * t
    };

    function lerp(start, end, t) {
        return start * (1 - t) + end * t;
    }

    // Export public API
    return {
        createVideoFloat,
        createSoundFloat,
        createImageFloat,
        createResponsiveFloat,
        createAnimatedFloat
    };
})();

// Usage examples:

// Create a video float
// const videoFloat = zed.floatOBJ.createVideoFloat('path/to/video.mp4', {
//     position: { x: 100, y: 100 },
//     size: { width: 640, height: 360 }
// });

// Create a sound float
// const soundFloat = zed.floatOBJ.createSoundFloat('path/to/audio.mp3', {
//     position: { x: 50, y: 50 },
//     size: { width: 200, height: 50 }
// });

// Create an image float
// const imageFloat = zed.floatOBJ.createImageFloat('path/to/image.jpg', {
//     position: { x: 200, y: 200 },
//     size: { width: 300, height: 200 }
// });

// Create a responsive float
// const responsiveFloat = zed.floatOBJ.createResponsive
