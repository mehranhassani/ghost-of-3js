// Simple noise utility as fallback if SimplexNoise library fails
class SimpleNoise {
    constructor() {
        this.permutation = this.generatePermutation();
    }
    
    generatePermutation() {
        const p = [];
        for (let i = 0; i < 256; i++) {
            p[i] = Math.floor(Math.random() * 256);
        }
        return p.concat(p); // Duplicate for overflow
    }
    
    fade(t) {
        return t * t * t * (t * (t * 6 - 15) + 10);
    }
    
    lerp(t, a, b) {
        return a + t * (b - a);
    }
    
    grad(hash, x, y) {
        const h = hash & 15;
        const u = h < 8 ? x : y;
        const v = h < 4 ? y : h === 12 || h === 14 ? x : 0;
        return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
    }
    
    noise2D(x, y) {
        const X = Math.floor(x) & 255;
        const Y = Math.floor(y) & 255;
        
        x -= Math.floor(x);
        y -= Math.floor(y);
        
        const u = this.fade(x);
        const v = this.fade(y);
        
        const A = this.permutation[X] + Y;
        const B = this.permutation[X + 1] + Y;
        
        return this.lerp(v,
            this.lerp(u, this.grad(this.permutation[A], x, y),
                        this.grad(this.permutation[B], x - 1, y)),
            this.lerp(u, this.grad(this.permutation[A + 1], x, y - 1),
                        this.grad(this.permutation[B + 1], x - 1, y - 1))
        ) * 0.5 + 0.5; // Normalize to 0-1 range
    }
}

// Ensure noise functions are available globally
if (typeof SimplexNoise === 'undefined') {
    console.warn('SimplexNoise library not found, using fallback noise generator');
    window.SimplexNoise = SimpleNoise;
}
