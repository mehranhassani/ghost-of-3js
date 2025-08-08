(function(){
  const Camera = {
    x: 0,
    y: 0,
    lerpFactor: 0.15,
    follow(targetX, targetY){
      this.x += (targetX - this.x) * this.lerpFactor;
      this.y += (targetY - this.y) * this.lerpFactor;
    },
  };

  window.Camera = Camera;
})();