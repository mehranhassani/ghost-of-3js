(function(){
  const PALETTE = {
    waterDeep: '#3a5a98',
    waterShallow: '#4f78c7',
    sand: '#d7c497',
    grass: '#78b159',
    forest: '#4e8b37',
    rock: '#7b7b7b',
    snow: '#e9f1f7',
    treeTrunk: '#5b3a29',
    treeLeaf: '#2f6a2f',
    playerCloak: '#22252b',
    playerHat: '#f5d38a',
    playerFace: '#f1c27d',
  };

  function drawPlayer(ctx, x, y, scale){
    const s = scale | 0; // pixel size
    // 8x8 simple pixel sprite
    // Hat and face
    ctx.fillStyle = PALETTE.playerHat; ctx.fillRect(x + 2*s, y + 0*s, 4*s, 1*s);
    ctx.fillStyle = PALETTE.playerFace; ctx.fillRect(x + 3*s, y + 1*s, 2*s, 2*s);
    // Cloak body
    ctx.fillStyle = PALETTE.playerCloak; ctx.fillRect(x + 2*s, y + 3*s, 4*s, 4*s);
    // Feet
    ctx.fillStyle = '#1b1b1b'; ctx.fillRect(x + 2*s, y + 7*s, 1*s, 1*s);
    ctx.fillRect(x + 5*s, y + 7*s, 1*s, 1*s);
  }

  window.Assets = { PALETTE, drawPlayer };
})();