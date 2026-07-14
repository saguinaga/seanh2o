/** Location weather — rain, leaves */
window.BlossomWeather = (function () {
  function typeFor(locId, phaseId, day) {
    if (locId === 'street' && (phaseId === 'evening' || (day || 1) % 4 === 0)) return 'rain';
    if (locId === 'pch' && phaseId === 'morning' && (day || 1) % 3 === 0) return 'rain';
    if (locId === 'pacCity' && (phaseId === 'afternoon' || phaseId === 'evening')) return 'leaves';
    if (locId === 'park' && (phaseId === 'afternoon' || phaseId === 'evening')) return 'leaves';
    return 'none';
  }

  function drawRain(ctx, w, h, floorY, anim) {
    ctx.save();
    ctx.strokeStyle = 'rgba(186, 230, 253, 0.45)';
    ctx.lineWidth = 1.2;
    for (let i = 0; i < 90; i++) {
      const rx = (i * 47 + anim * 180) % (w + 40) - 20;
      const ry = (i * 31 + anim * 220) % (floorY + 20);
      ctx.beginPath();
      ctx.moveTo(rx, ry);
      ctx.lineTo(rx - 4, ry + 14);
      ctx.stroke();
    }
    const rg = ctx.createLinearGradient(0, floorY - 40, 0, floorY + 30);
    rg.addColorStop(0, 'rgba(148, 163, 184, 0)');
    rg.addColorStop(1, 'rgba(148, 163, 184, 0.12)');
    ctx.fillStyle = rg;
    ctx.fillRect(0, floorY - 20, w, 50);
    ctx.restore();
  }

  function drawLeaves(ctx, w, h, floorY, anim) {
    const colors = ['#f97316', '#eab308', '#84cc16', '#dc2626'];
    for (let i = 0; i < 28; i++) {
      const lx = (i * 73 + anim * 35) % (w + 30) - 15;
      const ly = (i * 41 + anim * 28) % (floorY - 40) + 30;
      const sway = Math.sin(anim * 2 + i) * 6;
      ctx.save();
      ctx.translate(lx, ly);
      ctx.rotate(Math.sin(anim + i * 0.5) * 0.8);
      ctx.fillStyle = colors[i % colors.length];
      ctx.globalAlpha = 0.75;
      ctx.beginPath();
      ctx.ellipse(sway, 0, 5, 3, 0.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    ctx.globalAlpha = 1;
  }

  function draw(ctx, w, h, floorY, weather, anim) {
    if (weather === 'rain') drawRain(ctx, w, h, floorY, anim);
    else if (weather === 'leaves') drawLeaves(ctx, w, h, floorY, anim);
  }

  return { typeFor, draw };
})();