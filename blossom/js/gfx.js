/** Lighting, shadows, parallax & presentation polish */
window.BlossomGfx = (function () {
  const W = () => window.BlossomWorld?.W ?? 800;
  const H = () => window.BlossomWorld?.H ?? 480;

  function groundShadow(ctx, cx, footY, rx, ry, alpha) {
    const g = ctx.createRadialGradient(cx, footY, 0, cx, footY, rx);
    g.addColorStop(0, `rgba(15, 23, 42, ${alpha ?? 0.38})`);
    g.addColorStop(0.55, `rgba(15, 23, 42, ${(alpha ?? 0.38) * 0.35})`);
    g.addColorStop(1, 'rgba(15, 23, 42, 0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(cx, footY, rx, ry ?? rx * 0.32, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  function contactShadow(ctx, x, y, w, h) {
    groundShadow(ctx, x + w / 2, y + h - 2, w * 0.42, 7, 0.32);
  }

  function ceilingLight(ctx, x, y, r, color, anim, phaseId) {
    const pulse = phaseId === 'night' ? 0.55 : 0.75 + Math.sin(anim * 1.2) * 0.12;
    const glow = ctx.createRadialGradient(x, y, 0, x, y, r * 2.8);
    glow.addColorStop(0, color.replace('ALPHA', String(pulse * 0.35)));
    glow.addColorStop(0.4, color.replace('ALPHA', String(pulse * 0.12)));
    glow.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(x, y, r * 2.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = BlossomArt.shade('#fef9c3', 0.05);
    ctx.beginPath();
    ctx.ellipse(x, y, r * 0.55, r * 0.22, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.fillRect(x - r * 0.35, y - 2, r * 0.7, 3);
  }

  function godRays(ctx, x, y, anim, strength) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(anim * 0.04);
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * Math.PI * 0.5 - Math.PI * 0.25;
      const g = ctx.createLinearGradient(0, 0, Math.cos(a) * 400, Math.sin(a) * 400);
      g.addColorStop(0, `rgba(253, 224, 71, ${strength * 0.14})`);
      g.addColorStop(1, 'rgba(253, 224, 71, 0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(a - 0.06) * 420, Math.sin(a - 0.06) * 280);
      ctx.lineTo(Math.cos(a + 0.06) * 420, Math.sin(a + 0.06) * 280);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  function parallaxMountains(ctx, floorY, anim, palette) {
    palette.forEach((col, layer) => {
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.moveTo(0, floorY);
      const scroll = anim * (8 + layer * 4);
      for (let x = -40; x <= W() + 60; x += 24) {
        const y = floorY - 30 - layer * 38
          + Math.sin((x + scroll) * 0.004 + layer) * (18 - layer * 3)
          + Math.cos((x + scroll) * 0.009) * 8;
        ctx.lineTo(x, y);
      }
      ctx.lineTo(W(), floorY);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.04)';
      ctx.beginPath();
      ctx.moveTo(0, floorY - 30 - layer * 38);
      for (let x = 0; x <= W(); x += 40) {
        const y = floorY - 34 - layer * 38 + Math.sin((x + scroll) * 0.004 + layer) * (18 - layer * 3);
        ctx.lineTo(x, y);
      }
      ctx.stroke();
    });
  }

  function drawCloudPremium(ctx, x, y, scale, alpha, anim) {
    const s = scale || 1;
    const drift = Math.sin(anim * 0.3) * 3;
    ctx.save();
    ctx.globalAlpha = (alpha ?? 0.9) * 0.35;
    ctx.fillStyle = '#94a3b8';
    const blobs = [[0, 6, 24], [20 * s, 0, 20], [-18 * s, 4, 18], [10 * s, -10, 16]];
    blobs.forEach(([ox, oy, r]) => {
      ctx.beginPath();
      ctx.arc(x + ox * s + drift, y + oy + 8, r * s, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = alpha ?? 0.92;
    ctx.fillStyle = '#fff';
    blobs.forEach(([ox, oy, r]) => {
      ctx.beginPath();
      ctx.arc(x + ox * s + drift, y + oy, r * s, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.beginPath();
    ctx.arc(x - 6 * s + drift, y - 4, 8 * s, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function kitchenTiles(ctx, x, y, w, h) {
    const ts = 16;
    for (let row = 0; row < h / ts; row++) {
      for (let col = 0; col < w / ts; col++) {
        const tx = x + col * ts;
        const ty = y + row * ts;
        const even = (row + col) % 2;
        ctx.fillStyle = even ? '#f1f5f9' : '#e2e8f0';
        ctx.fillRect(tx, ty, ts - 1, ts - 1);
        if (even) {
          ctx.fillStyle = 'rgba(255,255,255,0.35)';
          ctx.fillRect(tx + 2, ty + 2, ts * 0.4, ts * 0.25);
        }
      }
    }
  }

  function dappledLight(ctx, floorY, anim) {
    for (let i = 0; i < 18; i++) {
      const dx = (i * 113 + anim * 20) % W();
      const dy = floorY + 8 + (i % 5) * 14;
      const g = ctx.createRadialGradient(dx, dy, 0, dx, dy, 22 + (i % 3) * 8);
      g.addColorStop(0, 'rgba(254, 249, 195, 0.12)');
      g.addColorStop(1, 'rgba(254, 249, 195, 0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.ellipse(dx, dy, 20, 10, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function streetReflection(ctx, floorY, anim) {
    ctx.fillStyle = 'rgba(148, 163, 184, 0.08)';
    for (let i = 0; i < 20; i++) {
      const rx = (i * 67 + anim * 35) % W();
      const rw = 30 + (i % 4) * 12;
      ctx.fillRect(rx, floorY + 32 + (i % 3) * 18, rw, 3);
    }
    const rg = ctx.createLinearGradient(0, floorY + 28, 0, floorY + 90);
    rg.addColorStop(0, 'rgba(255,255,255,0.06)');
    rg.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = rg;
    ctx.fillRect(0, floorY + 28, W(), 70);
  }

  function wallAmbientOcclusion(ctx, x, y, w, h) {
    const g = ctx.createLinearGradient(x, y, x, y + h);
    g.addColorStop(0, 'rgba(0,0,0,0)');
    g.addColorStop(1, 'rgba(0,0,0,0.14)');
    ctx.fillStyle = g;
    ctx.fillRect(x, y, w, h);
  }

  function drawTreePremium(ctx, x, y, scale, anim) {
    const s = scale || 1;
    const sway = Math.sin(anim * 1.4) * 3;
    groundShadow(ctx, x, y + 88 * s, 28 * s, 9, 0.28);
    const tg = ctx.createLinearGradient(x - 10 * s, y + 38 * s, x + 10 * s, y + 92 * s);
    tg.addColorStop(0, '#a16207');
    tg.addColorStop(0.5, '#78350f');
    tg.addColorStop(1, '#451a03');
    ctx.fillStyle = tg;
    BlossomArt.roundRect(ctx, x - 10 * s, y + 36 * s, 20 * s, 56 * s, 5);
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.15)';
    ctx.stroke();
    const layers = [
      { color: '#14532d', r: 36, ox: sway, oy: 0 },
      { color: '#166534', r: 30, ox: sway * 0.6 - 10, oy: -6 },
      { color: '#22c55e', r: 26, ox: sway * 0.4, oy: 2 },
      { color: '#4ade80', r: 18, ox: sway - 14, oy: -10 },
      { color: '#86efac', r: 14, ox: sway + 12, oy: -6 },
    ];
    layers.forEach((L) => {
      ctx.fillStyle = L.color;
      ctx.beginPath();
      ctx.arc(x + L.ox, y + L.oy * s, L.r * s, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    ctx.beginPath();
    ctx.arc(x + sway - 8 * s, y - 10 * s, 10 * s, 0, Math.PI * 2);
    ctx.fill();
  }

  function carpetPattern(ctx, x, y, w, h) {
    const rg = ctx.createRadialGradient(x + w / 2, y + h / 2, 2, x + w / 2, y + h / 2, w / 1.4);
    rg.addColorStop(0, '#fda4af');
    rg.addColorStop(0.7, '#f472b6');
    rg.addColorStop(1, '#db2777');
    ctx.fillStyle = rg;
    BlossomArt.roundRect(ctx, x, y, w, h, 12);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    ctx.lineWidth = 1;
    for (let i = x + 8; i < x + w - 8; i += 10) {
      ctx.beginPath();
      ctx.moveTo(i, y + 6);
      ctx.lineTo(i, y + h - 6);
      ctx.stroke();
    }
    for (let j = y + 6; j < y + h - 6; j += 8) {
      ctx.beginPath();
      ctx.moveTo(x + 6, j);
      ctx.lineTo(x + w - 6, j);
      ctx.stroke();
    }
    ctx.strokeStyle = 'rgba(190, 24, 93, 0.35)';
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  function colorGrade(ctx, w, h, loc, phaseId) {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    if (phaseId === 'night') {
      g.addColorStop(0, 'rgba(30, 58, 138, 0.18)');
      g.addColorStop(1, 'rgba(15, 23, 42, 0.25)');
    } else if (phaseId === 'evening') {
      g.addColorStop(0, 'rgba(249, 115, 22, 0.12)');
      g.addColorStop(0.5, 'rgba(192, 132, 252, 0.06)');
      g.addColorStop(1, 'rgba(30, 27, 75, 0.08)');
    } else if (loc?.id === 'park') {
      g.addColorStop(0, 'rgba(74, 222, 128, 0.06)');
      g.addColorStop(1, 'rgba(0,0,0,0)');
    } else if (loc?.id === 'house') {
      g.addColorStop(0, 'rgba(253, 224, 71, 0.05)');
      g.addColorStop(1, 'rgba(0,0,0,0)');
    } else {
      g.addColorStop(0, 'rgba(56, 189, 248, 0.05)');
      g.addColorStop(1, 'rgba(0,0,0,0)');
    }
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  }

  function filmGrain(ctx, w, h, anim) {
    ctx.save();
    ctx.globalAlpha = 0.035;
    ctx.fillStyle = '#fff';
    for (let i = 0; i < 120; i++) {
      const gx = (i * 97 + Math.floor(anim * 60)) % w;
      const gy = (i * 53) % h;
      ctx.fillRect(gx, gy, 1, 1);
    }
    ctx.restore();
  }

  function drawExtrudedFace(ctx, x, y, w, h, depth, colors) {
    const { front, right, top, shadow: sh } = colors;
    const d = depth || 18;
    ctx.fillStyle = sh || 'rgba(15, 23, 42, 0.22)';
    ctx.beginPath();
    ctx.moveTo(x + 4, y + h + 4);
    ctx.lineTo(x + w + d * 0.55, y + h + 4 - d * 0.35);
    ctx.lineTo(x + w + d * 0.55, y + 4 - d * 0.35);
    ctx.lineTo(x + 4, y + 4);
    ctx.closePath();
    ctx.fill();
    const rg = ctx.createLinearGradient(x + w, y, x + w + d, y - d * 0.4);
    rg.addColorStop(0, right || BlossomArt.shade(front, -0.18));
    rg.addColorStop(1, BlossomArt.shade(right || front, -0.28));
    ctx.fillStyle = rg;
    ctx.beginPath();
    ctx.moveTo(x + w, y);
    ctx.lineTo(x + w + d, y - d * 0.4);
    ctx.lineTo(x + w + d, y + h - d * 0.4);
    ctx.lineTo(x + w, y + h);
    ctx.closePath();
    ctx.fill();
    const tg = ctx.createLinearGradient(x, y - d, x + w, y);
    tg.addColorStop(0, top || BlossomArt.shade(front, 0.14));
    tg.addColorStop(1, front);
    ctx.fillStyle = tg;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + w, y);
    ctx.lineTo(x + w + d, y - d * 0.4);
    ctx.lineTo(x + d, y - d * 0.4);
    ctx.closePath();
    ctx.fill();
    const fg = ctx.createLinearGradient(x, y, x, y + h);
    fg.addColorStop(0, BlossomArt.shade(front, 0.08));
    fg.addColorStop(0.45, front);
    fg.addColorStop(1, BlossomArt.shade(front, -0.14));
    ctx.fillStyle = fg;
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = 'rgba(0,0,0,0.12)';
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, w, h);
  }

  function drawBuilding3D(ctx, x, y, w, h, depth, theme) {
    const { wall, trim, awning, sign, door } = theme;
    const d = depth || 22;
    const baseY = y + 40;
    const bh = h - 40;
    drawExtrudedFace(ctx, x, baseY, w, bh, d, {
      front: wall,
      right: BlossomArt.shade(wall, -0.22),
      top: BlossomArt.shade(wall, 0.1),
    });
    ctx.fillStyle = trim;
    ctx.fillRect(x, baseY - 2, w, 6);
    ctx.fillStyle = BlossomArt.shade(trim, -0.15);
    ctx.fillRect(x + w, baseY - 2 - d * 0.15, d, 6);
    if (awning) {
      const ag = ctx.createLinearGradient(x, y + 24, x, y + 44);
      ag.addColorStop(0, BlossomArt.shade(awning, 0.12));
      ag.addColorStop(1, awning);
      ctx.fillStyle = ag;
      ctx.beginPath();
      ctx.moveTo(x - 3, y + 38);
      for (let i = 0; i <= 6; i++) {
        const px = x - 3 + (i / 6) * (w + 6);
        const py = y + 24 + Math.sin(i * 0.9) * 4;
        ctx.lineTo(px, py);
      }
      ctx.lineTo(x + w + 3, y + 38);
      ctx.closePath();
      ctx.fill();
    }
    BlossomArt.drawWindow(ctx, x + 16, y + 68, (w - 40) * 0.45, 52, theme.anim || 0, true);
    BlossomArt.drawWindow(ctx, x + w - 16 - (w - 40) * 0.45, y + 68, (w - 40) * 0.45, 52, theme.anim || 0, true);
    BlossomArt.drawDoor(ctx, x + w / 2 - 18, y + h - 58, 36, 52, door || '#92400e');
    ctx.fillStyle = 'rgba(255,255,255,0.92)';
    ctx.font = 'bold 13px Fredoka, Nunito, sans-serif';
    ctx.fillText(sign, x + 10, y + 20);
    groundShadow(ctx, x + w / 2, y + h + 6, w * 0.55, 10, 0.34);
  }

  function depthFog(ctx, floorY, anim, strength) {
    const s = strength ?? 0.55;
    const fg = ctx.createLinearGradient(0, floorY - 180, 0, floorY + 40);
    fg.addColorStop(0, `rgba(148, 163, 184, ${s * 0.22})`);
    fg.addColorStop(0.55, `rgba(100, 116, 139, ${s * 0.08})`);
    fg.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = fg;
    ctx.fillRect(0, floorY - 200, W(), 240);
    for (let i = 0; i < 6; i++) {
      const dx = (i * 143 + anim * 8) % W();
      const g = ctx.createRadialGradient(dx, floorY - 60 - i * 18, 2, dx, floorY - 60 - i * 18, 80);
      g.addColorStop(0, 'rgba(255,255,255,0.04)');
      g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.ellipse(dx, floorY - 60 - i * 18, 70, 22, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function perspectiveGround(ctx, floorY, groundColor, accentColor) {
    const g = ctx.createLinearGradient(0, floorY - 120, 0, H());
    g.addColorStop(0, BlossomArt.shade(groundColor, 0.18));
    g.addColorStop(0.35, groundColor);
    g.addColorStop(1, BlossomArt.shade(accentColor || groundColor, -0.2));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(0, floorY);
    ctx.lineTo(W(), floorY);
    ctx.lineTo(W() * 0.92, H());
    ctx.lineTo(W() * 0.08, H());
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    for (let row = 0; row < 8; row++) {
      const ty = floorY + 12 + row * 14;
      const inset = row * 18;
      ctx.beginPath();
      ctx.moveTo(inset, ty);
      ctx.lineTo(W() - inset, ty);
      ctx.stroke();
    }
  }

  function drawQuestPin(ctx, x, y, anim, label) {
    const bob = Math.sin(anim * 4) * 6;
    const py = y + bob;
    const pulse = 0.55 + Math.sin(anim * 5) * 0.45;
    const rg = ctx.createRadialGradient(x, py + 8, 4, x, py + 8, 42 + pulse * 10);
    rg.addColorStop(0, `rgba(250, 204, 21, ${0.45 + pulse * 0.3})`);
    rg.addColorStop(1, 'rgba(250, 204, 21, 0)');
    ctx.fillStyle = rg;
    ctx.beginPath();
    ctx.arc(x, py + 8, 40 + pulse * 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#dc2626';
    ctx.beginPath();
    ctx.moveTo(x, py - 38);
    ctx.bezierCurveTo(x + 22, py - 22, x + 20, py + 2, x, py + 18);
    ctx.bezierCurveTo(x - 20, py + 2, x - 22, py - 22, x, py - 38);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.arc(x, py - 24, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();
    if (label) {
      ctx.fillStyle = 'rgba(15, 23, 42, 0.82)';
      const tw = ctx.measureText(label).width + 16;
      BlossomArt.roundRect(ctx, x - tw / 2, py - 58, tw, 18, 9);
      ctx.fill();
      ctx.fillStyle = '#fde047';
      ctx.font = '700 10px Nunito, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(label, x, py - 45);
      ctx.textAlign = 'left';
    }
    ctx.fillStyle = 'rgba(15, 23, 42, 0.25)';
    ctx.beginPath();
    ctx.ellipse(x, py + 22, 14, 5, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawNavPath(ctx, points, anim) {
    if (!points?.length) return;
    ctx.save();
    ctx.setLineDash([10, 8]);
    ctx.lineDashOffset = -anim * 28;
    ctx.strokeStyle = 'rgba(250, 204, 21, 0.65)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    points.forEach((pt, i) => {
      if (i === 0) ctx.moveTo(pt.x, pt.y);
      else ctx.lineTo(pt.x, pt.y);
    });
    ctx.stroke();
    ctx.setLineDash([]);
    points.forEach((pt, i) => {
      const pulse = 0.5 + Math.sin(anim * 4 + i) * 0.5;
      ctx.fillStyle = `rgba(253, 224, 71, ${0.5 + pulse * 0.4})`;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, 5 + pulse * 2, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();
  }

  function finishFrame(ctx, w, h, opts) {
    const { loc, phaseId, anim } = opts || {};
    colorGrade(ctx, w, h, loc, phaseId);
    if (loc?.id && loc.id !== 'house') {
      depthFog(ctx, loc.floorY, anim ?? 0, loc.id === 'street' ? 0.45 : 0.38);
    }
    BlossomArt.vignette(ctx, w, h, phaseId === 'night' ? 0.32 : 0.24);
    if (phaseId !== 'night') {
      const rg = ctx.createRadialGradient(w * 0.5, h * 0.42, h * 0.08, w * 0.5, h * 0.42, h * 0.78);
      rg.addColorStop(0, 'rgba(255,255,255,0.05)');
      rg.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = rg;
      ctx.fillRect(0, 0, w, h);
    }
    filmGrain(ctx, w, h, anim ?? 0);
  }

  function needsShadow(kind) {
    return !['road', 'fence', 'tree', 'exit', 'rug', 'path', 'pond', 'bridge', 'beach', 'pier', 'npc', 'lamp', 'pet'].includes(kind);
  }

  function roomLighting(ctx, roomId, x, y, w, h, phaseId, anim) {
    if (roomId === 'bath') {
      const g = ctx.createRadialGradient(x + w / 2, y + 20, 4, x + w / 2, y + h / 2, w * 0.7);
      g.addColorStop(0, 'rgba(56, 189, 248, 0.18)');
      g.addColorStop(1, 'rgba(56, 189, 248, 0)');
      ctx.fillStyle = g;
      ctx.fillRect(x, y, w, h);
      ctx.fillStyle = 'rgba(255,255,255,0.08)';
      for (let i = x + 8; i < x + w - 8; i += 14) {
        ctx.fillRect(i, y + h * 0.3, 8, 3);
      }
    } else if (roomId === 'kitchen') {
      const glow = ctx.createLinearGradient(x, y, x, y + h * 0.5);
      glow.addColorStop(0, 'rgba(253, 186, 116, 0.22)');
      glow.addColorStop(1, 'rgba(253, 186, 116, 0)');
      ctx.fillStyle = glow;
      ctx.fillRect(x, y, w, h * 0.55);
      ctx.fillStyle = 'rgba(254, 243, 199, 0.35)';
      ctx.fillRect(x + 8, y + 6, w - 16, 5);
    } else if (roomId === 'bedroom' && (phaseId === 'evening' || phaseId === 'night')) {
      const pulse = 0.65 + Math.sin(anim * 1.1) * 0.1;
      const lg = ctx.createRadialGradient(x + w * 0.35, y + 40, 2, x + w * 0.35, y + 80, 90);
      lg.addColorStop(0, `rgba(253, 224, 71, ${pulse * 0.2})`);
      lg.addColorStop(1, 'rgba(253, 224, 71, 0)');
      ctx.fillStyle = lg;
      ctx.fillRect(x, y, w, h);
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(x + w * 0.32, y + 36, 10, 14);
    }
  }

  function drawWindowView(ctx, x, y, w, h, anim) {
    const g = ctx.createLinearGradient(x, y, x, y + h);
    g.addColorStop(0, '#7dd3fc');
    g.addColorStop(0.5, '#86efac');
    g.addColorStop(1, '#4ade80');
    ctx.fillStyle = g;
    ctx.fillRect(x + 4, y + 4, w - 8, h - 8);
    const scroll = anim * 12;
    ctx.fillStyle = '#16a34a';
    ctx.beginPath();
    ctx.moveTo(x + 6, y + h - 8);
    for (let i = 0; i <= w - 12; i += 10) {
      const py = y + h - 14 + Math.sin((i + scroll) * 0.05) * 4;
      ctx.lineTo(x + 6 + i, py);
    }
    ctx.lineTo(x + w - 6, y + h - 6);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.beginPath();
    ctx.arc(x + w * 0.3 + Math.sin(anim) * 4, y + 14, 8, 0, Math.PI * 2);
    ctx.fill();
    if (window.BlossomGfx?.drawCloudPremium) {
      drawCloudPremium(ctx, x + w * 0.55, y + 10, 0.35, 0.5, anim);
    }
  }

  const layerCache = { canvas: null, key: '' };

  function drawCachedInterior(ctx, loc, drawFn) {
    const key = `${loc.id}-${(loc.rooms || []).map((r) => r.wall).join('|')}`;
    if (!layerCache.canvas) {
      layerCache.canvas = document.createElement('canvas');
      layerCache.canvas.width = W();
      layerCache.canvas.height = H();
    }
    if (layerCache.key !== key) {
      const b = layerCache.canvas.getContext('2d');
      b.clearRect(0, 0, W(), H());
      drawFn(b);
      layerCache.key = key;
    }
    ctx.drawImage(layerCache.canvas, 0, 0);
  }

  function invalidateLayerCache() {
    layerCache.key = '';
  }

  return {
    groundShadow,
    contactShadow,
    ceilingLight,
    godRays,
    parallaxMountains,
    drawCloudPremium,
    kitchenTiles,
    dappledLight,
    streetReflection,
    wallAmbientOcclusion,
    drawTreePremium,
    carpetPattern,
    colorGrade,
    finishFrame,
    needsShadow,
    roomLighting,
    drawWindowView,
    drawCachedInterior,
    invalidateLayerCache,
    drawExtrudedFace,
    drawBuilding3D,
    depthFog,
    perspectiveGround,
    drawQuestPin,
    drawNavPath,
  };
})();