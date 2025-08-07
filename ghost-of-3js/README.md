# Ghost of Tsushima 3D - Pixel Style RPG

A Three.js-based open-world RPG inspired by Ghost of Tsushima, featuring procedural world generation, toon shading, and atmospheric gameplay.

## 🎌 Features

### **Core Gameplay**
- **Open World Exploration**: Procedurally generated terrain with infinite world expansion
- **Combat System**: Sword-based combat with combo attacks, critical hits, and special abilities
- **Stealth Mechanics**: Sneak around enemies, stealth takedowns, and visibility system
- **RPG Progression**: Experience points, leveling, skill trees, and equipment upgrades
- **Quest System**: Dynamic quest generation and tracking

### **Ghost of Tsushima Inspired Elements**
- **Wind System**: Dynamic wind particles that guide exploration and create atmosphere
- **Atmospheric Audio**: Procedural wind sounds, nature ambience, and UI feedback
- **Japanese Aesthetics**: Shrines, hot springs, bamboo groves, and traditional architecture
- **Toon Shading**: Custom pixel art style with cel-shading effects
- **Weather & Time**: Day/night cycle with dynamic lighting

### **Technical Features**
- **Procedural Generation**: Terrain, vegetation, and points of interest generated on-the-fly
- **Performance Optimized**: Chunk-based loading/unloading system
- **Custom Shaders**: Toon shading materials and atmospheric effects
- **Responsive UI**: Health bars, minimap, inventory, and quest tracking

## 🎮 Controls

### **Movement**
- `WASD` - Move around
- `Mouse` - Look around / Camera control
- `Space` - Jump
- `Shift` - Sprint
- `Click` - Lock mouse pointer (required for gameplay)

### **Combat**
- `Left Click` - Attack with katana
- `Right Click` - Heavy attack (consumes stamina)
- `R` - Wind Strike (special ability, unlocked through skills)
- `F` - Toggle Stealth Mode
- `C` - Activate Focus Mode

### **Interface**
- `I` - Open/Close Inventory
- `Q` - Open/Close Quest Log
- `E` - Interact with objects (shrines, hot springs)
- `T` - Show Tutorial
- `M` - Toggle Audio Mute
- `P` - Pause Game
- `F` - Toggle Fullscreen

## 🏗️ Game Systems

### **Skills System**
- **Sword Mastery**: Increases damage and critical hit chance
- **Stealth**: Improves stealth effectiveness and detection avoidance
- **Wind Control**: Unlocks special wind-based abilities
- **Meditation**: Enhances focus and stamina regeneration
- **Archery**: Ranged combat abilities (future implementation)
- **Resilience**: Increases health and stamina pools

### **Combat Mechanics**
- **Combo System**: Chain attacks for increased damage
- **Critical Hits**: Chance-based critical strikes
- **Stamina Management**: Sprint and abilities consume stamina
- **Equipment Bonuses**: Weapons and armor provide stat boosts
- **Stealth Takedowns**: Bonus damage and experience for stealth kills

### **World Generation**
- **Terrain**: Multi-octave noise generation for realistic landscapes
- **Vegetation**: Trees, bamboo groves, and rocks placed using noise patterns
- **Points of Interest**: Shrines and hot springs spawn based on world seeds
- **Dynamic Loading**: Chunks load/unload based on player distance

### **Quest Types**
- **Exploration Quests**: Discover new locations and landmarks
- **Combat Challenges**: Defeat enemies and master combat
- **Collection Quests**: Gather items and resources
- **Shrine Visits**: Find and interact with sacred locations

## 🚀 Getting Started

### **Requirements**
- Modern web browser with WebGL support
- HTTP server (for loading modules and assets)

### **Running the Game**

1. **Clone/Download** the game files to your local machine
2. **Start a local server** in the game directory:
   ```bash
   # Using Python 3
   python -m http.server 8080
   
   # Using Node.js (if you have http-server installed)
   npx http-server -p 8080
   
   # Using PHP
   php -S localhost:8080
   ```
3. **Open your browser** and navigate to `http://localhost:8080`
4. **Click anywhere** to lock the mouse pointer and start playing
5. **Press T** for the in-game tutorial

### **Performance Tips**
- The game uses toon shading and reduced pixel ratio for artistic effect
- Adjust your browser's hardware acceleration settings if needed
- Close other tabs/applications for better performance
- The world generates dynamically - expect brief loading when exploring new areas

## 🎨 Visual Style

The game uses a unique **pixel toon shader** approach that combines:
- **Flat shading** for geometric surfaces
- **Quantized lighting** for toon effect
- **Rim lighting** for character definition
- **Atmospheric fog** for depth and mood
- **Dynamic sky** with time-of-day effects
- **Wind particle systems** for environmental storytelling

## 🔊 Audio Design

All audio is **procedurally generated** using the Web Audio API:
- **Wind Ambience**: Continuous atmospheric wind sounds
- **Nature Sounds**: Randomly triggered birds, rustling leaves, bamboo creaks
- **UI Feedback**: Tones and chords for interface interactions
- **Spatial Audio**: Volume and effects change based on player position

## 🌍 World Design Philosophy

The game world follows Ghost of Tsushima's design philosophy:
- **Wind as Guide**: Wind particles subtly guide players toward points of interest
- **Minimalist UI**: Clean interface that doesn't obstruct the world
- **Environmental Storytelling**: Shrines, springs, and ruins tell stories without text
- **Organic Exploration**: No rigid mission structure - players create their own journey
- **Atmospheric Immersion**: Audio and visual elements work together for mood

## 🛠️ Technical Architecture

### **System Overview**
- **Game.js**: Main game loop and system orchestration
- **Player.js**: Character controller, combat, and progression
- **WorldGenerator.js**: Procedural terrain and content generation
- **CombatSystem.js**: Enemy AI, combat mechanics, and spawning
- **UISystem.js**: Interface management and player feedback
- **AudioSystem.js**: Procedural audio generation and spatial sound

### **Rendering Pipeline**
1. **Scene Setup**: Three.js scene with enhanced lighting
2. **Toon Shading**: Custom vertex/fragment shaders
3. **Post-Processing**: Atmospheric effects and tone mapping
4. **Shadow Mapping**: PCF shadows with large shadow maps
5. **Fog Rendering**: Exponential fog for atmospheric depth

### **Performance Optimizations**
- **Chunk-based Loading**: Only active world chunks are in memory
- **Geometry Instancing**: Shared geometries for similar objects
- **Material Pooling**: Reused materials for consistency and performance
- **Frustum Culling**: Automatic culling of off-screen objects
- **LOD System**: Distance-based level of detail (future enhancement)

## 🎯 Future Enhancements

### **Planned Features**
- **Archery System**: Bow and arrow combat mechanics
- **Mount System**: Horse riding for faster travel
- **Weather Effects**: Rain, fog, and seasonal changes
- **Story Missions**: Structured narrative content
- **Multiplayer**: Co-op exploration and combat
- **Save System**: Persistent character progression

### **Technical Improvements**
- **LOD System**: Performance optimization for distant objects
- **Texture Streaming**: Dynamic texture loading for large worlds
- **Audio Streaming**: More complex procedural audio
- **Mobile Support**: Touch controls and optimization
- **VR Support**: Virtual reality compatibility

## 📄 License

This project is created for educational and demonstration purposes. It draws inspiration from Ghost of Tsushima but is an independent fan project with no commercial intent.

## 🙏 Acknowledgments

- **Sucker Punch Productions** - For creating the beautiful Ghost of Tsushima
- **Three.js Community** - For the amazing 3D library and documentation
- **Web Audio API** - For enabling procedural audio generation
- **Simplex Noise** - For terrain generation algorithms

---

**Enjoy your journey through the mystical lands! 🎌⚔️**