(function(){
  const speed = 90; // world pixels per second
  const spriteScale = 2; // 8x8 * 2

  const Player = {
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    dir: 1,
    target: null,
    init(x, y){ this.x = x; this.y = y; },
    update(dt){
      const tsize = window.World.TILE_SIZE;
      let ax = 0, ay = 0;

      if (!window.Input.getAutopilot()){
        if (window.Input.isDown('arrowleft') || window.Input.isDown('a')) ax -= 1;
        if (window.Input.isDown('arrowright') || window.Input.isDown('d')) ax += 1;
        if (window.Input.isDown('arrowup') || window.Input.isDown('w')) ay -= 1;
        if (window.Input.isDown('arrowdown') || window.Input.isDown('s')) ay += 1;
      } else {
        // simple wander AI
        if (!this.target || distance(this.x, this.y, this.target.x, this.target.y) < 8){
          const angle = Math.random() * Math.PI * 2;
          const dist = 200 + Math.random() * 400;
          this.target = { x: this.x + Math.cos(angle) * dist, y: this.y + Math.sin(angle) * dist };
        }
        const dx = this.target.x - this.x;
        const dy = this.target.y - this.y;
        const len = Math.hypot(dx, dy) || 1;
        ax = dx / len;
        ay = dy / len;

        // avoid water
        const nextX = this.x + ax * speed * dt;
        const nextY = this.y + ay * speed * dt;
        const tile = window.World.getTileAt(Math.floor(nextX / tsize), Math.floor(nextY / tsize));
        if (window.World.isWater(tile)){
          // steer perpendicular
          const px = -ay, py = ax;
          ax = px; ay = py;
        }
      }

      const len = Math.hypot(ax, ay);
      if (len > 0){ ax /= len; ay /= len; this.dir = ax >= 0 ? 1 : -1; }

      this.vx = ax * speed;
      this.vy = ay * speed;
      this.x += this.vx * dt;
      this.y += this.vy * dt;
    },
    draw(ctx, camera){
      const s = spriteScale;
      const screenX = Math.floor(ctx.canvas.width/2 + (this.x - camera.x) * window.World.PIXEL_SCALE) - 4*s;
      const screenY = Math.floor(ctx.canvas.height/2 + (this.y - camera.y) * window.World.PIXEL_SCALE) - 4*s;
      ctx.save();
      if (this.dir < 0){
        ctx.translate(screenX + 8*s, 0);
        ctx.scale(-1, 1);
        window.Assets.drawPlayer(ctx, 0, screenY, s);
      } else {
        window.Assets.drawPlayer(ctx, screenX, screenY, s);
      }
      ctx.restore();
    }
  };

  function distance(x1, y1, x2, y2){ const dx = x2 - x1, dy = y2 - y1; return Math.hypot(dx, dy); }

  window.Player = Player;
})();