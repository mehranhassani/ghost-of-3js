class Player {
    constructor(scene, camera) {
        console.log('Player constructor called');
        this.scene = scene;
        this.camera = camera;
        
        // Player mesh and controls
        this.mesh = null;
        this.controls = null;
        
        // Position and movement
        this.position = new THREE.Vector3(0, 2, 0);
        this.velocity = new THREE.Vector3();
        this.rotation = 0;
        this.isMoving = false;
        this.moveSpeed = 25;
        this.sprintMultiplier = 1.8;
        this.jumpForce = 15;
        this.isGrounded = true;
        this.isSprinting = false;
        
        // Stats
        this.health = 100;
        this.maxHealth = 100;
        this.stamina = 100;
        this.maxStamina = 100;
        this.level = 1;
        this.xp = 0;
        this.xpToNextLevel = 100;
        this.skillPoints = 0;
        
        // Skills system
        this.skills = {
            swordMastery: { level: 1, maxLevel: 10, cost: 1 },
            stealth: { level: 1, maxLevel: 10, cost: 1 },
            windControl: { level: 0, maxLevel: 5, cost: 2 },
            meditation: { level: 0, maxLevel: 8, cost: 1 },
            archery: { level: 0, maxLevel: 10, cost: 1 },
            resilience: { level: 1, maxLevel: 10, cost: 1 }
        };
        
        // Combat
        this.attackCooldown = 0;
        this.attackDamage = 25;
        this.isAttacking = false;
        this.comboCount = 0;
        this.maxCombo = 3;
        this.comboTimer = 0;
        this.criticalChance = 0.1;
        
        // Equipment
        this.equipment = {
            weapon: { name: 'Iron Katana', damage: 25, critBonus: 0.05 },
            armor: { name: 'Simple Kimono', defense: 5, stealthBonus: 0.1 },
            accessory: null
        };
        
        // Special abilities
        this.abilities = {
            windStrike: { cooldown: 0, maxCooldown: 8, unlocked: false },
            stealthMode: { active: false, duration: 0, maxDuration: 5, cooldown: 0, maxCooldown: 15 },
            focus: { active: false, duration: 0, maxDuration: 3, cooldown: 0, maxCooldown: 10 }
        };
        
        // Input state
        this.keys = {
            forward: false,
            backward: false,
            left: false,
            right: false,
            jump: false,
            sprint: false,
            attack: false
        };
        
        // Animation
        this.animationState = 'idle';
        this.animationTime = 0;
        
        // Stealth
        this.stealthLevel = 0; // 0-100, higher = harder to detect
        this.isInStealth = false;
        
        // Don't auto-init here, let game.js call init() when ready
    }

    async init() {
        this.createPlayerMesh();
        this.setupControls();
        this.setupPhysics();
        this.updateSkillEffects();
    }

    updateSkillEffects() {
        // Apply skill bonuses
        const swordLevel = this.skills.swordMastery.level;
        this.attackDamage = 25 + (swordLevel - 1) * 5;
        this.criticalChance = 0.1 + (swordLevel - 1) * 0.02;
        
        const resilienceLevel = this.skills.resilience.level;
        this.maxHealth = 100 + (resilienceLevel - 1) * 15;
        this.maxStamina = 100 + (resilienceLevel - 1) * 10;
        
        const stealthLevel = this.skills.stealth.level;
        this.stealthLevel = stealthLevel * 10;
        
        // Unlock abilities based on skills
        if (this.skills.windControl.level >= 3) {
            this.abilities.windStrike.unlocked = true;
        }
    }

    createPlayerMesh() {
        // Create a more detailed samurai character
        const group = new THREE.Group();
        
        // Body with better proportions - use fallback if CapsuleGeometry not available
        let bodyGeometry;
        try {
            if (THREE.CapsuleGeometry) {
                console.log('Creating player body with CapsuleGeometry');
                bodyGeometry = new THREE.CapsuleGeometry(0.5, 1.5, 6, 10);
            } else {
                console.log('CapsuleGeometry not available, using fallback for player');
                // Fallback to cylinder with spheres
                const cylinder = new THREE.CylinderGeometry(0.5, 0.5, 1.5, 10, 1, true);
                const sphere = new THREE.SphereGeometry(0.5, 6, 10);
                
                // Create group for body
                const bodyGroup = new THREE.Group();
                
                // Add cylinder
                const cylinderMesh = new THREE.Mesh(cylinder);
                bodyGroup.add(cylinderMesh);
                
                // Add top sphere
                const topSphere = new THREE.Mesh(sphere);
                topSphere.position.y = 0.75;
                bodyGroup.add(topSphere);
                
                // Add bottom sphere
                const bottomSphere = new THREE.Mesh(sphere);
                bottomSphere.position.y = -0.75;
                bodyGroup.add(bottomSphere);
                
                bodyGeometry = bodyGroup;
            }
        } catch (error) {
            console.error('Error creating player body geometry:', error);
            // Use simple cylinder as last resort
            bodyGeometry = new THREE.CylinderGeometry(0.5, 0.5, 1.5, 10, 1, true);
        }
        
        const bodyMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x4a4a4a,
            flatShading: true
        });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = 0.75;
        body.castShadow = true;
        group.add(body);
        
        // Head
        const headGeometry = new THREE.SphereGeometry(0.35, 10, 10);
        const headMaterial = new THREE.MeshLambertMaterial({ 
            color: 0xffdbac,
            flatShading: true
        });
        const head = new THREE.Mesh(headGeometry, headMaterial);
        head.position.y = 1.8;
        head.castShadow = true;
        group.add(head);
        
        // Enhanced Katana
        const katanaGroup = new THREE.Group();
        
        // Blade with better details
        const bladeGeometry = new THREE.BoxGeometry(0.05, 1.0, 0.02);
        const bladeMaterial = new THREE.MeshLambertMaterial({ 
            color: 0xe0e0e0,
            flatShading: true
        });
        const blade = new THREE.Mesh(bladeGeometry, bladeMaterial);
        blade.position.y = 0.5;
        katanaGroup.add(blade);
        
        // Handle with guard
        const handleGeometry = new THREE.BoxGeometry(0.08, 0.3, 0.08);
        const handleMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x8B4513,
            flatShading: true
        });
        const handle = new THREE.Mesh(handleGeometry, handleMaterial);
        handle.position.y = -0.15;
        katanaGroup.add(handle);
        
        // Guard
        const guardGeometry = new THREE.BoxGeometry(0.15, 0.03, 0.15);
        const guard = new THREE.Mesh(guardGeometry, new THREE.MeshLambertMaterial({ color: 0x666666, flatShading: true }));
        guard.position.y = 0;
        katanaGroup.add(guard);
        
        // Attach katana to side
        katanaGroup.position.set(-0.6, 0.5, 0);
        katanaGroup.rotation.z = -0.2;
        group.add(katanaGroup);
        
        this.katana = katanaGroup;
        
        // Enhanced cape with physics simulation points
        const capeGeometry = new THREE.PlaneGeometry(1.4, 1.8, 6, 8);
        const capeMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x8B0000,
            side: THREE.DoubleSide,
            flatShading: true
        });
        const cape = new THREE.Mesh(capeGeometry, capeMaterial);
        cape.position.set(0, 0.5, -0.3);
        group.add(cape);
        
        this.cape = cape;
        
        // Armor pieces
        const shoulderGeometry = new THREE.BoxGeometry(0.7, 0.3, 0.4);
        const shoulderMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x2F4F4F,
            flatShading: true
        });
        const leftShoulder = new THREE.Mesh(shoulderGeometry, shoulderMaterial);
        leftShoulder.position.set(-0.4, 1.3, 0);
        leftShoulder.castShadow = true;
        group.add(leftShoulder);
        
        const rightShoulder = new THREE.Mesh(shoulderGeometry, shoulderMaterial);
        rightShoulder.position.set(0.4, 1.3, 0);
        rightShoulder.castShadow = true;
        group.add(rightShoulder);
        
        group.position.copy(this.position);
        this.mesh = group;
        this.scene.add(group);
        
        // Make sure player is visible and positioned correctly
        console.log('Player mesh created and added to scene');
    }

    setupControls() {
        try {
            // Set up pointer lock controls for mouse look
            if (THREE.PointerLockControls) {
                this.controls = new THREE.PointerLockControls(this.camera, document.body);
                
                // Lock pointer on click
                document.addEventListener('click', () => {
                    if (!document.pointerLockElement) {
                        this.controls.lock();
                    }
                });
                
                this.controls.addEventListener('lock', () => {
                    console.log('Pointer locked - Game ready!');
                });
                
                this.controls.addEventListener('unlock', () => {
                    console.log('Pointer unlocked');
                });
            } else {
                console.warn('PointerLockControls not available, using fallback controls');
                // Create fallback controls
                this.controls = {
                    isLocked: false,
                    lock: () => {
                        console.log('Pointer lock requested (fallback)');
                        this.controls.isLocked = true;
                    },
                    unlock: () => {
                        console.log('Pointer unlock requested (fallback)');
                        this.controls.isLocked = false;
                    },
                    getObject: () => this.camera,
                    getDirection: () => new THREE.Vector3(0, 0, -1),
                    disconnect: () => {},
                    dispose: () => {},
                    addEventListener: (event, callback) => {
                        // Simple event listener fallback
                        if (event === 'lock') {
                            this.controls.onLock = callback;
                        } else if (event === 'unlock') {
                            this.controls.onUnlock = callback;
                        }
                    }
                };
            }
        } catch (error) {
            console.error('Error setting up controls:', error);
            // Create minimal fallback
            this.controls = {
                isLocked: false,
                lock: () => console.log('Controls fallback lock'),
                unlock: () => console.log('Controls fallback unlock'),
                getObject: () => this.camera,
                getDirection: () => new THREE.Vector3(0, 0, -1),
                disconnect: () => {},
                dispose: () => {},
                addEventListener: () => {}
            };
        }
    }

    setupPhysics() {
        // Simple physics for gravity and collision
        this.gravity = -30;
        this.groundY = 0;
    }

    onKeyDown(event) {
        switch(event.code) {
            case 'KeyW':
            case 'ArrowUp':
                this.keys.forward = true;
                break;
            case 'KeyS':
            case 'ArrowDown':
                this.keys.backward = true;
                break;
            case 'KeyA':
            case 'ArrowLeft':
                this.keys.left = true;
                break;
            case 'KeyD':
            case 'ArrowRight':
                this.keys.right = true;
                break;
            case 'Space':
                this.keys.jump = true;
                event.preventDefault();
                break;
            case 'ShiftLeft':
                this.keys.sprint = true;
                break;
            case 'KeyR':
                this.useWindStrike();
                break;
            case 'KeyF':
                this.toggleStealthMode();
                break;
            case 'KeyC':
                this.activateFocus();
                break;
        }
    }

    onKeyUp(event) {
        switch(event.code) {
            case 'KeyW':
            case 'ArrowUp':
                this.keys.forward = false;
                break;
            case 'KeyS':
            case 'ArrowDown':
                this.keys.backward = false;
                break;
            case 'KeyA':
            case 'ArrowLeft':
                this.keys.left = false;
                break;
            case 'KeyD':
            case 'ArrowRight':
                this.keys.right = false;
                break;
            case 'Space':
                this.keys.jump = false;
                break;
            case 'ShiftLeft':
                this.keys.sprint = false;
                break;
        }
    }

    onMouseClick(event) {
        if (event.button === 0) { // Left click - attack
            this.attack();
        } else if (event.button === 2) { // Right click - heavy attack
            this.heavyAttack();
            event.preventDefault();
        }
    }

    attack() {
        if (this.attackCooldown > 0 || this.isAttacking) return;
        
        this.isAttacking = true;
        this.attackCooldown = 0.4 - (this.skills.swordMastery.level - 1) * 0.03;
        this.animationState = 'attack';
        this.animationTime = 0;
        
        // Handle combo system
        if (this.comboTimer > 0) {
            this.comboCount = Math.min(this.comboCount + 1, this.maxCombo);
        } else {
            this.comboCount = 1;
        }
        this.comboTimer = 1.5;
        
        // Calculate damage with combo bonus
        let damage = this.attackDamage + this.equipment.weapon.damage;
        const comboMultiplier = 1 + (this.comboCount - 1) * 0.2;
        damage *= comboMultiplier;
        
        // Critical hit chance
        if (Math.random() < this.criticalChance + this.equipment.weapon.critBonus) {
            damage *= 1.5;
            console.log('Critical hit!');
        }
        
        this.finalAttackDamage = Math.floor(damage);
        
        // Animate katana swing with combo variation
        if (this.katana) {
            const swingAngle = -1.2 - (this.comboCount * 0.3);
            const originalRotation = this.katana.rotation.z;
            this.katana.rotation.z = originalRotation + swingAngle;
            
            setTimeout(() => {
                if (this.katana) {
                    this.katana.rotation.z = originalRotation;
                }
                this.isAttacking = false;
                if (this.animationState === 'attack') {
                    this.animationState = 'idle';
                }
            }, 250 + this.comboCount * 50);
        }
        
        console.log(`Player attacks! Combo: ${this.comboCount}x, Damage: ${this.finalAttackDamage}`);
    }

    heavyAttack() {
        if (this.attackCooldown > 0 || this.stamina < 30) return;
        
        this.stamina -= 30;
        this.isAttacking = true;
        this.attackCooldown = 1.2;
        this.animationState = 'heavy_attack';
        
        // Heavy attack deals double damage and breaks enemy guard
        this.finalAttackDamage = Math.floor((this.attackDamage + this.equipment.weapon.damage) * 2);
        
        console.log(`Heavy attack! Damage: ${this.finalAttackDamage}`);
    }

    useWindStrike() {
        if (!this.abilities.windStrike.unlocked || this.abilities.windStrike.cooldown > 0) return;
        
        this.abilities.windStrike.cooldown = this.abilities.windStrike.maxCooldown;
        
        // Create wind projectile effect
        this.createWindProjectile();
        
        console.log('Wind Strike activated!');
    }

    createWindProjectile() {
        const windGeometry = new THREE.SphereGeometry(0.5, 8, 8);
        const windMaterial = new THREE.MeshBasicMaterial({ 
            color: 0x87CEEB,
            transparent: true,
            opacity: 0.7
        });
        const windProjectile = new THREE.Mesh(windGeometry, windMaterial);
        
        windProjectile.position.copy(this.position);
        windProjectile.position.y += 1;
        
        const direction = this.controls.getDirection(new THREE.Vector3());
        windProjectile.velocity = direction.multiplyScalar(50);
        windProjectile.life = 3;
        
        this.scene.add(windProjectile);
        
        // Animate projectile
        const animateProjectile = () => {
            if (windProjectile.life <= 0) {
                this.scene.remove(windProjectile);
                return;
            }
            
            windProjectile.position.add(windProjectile.velocity.clone().multiplyScalar(0.016));
            windProjectile.life -= 0.016;
            windProjectile.material.opacity = Math.max(0, windProjectile.life / 3);
            
            requestAnimationFrame(animateProjectile);
        };
        animateProjectile();
    }

    toggleStealthMode() {
        if (this.abilities.stealthMode.cooldown > 0 || this.abilities.stealthMode.active) return;
        
        this.abilities.stealthMode.active = true;
        this.abilities.stealthMode.duration = this.abilities.stealthMode.maxDuration + this.skills.stealth.level;
        this.isInStealth = true;
        
        // Visual stealth effect
        if (this.mesh) {
            this.mesh.traverse(child => {
                if (child.material) {
                    child.material.opacity = 0.3;
                    child.material.transparent = true;
                }
            });
        }
        
        console.log('Stealth mode activated!');
    }

    deactivateStealthMode() {
        this.abilities.stealthMode.active = false;
        this.abilities.stealthMode.cooldown = this.abilities.stealthMode.maxCooldown;
        this.isInStealth = false;
        
        // Remove stealth visual effect
        if (this.mesh) {
            this.mesh.traverse(child => {
                if (child.material) {
                    child.material.opacity = 1.0;
                    child.material.transparent = false;
                }
            });
        }
        
        console.log('Stealth mode deactivated');
    }

    activateFocus() {
        if (this.abilities.focus.cooldown > 0 || this.abilities.focus.active) return;
        
        this.abilities.focus.active = true;
        this.abilities.focus.duration = this.abilities.focus.maxDuration;
        
        // Focus mode benefits: slower time perception, increased critical chance
        console.log('Focus activated - Time slows down...');
    }

    deactivateFocus() {
        this.abilities.focus.active = false;
        this.abilities.focus.cooldown = this.abilities.focus.maxCooldown;
        
        console.log('Focus deactivated');
    }

    jump() {
        if (this.isGrounded && this.keys.jump) {
            this.velocity.y = this.jumpForce;
            this.isGrounded = false;
            this.animationState = 'jump';
            
            // Consume stamina for jump
            this.stamina = Math.max(0, this.stamina - 10);
        }
    }

    updateMovement(deltaTime) {
        if (!this.controls.isLocked) return;
        
        // Calculate movement direction based on camera
        const direction = new THREE.Vector3();
        const cameraDirection = this.controls.getDirection(new THREE.Vector3());
        
        // Forward/backward
        if (this.keys.forward) direction.add(cameraDirection);
        if (this.keys.backward) direction.sub(cameraDirection);
        
        // Left/right (strafe)
        const right = new THREE.Vector3();
        right.crossVectors(cameraDirection, new THREE.Vector3(0, 1, 0));
        if (this.keys.right) direction.add(right);
        if (this.keys.left) direction.sub(right);
        
        // Normalize to prevent faster diagonal movement
        direction.normalize();
        
        // Apply speed with skill bonuses
        let currentSpeed = this.moveSpeed + (this.level - 1) * 2;
        this.isSprinting = this.keys.sprint && this.stamina > 0;
        
        if (this.isSprinting) {
            currentSpeed *= this.sprintMultiplier;
            this.stamina = Math.max(0, this.stamina - deltaTime * 25);
        } else {
            this.stamina = Math.min(this.maxStamina, this.stamina + deltaTime * 15);
        }
        
        // Stealth mode affects movement
        if (this.isInStealth) {
            currentSpeed *= 0.6; // Slower movement in stealth
        }
        
        // Apply movement
        this.velocity.x = direction.x * currentSpeed;
        this.velocity.z = direction.z * currentSpeed;
        
        // Update animation state
        this.isMoving = direction.length() > 0;
        if (this.isMoving && this.animationState === 'idle') {
            if (this.isInStealth) {
                this.animationState = 'stealth_walk';
            } else {
                this.animationState = this.isSprinting ? 'run' : 'walk';
            }
        } else if (!this.isMoving && (this.animationState === 'walk' || this.animationState === 'run' || this.animationState === 'stealth_walk')) {
            this.animationState = 'idle';
        }
        
        // Jump
        this.jump();
    }

    updatePhysics(deltaTime) {
        // Apply gravity
        if (!this.isGrounded) {
            this.velocity.y += this.gravity * deltaTime;
        }
        
        // Update position
        this.position.add(this.velocity.clone().multiplyScalar(deltaTime));
        
        // Ground collision
        if (this.position.y <= this.groundY + 1) {
            this.position.y = this.groundY + 1;
            this.velocity.y = 0;
            this.isGrounded = true;
            if (this.animationState === 'jump') {
                this.animationState = 'idle';
            }
        }
        
        // Update mesh position
        if (this.mesh) {
            this.mesh.position.copy(this.position);
            this.mesh.position.y -= 1; // Offset for character height
        }
        
        // Update camera position
        this.camera.position.copy(this.position);
    }

    updateAnimation(deltaTime) {
        this.animationTime += deltaTime;
        
        if (!this.mesh) return;
        
        // Enhanced animation system
        switch (this.animationState) {
            case 'walk':
                this.mesh.position.y = this.position.y - 1 + Math.sin(this.animationTime * 8) * 0.1;
                break;
            case 'run':
                this.mesh.position.y = this.position.y - 1 + Math.sin(this.animationTime * 12) * 0.15;
                break;
            case 'stealth_walk':
                this.mesh.position.y = this.position.y - 1 + Math.sin(this.animationTime * 6) * 0.05;
                break;
            case 'idle':
                this.mesh.position.y = this.position.y - 1 + Math.sin(this.animationTime * 2) * 0.03;
                break;
        }
        
        // Enhanced cape physics
        if (this.cape) {
            let windStrength = 0.3 + Math.sin(this.animationTime * 3) * 0.1;
            
            if (this.isMoving) {
                windStrength += this.isSprinting ? 0.4 : 0.2;
            }
            
            this.cape.rotation.x = windStrength;
            this.cape.rotation.y = Math.sin(this.animationTime * 2) * 0.1;
        }
    }

    updateAbilities(deltaTime) {
        // Update ability cooldowns
        Object.keys(this.abilities).forEach(abilityName => {
            const ability = this.abilities[abilityName];
            
            if (ability.cooldown > 0) {
                ability.cooldown = Math.max(0, ability.cooldown - deltaTime);
            }
            
            if (ability.active && ability.duration > 0) {
                ability.duration -= deltaTime;
                
                if (ability.duration <= 0) {
                    switch (abilityName) {
                        case 'stealthMode':
                            this.deactivateStealthMode();
                            break;
                        case 'focus':
                            this.deactivateFocus();
                            break;
                    }
                }
            }
        });
        
        // Update combo timer
        if (this.comboTimer > 0) {
            this.comboTimer -= deltaTime;
            if (this.comboTimer <= 0) {
                this.comboCount = 0;
            }
        }
    }

    upgradeSkill(skillName) {
        const skill = this.skills[skillName];
        if (!skill || skill.level >= skill.maxLevel || this.skillPoints < skill.cost) {
            return false;
        }
        
        this.skillPoints -= skill.cost;
        skill.level++;
        
        this.updateSkillEffects();
        
        console.log(`Skill upgraded: ${skillName} to level ${skill.level}`);
        return true;
    }

    takeDamage(amount) {
        // Apply defense from equipment
        const defense = this.equipment.armor.defense;
        const finalDamage = Math.max(1, amount - defense);
        
        this.health = Math.max(0, this.health - finalDamage);
        
        // Flash red effect (would be handled by rendering system)
        console.log(`Player takes ${finalDamage} damage (${defense} blocked). Health: ${this.health}/${this.maxHealth}`);
        
        if (this.health <= 0) {
            this.die();
        }
    }

    heal(amount) {
        this.health = Math.min(this.maxHealth, this.health + amount);
        console.log(`Player healed for ${amount}. Health: ${this.health}/${this.maxHealth}`);
    }

    gainXP(amount) {
        this.xp += amount;
        console.log(`Gained ${amount} XP`);
        
        while (this.xp >= this.xpToNextLevel) {
            this.levelUp();
        }
    }

    levelUp() {
        this.level++;
        this.xp -= this.xpToNextLevel;
        this.xpToNextLevel = Math.floor(this.xpToNextLevel * 1.4);
        
        // Grant skill points and increase stats
        this.skillPoints += 2;
        this.maxHealth += 15;
        this.health = this.maxHealth; // Full heal on level up
        this.maxStamina += 8;
        this.stamina = this.maxStamina;
        this.attackDamage += 3;
        
        console.log(`Level up! Now level ${this.level}. Gained 2 skill points!`);
    }

    die() {
        console.log('Player died!');
        // Handle death (respawn, etc.)
        this.respawn();
    }

    respawn() {
        this.health = Math.floor(this.maxHealth * 0.5); // Respawn with half health
        this.stamina = this.maxStamina;
        this.position.set(0, 2, 0);
        
        // Reset abilities
        Object.keys(this.abilities).forEach(abilityName => {
            this.abilities[abilityName].active = false;
            this.abilities[abilityName].duration = 0;
            this.abilities[abilityName].cooldown = 0;
        });
        
        if (this.isInStealth) {
            this.deactivateStealthMode();
        }
        
        console.log('Player respawned at starting location');
    }

    getStealthLevel() {
        let stealth = this.stealthLevel;
        
        // Bonus from equipment
        stealth += this.equipment.armor.stealthBonus * 100;
        
        // Bonus from stealth mode
        if (this.isInStealth) {
            stealth += 50;
        }
        
        // Penalty from movement
        if (this.isMoving) {
            stealth -= this.isSprinting ? 30 : 10;
        }
        
        return Math.max(0, Math.min(100, stealth));
    }

    update(deltaTime) {
        // Update cooldowns
        if (this.attackCooldown > 0) {
            this.attackCooldown = Math.max(0, this.attackCooldown - deltaTime);
        }
        
        this.updateMovement(deltaTime);
        this.updatePhysics(deltaTime);
        this.updateAnimation(deltaTime);
        this.updateAbilities(deltaTime);
        
        // Update camera position to follow player
        if (this.camera && this.mesh) {
            // Position camera behind and above the player
            const cameraOffset = new THREE.Vector3(0, 3, 8);
            const targetCameraPos = this.position.clone().add(cameraOffset);
            
            // Smooth camera movement
            this.camera.position.lerp(targetCameraPos, deltaTime * 5);
            
            // Make camera look at player position
            this.camera.lookAt(this.position.clone().add(new THREE.Vector3(0, 1, 0)));
        }
    }
}

// Make Player class available globally
window.Player = Player;
console.log('Player class loaded and available globally');
