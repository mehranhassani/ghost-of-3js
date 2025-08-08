(function(){
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  function resize(){
    canvas.width = Math.floor(window.innerWidth);
    canvas.height = Math.floor(window.innerHeight);
  }
  window.addEventListener('resize', resize);
  resize();

  // init
  const startX = 0, startY = 0;
  window.Player.init(startX, startY);

  let last = performance.now();
  function loop(now){
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;

    // logic
    window.Player.update(dt);
    window.Camera.follow(window.Player.x, window.Player.y);

    // clear
    ctx.fillStyle = '#1d2230';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // world
    window.World.draw(ctx, window.Camera, canvas);

    // player
    window.Player.draw(ctx, window.Camera);

    // ui feedback
    window.Feedback.update(dt, window.Player, window.Camera, canvas);

    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();