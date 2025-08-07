class AudioSystem {
    constructor() {
        this.sounds = new Map();
        this.music = null;
        this.ambientSounds = [];
        this.isMuted = false;
        this.masterVolume = 0.7;
        this.musicVolume = 0.4;
        this.sfxVolume = 0.8;
        
        this.windSounds = [];
        this.natureSounds = [];
        
        this.init();
    }

    init() {
        // Create procedural audio since we can't use external files
        this.createProceduralSounds();
        this.startAmbientLoop();
    }

    createProceduralSounds() {
        // Create wind sound using Web Audio API
        this.createWindSound();
        this.createNatureSounds();
        this.createUISound();
    }

    createWindSound() {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // Create wind sound using noise and filters
            const createWindLoop = () => {
                const bufferSize = audioContext.sampleRate * 2; // 2 seconds
                const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
                const channelData = buffer.getChannelData(0);
                
                // Generate pink noise for wind base
                for (let i = 0; i < bufferSize; i++) {
                    channelData[i] = (Math.random() * 2 - 1) * 0.3;
                }
                
                // Apply envelope for natural wind gusts
                for (let i = 0; i < bufferSize; i++) {
                    const envelope = Math.sin((i / bufferSize) * Math.PI) * 0.8 + 0.2;
                    channelData[i] *= envelope;
                }
                
                const source = audioContext.createBufferSource();
                const gainNode = audioContext.createGain();
                const filter = audioContext.createBiquadFilter();
                
                source.buffer = buffer;
                source.loop = true;
                
                // Low-pass filter for muffled wind effect
                filter.type = 'lowpass';
                filter.frequency.setValueAtTime(800, audioContext.currentTime);
                filter.Q.setValueAtTime(1, audioContext.currentTime);
                
                gainNode.gain.setValueAtTime(0.2 * this.masterVolume, audioContext.currentTime);
                
                source.connect(filter);
                filter.connect(gainNode);
                gainNode.connect(audioContext.destination);
                
                source.start();
                
                return { source, gainNode, filter };
            };
            
            this.windAudio = createWindLoop();
            
        } catch (error) {
            console.warn('Web Audio API not supported, using fallback audio system');
            this.createFallbackAudio();
        }
    }

    createNatureSounds() {
        // Placeholder for nature sounds (birds, rustling leaves, etc.)
        // In a real implementation, these would be loaded audio files or more complex procedural generation
        this.natureSounds = [
            { type: 'bird_chirp', frequency: 0.1, volume: 0.3 },
            { type: 'leaf_rustle', frequency: 0.05, volume: 0.2 },
            { type: 'water_flow', frequency: 0.02, volume: 0.4 }
        ];
    }

    createUISound() {
        // Simple UI feedback sounds
        this.sounds.set('ui_click', this.createTone(800, 0.1, 0.1));
        this.sounds.set('ui_hover', this.createTone(600, 0.05, 0.05));
        this.sounds.set('quest_complete', this.createTone(523, 0.3, 0.2)); // C note
        this.sounds.set('level_up', this.createChord([523, 659, 783], 0.5, 0.3)); // C major chord
    }

    createTone(frequency, duration, volume) {
        return () => {
            try {
                const audioContext = new (window.AudioContext || window.webkitAudioContext)();
                const oscillator = audioContext.createOscillator();
                const gainNode = audioContext.createGain();
                
                oscillator.type = 'sine';
                oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
                
                gainNode.gain.setValueAtTime(0, audioContext.currentTime);
                gainNode.gain.linearRampToValueAtTime(volume * this.sfxVolume * this.masterVolume, audioContext.currentTime + 0.01);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
                
                oscillator.connect(gainNode);
                gainNode.connect(audioContext.destination);
                
                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + duration);
            } catch (error) {
                console.warn('Could not play tone:', error);
            }
        };
    }

    createChord(frequencies, duration, volume) {
        return () => {
            try {
                const audioContext = new (window.AudioContext || window.webkitAudioContext)();
                
                frequencies.forEach((freq, index) => {
                    setTimeout(() => {
                        const oscillator = audioContext.createOscillator();
                        const gainNode = audioContext.createGain();
                        
                        oscillator.type = 'sine';
                        oscillator.frequency.setValueAtTime(freq, audioContext.currentTime);
                        
                        gainNode.gain.setValueAtTime(0, audioContext.currentTime);
                        gainNode.gain.linearRampToValueAtTime(volume * this.sfxVolume * this.masterVolume, audioContext.currentTime + 0.01);
                        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
                        
                        oscillator.connect(gainNode);
                        gainNode.connect(audioContext.destination);
                        
                        oscillator.start(audioContext.currentTime);
                        oscillator.stop(audioContext.currentTime + duration);
                    }, index * 100);
                });
            } catch (error) {
                console.warn('Could not play chord:', error);
            }
        };
    }

    createFallbackAudio() {
        // Fallback for browsers without Web Audio API support
        this.windAudio = {
            source: null,
            gainNode: { gain: { value: 0.2 } },
            filter: null
        };
    }

    startAmbientLoop() {
        // Start ambient sound effects
        this.ambientInterval = setInterval(() => {
            if (!this.isMuted && Math.random() < 0.3) {
                this.playRandomNatureSound();
            }
        }, 3000 + Math.random() * 5000); // Random interval between 3-8 seconds
    }

    playRandomNatureSound() {
        const soundTypes = ['bird_chirp', 'leaf_rustle', 'bamboo_creak'];
        const soundType = soundTypes[Math.floor(Math.random() * soundTypes.length)];
        
        // Generate procedural nature sound
        this.playNatureSound(soundType);
    }

    playNatureSound(type) {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            let oscillator, gainNode, filter;
            
            switch (type) {
                case 'bird_chirp':
                    oscillator = audioContext.createOscillator();
                    gainNode = audioContext.createGain();
                    
                    oscillator.type = 'sine';
                    oscillator.frequency.setValueAtTime(800 + Math.random() * 1200, audioContext.currentTime);
                    oscillator.frequency.exponentialRampToValueAtTime(400 + Math.random() * 800, audioContext.currentTime + 0.1);
                    
                    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
                    gainNode.gain.linearRampToValueAtTime(0.1 * this.sfxVolume * this.masterVolume, audioContext.currentTime + 0.01);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);
                    
                    oscillator.connect(gainNode);
                    gainNode.connect(audioContext.destination);
                    
                    oscillator.start(audioContext.currentTime);
                    oscillator.stop(audioContext.currentTime + 0.15);
                    break;
                    
                case 'leaf_rustle':
                    // Create noise for rustling
                    const bufferSize = audioContext.sampleRate * 0.5;
                    const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
                    const channelData = buffer.getChannelData(0);
                    
                    for (let i = 0; i < bufferSize; i++) {
                        channelData[i] = (Math.random() * 2 - 1) * 0.1;
                    }
                    
                    const source = audioContext.createBufferSource();
                    gainNode = audioContext.createGain();
                    filter = audioContext.createBiquadFilter();
                    
                    source.buffer = buffer;
                    filter.type = 'highpass';
                    filter.frequency.setValueAtTime(1000, audioContext.currentTime);
                    
                    gainNode.gain.setValueAtTime(0.05 * this.sfxVolume * this.masterVolume, audioContext.currentTime);
                    
                    source.connect(filter);
                    filter.connect(gainNode);
                    gainNode.connect(audioContext.destination);
                    
                    source.start();
                    break;
                    
                case 'bamboo_creak':
                    oscillator = audioContext.createOscillator();
                    gainNode = audioContext.createGain();
                    
                    oscillator.type = 'sawtooth';
                    oscillator.frequency.setValueAtTime(150 + Math.random() * 100, audioContext.currentTime);
                    
                    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
                    gainNode.gain.linearRampToValueAtTime(0.08 * this.sfxVolume * this.masterVolume, audioContext.currentTime + 0.1);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.8);
                    
                    oscillator.connect(gainNode);
                    gainNode.connect(audioContext.destination);
                    
                    oscillator.start(audioContext.currentTime);
                    oscillator.stop(audioContext.currentTime + 0.8);
                    break;
            }
        } catch (error) {
            console.warn('Could not play nature sound:', error);
        }
    }

    playSound(soundName) {
        if (this.isMuted) return;
        
        const sound = this.sounds.get(soundName);
        if (sound) {
            sound();
        }
    }

    playUIClick() {
        this.playSound('ui_click');
    }

    playQuestComplete() {
        this.playSound('quest_complete');
    }

    playLevelUp() {
        this.playSound('level_up');
    }

    updateWindIntensity(intensity) {
        // Update wind sound based on current wind strength
        if (this.windAudio && this.windAudio.gainNode) {
            const targetVolume = (0.1 + intensity * 0.3) * this.masterVolume;
            
            try {
                this.windAudio.gainNode.gain.setTargetAtTime(targetVolume, 0, 0.5);
            } catch (error) {
                // Fallback for browsers without smooth volume changes
                this.windAudio.gainNode.gain.value = targetVolume;
            }
        }
    }

    updateEnvironmentalAudio(biome, timeOfDay) {
        // Adjust ambient sounds based on environment
        const volumeMultiplier = this.getEnvironmentVolumeMultiplier(biome);
        
        if (this.windAudio && this.windAudio.gainNode) {
            const baseVolume = 0.2 * this.masterVolume * volumeMultiplier;
            this.windAudio.gainNode.gain.value = baseVolume;
        }
    }

    getEnvironmentVolumeMultiplier(biome) {
        switch (biome) {
            case 'forest': return 1.2;
            case 'mountain': return 1.5;
            case 'valley': return 0.8;
            case 'plains': return 1.0;
            default: return 1.0;
        }
    }

    toggleMute() {
        this.isMuted = !this.isMuted;
        
        if (this.windAudio) {
            if (this.isMuted) {
                this.windAudio.gainNode.gain.setValueAtTime(0, 0);
            } else {
                this.windAudio.gainNode.gain.setValueAtTime(0.2 * this.masterVolume, 0);
            }
        }
        
        console.log(`Audio ${this.isMuted ? 'muted' : 'unmuted'}`);
    }

    pause() {
        this.wasMuted = this.isMuted;
        if (!this.isMuted) {
            this.toggleMute();
        }
    }

    resume() {
        if (this.wasMuted !== undefined && !this.wasMuted && this.isMuted) {
            this.toggleMute();
        }
    }

    setMasterVolume(volume) {
        this.masterVolume = Math.max(0, Math.min(1, volume));
        
        // Update all active sounds
        if (this.windAudio && this.windAudio.gainNode) {
            this.windAudio.gainNode.gain.value = 0.2 * this.masterVolume;
        }
    }

    update(playerPosition, deltaTime) {
        // Update 3D audio positioning and environmental effects
        this.updateEnvironmentalEffects(playerPosition, deltaTime);
        this.updateWindEffects(deltaTime);
    }

    updateEnvironmentalEffects(playerPosition, deltaTime) {
        // Simple environmental audio effects based on player position
        // In a real implementation, this would consider nearby objects, terrain, etc.
        
        const height = playerPosition.y;
        const windMultiplier = Math.max(0.5, Math.min(1.5, 1 + (height - 10) * 0.02));
        
        this.updateWindIntensity(windMultiplier);
    }

    updateWindEffects(deltaTime) {
        // Add subtle variations to wind sound over time
        if (this.windAudio && this.windAudio.filter) {
            try {
                const time = Date.now() * 0.001;
                const frequency = 600 + Math.sin(time * 0.5) * 200;
                this.windAudio.filter.frequency.setValueAtTime(frequency, 0);
            } catch (error) {
                // Ignore filter update errors
            }
        }
    }

    destroy() {
        // Clean up audio resources
        if (this.ambientInterval) {
            clearInterval(this.ambientInterval);
        }
        
        if (this.windAudio && this.windAudio.source) {
            try {
                this.windAudio.source.stop();
            } catch (error) {
                // Ignore stop errors
            }
        }
    }
}