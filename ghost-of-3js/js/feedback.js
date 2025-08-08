(function(){
  const fpsEl = document.getElementById('fps');
  const posEl = document.getElementById('pos');
  const seedEl = document.getElementById('seed');
  const chunksEl = document.getElementById('chunks');
  const autoBtn = document.getElementById('autopilot');

  let frames = 0;
  let acc = 0;
  let fps = 0;

  function update(dt, player, camera, canvas){
    frames++; acc += dt;
    if (acc >= 0.5){
      fps = Math.round(frames / acc);
      frames = 0; acc = 0;
      fpsEl.textContent = 'FPS: ' + fps;
    }

    posEl.textContent = 'x:' + Math.floor(player.x) + ' y:' + Math.floor(player.y);
    seedEl.textContent = 'seed: ' + window.World.getSeed();
    const count = window.World.forVisibleChunks(camera, canvas);
    chunksEl.textContent = 'chunks: ' + count;
  }

  autoBtn.addEventListener('click', () => {
    const on = !window.Input.getAutopilot();
    window.Input.setAutopilot(on);
    autoBtn.textContent = 'Autopilot: ' + (on ? 'On' : 'Off');
  });

  window.Feedback = { update };
})();