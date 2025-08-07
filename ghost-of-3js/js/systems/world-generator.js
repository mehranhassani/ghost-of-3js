class WorldGenerator {
    constructor(scene) {
        this.scene = scene;
        this.chunks = new Map();
        this.chunkSize = 100;
        this.loadDistance = 300;
        this.unloadDistance = 400;
        
        // Noise for terrain generation
        this.terrainNoise = new SimplexNoise();
        this.vegetationNoise = new SimplexNoise();
        this.structureNoise = new SimplexNoise();
        
        // Generation parameters
        this.terrainHeight = 20;
        this.waterLevel = -5;
        
        // Asset pools
        this.materials = this.createMaterials();
        this.geometries = this.createGeometries();
        
        // Points of interest
        this.pointsOfInterest = [];
        
        this.init();
    }

    init() {
        // Generate initial terrain textures and materials
        this.createTerrainMaterials();
    }

    createMaterials() {
        return {
            grass: new THREE.MeshLambertMaterial({ 
                color: 0x4a7c59, 
                flatShading: true 
            }),
            dirt: new THREE.MeshLambertMaterial({ 
                color: 0x8B4513, 
                flatShading: true 
            }),
            stone: new THREE.MeshLambertMaterial({ 
                color: 0x696969, 
                flatShading: true 
            }),
            water: new THREE.MeshLambertMaterial({ 
                color: 0x4682B4, 
                transparent: true, 
                opacity: 0.8,
                flatShading: true 
            }),
            tree: new THREE.MeshLambertMaterial({ 
                color: 0x228B22, 
                flatShading: true 
            }),
            treeTrunk: new THREE.MeshLambertMaterial({ 
                color: 0x8B4513, 
                flatShading: true 
            }),
            bamboo: new THREE.MeshLambertMaterial({ 
                color: 0x9ACD32, 
                flatShading: true 
            }),
            shrine: new THREE.MeshLambertMaterial({ 
                color: 0xDC143C, 
                flatShading: true 
            })
        };
    }

    createGeometries() {
        return {
            terrain: new THREE.PlaneGeometry(this.chunkSize, this.chunkSize, 32, 32),
            tree: new THREE.ConeGeometry(3, 8, 8),
            treeTrunk: new THREE.CylinderGeometry(0.5, 0.7, 4, 8),
            bamboo: new THREE.CylinderGeometry(0.2, 0.2, 12, 6),
            rock: new THREE.SphereGeometry(2, 8, 6),
            shrine: new THREE.BoxGeometry(2, 3, 2)
        };
    }

    createTerrainMaterials() {
        // Create a more sophisticated terrain material with blending
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');
        
        // Create grass texture
        ctx.fillStyle = '#4a7c59';
        ctx.fillRect(0, 0, 256, 256);
        
        // Add some noise for texture
        for (let i = 0; i < 1000; i++) {
            const x = Math.random() * 256;
            const y = Math.random() * 256;
            const shade = Math.random() * 50 - 25;
            ctx.fillStyle = `rgb(${74 + shade}, ${124 + shade}, ${89 + shade})`;
            ctx.fillRect(x, y, 2, 2);
        }
        
        const grassTexture = new THREE.CanvasTexture(canvas);
        grassTexture.wrapS = THREE.RepeatWrapping;
        grassTexture.wrapT = THREE.RepeatWrapping;
        
        this.materials.grassTextured = new THREE.MeshLambertMaterial({ 
            map: grassTexture,
            flatShading: true 
        });
    }

    getChunkKey(x, z) {
        const chunkX = Math.floor(x / this.chunkSize);
        const chunkZ = Math.floor(z / this.chunkSize);
        return `${chunkX},${chunkZ}`;
    }

    getChunkCenter(chunkX, chunkZ) {
        return {
            x: chunkX * this.chunkSize,
            z: chunkZ * this.chunkSize
        };
    }

    generateTerrain(chunkX, chunkZ) {
        const geometry = this.geometries.terrain.clone();
        const vertices = geometry.attributes.position;
        
        // Generate height map using noise
        for (let i = 0; i < vertices.count; i++) {
            const x = vertices.getX(i) + chunkX * this.chunkSize;
            const z = vertices.getZ(i) + chunkZ * this.chunkSize;
            
            // Use multiple octaves of noise for more interesting terrain
            let height = 0;
            height += this.terrainNoise.noise2D(x * 0.01, z * 0.01) * this.terrainHeight;
            height += this.terrainNoise.noise2D(x * 0.02, z * 0.02) * this.terrainHeight * 0.5;
            height += this.terrainNoise.noise2D(x * 0.04, z * 0.04) * this.terrainHeight * 0.25;
            
            vertices.setY(i, height);
        }
        
        geometry.computeVertexNormals();
        
        const terrain = new THREE.Mesh(geometry, this.materials.grassTextured);
        terrain.rotation.x = -Math.PI / 2;
        terrain.position.set(chunkX * this.chunkSize, 0, chunkZ * this.chunkSize);
        terrain.receiveShadow = true;
        
        return terrain;
    }

    generateVegetation(chunkX, chunkZ) {
        const vegetation = new THREE.Group();
        const center = this.getChunkCenter(chunkX, chunkZ);
        
        // Generate trees
        const treeCount = 15 + Math.floor(Math.random() * 10);
        for (let i = 0; i < treeCount; i++) {
            const x = center.x + (Math.random() - 0.5) * this.chunkSize;
            const z = center.z + (Math.random() - 0.5) * this.chunkSize;
            
            // Use noise to determine if tree should be placed
            const treeNoise = this.vegetationNoise.noise2D(x * 0.05, z * 0.05);
            if (treeNoise > 0.1) {
                const tree = this.createTree(x, z);
                vegetation.add(tree);
            }
        }
        
        // Generate bamboo groves
        const bambooCount = 8 + Math.floor(Math.random() * 5);
        for (let i = 0; i < bambooCount; i++) {
            const x = center.x + (Math.random() - 0.5) * this.chunkSize;
            const z = center.z + (Math.random() - 0.5) * this.chunkSize;
            
            const bambooNoise = this.vegetationNoise.noise2D(x * 0.03, z * 0.03);
            if (bambooNoise > 0.3) {
                const bamboo = this.createBambooGrove(x, z);
                vegetation.add(bamboo);
            }
        }
        
        // Generate rocks
        const rockCount = 5 + Math.floor(Math.random() * 8);
        for (let i = 0; i < rockCount; i++) {
            const x = center.x + (Math.random() - 0.5) * this.chunkSize;
            const z = center.z + (Math.random() - 0.5) * this.chunkSize;
            
            const rock = this.createRock(x, z);
            vegetation.add(rock);
        }
        
        return vegetation;
    }

    createTree(x, z) {
        const tree = new THREE.Group();
        
        // Trunk
        const trunk = new THREE.Mesh(this.geometries.treeTrunk, this.materials.treeTrunk);
        trunk.position.set(x, 2, z);
        trunk.castShadow = true;
        tree.add(trunk);
        
        // Foliage
        const foliage = new THREE.Mesh(this.geometries.tree, this.materials.tree);
        foliage.position.set(x, 6, z);
        foliage.scale.setScalar(0.8 + Math.random() * 0.4);
        foliage.castShadow = true;
        tree.add(foliage);
        
        return tree;
    }

    createBambooGrove(x, z) {
        const grove = new THREE.Group();
        const bambooCount = 3 + Math.floor(Math.random() * 5);
        
        for (let i = 0; i < bambooCount; i++) {
            const bamboo = new THREE.Mesh(this.geometries.bamboo, this.materials.bamboo);
            bamboo.position.set(
                x + (Math.random() - 0.5) * 8,
                6,
                z + (Math.random() - 0.5) * 8
            );
            bamboo.scale.y = 0.7 + Math.random() * 0.6;
            bamboo.castShadow = true;
            grove.add(bamboo);
        }
        
        return grove;
    }

    createRock(x, z) {
        const rock = new THREE.Mesh(this.geometries.rock, this.materials.stone);
        rock.position.set(x, 1, z);
        rock.scale.setScalar(0.5 + Math.random() * 0.8);
        rock.rotation.y = Math.random() * Math.PI * 2;
        rock.castShadow = true;
        rock.receiveShadow = true;
        return rock;
    }

    generatePointsOfInterest(chunkX, chunkZ) {
        const pois = [];
        const center = this.getChunkCenter(chunkX, chunkZ);
        
        // Chance to generate a shrine
        const shrineNoise = this.structureNoise.noise2D(chunkX * 0.1, chunkZ * 0.1);
        if (shrineNoise > 0.7) {
            const shrine = this.createShrine(
                center.x + (Math.random() - 0.5) * 40,
                center.z + (Math.random() - 0.5) * 40
            );
            pois.push(shrine);
        }
        
        // Chance to generate a hot spring
        const springNoise = this.structureNoise.noise2D(chunkX * 0.08, chunkZ * 0.08);
        if (springNoise > 0.6) {
            const spring = this.createHotSpring(
                center.x + (Math.random() - 0.5) * 60,
                center.z + (Math.random() - 0.5) * 60
            );
            pois.push(spring);
        }
        
        return pois;
    }

    createShrine(x, z) {
        const shrine = new THREE.Group();
        
        // Main structure
        const main = new THREE.Mesh(this.geometries.shrine, this.materials.shrine);
        main.position.set(x, 1.5, z);
        main.castShadow = true;
        shrine.add(main);
        
        // Roof
        const roof = new THREE.Mesh(
            new THREE.ConeGeometry(2.5, 1.5, 4),
            new THREE.MeshLambertMaterial({ color: 0x8B4513, flatShading: true })
        );
        roof.position.set(x, 3.5, z);
        roof.rotation.y = Math.PI / 4;
        roof.castShadow = true;
        shrine.add(roof);
        
        // Add to points of interest
        this.pointsOfInterest.push({
            type: 'shrine',
            position: { x, z },
            interactable: true,
            discovered: false
        });
        
        return shrine;
    }

    createHotSpring(x, z) {
        const spring = new THREE.Group();
        
        // Water pool
        const pool = new THREE.Mesh(
            new THREE.CylinderGeometry(4, 4, 0.2, 16),
            this.materials.water
        );
        pool.position.set(x, 0.1, z);
        spring.add(pool);
        
        // Surrounding rocks
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const rock = new THREE.Mesh(this.geometries.rock, this.materials.stone);
            rock.position.set(
                x + Math.cos(angle) * 5,
                0.5,
                z + Math.sin(angle) * 5
            );
            rock.scale.setScalar(0.3 + Math.random() * 0.4);
            spring.add(rock);
        }
        
        // Add to points of interest
        this.pointsOfInterest.push({
            type: 'hot_spring',
            position: { x, z },
            interactable: true,
            discovered: false
        });
        
        return spring;
    }

    async generateChunk(worldX, worldZ) {
        const chunkX = Math.floor(worldX / this.chunkSize);
        const chunkZ = Math.floor(worldZ / this.chunkSize);
        const key = this.getChunkKey(worldX, worldZ);
        
        if (this.chunks.has(key)) {
            return this.chunks.get(key);
        }
        
        console.log(`Generating chunk at ${chunkX}, ${chunkZ}`);
        
        const chunk = new THREE.Group();
        
        // Generate terrain
        const terrain = this.generateTerrain(chunkX, chunkZ);
        chunk.add(terrain);
        
        // Generate vegetation
        const vegetation = this.generateVegetation(chunkX, chunkZ);
        chunk.add(vegetation);
        
        // Generate points of interest
        const pois = this.generatePointsOfInterest(chunkX, chunkZ);
        pois.forEach(poi => chunk.add(poi));
        
        // Add chunk to scene
        this.scene.add(chunk);
        this.chunks.set(key, chunk);
        
        return chunk;
    }

    unloadChunk(key) {
        const chunk = this.chunks.get(key);
        if (chunk) {
            this.scene.remove(chunk);
            this.chunks.delete(key);
            
            // Clean up geometries and materials if needed
            chunk.traverse((child) => {
                if (child.geometry) child.geometry.dispose();
                if (child.material) child.material.dispose();
            });
        }
    }

    update(playerPosition, deltaTime) {
        // Check which chunks need to be loaded/unloaded
        const playerChunkX = Math.floor(playerPosition.x / this.chunkSize);
        const playerChunkZ = Math.floor(playerPosition.z / this.chunkSize);
        
        const loadRadius = Math.ceil(this.loadDistance / this.chunkSize);
        const unloadRadius = Math.ceil(this.unloadDistance / this.chunkSize);
        
        // Generate new chunks
        for (let x = playerChunkX - loadRadius; x <= playerChunkX + loadRadius; x++) {
            for (let z = playerChunkZ - loadRadius; z <= playerChunkZ + loadRadius; z++) {
                const distance = Math.sqrt((x - playerChunkX) ** 2 + (z - playerChunkZ) ** 2);
                if (distance <= loadRadius) {
                    const worldX = x * this.chunkSize;
                    const worldZ = z * this.chunkSize;
                    this.generateChunk(worldX, worldZ);
                }
            }
        }
        
        // Unload distant chunks
        const chunksToUnload = [];
        this.chunks.forEach((chunk, key) => {
            const [chunkX, chunkZ] = key.split(',').map(Number);
            const distance = Math.sqrt((chunkX - playerChunkX) ** 2 + (chunkZ - playerChunkZ) ** 2);
            
            if (distance > unloadRadius) {
                chunksToUnload.push(key);
            }
        });
        
        chunksToUnload.forEach(key => this.unloadChunk(key));
        
        // Update points of interest discovery
        this.updatePointsOfInterest(playerPosition);
    }

    updatePointsOfInterest(playerPosition) {
        this.pointsOfInterest.forEach(poi => {
            if (!poi.discovered) {
                const distance = Math.sqrt(
                    (poi.position.x - playerPosition.x) ** 2 + 
                    (poi.position.z - playerPosition.z) ** 2
                );
                
                if (distance < 10) {
                    poi.discovered = true;
                    console.log(`Discovered ${poi.type}!`);
                    // Could trigger UI notification here
                }
            }
        });
    }

    getHeightAt(x, z) {
        // Calculate terrain height at given world coordinates
        let height = 0;
        height += this.terrainNoise.noise2D(x * 0.01, z * 0.01) * this.terrainHeight;
        height += this.terrainNoise.noise2D(x * 0.02, z * 0.02) * this.terrainHeight * 0.5;
        height += this.terrainNoise.noise2D(x * 0.04, z * 0.04) * this.terrainHeight * 0.25;
        return height;
    }
}