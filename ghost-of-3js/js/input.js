(function(){
  const keys = new Set();
  let autopilot = false;

  function onKeyDown(e){ keys.add(e.key.toLowerCase()); }
  function onKeyUp(e){ keys.delete(e.key.toLowerCase()); }

  function isDown(k){ return keys.has(k.toLowerCase()); }
  function setAutopilot(v){ autopilot = !!v; }
  function getAutopilot(){ return autopilot; }

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);

  window.Input = { isDown, setAutopilot, getAutopilot };
})();