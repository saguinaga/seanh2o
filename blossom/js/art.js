/** Procedural textures & rich drawing helpers — CC0 grass tile optional */
window.BlossomArt = (function () {
  const cache = {};
  let grassPattern = null;

  function loadAssets() {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = 'assets/grass-tile.png';
    img.onload = () => {
      const c = document.createElement('canvas');
      c.width = c.height = 64;
      const cx = c.getContext('2d');
      cx.drawImage(img, 0, 0, 64, 64);
      grassPattern = cx.createPattern(c, 'repeat');
    };
  }

  function noisePattern(ctx, w, h, base, accent) {
    const key = `${w}x${h}-${base}-${accent}`;
    if (cache[key]) return cache[key];
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    const cx = c.getContext('2d');
    cx.fillStyle = base;
    cx.fillRect(0, 0, w, h);
    for (let i = 0; i < w * h * 0.08; i += 1) {
      cx.fillStyle = accent;
      cx.fillRect(Math.random() * w, Math.random() * h, 1, 1);
    }
    cache[key] = ctx.createPattern(c, 'repeat');
    return cache[key];
  }

  function drawSun(ctx, x, y, r, anim) {
    const glow = ctx.createRadialGradient(x, y, r * 0.2, x, y, r * 3.5);
    glow.addColorStop(0, 'rgba(253, 224, 71, 0.55)');
    glow.addColorStop(0.4, 'rgba(251, 191, 36, 0.15)');
    glow.addColorStop(1, 'rgba(251, 191, 36, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(x, y, r * 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fde047';
    ctx.beginPath();
    ctx.arc(x, y, r + Math.sin(anim * 0.7) * 1.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(253, 224, 71, 0.5)';
    ctx.lineWidth = 3;
    for (let i = 0; i < 8; i += 1) {
      const a = (i / 8) * Math.PI * 2 + anim * 0.2;
      ctx.beginPath();
      ctx.moveTo(x + Math.cos(a) * (r + 6), y + Math.sin(a) * (r + 6));
      ctx.lineTo(x + Math.cos(a) * (r + 18), y + Math.sin(a) * (r + 18));
      ctx.stroke();
    }
  }

  function drawHills(ctx, floorY, colors, anim) {
    colors.forEach((col, i) => {
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.moveTo(0, floorY);
      for (let x = 0; x <= BlossomWorld.W + 40; x += 40) {
        const y = floorY - 40 - i * 28 + Math.sin(x * 0.008 + anim * 0.15 + i) * 12;
        ctx.lineTo(x, y);
      }
      ctx.lineTo(BlossomWorld.W, floorY);
      ctx.closePath();
      ctx.fill();
    });
  }

  function drawAwning(ctx, x, y, w, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x, y);
    for (let i = 0; i <= w; i += 20) {
      ctx.lineTo(x + i, y + (i % 40 === 0 ? 14 : 8));
    }
    ctx.lineTo(x + w, y + 30);
    ctx.lineTo(x, y + 30);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.12)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  function drawWindow(ctx, x, y, w, h, anim, lit) {
    ctx.fillStyle = '#fef3c7';
    ctx.fillRect(x - 3, y - 3, w + 6, h + 6);
    const g = ctx.createLinearGradient(x, y, x + w, y + h);
    g.addColorStop(0, lit ? '#bae6fd' : '#cbd5e1');
    g.addColorStop(1, lit ? '#7dd3fc' : '#94a3b8');
    ctx.fillStyle = g;
    ctx.fillRect(x, y, w, h);
    if (lit) {
      ctx.fillStyle = `rgba(255, 255, 200, ${0.15 + Math.sin(anim) * 0.05})`;
      ctx.fillRect(x + 4, y + 4, w * 0.4, h * 0.5);
    }
    ctx.strokeStyle = '#92400e';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, w, h);
    ctx.beginPath();
    ctx.moveTo(x + w / 2, y);
    ctx.lineTo(x + w / 2, y + h);
    ctx.moveTo(x, y + h / 2);
    ctx.lineTo(x + w, y + h / 2);
    ctx.stroke();
  }

  function drawNpcBonnie(ctx, x, y, anim, near) {
    const bob = Math.sin(anim * 2) * 2;
    const py = y + bob;
    if (near) {
      ctx.strokeStyle = 'rgba(250, 204, 21, 0.8)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.ellipse(x, py - 20, 28, 50, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    ctx.beginPath();
    ctx.ellipse(x, py + 2, 16, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fce7f3';
    ctx.beginPath();
    ctx.moveTo(x - 18, py - 10);
    ctx.lineTo(x + 18, py - 10);
    ctx.lineTo(x + 14, py + 22);
    ctx.lineTo(x - 14, py + 22);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#fda4af';
    ctx.fillRect(x - 16, py - 28, 32, 20);
    ctx.fillStyle = '#f5d0a8';
    ctx.beginPath();
    ctx.ellipse(x, py - 42, 14, 15, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#be185d';
    ctx.beginPath();
    ctx.arc(x, py - 52, 15, Math.PI, 0);
    ctx.fill();
    ctx.fillStyle = '#1e293b';
    ctx.font = 'bold 11px Nunito, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Bonnie', x, py - 58);
    ctx.textAlign = 'left';
  }

  function drawStage(ctx, p, anim) {
    const { x, y, w, h } = p;
    ctx.fillStyle = '#4c1d95';
    ctx.fillRect(x, y + 40, w, h - 40);
    ctx.fillStyle = '#7c3aed';
    ctx.beginPath();
    ctx.moveTo(x - 10, y + 45);
    ctx.lineTo(x + w / 2, y);
    ctx.lineTo(x + w + 10, y + 45);
    ctx.closePath();
    ctx.fill();
    drawAwning(ctx, x, y + 38, w, '#c026d3');
    ctx.fillStyle = '#1e1b4b';
    ctx.fillRect(x + 15, y + 70, w - 30, h - 90);
    const spot = 0.4 + Math.sin(anim * 3) * 0.15;
    const g = ctx.createRadialGradient(x + w / 2, y + 90, 5, x + w / 2, y + 100, 80);
    g.addColorStop(0, `rgba(253, 224, 71, ${spot})`);
    g.addColorStop(1, 'rgba(253, 224, 71, 0)');
    ctx.fillStyle = g;
    ctx.fillRect(x, y + 50, w, h - 60);
    ctx.fillStyle = '#fef08a';
    ctx.font = 'bold 13px Fredoka, Nunito, sans-serif';
    ctx.fillText('Harbor Stage', x + 12, y + 28);
  }

  function drawStudio(ctx, p, anim) {
    const { x, y, w, h } = p;
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(x, y + 20, w, h - 20);
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(x + 10, y + 30, w - 20, 8);
    ctx.fillStyle = '#f472b6';
    ctx.globalAlpha = 0.5 + Math.sin(anim * 5) * 0.3;
    ctx.beginPath();
    ctx.arc(x + w / 2, y + 10, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(x + 20, y + 50, w - 40, h - 70);
    ctx.fillStyle = '#64748b';
    ctx.font = '10px Nunito, sans-serif';
    ctx.fillText('ring light', x + 22, y + 45);
    ctx.fillStyle = '#fef08a';
    ctx.font = 'bold 12px Fredoka, Nunito, sans-serif';
    ctx.fillText('Film corner', x + 8, y + 16);
  }

  function drawBoutique(ctx, p, anim) {
    const { x, y, w, h } = p;
    const pulse = 0.5 + Math.sin(anim * 3) * 0.5;
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(x, y + 38, w, h - 38);
    drawAwning(ctx, x - 4, y + 30, w + 8, '#f472b6');
    ctx.fillStyle = '#fce7f3';
    ctx.fillRect(x + 10, y + 55, w - 20, h - 75);
    for (let i = 0; i < 3; i++) {
      const cx = x + 28 + i * 32;
      ctx.strokeStyle = '#fda4af';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx, y + 60);
      ctx.lineTo(cx, y + h - 25);
      ctx.stroke();
      ctx.fillStyle = `rgba(244, 114, 182, ${0.3 + pulse * 0.2})`;
      ctx.fillRect(cx - 12, y + 68, 24, 40);
    }
    ctx.fillStyle = '#fef08a';
    ctx.font = 'bold 13px Fredoka, Nunito, sans-serif';
    ctx.fillText('✨ Bloom Boutique', x + 8, y + 22);
    ctx.font = '9px Nunito, sans-serif';
    ctx.fillStyle = '#be185d';
    ctx.fillText('NEW styles inside!', x + 10, y + 48);
  }

  function drawSalonRich(ctx, p, anim) {
    const { x, y, w, h } = p;
    ctx.fillStyle = '#1e1b4b';
    ctx.fillRect(x, y + 35, w, h - 35);
    drawAwning(ctx, x - 5, y + 28, w + 10, '#c4b5fd');
    ctx.fillStyle = '#ddd6fe';
    ctx.fillRect(x + 8, y + 55, w - 16, h - 70);
    drawWindow(ctx, x + 20, y + 75, 35, 45, anim, true);
    drawWindow(ctx, x + w - 55, y + 75, 35, 45, anim, true);
    ctx.fillStyle = '#f9a8d4';
    ctx.fillRect(x + w / 2 - 25, y + h - 35, 50, 25);
    ctx.fillStyle = '#fef08a';
    ctx.font = 'bold 14px Fredoka, Nunito, sans-serif';
    ctx.fillText('Bonnie\'s Salon', x + 10, y + 22);
    ctx.font = '10px Nunito, sans-serif';
    ctx.fillStyle = '#fce7f3';
    ctx.fillText('✂ Now hiring Lv3+', x + 10, y + 48);
  }

  function vignette(ctx, w, h) {
    const g = ctx.createRadialGradient(w / 2, h / 2, h * 0.35, w / 2, h / 2, h * 0.85);
    g.addColorStop(0, 'rgba(0,0,0,0)');
    g.addColorStop(1, 'rgba(15,23,42,0.12)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  }

  function grassFill(ctx, x, y, w, h) {
    if (grassPattern) {
      ctx.save();
      ctx.translate(x, y);
      ctx.fillStyle = grassPattern;
      ctx.fillRect(0, 0, w, h);
      ctx.restore();
    }
  }

  loadAssets();

  return {
    noisePattern,
    drawSun,
    drawHills,
    drawAwning,
    drawWindow,
    drawNpcBonnie,
    drawStage,
    drawStudio,
    drawSalonRich,
    drawBoutique,
    vignette,
    grassFill,
  };
})();