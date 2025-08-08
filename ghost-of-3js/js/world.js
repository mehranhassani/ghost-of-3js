(function(){
  const TILE_SIZE = 16; // base tile pixels
  const PIXEL_SCALE = 3; // visual scale
  const DRAW_TILE = TILE_SIZE * PIXEL_SCALE;
  const CHUNK_SIZE = 32; // tiles per chunk side
  const WATER_LEVEL = 0.38;

  const { fbm2D } = window.NoiseLib || {};
  if (!fbm2D) { console.error('NoiseLib not loaded'); }

  const chunks = new Map();
  let worldSeed = Math.floor(Math.random() * 1e9) | 0;

  function key(cx, cy){ return cx + ',' + cy; }

  function sampleHeight(x, y){
    return fbm2D(x, y, { seed: worldSeed + 100, frequency: 0.005, octaves: 5, gain: 0.5, lacunarity: 2.1 });
  }

  function sampleMoisture(x, y){
    return fbm2D(x, y, { seed: worldSeed + 200, frequency: 0.01, octaves: 4, gain: 0.55, lacunarity: 2.0 });
  }

  function biomeAt(x, y){
    const h = sampleHeight(x, y);
    const m = sampleMoisture(x + 1000, y + 1000);

    if (h < WATER_LEVEL * 0.8) return 'deepWater';
    if (h < WATER_LEVEL) return 'shallowWater';
    if (h < WATER_LEVEL + 0.03) return 'sand';

    if (h < 0.6){
      if (m > 0.55) return 'forest';
      return 'grass';
    }
    if (h < 0.8) return 'rock';
    return 'snow';
  }

  function generateChunk(cx, cy){
    const tiles = new Uint8Array(CHUNK_SIZE * CHUNK_SIZE);
    const decor = new Uint8Array(CHUNK_SIZE * CHUNK_SIZE);

    for (let ty=0; ty<CHUNK_SIZE; ty++){
      for (let tx=0; tx<CHUNK_SIZE; tx++){
        const wx = cx * CHUNK_SIZE + tx;
        const wy = cy * CHUNK_SIZE + ty;
        const biome = biomeAt(wx, wy);
        const idx = ty * CHUNK_SIZE + tx;
        tiles[idx] = encodeBiome(biome);

        // simple tree placement
        if (biome === 'forest' && (fbm2D(wx + 333, wy + 777, { seed: worldSeed + 300, frequency: 0.05, octaves: 2 }) > 0.72)){
          decor[idx] = 1; // tree
        }
      }
    }

    return { tiles, decor, cx, cy };
  }

  function encodeBiome(b){
    switch(b){
      case 'deepWater': return 0;
      case 'shallowWater': return 1;
      case 'sand': return 2;
      case 'grass': return 3;
      case 'forest': return 4;
      case 'rock': return 5;
      case 'snow': return 6;
      default: return 3;
    }
  }
  function decodeBiome(v){
    switch(v){
      case 0: return 'deepWater';
      case 1: return 'shallowWater';
      case 2: return 'sand';
      case 3: return 'grass';
      case 4: return 'forest';
      case 5: return 'rock';
      case 6: return 'snow';
      default: return 'grass';
    }
  }

  function getChunk(cx, cy){
    const k = key(cx, cy);
    if (!chunks.has(k)) chunks.set(k, generateChunk(cx, cy));
    return chunks.get(k);
  }

  function forVisibleChunks(camera, canvas){
    const tilesWide = Math.ceil(canvas.width / DRAW_TILE) + 2;
    const tilesHigh = Math.ceil(canvas.height / DRAW_TILE) + 2;
    const camTileX = Math.floor(camera.x / TILE_SIZE);
    const camTileY = Math.floor(camera.y / TILE_SIZE);

    const minTileX = camTileX - Math.floor(tilesWide/2);
    const minTileY = camTileY - Math.floor(tilesHigh/2);
    const maxTileX = minTileX + tilesWide;
    const maxTileY = minTileY + tilesHigh;

    const minChunkX = Math.floor(minTileX / CHUNK_SIZE);
    const minChunkY = Math.floor(minTileY / CHUNK_SIZE);
    const maxChunkX = Math.floor(maxTileX / CHUNK_SIZE);
    const maxChunkY = Math.floor(maxTileY / CHUNK_SIZE);

    let count = 0;
    for (let cy=minChunkY; cy<=maxChunkY; cy++){
      for (let cx=minChunkX; cx<=maxChunkX; cx++){
        getChunk(cx, cy); count++;
      }
    }
    return count;
  }

  function getTileAt(worldTileX, worldTileY){
    const cx = Math.floor(worldTileX / CHUNK_SIZE);
    const cy = Math.floor(worldTileY / CHUNK_SIZE);
    const chunk = getChunk(cx, cy);
    const tx = worldTileX - cx * CHUNK_SIZE;
    const ty = worldTileY - cy * CHUNK_SIZE;
    const idx = ty * CHUNK_SIZE + tx;
    return decodeBiome(chunk.tiles[idx]);
  }

  function isWater(tile){ return tile === 'deepWater' || tile === 'shallowWater'; }

  function draw(ctx, camera, canvas){
    const tilesWide = Math.ceil(canvas.width / DRAW_TILE) + 2;
    const tilesHigh = Math.ceil(canvas.height / DRAW_TILE) + 2;
    const camTileX = Math.floor(camera.x / TILE_SIZE);
    const camTileY = Math.floor(camera.y / TILE_SIZE);

    const offsetX = Math.floor(canvas.width/2 - (camera.x % TILE_SIZE) * PIXEL_SCALE);
    const offsetY = Math.floor(canvas.height/2 - (camera.y % TILE_SIZE) * PIXEL_SCALE);

    const startTileX = camTileX - Math.floor(tilesWide/2);
    const startTileY = camTileY - Math.floor(tilesHigh/2);

    const p = window.Assets.PALETTE;

    for (let y=0; y<tilesHigh; y++){
      for (let x=0; x<tilesWide; x++){
        const wx = startTileX + x;
        const wy = startTileY + y;
        const tile = getTileAt(wx, wy);

        let color = p.grass;
        if (tile === 'deepWater') color = p.waterDeep;
        else if (tile === 'shallowWater') color = p.waterShallow;
        else if (tile === 'sand') color = p.sand;
        else if (tile === 'forest') color = p.forest;
        else if (tile === 'rock') color = p.rock;
        else if (tile === 'snow') color = p.snow;

        ctx.fillStyle = color;
        ctx.fillRect(offsetX + x*DRAW_TILE, offsetY + y*DRAW_TILE, DRAW_TILE, DRAW_TILE);
      }
    }

    // simple decor pass (trees)
    const minChunkX = Math.floor(startTileX / CHUNK_SIZE);
    const minChunkY = Math.floor(startTileY / CHUNK_SIZE);
    const maxChunkX = Math.floor((startTileX + tilesWide) / CHUNK_SIZE);
    const maxChunkY = Math.floor((startTileY + tilesHigh) / CHUNK_SIZE);

    ctx.fillStyle = window.Assets.PALETTE.treeTrunk;

    for (let cy=minChunkY; cy<=maxChunkY; cy++){
      for (let cx=minChunkX; cx<=maxChunkX; cx++){
        const chunk = getChunk(cx, cy);
        for (let ty=0; ty<CHUNK_SIZE; ty++){
          for (let tx=0; tx<CHUNK_SIZE; tx++){
            const idx = ty * CHUNK_SIZE + tx;
            if (chunk.decor[idx] === 1){
              const wx = cx * CHUNK_SIZE + tx;
              const wy = cy * CHUNK_SIZE + ty;
              const sx = offsetX + (wx - startTileX) * DRAW_TILE;
              const sy = offsetY + (wy - startTileY) * DRAW_TILE;
              // trunk
              ctx.fillStyle = window.Assets.PALETTE.treeTrunk;
              ctx.fillRect(sx + 6, sy + 10, 6, 10);
              // leaves
              ctx.fillStyle = window.Assets.PALETTE.treeLeaf;
              ctx.fillRect(sx + 2, sy + 2, 14, 10);
            }
          }
        }
      }
    }
  }

  function getSeed(){ return worldSeed; }
  function setSeed(s){ worldSeed = s|0; chunks.clear(); }

  window.World = { TILE_SIZE, PIXEL_SCALE, DRAW_TILE, CHUNK_SIZE, draw, getTileAt, isWater, forVisibleChunks, getSeed, setSeed };
})();