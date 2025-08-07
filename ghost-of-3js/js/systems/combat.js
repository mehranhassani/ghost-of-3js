class CombatSystem {
    constructor(scene, player) {
        this.scene = scene;
        this.player = player;
        this.enemies = [];
        this.maxEnemies = 8;
        
        // Combat settings
        this.combatRange = 5;
        this.detectionRange = 15;
        this.stealthDetectionRange = 8;
        
        // Enemy spawn settings
        this.spawnCooldown = 0;
        this.spawnInterval = 10; // seconds
        
        this.init();
    }

    init() {
        this.createEnemyMaterials();
        this.spawnInitialEnemies();
    }

    createEnemyMaterials() {
        this.materials = {
            enemy: new THREE.MeshLambertMaterial({ 
                color: 0x8B0000, 
                flatShading: true 
            }),
            enemyWeapon: new THREE.MeshLambertMaterial({ 
                color: 0x696969, 
                flatShading: true 
            }),
            enemyArmor: new THREE.MeshLambertMaterial({ 
                color: 0x2F4F4F, 
                flatShading: true 
            })
        };
    }

    spawnInitialEnemies() {
        // Spawn a few enemies around the player
        for (let i = 0; i < 3; i++) {
            setTimeout(() => {
                this.spawnEnemy();
            }, i * 2000);
        }
    }

    spawnEnemy() {
        if (this.enemies.length >= this.maxEnemies) {
            return;
        }

        const enemy = this.createEnemy();
        this.enemies.push(enemy);
        this.scene.add(enemy.mesh);
        
        console.log(`Enemy spawned. Total enemies: ${this.enemies.length}`);
    }

    createEnemy() {
        const enemy = {
            id: Date.now() + Math.random(),
            mesh: new THREE.Group(),
            position: new THREE.Vector3(),
            health: 50,
            maxHealth: 50,
            damage: 15,
            speed: 12,
            state: 'patrol', // patrol, chase, attack, stunned, dead
            alertLevel: 0, // 0-100, affects detection
            lastSeen: null,
            target: null,
            attackCooldown: 0,
            patrolTarget: new THREE.Vector3(),
            patrolTime: 0,
            detectionRadius: this.detectionRange,
            isAlerted: false
        };

        // Create enemy mesh
        this.buildEnemyMesh(enemy);
        
        // Set spawn position (away from player)
        const spawnDistance = 30 + Math.random() * 50;
        const spawnAngle = Math.random() * Math.PI * 2;
        
        enemy.position.set(
            this.player.position.x + Math.cos(spawnAngle) * spawnDistance,
            2,
            this.player.position.z + Math.sin(spawnAngle) * spawnDistance
        );
        
        enemy.mesh.position.copy(enemy.position);
        
        // Set initial patrol target
        this.setNewPatrolTarget(enemy);
        
        return enemy;
    }

    buildEnemyMesh(enemy) {
        // Body
        const bodyGeometry = new THREE.CapsuleGeometry(0.4, 1.2, 4, 8);
        const body = new THREE.Mesh(bodyGeometry, this.materials.enemy);
        body.position.y = 0.6;
        body.castShadow = true;
        enemy.mesh.add(body);
        
        // Head
        const headGeometry = new THREE.SphereGeometry(0.25, 8, 8);
        const head = new THREE.Mesh(headGeometry, this.materials.enemy);
        head.position.y = 1.4;
        head.castShadow = true;
        enemy.mesh.add(head);
        
        // Weapon
        const weaponGeometry = new THREE.BoxGeometry(0.03, 0.6, 0.02);
        const weapon = new THREE.Mesh(weaponGeometry, this.materials.enemyWeapon);
        weapon.position.set(0.3, 0.8, 0);
        weapon.castShadow = true;
        enemy.mesh.add(weapon);
        enemy.weapon = weapon;
        
        // Detection indicator (visible when alerted)
        const indicatorGeometry = new THREE.SphereGeometry(0.1, 4, 4);
        const indicatorMaterial = new THREE.MeshBasicMaterial({ 
            color: 0xFF0000,
            transparent: true,
            opacity: 0
        });
        const indicator = new THREE.Mesh(indicatorGeometry, indicatorMaterial);
        indicator.position.y = 2;
        enemy.mesh.add(indicator);
        enemy.alertIndicator = indicator;
    }

    setNewPatrolTarget(enemy) {
        // Set a new random patrol point within range
        const range = 20;
        enemy.patrolTarget.set(
            enemy.position.x + (Math.random() - 0.5) * range,
            enemy.position.y,
            enemy.position.z + (Math.random() - 0.5) * range
        );
        enemy.patrolTime = 0;
    }

    updateEnemyAI(enemy, deltaTime) {
        // Update enemy behavior based on state
        switch (enemy.state) {
            case 'patrol':
                this.updatePatrolBehavior(enemy, deltaTime);
                break;
            case 'chase':
                this.updateChaseBehavior(enemy, deltaTime);
                break;
            case 'attack':
                this.updateAttackBehavior(enemy, deltaTime);
                break;
            case 'stunned':
                this.updateStunnedBehavior(enemy, deltaTime);
                break;
        }
        
        // Always check for player detection
        this.updatePlayerDetection(enemy, deltaTime);
        
        // Update cooldowns
        if (enemy.attackCooldown > 0) {
            enemy.attackCooldown -= deltaTime;
        }
    }

    updatePatrolBehavior(enemy, deltaTime) {
        // Move towards patrol target
        const direction = enemy.patrolTarget.clone().sub(enemy.position).normalize();
        const moveDistance = enemy.speed * 0.3 * deltaTime; // Slower patrol speed
        
        enemy.position.add(direction.multiplyScalar(moveDistance));
        enemy.mesh.position.copy(enemy.position);
        
        // Face movement direction
        if (direction.length() > 0) {
            enemy.mesh.lookAt(enemy.position.clone().add(direction));
        }
        
        // Check if reached patrol target
        const distanceToTarget = enemy.position.distanceTo(enemy.patrolTarget);
        if (distanceToTarget < 2) {
            enemy.patrolTime += deltaTime;
            if (enemy.patrolTime > 2) { // Wait 2 seconds at patrol point
                this.setNewPatrolTarget(enemy);
            }
        }
    }

    updateChaseBehavior(enemy, deltaTime) {
        // Chase the player
        const playerPosition = this.player.position;
        const direction = playerPosition.clone().sub(enemy.position).normalize();
        const moveDistance = enemy.speed * deltaTime;
        
        enemy.position.add(direction.multiplyScalar(moveDistance));
        enemy.mesh.position.copy(enemy.position);
        
        // Face player
        enemy.mesh.lookAt(playerPosition);
        
        // Check if close enough to attack
        const distanceToPlayer = enemy.position.distanceTo(playerPosition);
        if (distanceToPlayer <= this.combatRange) {
            enemy.state = 'attack';
            enemy.attackCooldown = 0.5;
        }
        
        // Lose player if too far away
        if (distanceToPlayer > this.detectionRange * 2) {
            enemy.state = 'patrol';
            enemy.isAlerted = false;
            enemy.lastSeen = null;
            this.setNewPatrolTarget(enemy);
        }
    }

    updateAttackBehavior(enemy, deltaTime) {
        const playerPosition = this.player.position;
        const distanceToPlayer = enemy.position.distanceTo(playerPosition);
        
        // Face player
        enemy.mesh.lookAt(playerPosition);
        
        // Attack if cooldown is over
        if (enemy.attackCooldown <= 0 && distanceToPlayer <= this.combatRange) {
            this.executeEnemyAttack(enemy);
            enemy.attackCooldown = 1.5; // Attack cooldown
        }
        
        // Return to chase if player moves away
        if (distanceToPlayer > this.combatRange * 1.5) {
            enemy.state = 'chase';
        }
    }

    updateStunnedBehavior(enemy, deltaTime) {
        // Enemy is stunned, gradually recover
        enemy.attackCooldown -= deltaTime;
        if (enemy.attackCooldown <= 0) {
            enemy.state = 'chase';
        }
    }

    updatePlayerDetection(enemy, deltaTime) {
        const playerPosition = this.player.position;
        const distanceToPlayer = enemy.position.distanceTo(playerPosition);
        
        // Different detection ranges based on player state
        let detectionRange = this.detectionRange;
        if (this.player.isSprinting) {
            detectionRange *= 1.5; // Easier to detect when running
        }
        
        // Check line of sight (simplified)
        if (distanceToPlayer <= detectionRange && enemy.state !== 'stunned') {
            // Player detected
            if (!enemy.isAlerted) {
                enemy.isAlerted = true;
                enemy.state = 'chase';
                enemy.lastSeen = playerPosition.clone();
                console.log('Enemy detected player!');
                
                // Visual indicator
                if (enemy.alertIndicator) {
                    enemy.alertIndicator.material.opacity = 1;
                    setTimeout(() => {
                        if (enemy.alertIndicator) {
                            enemy.alertIndicator.material.opacity = 0;
                        }
                    }, 2000);
                }
            }
            
            enemy.lastSeen = playerPosition.clone();
        }
    }

    executeEnemyAttack(enemy) {
        console.log('Enemy attacks player!');
        
        // Animate weapon swing
        if (enemy.weapon) {
            const originalRotation = enemy.weapon.rotation.z;
            enemy.weapon.rotation.z = originalRotation + 1.2;
            
            setTimeout(() => {
                if (enemy.weapon) {
                    enemy.weapon.rotation.z = originalRotation;
                }
            }, 300);
        }
        
        // Check if player is in range and deal damage
        const distanceToPlayer = enemy.position.distanceTo(this.player.position);
        if (distanceToPlayer <= this.combatRange) {
            // Player takes damage (could add blocking/dodging mechanics)
            this.player.takeDamage(enemy.damage);
        }
    }

    checkPlayerAttacks() {
        if (!this.player.isAttacking) return;
        
        // Check if player hits any enemies
        this.enemies.forEach((enemy, index) => {
            if (enemy.state === 'dead') return;
            
            const distanceToEnemy = this.player.position.distanceTo(enemy.position);
            if (distanceToEnemy <= this.combatRange) {
                this.damageEnemy(enemy, this.player.attackDamage);
                
                // Stun enemy briefly
                enemy.state = 'stunned';
                enemy.attackCooldown = 0.8;
            }
        });
    }

    damageEnemy(enemy, damage) {
        enemy.health -= damage;
        console.log(`Enemy takes ${damage} damage. Health: ${enemy.health}/${enemy.maxHealth}`);
        
        // Flash red effect
        if (enemy.mesh) {
            const originalColor = enemy.mesh.children[0].material.color.clone();
            enemy.mesh.children[0].material.color.setHex(0xFF0000);
            
            setTimeout(() => {
                if (enemy.mesh.children[0]) {
                    enemy.mesh.children[0].material.color.copy(originalColor);
                }
            }, 200);
        }
        
        if (enemy.health <= 0) {
            this.killEnemy(enemy);
        }
    }

    killEnemy(enemy) {
        enemy.state = 'dead';
        console.log('Enemy defeated!');
        
        // Remove from scene
        this.scene.remove(enemy.mesh);
        
        // Remove from enemies array
        const index = this.enemies.findIndex(e => e.id === enemy.id);
        if (index !== -1) {
            this.enemies.splice(index, 1);
        }
        
        // Give player XP
        this.player.gainXP(25);
        
        // Dispose of enemy mesh
        enemy.mesh.traverse((child) => {
            if (child.geometry) child.geometry.dispose();
            if (child.material) child.material.dispose();
        });
    }

    createStealthTakedown(enemy) {
        // Special stealth takedown attack
        if (enemy.state !== 'chase' && enemy.state !== 'attack') {
            this.killEnemy(enemy);
            this.player.gainXP(50); // Bonus XP for stealth
            console.log('Stealth takedown!');
            return true;
        }
        return false;
    }

    update(deltaTime) {
        // Update spawn cooldown
        this.spawnCooldown -= deltaTime;
        
        // Spawn new enemies if needed
        if (this.spawnCooldown <= 0 && this.enemies.length < this.maxEnemies) {
            this.spawnEnemy();
            this.spawnCooldown = this.spawnInterval + Math.random() * 10;
        }
        
        // Update all enemies
        this.enemies.forEach(enemy => {
            if (enemy.state !== 'dead') {
                this.updateEnemyAI(enemy, deltaTime);
            }
        });
        
        // Check for player attacks
        this.checkPlayerAttacks();
        
        // Clean up dead enemies
        this.enemies = this.enemies.filter(enemy => enemy.state !== 'dead');
    }

    getEnemiesInRange(position, range) {
        return this.enemies.filter(enemy => 
            enemy.state !== 'dead' && 
            enemy.position.distanceTo(position) <= range
        );
    }

    getAlertedEnemies() {
        return this.enemies.filter(enemy => enemy.isAlerted && enemy.state !== 'dead');
    }

    isPlayerInCombat() {
        return this.enemies.some(enemy => 
            (enemy.state === 'chase' || enemy.state === 'attack') && 
            enemy.position.distanceTo(this.player.position) <= this.detectionRange
        );
    }

    // Debug function to show enemy states
    getEnemyStates() {
        return this.enemies.map(enemy => ({
            id: enemy.id,
            state: enemy.state,
            health: enemy.health,
            distance: enemy.position.distanceTo(this.player.position).toFixed(1)
        }));
    }
}