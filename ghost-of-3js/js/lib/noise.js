// Minimal seeded 2D value noise with fBM
// Public domain style implementation

(function(global){
  function mulberry32(seed){
    let t = seed >>> 0;
    return function(){
      t += 0x6D2B79F5;
      let r = Math.imul(t ^ (t >>> 15), 1 | t);
      r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
      return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
    };
  }

  function xorshift32(x){
    x ^= x << 13; x ^= x >>> 17; x ^= x << 5;
    return x >>> 0;
  }

  function hash2d(x, y, seed){
    let h = 0x811C9DC5 ^ seed;
    h ^= (x & 0xffff) + ((x >>> 16) * 0x45d9f3b);
    h = xorshift32(h);
    h ^= (y & 0xffff) + ((y >>> 16) * 0x45d9f3b);
    h = xorshift32(h);
    return (h & 0xffffffff) / 4294967296;
  }

  function smoothstep(t){
    return t * t * (3 - 2 * t);
  }

  function lerp(a, b, t){
    return a + (b - a) * t;
  }

  function valueNoise2D(x, y, seed){
    const xi = Math.floor(x);
    const yi = Math.floor(y);
    const xf = x - xi;
    const yf = y - yi;

    const v00 = hash2d(xi, yi, seed);
    const v10 = hash2d(xi + 1, yi, seed);
    const v01 = hash2d(xi, yi + 1, seed);
    const v11 = hash2d(xi + 1, yi + 1, seed);

    const u = smoothstep(xf);
    const v = smoothstep(yf);

    const x1 = lerp(v00, v10, u);
    const x2 = lerp(v01, v11, u);
    return lerp(x1, x2, v);
  }

  function fbm2D(x, y, options){
    const {
      seed = 1337,
      octaves = 5,
      lacunarity = 2.0,
      gain = 0.5,
      frequency = 0.01,
    } = options || {};

    let amp = 1.0;
    let freq = frequency;
    let sum = 0.0;
    let ampSum = 0.0;

    for(let i=0;i<octaves;i++){
      sum += valueNoise2D(x * freq, y * freq, seed + i * 1013) * amp;
      ampSum += amp;
      amp *= gain;
      freq *= lacunarity;
    }
    return sum / ampSum; // 0..1
  }

  function seededRandom(seed){
    const rand = mulberry32(seed);
    return {
      next: () => rand(),
      range: (min, max) => min + (max - min) * rand(),
      int: (min, max) => Math.floor(min + (max - min + 1) * rand()),
    };
  }

  const NoiseLib = { fbm2D, valueNoise2D, seededRandom };
  if (typeof module !== 'undefined' && module.exports){
    module.exports = NoiseLib;
  } else {
    global.NoiseLib = NoiseLib;
  }
})(typeof window !== 'undefined' ? window : globalThis);