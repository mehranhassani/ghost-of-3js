class Game {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.clock = new THREE.Clock();
        
        // Game systems
        this.worldGenerator = null;
        this.player = null;
        this.audioSystem = null;
        this.uiSystem = null;
        this.combatSystem = null;
        
        // Game state
        this.isLoaded = false;
        this.isPaused = false;
        this.gameTime = 0;
        this.loadingProgress = 0;
        this.debugMode = true; // Enable debug mode
        
        // Wind system for Ghost of Tsushima vibes
        this.windDirection = new THREE.Vector3(1, 0, 0.5);
        this.windStrength = 0.5;
        this.windParticles = [];
        
        // Toon shading materials
        this.toonMaterials = new Map();
        
        this.init();
    }

    async init() {
        // Add timeout to prevent infinite loading
        const timeout = setTimeout(() => {
            console.error('Game initialization timed out');
            this.showErrorMessage('Game initialization timed out. Please refresh the page.');
        }, 30000); // 30 second timeout
        
        try {
            if (this.debugMode) console.log('Starting game initialization...');
            this.updateLoadingProgress(10);
            
            // Check if Three.js is available
            if (typeof THREE === 'undefined') {
                throw new Error('Three.js library not loaded');
            }
            if (this.debugMode) console.log('✓ Three.js library loaded');
            
            // Add fallback for CapsuleGeometry if not available
            if (!THREE.CapsuleGeometry) {
                console.warn('CapsuleGeometry not available, using fallback');
                THREE.CapsuleGeometry = function(radius, length, capSegments, radialSegments) {
                    // Fallback to CylinderGeometry with spheres on top
                    const cylinder = new THREE.CylinderGeometry(radius, radius, length, radialSegments, 1, true);
                    const sphere = new THREE.SphereGeometry(radius, capSegments, radialSegments);
                    
                    // Create group to combine geometries
                    const group = new THREE.Group();
                    
                    // Add cylinder
                    const cylinderMesh = new THREE.Mesh(cylinder);
                    group.add(cylinderMesh);
                    
                    // Add top sphere
                    const topSphere = new THREE.Mesh(sphere);
                    topSphere.position.y = length / 2;
                    group.add(topSphere);
                    
                    // Add bottom sphere
                    const bottomSphere = new THREE.Mesh(sphere);
                    bottomSphere.position.y = -length / 2;
                    group.add(bottomSphere);
                    
                    return group;
                };
                console.log('✓ CapsuleGeometry fallback created');
            } else {
                console.log('✓ CapsuleGeometry is available');
            }
            
            // Ensure the fallback is available globally
            window.THREE = THREE;
            
            // Add fallback for PointerLockControls if not available
            if (!THREE.PointerLockControls) {
                console.warn('PointerLockControls not available, using fallback');
                THREE.PointerLockControls = function(camera, domElement) {
                    this.camera = camera;
                    this.domElement = domElement;
                    this.isLocked = false;
                    
                    // Simple fallback implementation
                    this.lock = function() {
                        console.log('Pointer lock requested (fallback)');
                        this.isLocked = true;
                    };
                    
                    this.unlock = function() {
                        console.log('Pointer unlock requested (fallback)');
                        this.isLocked = false;
                    };
                    
                    this.getObject = function() {
                        return this.camera;
                    };
                    
                    this.getDirection = function() {
                        return new THREE.Vector3(0, 0, -1);
                    };
                    
                    this.disconnect = function() {};
                    this.dispose = function() {};
                };
                console.log('✓ PointerLockControls fallback created');
            } else {
                console.log('✓ PointerLockControls is available');
            }
            
            this.setupRenderer();
            this.updateLoadingProgress(20);
            if (this.debugMode) console.log('✓ Renderer setup complete');
            
            this.setupScene();
            this.updateLoadingProgress(30);
            if (this.debugMode) console.log('✓ Scene setup complete');
            
            this.setupCamera();
            this.updateLoadingProgress(40);
            if (this.debugMode) console.log('✓ Camera setup complete');
            
            this.setupLighting();
            this.updateLoadingProgress(50);
            if (this.debugMode) console.log('✓ Lighting setup complete');
            
            this.createToonMaterials();
            this.updateLoadingProgress(60);
            if (this.debugMode) console.log('✓ Materials created');
            
            await this.loadSystems();
            this.updateLoadingProgress(80);
            if (this.debugMode) console.log('✓ Systems loaded');
            
            await this.generateInitialWorld();
            this.updateLoadingProgress(90);
            if (this.debugMode) console.log('✓ Initial world generated');
            
            this.setupEventListeners();
            this.updateLoadingProgress(95);
            if (this.debugMode) console.log('✓ Event listeners setup complete');
            
            this.hideLoadingScreen();
            this.updateLoadingProgress(100);
            if (this.debugMode) console.log('✓ Loading screen hidden');
            
            this.startGameLoop();
            if (this.debugMode) console.log('✓ Game loop started');
            
            clearTimeout(timeout);
            console.log('🎌 Game initialization completed successfully! 🎌');
        } catch (error) {
            clearTimeout(timeout);
            console.error('❌ Failed to initialize game:', error);
            this.showErrorMessage(error.message);
        }
    }

    showErrorMessage(message) {
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            loadingScreen.innerHTML = `
                <div class="loading-content">
                    <h1>Ghost of Tsushima 3D</h1>
                    <div style="color: #ff4444; margin: 20px 0;">
                        <h3>Loading Error</h3>
                        <p>${message}</p>
                        <p>Please refresh the page to try again.</p>
                    </div>
                    <button onclick="location.reload()" style="
                        background: #d4af37; 
                        color: #000; 
                        border: none; 
                        padding: 10px 20px; 
                        border-radius: 5px; 
                        cursor: pointer;
                        font-family: inherit;
                    ">Reload Game</button>
                </div>
            `;
        }
    }

    setupRenderer() {
        try {
            console.log('Setting up renderer...');
            this.renderer = new THREE.WebGLRenderer({
                antialias: false, // Disable for pixel art style
                powerPreference: "high-performance"
            });
            
            this.renderer.setSize(window.innerWidth, window.innerHeight);
            
            // Pixelated effect - reduce resolution
            const pixelRatio = Math.min(window.devicePixelRatio, 1.5);
            this.renderer.setPixelRatio(pixelRatio * 0.7); // Reduce for more pixelated look
            
            this.renderer.shadowMap.enabled = true;
            this.renderer.shadowMap.type = THREE.PCFShadowMap;
            this.renderer.outputEncoding = THREE.sRGBEncoding;
            this.renderer.toneMapping = THREE.ReinhardToneMapping;
            this.renderer.toneMappingExposure = 1.3;
            
            // Enable alpha to background for better blending
            this.renderer.setClearColor(0x87CEEB, 1.0);
            
            // Ensure the canvas is visible
            this.renderer.domElement.style.position = 'fixed';
            this.renderer.domElement.style.top = '0';
            this.renderer.domElement.style.left = '0';
            this.renderer.domElement.style.zIndex = '1';
            this.renderer.domElement.style.width = '100%';
            this.renderer.domElement.style.height = '100%';
            
            document.body.appendChild(this.renderer.domElement);
            console.log('Renderer setup complete');
        } catch (error) {
            console.error('Error setting up renderer:', error);
            throw error;
        }
    }

    createToonMaterials() {
        // Create custom toon shading materials
        const toonVertexShader = `
            varying vec3 vNormal;
            varying vec3 vPosition;
            varying vec2 vUv;
            
            void main() {
                vNormal = normalize(normalMatrix * normal);
                vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
                vUv = uv;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `;
        
        const toonFragmentShader = `
            uniform vec3 color;
            uniform vec3 lightDirection;
            uniform float toonLevels;
            
            varying vec3 vNormal;
            varying vec3 vPosition;
            varying vec2 vUv;
            
            void main() {
                vec3 light = normalize(lightDirection);
                float intensity = dot(vNormal, light);
                
                // Quantize the intensity for toon effect
                intensity = floor(intensity * toonLevels) / toonLevels;
                intensity = clamp(intensity, 0.2, 1.0);
                
                vec3 finalColor = color * intensity;
                
                // Add rim lighting
                vec3 viewDir = normalize(-vPosition);
                float rimFactor = 1.0 - dot(viewDir, vNormal);
                rimFactor = pow(rimFactor, 3.0);
                finalColor += vec3(0.3, 0.3, 0.4) * rimFactor * 0.5;
                
                gl_FragColor = vec4(finalColor, 1.0);
            }
        `;
        
        // Create different colored toon materials
        const colors = [
            { name: 'grass', color: new THREE.Color(0x4a7c59) },
            { name: 'dirt', color: new THREE.Color(0x8B4513) },
            { name: 'stone', color: new THREE.Color(0x696969) },
            { name: 'tree', color: new THREE.Color(0x228B22) },
            { name: 'player', color: new THREE.Color(0x4a4a4a) },
            { name: 'enemy', color: new THREE.Color(0x8B0000) }
        ];
        
        colors.forEach(colorData => {
            const material = new THREE.ShaderMaterial({
                uniforms: {
                    color: { value: colorData.color },
                    lightDirection: { value: new THREE.Vector3(1, 1, 1).normalize() },
                    toonLevels: { value: 4.0 }
                },
                vertexShader: toonVertexShader,
                fragmentShader: toonFragmentShader
            });
            
            this.toonMaterials.set(colorData.name, material);
        });
    }

    setupScene() {
        try {
            console.log('Setting up scene...');
            this.scene = new THREE.Scene();
            
            // Enhanced atmospheric fog for depth
            this.scene.fog = new THREE.FogExp2(0x87CEEB, 0.0012);
            
            // Add a simple ground plane for testing
            const groundGeometry = new THREE.PlaneGeometry(100, 100);
            const groundMaterial = new THREE.MeshLambertMaterial({ 
                color: 0x4a7c59,
                side: THREE.DoubleSide
            });
            const ground = new THREE.Mesh(groundGeometry, groundMaterial);
            ground.rotation.x = -Math.PI / 2;
            ground.position.y = -10;
            this.scene.add(ground);
            console.log('Added ground plane');
            
            // Add a simple cube for testing
            const cubeGeometry = new THREE.BoxGeometry(5, 5, 5);
            const cubeMaterial = new THREE.MeshLambertMaterial({ color: 0xff0000 });
            const cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
            cube.position.set(0, 0, -20);
            this.scene.add(cube);
            console.log('Added test cube');
            
            // Enhanced sky with time-of-day effects
            const skyGeometry = new THREE.SphereGeometry(1000, 32, 32);
            const skyMaterial = new THREE.ShaderMaterial({
                uniforms: {
                    time: { value: 0 },
                    topColor: { value: new THREE.Color(0x87CEEB) },
                    bottomColor: { value: new THREE.Color(0xE6F3FF) },
                    offset: { value: 33 },
                    exponent: { value: 0.6 },
                    sunPosition: { value: new THREE.Vector3(100, 100, 50).normalize() }
                },
                vertexShader: `
                    varying vec3 vWorldPosition;
                    varying vec3 vSunDirection;
                    uniform vec3 sunPosition;
                    
                    void main() {
                        vec4 worldPosition = modelMatrix * vec4(position, 1.0);
                        vWorldPosition = worldPosition.xyz;
                        vSunDirection = sunPosition;
                        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                    }
                `,
                fragmentShader: `
                    uniform vec3 topColor;
                    uniform vec3 bottomColor;
                    uniform float offset;
                    uniform float exponent;
                    uniform float time;
                    
                    varying vec3 vWorldPosition;
                    varying vec3 vSunDirection;
                    
                    void main() {
                        float h = normalize(vWorldPosition + offset).y;
                        float mixValue = clamp(pow(max(h, 0.0), exponent), 0.0, 1.0);
                        
                        // Add sun effect
                        vec3 viewDirection = normalize(vWorldPosition);
                        float sunIntensity = max(dot(viewDirection, vSunDirection), 0.0);
                        sunIntensity = pow(sunIntensity, 8.0);
                        
                        // Time-based color variation
                        float timeVar = sin(time * 0.0005) * 0.1 + 0.9;
                        vec3 sunColor = vec3(1.0, 0.8, 0.6) * sunIntensity * 0.8;
                        vec3 finalColor = mix(bottomColor, topColor, mixValue) * timeVar + sunColor;
                        
                        gl_FragColor = vec4(finalColor, 1.0);
                    }
                `,
                side: THREE.BackSide
            });
            
            const sky = new THREE.Mesh(skyGeometry, skyMaterial);
            this.scene.add(sky);
            this.skyMaterial = skyMaterial;
            console.log('Scene setup complete');
        } catch (error) {
            console.error('Error setting up scene:', error);
            throw error;
        }
    }

    setupCamera() {
        try {
            console.log('Setting up camera...');
            this.camera = new THREE.PerspectiveCamera(
                75,
                window.innerWidth / window.innerHeight,
                0.1,
                2000
            );
            // Position camera behind and above the player
            this.camera.position.set(0, 5, 10);
            this.camera.lookAt(0, 0, 0);
            console.log('Camera setup complete');
        } catch (error) {
            console.error('Error setting up camera:', error);
            throw error;
        }
    }

    setupLighting() {
        // Enhanced lighting for toon shading
        const ambientLight = new THREE.AmbientLight(0x87CEEB, 0.6);
        this.scene.add(ambientLight);

        // Main sun light with enhanced shadows
        this.sunLight = new THREE.DirectionalLight(0xFFE4B5, 1.2);
        this.sunLight.position.set(100, 100, 50);
        this.sunLight.castShadow = true;
        this.sunLight.shadow.mapSize.width = 4096;
        this.sunLight.shadow.mapSize.height = 4096;
        this.sunLight.shadow.camera.near = 0.5;
        this.sunLight.shadow.camera.far = 1000;
        this.sunLight.shadow.camera.left = -300;
        this.sunLight.shadow.camera.right = 300;
        this.sunLight.shadow.camera.top = 300;
        this.sunLight.shadow.camera.bottom = -300;
        this.sunLight.shadow.bias = -0.0001;
        this.scene.add(this.sunLight);

        // Fill light for softer shadows
        this.fillLight = new THREE.DirectionalLight(0xB0E0E6, 0.4);
        this.fillLight.position.set(-50, 30, -50);
        this.scene.add(this.fillLight);

        // Rim light for character definition
        this.rimLight = new THREE.DirectionalLight(0xFFB6C1, 0.5);
        this.rimLight.position.set(-50, 50, -50);
        this.scene.add(this.rimLight);
    }

    async loadSystems() {
        try {
            console.log('Loading game systems...');
            
            // Ensure CapsuleGeometry fallback is available before loading systems
            if (!THREE.CapsuleGeometry) {
                console.warn('CapsuleGeometry still not available, creating fallback again');
                THREE.CapsuleGeometry = function(radius, length, capSegments, radialSegments) {
                    const cylinder = new THREE.CylinderGeometry(radius, radius, length, radialSegments, 1, true);
                    const sphere = new THREE.SphereGeometry(radius, capSegments, radialSegments);
                    
                    const group = new THREE.Group();
                    const cylinderMesh = new THREE.Mesh(cylinder);
                    group.add(cylinderMesh);
                    
                    const topSphere = new THREE.Mesh(sphere);
                    topSphere.position.y = length / 2;
                    group.add(topSphere);
                    
                    const bottomSphere = new THREE.Mesh(sphere);
                    bottomSphere.position.y = -length / 2;
                    group.add(bottomSphere);
                    
                    return group;
                };
            }
            
            // Initialize UI system
            this.uiSystem = new UISystem();
            console.log('UI system loaded');
            
            // Initialize audio system with error handling
            try {
                this.audioSystem = new AudioSystem();
                console.log('Audio system loaded');
            } catch (audioError) {
                console.warn('Audio system failed to load:', audioError);
                // Create a minimal audio system
                this.audioSystem = {
                    playUIClick: () => {},
                    toggleMute: () => {},
                    update: () => {},
                    pause: () => {},
                    resume: () => {}
                };
            }
            
            // Initialize world generator
            this.worldGenerator = new WorldGenerator(this.scene);
            console.log('World generator loaded');
            
            // Initialize player
            if (typeof Player === 'undefined') {
                throw new Error('Player class not loaded');
            }
            this.player = new Player(this.scene, this.camera);
            await this.player.init();
            console.log('Player system loaded');
            
            // Initialize combat system
            this.combatSystem = new CombatSystem(this.scene, this.player);
            console.log('Combat system loaded');
            
        } catch (error) {
            console.error('Error loading systems:', error);
            throw error;
        }
    }

    async generateInitialWorld() {
        try {
            console.log('Generating initial world...');
            
            // Generate initial terrain around player
            const playerPos = this.player.position;
            await this.worldGenerator.generateChunk(playerPos.x, playerPos.z);
            console.log('Initial terrain generated');
            
            // Generate some initial quests
            this.generateInitialQuests();
            console.log('Initial quests generated');
            
            // Add some wind particles for atmosphere
            this.spawnInitialWindParticles();
            console.log('Wind particles spawned');
            
        } catch (error) {
            console.error('Error generating initial world:', error);
            // Continue anyway - the game can still run without initial world generation
        }
    }

    spawnInitialWindParticles() {
        for (let i = 0; i < 20; i++) {
            setTimeout(() => {
                this.spawnWindParticle();
            }, i * 200);
        }
    }

    generateInitialQuests() {
        const quests = [
            {
                id: 'explore_world',
                title: 'Explorer of Tsushima',
                description: 'Explore the mystical lands and discover 5 different locations.',
                progress: 0,
                maxProgress: 5,
                reward: { xp: 100, gold: 50 }
            },
            {
                id: 'master_combat',
                title: 'Way of the Samurai',
                description: 'Defeat 10 enemies using sword combat.',
                progress: 0,
                maxProgress: 10,
                reward: { xp: 200, skill: 'sword_mastery' }
            },
            {
                id: 'wind_listener',
                title: 'Listen to the Wind',
                description: 'Follow the wind to discover hidden secrets.',
                progress: 0,
                maxProgress: 3,
                reward: { xp: 150, item: 'wind_charm' }
            },
            {
                id: 'shrine_visitor',
                title: 'Sacred Places',
                description: 'Visit and pray at 3 different shrines.',
                progress: 0,
                maxProgress: 3,
                reward: { xp: 300, item: 'blessed_sword' }
            }
        ];
        
        this.uiSystem.updateQuests(quests);
    }

    setupEventListeners() {
        // Window resize
        window.addEventListener('resize', this.onWindowResize.bind(this));
        
        // Keyboard controls
        document.addEventListener('keydown', this.onKeyDown.bind(this));
        document.addEventListener('keyup', this.onKeyUp.bind(this));
        
        // Mouse controls
        document.addEventListener('click', this.onMouseClick.bind(this));
        
        // Additional controls
        document.addEventListener('keydown', (event) => {
            if (event.code === 'KeyF') {
                this.toggleFullscreen();
            }
        });
    }

    toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
        } else {
            document.exitFullscreen();
        }
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    onKeyDown(event) {
        switch(event.code) {
            case 'KeyI':
                this.uiSystem.toggleInventory();
                this.audioSystem.playUIClick();
                break;
            case 'KeyQ':
                this.uiSystem.toggleQuestLog();
                this.audioSystem.playUIClick();
                break;
            case 'KeyP':
                this.togglePause();
                break;
            case 'KeyM':
                this.audioSystem.toggleMute();
                break;
            case 'KeyE':
                this.handleInteraction();
                break;
            case 'KeyT':
                this.showTutorial();
                break;
        }
        
        // Forward to player
        if (this.player) {
            this.player.onKeyDown(event);
        }
    }

    onKeyUp(event) {
        if (this.player) {
            this.player.onKeyUp(event);
        }
    }

    onMouseClick(event) {
        // Handle UI clicks
        if (this.uiSystem.handleClick(event)) {
            return;
        }
        
        // Handle player actions
        if (this.player) {
            this.player.onMouseClick(event);
        }
    }

    handleInteraction() {
        // Check for nearby interactive objects
        const nearbyPOIs = this.worldGenerator.pointsOfInterest.filter(poi => {
            const distance = Math.sqrt(
                (poi.position.x - this.player.position.x) ** 2 + 
                (poi.position.z - this.player.position.z) ** 2
            );
            return distance < 8 && poi.interactable;
        });
        
        if (nearbyPOIs.length > 0) {
            const poi = nearbyPOIs[0];
            this.interactWithPOI(poi);
        }
    }

    interactWithPOI(poi) {
        switch (poi.type) {
            case 'shrine':
                this.uiSystem.showNotification('You pray at the shrine and feel blessed...', 'success');
                this.player.heal(20);
                // Update quest progress
                this.uiSystem.updateQuestProgress('shrine_visitor', 
                    this.getQuestProgress('shrine_visitor') + 1);
                break;
            case 'hot_spring':
                this.uiSystem.showNotification('The warm waters restore your health completely!', 'success');
                this.player.health = this.player.maxHealth;
                this.player.stamina = this.player.maxStamina;
                break;
        }
    }

    getQuestProgress(questId) {
        const quest = this.uiSystem.quests.find(q => q.id === questId);
        return quest ? quest.progress : 0;
    }

    showTutorial() {
        const tutorialText = `
            🎌 Welcome to Ghost of Tsushima 3D! 🎌
            
            MOVEMENT:
            • WASD - Move around
            • Mouse - Look around
            • Space - Jump
            • Shift - Sprint
            
            COMBAT:
            • Left Click - Attack with katana
            • Sneak up on enemies for stealth takedowns
            
            INTERFACE:
            • I - Open/Close Inventory
            • Q - Open/Close Quest Log
            • E - Interact with objects
            • M - Toggle Audio
            • P - Pause Game
            • F - Toggle Fullscreen
            
            EXPLORE:
            • Follow the wind particles to find secrets
            • Visit shrines for blessings
            • Relax in hot springs to restore health
            • Complete quests to gain experience
            
            The world generates around you as you explore!
        `;
        
        this.uiSystem.showNotification(tutorialText, 'info');
    }

    togglePause() {
        this.isPaused = !this.isPaused;
        if (this.isPaused) {
            this.audioSystem.pause();
            this.uiSystem.showNotification('Game Paused - Press P to resume', 'info');
        } else {
            this.audioSystem.resume();
            this.uiSystem.showNotification('Game Resumed', 'info');
        }
    }

    updateLoadingProgress(percent) {
        const progressBar = document.querySelector('.loading-progress');
        const loadingText = document.querySelector('#loading-screen p');
        
        if (progressBar) {
            progressBar.style.width = `${percent}%`;
        }
        
        if (loadingText) {
            const messages = [
                'Initializing...',
                'Loading Three.js...',
                'Setting up scene...',
                'Creating materials...',
                'Loading game systems...',
                'Generating world...',
                'Finalizing...',
                'Ready!'
            ];
            
            const messageIndex = Math.floor((percent / 100) * (messages.length - 1));
            loadingText.textContent = messages[messageIndex] || messages[messages.length - 1];
        }
    }

    hideLoadingScreen() {
        const loadingScreen = document.getElementById('loading-screen');
        const gameUI = document.getElementById('game-ui');
        
        setTimeout(() => {
            if (loadingScreen) {
                loadingScreen.classList.add('hidden');
            }
            if (gameUI) {
                gameUI.classList.remove('hidden');
            }
            this.isLoaded = true;
            
            // Add a visible test element to confirm the game is running
            const testElement = document.createElement('div');
            testElement.style.position = 'fixed';
            testElement.style.top = '10px';
            testElement.style.right = '10px';
            testElement.style.background = 'rgba(0,0,0,0.8)';
            testElement.style.color = '#00ff00';
            testElement.style.padding = '10px';
            testElement.style.borderRadius = '5px';
            testElement.style.zIndex = '1000';
            testElement.style.fontFamily = 'monospace';
            testElement.textContent = 'Game Running ✓';
            document.body.appendChild(testElement);
            
            // Show welcome message
            setTimeout(() => {
                if (this.uiSystem && this.uiSystem.showNotification) {
                    this.uiSystem.showNotification('Welcome to Ghost of Tsushima 3D! Press T for tutorial.', 'info');
                }
            }, 1000);
        }, 1000);
    }

    updateWindSystem(deltaTime) {
        // Enhanced wind system with more dynamic behavior
        const windTime = this.gameTime * 0.001;
        this.windDirection.x = Math.sin(windTime * 0.5) * 0.8 + Math.cos(windTime * 0.3) * 0.4;
        this.windDirection.z = Math.cos(windTime * 0.7) * 0.6 + Math.sin(windTime * 0.4) * 0.5;
        this.windStrength = 0.3 + Math.sin(windTime * 0.8) * 0.4 + Math.cos(windTime * 1.2) * 0.2;
        
        this.windDirection.normalize();
        
        // Update wind particles with improved physics
        this.windParticles.forEach((particle, index) => {
            const windForce = this.windDirection.clone().multiplyScalar(this.windStrength * deltaTime * 15);
            const gravity = new THREE.Vector3(0, -2 * deltaTime, 0);
            
            particle.velocity.add(windForce).add(gravity);
            particle.position.add(particle.velocity.clone().multiplyScalar(deltaTime));
            
            // Add turbulence
            const turbulence = new THREE.Vector3(
                (Math.random() - 0.5) * 0.5,
                (Math.random() - 0.5) * 0.2,
                (Math.random() - 0.5) * 0.5
            );
            particle.position.add(turbulence.multiplyScalar(deltaTime));
            
            particle.life -= deltaTime;
            
            // Fade out particle
            if (particle.material && particle.material.opacity) {
                particle.material.opacity = Math.max(0, particle.life / particle.maxLife);
            }
            
            if (particle.life <= 0) {
                this.scene.remove(particle);
                this.windParticles.splice(index, 1);
            }
        });
        
        // Spawn new wind particles
        if (Math.random() < 0.4) {
            this.spawnWindParticle();
        }
    }

    spawnWindParticle() {
        const geometry = new THREE.SphereGeometry(0.08 + Math.random() * 0.04, 4, 4);
        const material = new THREE.MeshBasicMaterial({ 
            color: new THREE.Color().setHSL(0.1 + Math.random() * 0.1, 0.3, 0.9),
            transparent: true, 
            opacity: 0.7 + Math.random() * 0.3
        });
        const particle = new THREE.Mesh(geometry, material);
        
        // Spawn around player
        const playerPos = this.player.position;
        const spawnRadius = 50 + Math.random() * 50;
        const spawnAngle = Math.random() * Math.PI * 2;
        
        particle.position.set(
            playerPos.x + Math.cos(spawnAngle) * spawnRadius,
            playerPos.y + Math.random() * 30 + 5,
            playerPos.z + Math.sin(spawnAngle) * spawnRadius
        );
        
        particle.velocity = new THREE.Vector3(
            (Math.random() - 0.5) * 2,
            Math.random() * 2,
            (Math.random() - 0.5) * 2
        );
        
        particle.life = 4.0 + Math.random() * 6.0;
        particle.maxLife = particle.life;
        
        this.windParticles.push(particle);
        this.scene.add(particle);
    }

    update(deltaTime) {
        if (this.isPaused || !this.isLoaded) return;
        
        this.gameTime += deltaTime;
        
        // Update sky shader
        if (this.skyMaterial) {
            this.skyMaterial.uniforms.time.value = this.gameTime * 1000;
        }
        
        // Update toon material lighting
        this.toonMaterials.forEach(material => {
            if (material.uniforms && material.uniforms.lightDirection) {
                material.uniforms.lightDirection.value.copy(this.sunLight.position).normalize();
            }
        });
        
        // Update game systems
        if (this.player) {
            this.player.update(deltaTime);
        }
        
        if (this.worldGenerator) {
            this.worldGenerator.update(this.player.position, deltaTime);
        }
        
        if (this.combatSystem) {
            this.combatSystem.update(deltaTime);
        }
        
        if (this.audioSystem) {
            this.audioSystem.update(this.player.position, deltaTime);
        }
        
        if (this.uiSystem) {
            this.uiSystem.update(this.player, deltaTime);
        }
        
        // Update atmospheric effects
        this.updateWindSystem(deltaTime);
        this.updateTimeOfDay(deltaTime);
    }

    updateTimeOfDay(deltaTime) {
        // Subtle day/night cycle effects
        const dayTime = (this.gameTime * 0.0001) % (Math.PI * 2);
        const lightIntensity = Math.max(0.4, Math.sin(dayTime) * 0.6 + 0.6);
        
        if (this.sunLight) {
            this.sunLight.intensity = lightIntensity;
        }
        
        if (this.skyMaterial && this.skyMaterial.uniforms) {
            const timeOfDay = Math.sin(dayTime) * 0.5 + 0.5;
            this.skyMaterial.uniforms.topColor.value.setHSL(0.55, 0.7, 0.3 + timeOfDay * 0.4);
        }
    }

    render() {
        if (this.renderer && this.scene && this.camera) {
            this.renderer.render(this.scene, this.camera);
        } else {
            console.error('Cannot render: renderer, scene, or camera not available');
        }
    }

    startGameLoop() {
        const animate = () => {
            requestAnimationFrame(animate);
            
            const deltaTime = this.clock.getDelta();
            this.update(deltaTime);
            this.render();
        };
        
        animate();
    }
}

// Initialize game when page loads and libraries are ready
window.addEventListener('load', () => {
    console.log('Page loaded, starting game initialization...');
    
    // Simple check - just wait a bit for scripts to load
    setTimeout(() => {
        console.log('Starting game...');
        try {
            new Game();
        } catch (error) {
            console.error('Failed to create game instance:', error);
            // Show error on page
            const loadingScreen = document.getElementById('loading-screen');
            if (loadingScreen) {
                loadingScreen.innerHTML = `
                    <div class="loading-content">
                        <h1>Ghost of Tsushima 3D</h1>
                        <div style="color: #ff4444; margin: 20px 0;">
                            <h3>Loading Error</h3>
                            <p>${error.message}</p>
                            <p>Please refresh the page to try again.</p>
                        </div>
                        <button onclick="location.reload()" style="
                            background: #d4af37; 
                            color: #000; 
                            border: none; 
                            padding: 10px 20px; 
                            border-radius: 5px; 
                            cursor: pointer;
                            font-family: inherit;
                        ">Reload Game</button>
                    </div>
                `;
            }
        }
    }, 2000); // Wait 2 seconds for all scripts to load
});
