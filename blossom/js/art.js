/** Procedural textures & rich drawing helpers */
window.BlossomArt = (function () {
  const cache = {};
  let grassPattern = null;

  function parseHex(hex) {
    const h = (hex || '#888').replace('#', '');
    const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16);
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
  }

  function mixColor(hex, hex2, t) {
    const a = parseHex(hex);
    const b = parseHex(hex2);
    const r = Math.round(a.r + (b.r - a.r) * t);
    const g = Math.round(a.g + (b.g - a.g) * t);
    const bl = Math.round(a.b + (b.b - a.b) * t);
    return `rgb(${r},${g},${bl})`;
  }

  function shade(hex, amt) {
    const { r, g, b } = parseHex(hex);
    const f = 1 + amt;
    return `rgb(${Math.min(255, Math.max(0, Math.round(r * f)))},${Math.min(255, Math.max(0, Math.round(g * f)))},${Math.min(255, Math.max(0, Math.round(b * f)))})`;
  }

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
    for (let i = 0; i < w * h * 0.12; i += 1) {
      cx.fillStyle = accent;
      const sz = Math.random() > 0.7 ? 2 : 1;
      cx.fillRect(Math.random() * w, Math.random() * h, sz, sz);
    }
    cache[key] = ctx.createPattern(c, 'repeat');
    return cache[key];
  }

  function softShadow(ctx, fn) {
    ctx.save();
    ctx.shadowColor = 'rgba(15, 23, 42, 0.28)';
    ctx.shadowBlur = 14;
    ctx.shadowOffsetY = 6;
    fn();
    ctx.restore();
  }

  function drawCloud(ctx, x, y, scale, alpha) {
    const s = scale || 1;
    ctx.save();
    ctx.globalAlpha = alpha ?? 0.92;
    ctx.fillStyle = '#fff';
    const blobs = [[0, 0, 22], [18 * s, -6, 18], [-16 * s, -2, 16], [8 * s, -12, 14]];
    blobs.forEach(([ox, oy, r]) => {
      ctx.beginPath();
      ctx.arc(x + ox * s, y + oy, r * s, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();
  }

  function drawSun(ctx, x, y, r, anim) {
    const pulse = Math.sin(anim * 0.7) * 1.5;
    const glow = ctx.createRadialGradient(x, y, r * 0.1, x, y, r * 4.2);
    glow.addColorStop(0, 'rgba(253, 224, 71, 0.7)');
    glow.addColorStop(0.35, 'rgba(251, 191, 36, 0.22)');
    glow.addColorStop(1, 'rgba(251, 191, 36, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(x, y, r * 4.2, 0, Math.PI * 2);
    ctx.fill();
    const core = ctx.createRadialGradient(x - r * 0.25, y - r * 0.25, 0, x, y, r + pulse);
    core.addColorStop(0, '#fffbeb');
    core.addColorStop(0.45, '#fde047');
    core.addColorStop(1, '#f59e0b');
    ctx.fillStyle = core;
    ctx.beginPath();
    ctx.arc(x, y, r + pulse, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(253, 224, 71, 0.45)';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    for (let i = 0; i < 12; i += 1) {
      const a = (i / 12) * Math.PI * 2 + anim * 0.15;
      const len = 10 + (i % 2) * 6;
      ctx.beginPath();
      ctx.moveTo(x + Math.cos(a) * (r + 8), y + Math.sin(a) * (r + 8));
      ctx.lineTo(x + Math.cos(a) * (r + len + 10), y + Math.sin(a) * (r + len + 10));
      ctx.stroke();
    }
  }

  function drawMoon(ctx, x, y, r, anim) {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r * 2.5);
    g.addColorStop(0, 'rgba(254, 249, 195, 0.35)');
    g.addColorStop(1, 'rgba(254, 249, 195, 0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r * 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fef9c3';
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(148, 163, 184, 0.25)';
    ctx.beginPath();
    ctx.arc(x + r * 0.25, y - r * 0.1, r * 0.22, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x - r * 0.35, y + r * 0.2, r * 0.14, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawHills(ctx, floorY, colors, anim) {
    colors.forEach((col, i) => {
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.moveTo(0, floorY);
      for (let x = 0; x <= BlossomWorld.W + 60; x += 30) {
        const y = floorY - 48 - i * 32 + Math.sin(x * 0.006 + anim * 0.12 + i * 1.2) * 16
          + Math.cos(x * 0.015 + i) * 8;
        ctx.lineTo(x, y);
      }
      ctx.lineTo(BlossomWorld.W, floorY);
      ctx.closePath();
      ctx.fill();
    });
  }

  function drawAwning(ctx, x, y, w, color) {
    const stripes = 7;
    const sw = w / stripes;
    for (let i = 0; i < stripes; i++) {
      ctx.fillStyle = i % 2 ? shade(color, -0.12) : color;
      ctx.beginPath();
      ctx.moveTo(x + i * sw, y);
      ctx.lineTo(x + (i + 1) * sw, y);
      ctx.lineTo(x + (i + 1) * sw, y + 28 + (i % 2 ? 4 : 0));
      ctx.lineTo(x + i * sw, y + 28);
      ctx.closePath();
      ctx.fill();
    }
    ctx.strokeStyle = 'rgba(0,0,0,0.15)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, y + 28);
    for (let i = 0; i <= w; i += 20) ctx.lineTo(x + i, y + 30 + (i % 40 === 0 ? 6 : 2));
    ctx.stroke();
  }

  function drawWindow(ctx, x, y, w, h, anim, lit) {
    ctx.fillStyle = shade('#fef3c7', -0.08);
    ctx.fillRect(x - 4, y - 4, w + 8, h + 8);
    const g = ctx.createLinearGradient(x, y, x + w, y + h);
    g.addColorStop(0, lit ? '#e0f2fe' : '#cbd5e1');
    g.addColorStop(0.5, lit ? '#7dd3fc' : '#94a3b8');
    g.addColorStop(1, lit ? '#38bdf8' : '#64748b');
    ctx.fillStyle = g;
    ctx.fillRect(x, y, w, h);
    if (lit) {
      ctx.fillStyle = `rgba(255, 255, 220, ${0.22 + Math.sin(anim * 1.5) * 0.06})`;
      ctx.fillRect(x + 5, y + 5, w * 0.42, h * 0.55);
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      ctx.fillRect(x + w * 0.55, y + 8, w * 0.25, h * 0.2);
    }
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 2.5;
    ctx.strokeRect(x, y, w, h);
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x + w / 2, y);
    ctx.lineTo(x + w / 2, y + h);
    ctx.moveTo(x, y + h / 2);
    ctx.lineTo(x + w, y + h / 2);
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.fillRect(x + 2, y + 2, w - 4, 3);
  }

  function drawDoor(ctx, x, y, w, h, color) {
    const g = ctx.createLinearGradient(x, y, x + w, y);
    g.addColorStop(0, shade(color, -0.15));
    g.addColorStop(0.5, color);
    g.addColorStop(1, shade(color, 0.1));
    ctx.fillStyle = g;
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = shade(color, -0.25);
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, w, h);
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.arc(x + w - 10, y + h / 2, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    ctx.fillRect(x + 6, y + 8, w - 14, h * 0.35);
  }

  function drawGrassBlades(ctx, x, y, w, h, anim) {
    for (let i = 0; i < Math.floor(w / 6); i++) {
      const gx = x + i * 6 + (i % 4);
      const sway = Math.sin(anim * 2.2 + i * 0.4) * 2.5;
      const gh = 8 + (i % 5) * 2;
      ctx.strokeStyle = i % 3 === 0 ? '#15803d' : i % 3 === 1 ? '#22c55e' : '#4ade80';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(gx, y + h);
      ctx.quadraticCurveTo(gx + sway, y + h - gh * 0.5, gx + sway * 0.6, y + h - gh);
      ctx.stroke();
    }
  }

  function drawWoodPlanks(ctx, x, y, w, h) {
    const plankH = 22;
    for (let row = 0; row < h / plankH; row++) {
      const py = y + row * plankH;
      const g = ctx.createLinearGradient(x, py, x, py + plankH);
      g.addColorStop(0, shade('#b8956b', 0.08));
      g.addColorStop(0.5, '#b8956b');
      g.addColorStop(1, shade('#9a7b55', -0.05));
      ctx.fillStyle = g;
      ctx.fillRect(x, py, w, plankH - 2);
      ctx.strokeStyle = 'rgba(0,0,0,0.08)';
      ctx.beginPath();
      ctx.moveTo(x, py + plankH - 1);
      ctx.lineTo(x + w, py + plankH - 1);
      ctx.stroke();
    }
  }

  function drawShopBuilding(ctx, p, anim, theme) {
    const { x, y, w, h } = p;
    const { wall, trim, awning, sign, door } = theme;
    softShadow(ctx, () => {
      const wg = ctx.createLinearGradient(x, y + 40, x + w, y + h);
      wg.addColorStop(0, shade(wall, 0.06));
      wg.addColorStop(1, shade(wall, -0.12));
      ctx.fillStyle = wg;
      ctx.fillRect(x, y + 40, w, h - 40);
    });
    ctx.fillStyle = trim;
    ctx.fillRect(x, y + 38, w, 6);
    drawAwning(ctx, x - 3, y + 24, w + 6, awning);
    drawWindow(ctx, x + 16, y + 68, (w - 40) * 0.45, 52, anim, true);
    drawWindow(ctx, x + w - 16 - (w - 40) * 0.45, y + 68, (w - 40) * 0.45, 52, anim, true);
    drawDoor(ctx, x + w / 2 - 18, y + h - 58, 36, 52, door || '#92400e');
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.font = 'bold 13px Fredoka, Nunito, sans-serif';
    ctx.fillText(sign, x + 10, y + 20);
  }

  function drawNpcBonnie(ctx, x, y, anim, near) {
    const bob = Math.sin(anim * 2) * 2;
    const wave = near ? Math.sin(anim * 6) * 0.35 : 0;
    const blink = Math.sin(anim * 0.9) > 0.92;
    const py = y + bob;
    if (near) {
      const g = ctx.createRadialGradient(x, py - 20, 10, x, py - 20, 55);
      g.addColorStop(0, 'rgba(250, 204, 21, 0.45)');
      g.addColorStop(1, 'rgba(250, 204, 21, 0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.ellipse(x, py - 20, 55, 60, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = 'rgba(15, 23, 42, 0.2)';
    ctx.beginPath();
    ctx.ellipse(x, py + 4, 18, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    const skin = '#f5d0a8';
    const apron = '#fda4af';
    const dress = '#fce7f3';
    ctx.fillStyle = shade(dress, -0.08);
    ctx.beginPath();
    ctx.moveTo(x - 20, py - 8);
    ctx.lineTo(x + 20, py - 8);
    ctx.lineTo(x + 16, py + 26);
    ctx.lineTo(x - 16, py + 26);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = apron;
    ctx.fillRect(x - 14, py - 6, 28, 22);
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.fillRect(x - 10, py - 2, 8, 14);
    ctx.fillStyle = shade(apron, -0.15);
    ctx.fillRect(x - 16, py + 18, 32, 4);
    ctx.fillStyle = skin;
    ctx.beginPath();
    ctx.ellipse(x, py - 44, 15, 17, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.beginPath();
    ctx.ellipse(x - 5, py - 48, 5, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#be185d';
    ctx.beginPath();
    ctx.arc(x, py - 56, 16, Math.PI, 0);
    ctx.fill();
    ctx.fillStyle = shade('#be185d', 0.1);
    roundRect(ctx, x - 18, py - 58, 36, 8, 4);
    ctx.fill();
    if (!blink) {
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.ellipse(x - 6, py - 46, 4, 5, 0, 0, Math.PI * 2);
      ctx.ellipse(x + 6, py - 46, 4, 5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#831843';
      ctx.beginPath();
      ctx.arc(x - 6, py - 45, 2, 0, Math.PI * 2);
      ctx.arc(x + 6, py - 45, 2, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.strokeStyle = '#831843';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x - 9, py - 45);
      ctx.lineTo(x - 3, py - 45);
      ctx.moveTo(x + 3, py - 45);
      ctx.lineTo(x + 9, py - 45);
      ctx.stroke();
    }
    if (near) {
      ctx.save();
      ctx.translate(x + 22, py - 18);
      ctx.rotate(-0.6 + wave);
      ctx.fillStyle = skin;
      roundRect(ctx, -4, -4, 10, 18, 4);
      ctx.fill();
      ctx.restore();
    }
    ctx.fillStyle = '#f9a8d4';
    ctx.beginPath();
    ctx.ellipse(x - 10, py - 40, 3, 2, 0, 0, Math.PI * 2);
    ctx.ellipse(x + 10, py - 40, 3, 2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(x - 7, py - 46, 7, 5, 0, 0, Math.PI * 2);
    ctx.ellipse(x + 7, py - 46, 7, 5, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = '#1e293b';
    ctx.font = 'bold 11px Nunito, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Bonnie', x, py - 66);
    ctx.textAlign = 'left';
  }

  function roundRect(ctx, x, y, w, h, r) {
    const rad = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + rad, y);
    ctx.arcTo(x + w, y, x + w, y + h, rad);
    ctx.arcTo(x + w, y + h, x, y + h, rad);
    ctx.arcTo(x, y + h, x, y, rad);
    ctx.arcTo(x, y, x + w, y, rad);
    ctx.closePath();
  }

  function drawStage(ctx, p, anim) {
    const { x, y, w, h } = p;
    softShadow(ctx, () => {
      ctx.fillStyle = '#312e81';
      ctx.fillRect(x, y + 42, w, h - 42);
    });
    const rg = ctx.createLinearGradient(x, y, x + w, y + 60);
    rg.addColorStop(0, '#a855f7');
    rg.addColorStop(1, '#6d28d9');
    ctx.fillStyle = rg;
    ctx.beginPath();
    ctx.moveTo(x - 12, y + 48);
    ctx.lineTo(x + w / 2, y);
    ctx.lineTo(x + w + 12, y + 48);
    ctx.closePath();
    ctx.fill();
    drawAwning(ctx, x, y + 36, w, '#c026d3');
    const spot = 0.45 + Math.sin(anim * 3) * 0.18;
    const g = ctx.createRadialGradient(x + w / 2, y + 95, 8, x + w / 2, y + 110, 95);
    g.addColorStop(0, `rgba(253, 224, 71, ${spot})`);
    g.addColorStop(0.6, `rgba(253, 224, 71, ${spot * 0.3})`);
    g.addColorStop(1, 'rgba(253, 224, 71, 0)');
    ctx.fillStyle = g;
    ctx.fillRect(x, y + 52, w, h - 62);
    ctx.fillStyle = '#1e1b4b';
    ctx.fillRect(x + 18, y + 72, w - 36, h - 95);
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 2;
    ctx.strokeRect(x + 18, y + 72, w - 36, h - 95);
    ctx.fillStyle = '#fef08a';
    ctx.font = 'bold 14px Fredoka, Nunito, sans-serif';
    ctx.fillText('Harbor Stage', x + 12, y + 28);
  }

  function drawStudio(ctx, p, anim) {
    const { x, y, w, h } = p;
    const wg = ctx.createLinearGradient(x, y, x, y + h);
    wg.addColorStop(0, '#1e293b');
    wg.addColorStop(1, '#0f172a');
    ctx.fillStyle = wg;
    ctx.fillRect(x, y + 18, w, h - 18);
    ctx.fillStyle = '#38bdf8';
    ctx.shadowColor = 'rgba(56, 189, 248, 0.6)';
    ctx.shadowBlur = 12;
    ctx.fillRect(x + 10, y + 28, w - 20, 6);
    ctx.shadowBlur = 0;
    const pulse = 0.55 + Math.sin(anim * 5) * 0.35;
    ctx.fillStyle = `rgba(244, 114, 182, ${pulse})`;
    ctx.beginPath();
    ctx.arc(x + w / 2, y + 8, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#f472b6';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(x + w / 2, y + 55, 28, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = '#334155';
    ctx.fillRect(x + 22, y + 52, w - 44, h - 72);
    ctx.fillStyle = '#64748b';
    ctx.font = '9px Nunito, sans-serif';
    ctx.fillText('LIVE', x + w / 2 - 10, y + 48);
    ctx.fillStyle = '#fef08a';
    ctx.font = 'bold 12px Fredoka, Nunito, sans-serif';
    ctx.fillText('Film corner', x + 8, y + 16);
  }

  function drawBoutique(ctx, p, anim) {
    const { x, y, w, h } = p;
    const pulse = 0.5 + Math.sin(anim * 3) * 0.5;
    softShadow(ctx, () => {
      const bg = ctx.createLinearGradient(x, y + 40, x, y + h);
      bg.addColorStop(0, '#1e293b');
      bg.addColorStop(1, '#0f172a');
      ctx.fillStyle = bg;
      ctx.fillRect(x, y + 38, w, h - 38);
    });
    drawAwning(ctx, x - 5, y + 28, w + 10, '#ec4899');
    ctx.fillStyle = '#fce7f3';
    ctx.fillRect(x + 8, y + 54, w - 16, h - 78);
    for (let i = 0; i < 3; i++) {
      const cx = x + 26 + i * 30;
      ctx.strokeStyle = '#f9a8d4';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx, y + 58);
      ctx.lineTo(cx, y + h - 28);
      ctx.stroke();
      const hg = ctx.createLinearGradient(cx - 12, y + 66, cx + 12, y + 106);
      hg.addColorStop(0, `rgba(244, 114, 182, ${0.45 + pulse * 0.2})`);
      hg.addColorStop(1, `rgba(236, 72, 153, ${0.25 + pulse * 0.15})`);
      ctx.fillStyle = hg;
      ctx.fillRect(cx - 12, y + 66, 24, 42);
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      ctx.fillRect(cx - 8, y + 70, 6, 30);
    }
    drawWindow(ctx, x + w - 42, y + 68, 28, 36, anim, true);
    ctx.fillStyle = '#fef08a';
    ctx.font = 'bold 13px Fredoka, Nunito, sans-serif';
    ctx.fillText('✨ Bloom Boutique', x + 8, y + 22);
    ctx.font = '9px Nunito, sans-serif';
    ctx.fillStyle = '#fbcfe8';
    ctx.fillText('NEW styles!', x + 10, y + 48);
  }

  function drawSalonRich(ctx, p, anim) {
    const { x, y, w, h } = p;
    softShadow(ctx, () => {
      const wg = ctx.createLinearGradient(x, y + 35, x + w, y + h);
      wg.addColorStop(0, '#312e81');
      wg.addColorStop(1, '#1e1b4b');
      ctx.fillStyle = wg;
      ctx.fillRect(x, y + 35, w, h - 35);
    });
    drawAwning(ctx, x - 5, y + 26, w + 10, '#a78bfa');
    ctx.fillStyle = '#ede9fe';
    ctx.fillRect(x + 8, y + 54, w - 16, h - 72);
    drawWindow(ctx, x + 18, y + 72, 38, 48, anim, true);
    drawWindow(ctx, x + w - 56, y + 72, 38, 48, anim, true);
    ctx.fillStyle = '#f9a8d4';
    ctx.fillRect(x + w / 2 - 28, y + h - 38, 56, 28);
    ctx.fillStyle = shade('#f9a8d4', -0.12);
    ctx.fillRect(x + w / 2 - 22, y + h - 34, 44, 6);
    ctx.fillStyle = '#fef08a';
    ctx.font = 'bold 14px Fredoka, Nunito, sans-serif';
    ctx.fillText('Bonnie\'s Salon', x + 10, y + 22);
    ctx.font = '10px Nunito, sans-serif';
    ctx.fillStyle = '#ddd6fe';
    ctx.fillText('✂ Now hiring Lv3+', x + 10, y + 48);
  }

  function vignette(ctx, w, h, strength) {
    const g = ctx.createRadialGradient(w / 2, h / 2, h * 0.28, w / 2, h / 2, h * 0.92);
    g.addColorStop(0, 'rgba(0,0,0,0)');
    g.addColorStop(1, `rgba(15,23,42,${strength ?? 0.18})`);
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
    } else {
      const g = ctx.createLinearGradient(x, y, x, y + h);
      g.addColorStop(0, '#4ade80');
      g.addColorStop(1, '#16a34a');
      ctx.fillStyle = g;
      ctx.fillRect(x, y, w, h);
    }
  }

  function warmLight(ctx, x, y, r, alpha) {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, `rgba(253, 224, 71, ${alpha ?? 0.12})`);
    g.addColorStop(1, 'rgba(253, 224, 71, 0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  loadAssets();

  return {
    shade,
    mixColor,
    noisePattern,
    drawSun,
    drawMoon,
    drawCloud,
    drawHills,
    drawAwning,
    drawWindow,
    drawDoor,
    drawNpcBonnie,
    drawStage,
    drawStudio,
    drawSalonRich,
    drawBoutique,
    drawShopBuilding,
    drawGrassBlades,
    drawWoodPlanks,
    vignette,
    grassFill,
    warmLight,
    softShadow,
    roundRect,
  };
})();