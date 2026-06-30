/** Higher-fidelity canvas rendering for Blossom Life */
window.BlossomRender = (function () {
  let worldCanvas = null;

  function getWorldCanvas() {
    if (!worldCanvas) {
      worldCanvas = document.createElement('canvas');
      worldCanvas.width = BlossomWorld.W;
      worldCanvas.height = BlossomWorld.H;
    }
    return worldCanvas;
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

  function shadow(ctx, color = 'rgba(0,0,0,0.22)', blur = 14, ox = 0, oy = 6) {
    ctx.shadowColor = color;
    ctx.shadowBlur = blur;
    ctx.shadowOffsetX = ox;
    ctx.shadowOffsetY = oy;
  }

  function clearShadow(ctx) {
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
  }

  function drawSky(ctx, loc, anim, phaseId) {
    const g = ctx.createLinearGradient(0, 0, 0, loc.floorY);
    if (loc.id === 'house') {
      if (phaseId === 'night') {
        g.addColorStop(0, '#1e293b');
        g.addColorStop(1, '#334155');
      } else if (phaseId === 'evening') {
        g.addColorStop(0, '#fef3c7');
        g.addColorStop(1, '#fde68a');
      } else {
        g.addColorStop(0, '#fffbeb');
        g.addColorStop(1, '#fef3c7');
      }
    } else if (phaseId === 'evening') {
      g.addColorStop(0, '#1e3a5f');
      g.addColorStop(0.35, '#7c3aed');
      g.addColorStop(0.7, '#f97316');
      g.addColorStop(1, loc.sky[2]);
    } else if (phaseId === 'night') {
      g.addColorStop(0, '#0f172a');
      g.addColorStop(0.4, '#1e1b4b');
      g.addColorStop(1, '#312e81');
    } else {
      g.addColorStop(0, loc.sky[0]);
      g.addColorStop(0.45, loc.sky[1]);
      g.addColorStop(1, loc.sky[2]);
    }
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, BlossomWorld.W, loc.floorY);

    if (loc.id !== 'house') {
      const mountainSets = {
        yard: ['#4ade8066', '#22c55e55', '#16a34a44'],
        street: ['#60a5fa66', '#3b82f655', '#2563eb44'],
        park: ['#6ee7b766', '#34d39955', '#10b98144'],
      };
      BlossomGfx.parallaxMountains(ctx, loc.floorY, anim, mountainSets[loc.id] || mountainSets.yard);
      const hillSets = {
        yard: ['#6ee7b799', '#34d39988', '#10b98166'],
        street: ['#93c5fd99', '#60a5fa77', '#3b82f666'],
        park: ['#a7f3d099', '#6ee7b788', '#34d39966'],
      };
      BlossomArt.drawHills(ctx, loc.floorY, hillSets[loc.id] || hillSets.yard, anim);
    }

    if (loc.id !== 'house') {
      if (phaseId === 'night') {
        BlossomArt.drawMoon(ctx, 120, 75, 22, anim);
        ctx.fillStyle = '#fef9c3';
        for (let i = 0; i < 60; i++) {
          const sx = (i * 137) % BlossomWorld.W;
          const sy = 20 + (i * 53) % 120;
          const tw = 0.4 + Math.sin(anim * 2 + i) * 0.35;
          ctx.globalAlpha = tw;
          ctx.beginPath();
          ctx.arc(sx, sy, 1 + (i % 3) * 0.4, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalAlpha = 1;
      } else {
        BlossomArt.drawSun(ctx, 680, phaseId === 'evening' ? 115 : 62, 30, anim);
        if (phaseId === 'morning' || phaseId === 'afternoon') {
          BlossomGfx.godRays(ctx, 680, 62, anim, 0.85);
        }
        if (phaseId === 'evening') {
          const rg = ctx.createLinearGradient(0, 0, BlossomWorld.W, loc.floorY);
          rg.addColorStop(0, 'rgba(249, 115, 22, 0.15)');
          rg.addColorStop(0.5, 'rgba(244, 114, 182, 0.08)');
          rg.addColorStop(1, 'rgba(0,0,0,0)');
          ctx.fillStyle = rg;
          ctx.fillRect(0, 0, BlossomWorld.W, loc.floorY);
        }
      }
    }

    const clouds = [
      [100, 58, 1, 0.88], [310, 42, 1.15, 0.82], [520, 72, 0.9, 0.78], [700, 38, 1.05, 0.85],
    ];
    if (loc.id !== 'house') {
      clouds.forEach(([cx, cy, sc, al], i) => {
        const drift = Math.sin(anim * 0.25 + i * 1.4) * 18;
        BlossomGfx.drawCloudPremium(ctx, cx + drift, cy, sc, phaseId === 'night' ? al * 0.35 : al, anim + i);
      });
    }

    if (loc.id === 'street') {
      ctx.fillStyle = 'rgba(30, 41, 59, 0.35)';
      ctx.fillRect(0, loc.floorY - 90, BlossomWorld.W, 90);
      for (let i = 0; i < 5; i++) {
        const bx = 60 + i * 155;
        const bh = 70 + (i % 3) * 25;
        const bg = ctx.createLinearGradient(bx, loc.floorY - bh - 90, bx, loc.floorY - 90);
        bg.addColorStop(0, '#475569');
        bg.addColorStop(1, '#334155');
        ctx.fillStyle = bg;
        ctx.fillRect(bx, loc.floorY - bh - 90, 90, bh);
        for (let w = 0; w < 3; w++) {
          BlossomArt.drawWindow(ctx, bx + 12 + w * 24, loc.floorY - bh - 70, 16, 22, anim, phaseId !== 'night');
        }
      }
    }
  }

  function drawInteriorWall(ctx, x, top, baseY, doorY, doorH) {
    const wallW = 7;
    const doorBottom = doorY + doorH;
    ctx.fillStyle = '#e7e5e4';
    ctx.fillRect(x - wallW / 2, top, wallW, doorY - top);
    ctx.fillRect(x - wallW / 2, doorBottom, wallW, baseY - doorBottom);
    ctx.strokeStyle = '#a8a29e';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x - 14, doorY);
    ctx.lineTo(x - 14, doorBottom);
    ctx.moveTo(x + 14, doorY);
    ctx.lineTo(x + 14, doorBottom);
    ctx.stroke();
    const arch = ctx.createLinearGradient(x - 16, doorY, x + 16, doorY);
    arch.addColorStop(0, 'rgba(254, 243, 199, 0.5)');
    arch.addColorStop(0.5, 'rgba(255, 255, 255, 0.15)');
    arch.addColorStop(1, 'rgba(254, 243, 199, 0.5)');
    ctx.fillStyle = arch;
    ctx.fillRect(x - 16, doorY - 4, 32, 6);
  }

  function drawHouseInterior(ctx, loc, anim, phaseId) {
    phaseId = phaseId || 'morning';
    const wallTop = 86;
    const baseY = loc.floorY - 28;
    const rooms = loc.rooms || [];
    const dividers = loc.walls || [];

    ctx.fillStyle = '#78716c';
    ctx.fillRect(0, wallTop, 10, baseY - wallTop);
    ctx.fillRect(BlossomWorld.W - 10, wallTop, 10, baseY - wallTop);

    rooms.forEach((room) => {
      const wg = ctx.createLinearGradient(room.x, wallTop, room.x, baseY);
      wg.addColorStop(0, BlossomArt.shade(room.wall, 0.06));
      wg.addColorStop(0.55, room.wall);
      wg.addColorStop(1, BlossomArt.shade(room.wall, -0.08));
      ctx.fillStyle = wg;
      ctx.fillRect(room.x + 4, wallTop + 8, room.w - 8, baseY - wallTop - 8);

      ctx.fillStyle = room.trim;
      ctx.fillRect(room.x + 4, wallTop + 8, room.w - 8, 5);

      ctx.fillStyle = 'rgba(15, 23, 42, 0.55)';
      ctx.font = '700 10px Nunito, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(room.label, room.x + room.w / 2, wallTop + 26);
      ctx.textAlign = 'left';
      BlossomGfx.wallAmbientOcclusion(ctx, room.x + 4, baseY - 22, room.w - 8, 22);
      const lx = room.x + room.w / 2;
      BlossomGfx.ceilingLight(ctx, lx, wallTop + 22, 14, 'rgba(253, 224, 71, ALPHA)', anim, phaseId === 'night' ? 'night' : 'day');
      BlossomGfx.roomLighting(ctx, room.id, room.x + 4, wallTop + 8, room.w - 8, baseY - wallTop - 8, phaseId, anim);
    });

    ctx.fillStyle = BlossomArt.noisePattern(ctx, 64, 64, 'rgba(255,255,255,0.04)', 'rgba(0,0,0,0.03)');
    ctx.fillRect(10, wallTop + 8, BlossomWorld.W - 20, baseY - wallTop - 8);

    dividers.forEach((w) => {
      drawInteriorWall(ctx, w.x, wallTop + 8, baseY, w.doorY, w.doorH);
    });

    const windows = [
      { x: 48, y: 118, w: 72, h: 58, lit: true },
      { x: 318, y: 112, w: 96, h: 68, lit: true },
      { x: 538, y: 120, w: 68, h: 52, lit: true },
      { x: 712, y: 128, w: 36, h: 40, lit: false },
    ];
    windows.forEach((win, i) => {
      if (win.lit && win.w > 60) {
        BlossomGfx.drawWindowView(ctx, win.x + 6, win.y + 6, win.w - 12, win.h - 12, anim + i);
      }
      BlossomArt.drawWindow(ctx, win.x, win.y, win.w, win.h, anim + i, win.lit);
      if (win.lit) {
        BlossomArt.warmLight(ctx, win.x + win.w / 2, win.y + win.h + 30, 55, 0.1);
      }
    });

    BlossomArt.warmLight(ctx, 126, 155, 100, 0.14);
    BlossomArt.warmLight(ctx, 380, 150, 115, 0.14);
    BlossomArt.warmLight(ctx, 580, 158, 90, 0.1);

    ctx.fillStyle = '#f97316';
    ctx.fillRect(0, wallTop, BlossomWorld.W, 8);
    ctx.fillStyle = '#fed7aa';
    ctx.fillRect(0, baseY, BlossomWorld.W, 28);
    ctx.strokeStyle = 'rgba(120, 53, 15, 0.18)';
    ctx.beginPath();
    ctx.moveTo(0, baseY);
    ctx.lineTo(BlossomWorld.W, baseY);
    ctx.stroke();

    ctx.fillStyle = '#f97316';
    ctx.fillRect(0, loc.floorY - 14, BlossomWorld.W, 14);
    ctx.fillStyle = '#ea580c';
    for (let i = 0; i < BlossomWorld.W; i += 40) ctx.fillRect(i, loc.floorY - 14, 22, 4);

    rooms.forEach((room) => {
      ctx.fillStyle = 'rgba(120, 53, 15, 0.14)';
      ctx.font = '600 9px Nunito, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(room.label, room.x + room.w / 2, loc.floorY + 20);
      ctx.textAlign = 'left';
    });

    ctx.fillStyle = '#92400e';
    ctx.fillRect(724, baseY + 4, 76, loc.floorY - baseY - 4);
    ctx.fillStyle = '#78350f';
    ctx.fillRect(728, baseY + 8, 68, loc.floorY - baseY - 12);
    ctx.fillStyle = '#fde68a';
    ctx.font = '700 9px Nunito, sans-serif';
    ctx.fillText('Front door', 732, baseY + 22);
  }

  function drawGround(ctx, loc, anim) {
    if (loc.id === 'house' && loc.rooms?.length) {
      loc.rooms.forEach((room) => {
        if (room.id === 'kitchen') {
          BlossomGfx.kitchenTiles(ctx, room.x, loc.floorY, room.w, BlossomWorld.H - loc.floorY);
        } else {
          const fg = ctx.createLinearGradient(room.x, loc.floorY, room.x, BlossomWorld.H);
          fg.addColorStop(0, room.floor);
          fg.addColorStop(1, BlossomArt.shade(room.floor, -0.12));
          ctx.fillStyle = fg;
          ctx.fillRect(room.x, loc.floorY, room.w, BlossomWorld.H - loc.floorY);
        }
      });
      ctx.strokeStyle = 'rgba(0,0,0,0.07)';
      loc.rooms.forEach((room) => {
        for (let i = room.x; i < room.x + room.w; i += 36) {
          ctx.beginPath();
          ctx.moveTo(i, loc.floorY);
          ctx.lineTo(i + 18, BlossomWorld.H);
          ctx.stroke();
        }
      });
      ctx.strokeStyle = 'rgba(120, 53, 15, 0.2)';
      ctx.lineWidth = 2;
      (loc.walls || []).forEach((w) => {
        ctx.beginPath();
        ctx.moveTo(w.x, loc.floorY);
        ctx.lineTo(w.x, BlossomWorld.H);
        ctx.stroke();
      });
      ctx.lineWidth = 1;
    } else if (loc.id === 'house') {
      BlossomArt.drawWoodPlanks(ctx, 0, loc.floorY, BlossomWorld.W, BlossomWorld.H - loc.floorY);
      ctx.strokeStyle = 'rgba(0,0,0,0.04)';
      for (let i = 0; i < BlossomWorld.W; i += 48) {
        ctx.beginPath();
        ctx.moveTo(i, loc.floorY);
        ctx.lineTo(i + 24, BlossomWorld.H);
        ctx.stroke();
      }
    } else if (loc.id === 'street') {
      const curbY = loc.floorY + 4;
      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(0, curbY, BlossomWorld.W, 18);
      ctx.fillStyle = BlossomArt.noisePattern(ctx, 32, 32, '#e2e8f0', '#cbd5e1');
      ctx.fillRect(0, curbY, BlossomWorld.W, 18);
      ctx.fillStyle = '#334155';
      ctx.fillRect(0, loc.floorY + 28, BlossomWorld.W, BlossomWorld.H - loc.floorY - 28);
      const roadG = ctx.createLinearGradient(0, loc.floorY + 28, 0, BlossomWorld.H);
      roadG.addColorStop(0, '#475569');
      roadG.addColorStop(1, '#1e293b');
      ctx.fillStyle = roadG;
      ctx.fillRect(0, loc.floorY + 28, BlossomWorld.W, BlossomWorld.H - loc.floorY - 28);
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 3;
      ctx.setLineDash([22, 16]);
      ctx.beginPath();
      ctx.moveTo(0, loc.floorY + 72);
      ctx.lineTo(BlossomWorld.W, loc.floorY + 72);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = 'rgba(255,255,255,0.12)';
      for (let i = 0; i < 12; i++) ctx.fillRect(80 + i * 62, loc.floorY + 48, 28, 4);
      BlossomGfx.streetReflection(ctx, loc.floorY, anim);
    } else {
      BlossomArt.grassFill(ctx, 0, loc.floorY, BlossomWorld.W, BlossomWorld.H - loc.floorY);
      BlossomArt.drawGrassBlades(ctx, 0, loc.floorY, BlossomWorld.W, BlossomWorld.H - loc.floorY, anim);
      BlossomGfx.dappledLight(ctx, loc.floorY, anim);
      ctx.fillStyle = 'rgba(255,255,255,0.08)';
      for (let i = 0; i < 32; i++) {
        ctx.beginPath();
        ctx.ellipse((i * 97) % BlossomWorld.W, loc.floorY + 14 + (i % 4) * 8, 5, 2.5, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  function drawTree(ctx, x, y, scale, anim) {
    BlossomGfx.drawTreePremium(ctx, x, y, scale, anim);
  }

  function drawFurnitureGrad(ctx, x, y, w, h, r, base, lit) {
    const g = ctx.createLinearGradient(x, y, x + w, y + h);
    g.addColorStop(0, BlossomArt.shade(base, lit ? 0.1 : 0.06));
    g.addColorStop(0.5, base);
    g.addColorStop(1, BlossomArt.shade(base, -0.12));
    ctx.fillStyle = g;
    roundRect(ctx, x, y, w, h, r);
    ctx.fill();
  }

  function drawProp(ctx, p, anim, choresDone, nearId, todaysChores, state) {
    const pulse = 0.5 + Math.sin(anim * 4) * 0.5;
    const done = p.choreId && choresDone[p.choreId];
    const onList = !p.choreId || todaysChores?.includes(p.choreId);
    const near = p.choreId === nearId || (p.kind === 'exit' && nearId === `exit-${p.to}`)
      || (p.kind === 'npc' && nearId === 'bonnie')
      || (p.kind === 'shop' && p.shop === 'boutique' && nearId === 'boutique')
      || (p.kind === 'shop' && p.shop === 'salon' && nearId === 'salon-work')
      || (p.kind === 'shop' && p.shop === 'wellness' && nearId === 'wellness-work')
      || (p.kind === 'stage' && nearId === 'stage-work')
      || (p.kind === 'studio' && nearId === 'studio-work')
      || (p.kind === 'gym' && nearId === 'gym-work');

    if (p.choreId && !onList && !done) ctx.globalAlpha = 0.42;

    const interactHighlight = p.choreId || p.kind === 'exit' || p.kind === 'fridge'
      || p.kind === 'npc' || p.kind === 'stage' || p.kind === 'studio'
      || (p.kind === 'shop' && (p.choreId || p.shop === 'salon' || p.shop === 'boutique' || p.shop === 'wellness'))
      || p.kind === 'gym';
    if (interactHighlight && near && (!p.choreId || (!done && onList))) {
      const cx = p.x + (p.w || 50) / 2;
      const cy = p.y + (p.h || 50) / 2;
      const g = ctx.createRadialGradient(cx, cy, 4, cx, cy, 58);
      g.addColorStop(0, `rgba(250, 204, 21, ${0.35 + pulse * 0.25})`);
      g.addColorStop(1, 'rgba(250, 204, 21, 0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(cx, cy, 58, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = `rgba(250, 204, 21, ${0.6 + pulse * 0.35})`;
      ctx.lineWidth = 2.5;
      roundRect(ctx, p.x - 4, p.y - 4, (p.w || 60) + 8, (p.h || 60) + 8, 12);
      ctx.stroke();
    }

    if (BlossomGfx.needsShadow(p.kind) && p.w && p.h) {
      BlossomGfx.contactShadow(ctx, p.x, p.y, p.w, p.h);
    }

    switch (p.kind) {
      case 'rug':
        BlossomGfx.carpetPattern(ctx, p.x, p.y, p.w, p.h);
        break;
      case 'bed':
        shadow(ctx);
        drawFurnitureGrad(ctx, p.x, p.y + 8, p.w, p.h - 8, 12, '#7c3aed', false);
        drawFurnitureGrad(ctx, p.x + 4, p.y + 4, p.w - 8, 18, 8, '#a78bfa', true);
        if (done) {
          drawFurnitureGrad(ctx, p.x + 8, p.y + 10, p.w - 16, 30, 10, '#ede9fe', true);
          ctx.fillStyle = '#fff';
          roundRect(ctx, p.x + 14, p.y + 14, p.w - 28, 20, 8);
          ctx.fill();
          ctx.fillStyle = '#c4b5fd';
          roundRect(ctx, p.x + 10, p.y + 8, p.w - 20, 10, 6);
          ctx.fill();
        } else {
          drawFurnitureGrad(ctx, p.x + 6, p.y + 12, p.w - 12, 28, 10, '#ddd6fe', true);
          ctx.fillStyle = '#fef3c7';
          roundRect(ctx, p.x + 12, p.y + 14, p.w - 24, 22, 8);
          ctx.fill();
          ctx.fillStyle = '#c4b5fd';
          roundRect(ctx, p.x + 20, p.y + 6, 28, 12, 6);
          ctx.fill();
          ctx.fillStyle = '#a78bfa';
          roundRect(ctx, p.x + p.w - 48, p.y + 10, 24, 14, 5);
          ctx.fill();
        }
        clearShadow(ctx);
        break;
      case 'desk':
        shadow(ctx);
        drawFurnitureGrad(ctx, p.x, p.y + 22, p.w, p.h - 22, 8, '#b45309', false);
        drawFurnitureGrad(ctx, p.x + 4, p.y, p.w - 8, 26, 6, '#fcd34d', true);
        ctx.fillStyle = '#78350f';
        ctx.fillRect(p.x + 12, p.y + 30, 6, p.h - 36);
        ctx.fillRect(p.x + p.w - 18, p.y + 30, 6, p.h - 36);
        clearShadow(ctx);
        break;
      case 'sink':
        shadow(ctx);
        drawFurnitureGrad(ctx, p.x, p.y, p.w, p.h, 10, '#e2e8f0', true);
        if (!done) {
          const sg = ctx.createRadialGradient(p.x + p.w / 2, p.y + 34, 2, p.x + p.w / 2, p.y + 34, 24);
          sg.addColorStop(0, '#94a3b8');
          sg.addColorStop(1, '#475569');
          ctx.fillStyle = sg;
          ctx.beginPath();
          ctx.ellipse(p.x + p.w / 2, p.y + 36, 24, 15, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.font = '14px sans-serif';
          ctx.fillText('🍽️', p.x + p.w / 2 - 10, p.y + 40);
        } else {
          const sg2 = ctx.createRadialGradient(p.x + p.w / 2, p.y + 34, 2, p.x + p.w / 2, p.y + 34, 24);
          sg2.addColorStop(0, '#e2e8f0');
          sg2.addColorStop(1, '#94a3b8');
          ctx.fillStyle = sg2;
          ctx.beginPath();
          ctx.ellipse(p.x + p.w / 2, p.y + 36, 24, 15, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = 'rgba(255,255,255,0.45)';
          ctx.beginPath();
          ctx.ellipse(p.x + p.w / 2 - 8, p.y + 32, 8, 4, -0.3, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.fillStyle = '#94a3b8';
        ctx.fillRect(p.x + p.w / 2 - 4, p.y - 8, 8, 14);
        clearShadow(ctx);
        break;
      case 'fridge':
        shadow(ctx);
        drawFurnitureGrad(ctx, p.x, p.y, p.w, p.h, 10, '#34d399', true);
        ctx.strokeStyle = '#059669';
        ctx.lineWidth = 2.5;
        ctx.stroke();
        ctx.fillStyle = 'rgba(255,255,255,0.35)';
        ctx.fillRect(p.x + 6, p.y + 8, p.w - 22, p.h * 0.38);
        ctx.fillStyle = '#047857';
        roundRect(ctx, p.x + p.w - 14, p.y + 32, 6, 22, 3);
        ctx.fill();
        ctx.fillStyle = '#fbbf24';
        ctx.beginPath();
        ctx.arc(p.x + p.w - 11, p.y + 43, 2.5, 0, Math.PI * 2);
        ctx.fill();
        clearShadow(ctx);
        break;
      case 'couch':
        shadow(ctx);
        drawFurnitureGrad(ctx, p.x + 6, p.y + 28, p.w - 12, p.h - 28, 12, '#db2777', false);
        drawFurnitureGrad(ctx, p.x, p.y + 22, p.w, p.h - 22, 14, '#f472b6', true);
        drawFurnitureGrad(ctx, p.x + 6, p.y, p.w - 12, 34, 12, '#fbcfe8', true);
        drawFurnitureGrad(ctx, p.x + 8, p.y - 4, p.w - 16, 14, 8, '#f9a8d4', true);
        ctx.fillStyle = 'rgba(255,255,255,0.2)';
        ctx.fillRect(p.x + 16, p.y + 28, p.w - 32, 12);
        clearShadow(ctx);
        break;
      case 'plant':
      case 'garden':
        drawTree(ctx, p.x + (p.w || 40) / 2, p.y, 0.55, anim);
        if (p.kind === 'garden') {
          ctx.fillStyle = '#92400e';
          roundRect(ctx, p.x, p.y + 42, p.w, p.h - 42, 8);
          ctx.fill();
          ctx.fillStyle = '#a16207';
          for (let i = 0; i < 5; i++) ctx.fillRect(p.x + 8 + i * 20, p.y + 48, 4, p.h - 54);
        }
        break;
      case 'bath':
        drawFurnitureGrad(ctx, p.x, p.y, p.w, p.h, 10, '#7dd3fc', true);
        ctx.fillStyle = 'rgba(255,255,255,0.35)';
        ctx.fillRect(p.x + 8, p.y + 8, p.w - 16, 8);
        break;
      case 'broom':
        ctx.fillStyle = '#78716c';
        ctx.fillRect(p.x + 42, p.y, 7, 32);
        ctx.fillStyle = done ? '#fcd34d' : '#fbbf24';
        ctx.beginPath();
        ctx.moveTo(p.x, p.y + 18);
        ctx.lineTo(p.x + 48, p.y + 2);
        ctx.lineTo(p.x + 48, p.y + 34);
        ctx.closePath();
        ctx.fill();
        if (done) {
          ctx.fillStyle = 'rgba(255,255,255,0.25)';
          ctx.fillRect(p.x - 8, p.y + 38, p.w + 16, 4);
        }
        break;
      case 'houseFacade': {
        const hx = p.x + 20;
        const hy = p.y + 60;
        shadow(ctx, 'rgba(0,0,0,0.2)', 18, 0, 10);
        drawFurnitureGrad(ctx, hx, hy, 160, 200, 10, '#fef3c7', true);
        ctx.fillStyle = '#7c3aed';
        ctx.beginPath();
        ctx.moveTo(hx - 10, hy + 10);
        ctx.lineTo(hx + 80, hy - 40);
        ctx.lineTo(hx + 170, hy + 10);
        ctx.closePath();
        ctx.fill();
        BlossomArt.drawWindow(ctx, hx + 30, hy + 50, 45, 50, anim, true);
        BlossomArt.drawWindow(ctx, hx + 95, hy + 50, 45, 50, anim, true);
        BlossomArt.drawDoor(ctx, hx + 62, hy + 130, 36, 58, '#92400e');
        clearShadow(ctx);
        break;
      }
      case 'fence':
        ctx.fillStyle = '#d6d3d1';
        for (let i = 0; i < 16; i++) {
          const fx = p.x + i * 50;
          const fg = ctx.createLinearGradient(fx, p.y, fx + 8, p.y + p.h);
          fg.addColorStop(0, '#e7e5e4');
          fg.addColorStop(1, '#a8a29e');
          ctx.fillStyle = fg;
          ctx.fillRect(fx, p.y, 9, p.h);
          ctx.fillRect(fx - 5, p.y + 14, 58, 7);
        }
        break;
      case 'path': {
        const pg = ctx.createLinearGradient(p.x, p.y, p.x, p.y + p.h);
        pg.addColorStop(0, '#e7e5e4');
        pg.addColorStop(1, '#a8a29e');
        ctx.fillStyle = pg;
        roundRect(ctx, p.x, p.y, p.w, p.h, 22);
        ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.15)';
        for (let i = 0; i < 8; i++) ctx.fillRect(p.x + 20 + i * 58, p.y + 20, 36, 3);
        break;
      }
      case 'trash':
        if (!done) {
          shadow(ctx);
          drawFurnitureGrad(ctx, p.x, p.y, p.w, p.h, 8, '#64748b', false);
          drawFurnitureGrad(ctx, p.x + 8, p.y - 10, p.w - 16, 12, 4, '#475569', false);
          ctx.font = '18px sans-serif';
          ctx.fillText('🗑️', p.x + 14, p.y + 28);
          clearShadow(ctx);
        } else {
          ctx.fillStyle = 'rgba(100,116,139,0.35)';
          ctx.font = '11px Nunito, sans-serif';
          ctx.fillText('✓ emptied', p.x, p.y + 20);
        }
        break;
      case 'mailbox':
        shadow(ctx);
        drawFurnitureGrad(ctx, p.x, p.y + 16, p.w, p.h - 16, 6, '#2563eb', true);
        ctx.fillStyle = '#1d4ed8';
        ctx.fillRect(p.x + 4, p.y + 16, p.w - 8, 6);
        ctx.fillStyle = '#fbbf24';
        ctx.fillRect(p.x + p.w - 12, p.y + 38, 8, 4);
        clearShadow(ctx);
        break;
      case 'road':
        break;
      case 'shop':
        if (p.shop === 'salon') BlossomArt.drawSalonRich(ctx, p, anim);
        else if (p.shop === 'wellness') BlossomArt.drawWellness(ctx, p, anim);
        else if (p.shop === 'boutique') BlossomArt.drawBoutique(ctx, p, anim);
        else if (p.shop === 'market') {
          BlossomArt.drawShopBuilding(ctx, p, anim, {
            wall: '#fef08a', trim: '#ca8a04', awning: '#fde047', sign: '🛒 Market', door: '#92400e',
          });
        } else if (p.shop === 'cafe') {
          BlossomArt.drawShopBuilding(ctx, p, anim, {
            wall: '#fecdd3', trim: '#f43f5e', awning: '#fda4af', sign: '☕ Café', door: '#9f1239',
          });
        } else {
          BlossomArt.drawShopBuilding(ctx, p, anim, {
            wall: '#e2e8f0', trim: '#64748b', awning: '#cbd5e1', sign: p.label || 'Shop', door: '#475569',
          });
        }
        break;
      case 'npc':
        if (p.id === 'bonnie' && (!state || state.level >= BlossomCareer.BONNIE_LEVEL)) {
          BlossomArt.drawNpcBonnie(ctx, p.x + 25, p.y + 60, anim, near);
        }
        break;
      case 'stage':
        BlossomArt.drawStage(ctx, p, anim);
        break;
      case 'gym':
        BlossomArt.drawGym(ctx, p, anim);
        break;
      case 'studio':
        BlossomArt.drawStudio(ctx, p, anim);
        break;
      case 'bench':
        drawFurnitureGrad(ctx, p.x, p.y + 16, p.w, p.h - 16, 6, '#92400e', false);
        ctx.fillStyle = '#78350f';
        ctx.fillRect(p.x + 8, p.y, 9, 22);
        ctx.fillRect(p.x + p.w - 17, p.y, 9, 22);
        break;
      case 'lamp': {
        const lit = 0.5 + Math.sin(anim * 2) * 0.15;
        ctx.fillStyle = '#64748b';
        ctx.fillRect(p.x, p.y + 22, 7, 82);
        const lg = ctx.createRadialGradient(p.x + 3, p.y + 16, 2, p.x + 3, p.y + 16, 28);
        lg.addColorStop(0, `rgba(253, 224, 71, ${lit})`);
        lg.addColorStop(1, 'rgba(253, 224, 71, 0)');
        ctx.fillStyle = lg;
        ctx.beginPath();
        ctx.arc(p.x + 3, p.y + 16, 28, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fef08a';
        ctx.beginPath();
        ctx.arc(p.x + 3, p.y + 16, 13, 0, Math.PI * 2);
        ctx.fill();
        break;
      }
      case 'pond': {
        const pg = ctx.createRadialGradient(p.x + p.w / 2, p.y + p.h / 2, 10, p.x + p.w / 2, p.y + p.h / 2, p.w / 2);
        pg.addColorStop(0, '#38bdf8');
        pg.addColorStop(0.7, '#0284c7');
        pg.addColorStop(1, '#0c4a6e');
        ctx.fillStyle = pg;
        ctx.beginPath();
        ctx.ellipse(p.x + p.w / 2, p.y + p.h / 2, p.w / 2, p.h / 2, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.beginPath();
        ctx.ellipse(p.x + p.w * 0.32, p.y + p.h * 0.32, 36, 12, -0.4, 0, Math.PI * 2);
        ctx.fill();
        break;
      }
      case 'bridge':
        drawFurnitureGrad(ctx, p.x, p.y, p.w, p.h, 8, '#a16207', false);
        ctx.strokeStyle = '#78350f';
        for (let i = 0; i < 5; i++) {
          ctx.beginPath();
          ctx.moveTo(p.x + 8 + i * 14, p.y + 4);
          ctx.lineTo(p.x + 8 + i * 14, p.y + p.h - 4);
          ctx.stroke();
        }
        break;
      case 'ducks':
        ctx.font = '24px serif';
        ctx.fillText('🦆', p.x, p.y + 30);
        ctx.fillText('🦆', p.x + 30, p.y + 24);
        break;
      case 'playground':
        drawFurnitureGrad(ctx, p.x, p.y + 52, p.w, p.h - 52, 10, '#ea580c', false);
        ctx.fillStyle = '#dc2626';
        ctx.beginPath();
        ctx.moveTo(p.x + 22, p.y + 52);
        ctx.lineTo(p.x + 52, p.y);
        ctx.lineTo(p.x + 82, p.y + 52);
        ctx.closePath();
        ctx.fill();
        break;
      case 'exit': {
        if (p.to === 'yard') {
          const glow = 0.35 + pulse * 0.25;
          ctx.fillStyle = `rgba(74, 222, 128, ${glow})`;
          ctx.fillRect(p.x + 4, p.y + 8, p.w - 8, p.h - 16);
          ctx.strokeStyle = '#22c55e';
          ctx.lineWidth = 2;
          ctx.strokeRect(p.x + 4, p.y + 8, p.w - 8, p.h - 16);
          ctx.fillStyle = '#14532d';
          ctx.font = 'bold 10px Nunito, sans-serif';
          ctx.fillText('Outside →', p.x + 6, p.y + p.h / 2 + 4);
        } else {
          const eg = ctx.createLinearGradient(p.x, p.y, p.x + p.w, p.y + p.h);
          eg.addColorStop(0, `rgba(74, 222, 128, ${0.3 + pulse * 0.2})`);
          eg.addColorStop(1, `rgba(34, 197, 94, ${0.2 + pulse * 0.15})`);
          ctx.fillStyle = eg;
          roundRect(ctx, p.x, p.y, p.w, p.h, 12);
          ctx.fill();
          ctx.strokeStyle = '#22c55e';
          ctx.lineWidth = 2.5;
          ctx.stroke();
          ctx.fillStyle = '#14532d';
          ctx.font = 'bold 11px Nunito, sans-serif';
          ctx.fillText(p.label || 'Go', p.x + 8, p.y + p.h / 2 + 4);
        }
        break;
      }
      case 'tree':
        drawTree(ctx, p.x, p.y, p.scale || 1, anim);
        break;
      case 'litter':
        if (!done) {
          ctx.font = '20px sans-serif';
          ctx.fillText('🗑️', p.x + 10, p.y + 26);
          ctx.fillText('🗑️', p.x + 36, p.y + 20);
        } else {
          ctx.fillStyle = 'rgba(74, 222, 128, 0.5)';
          ctx.font = '11px Nunito, sans-serif';
          ctx.fillText('✓ clean block', p.x, p.y + 20);
        }
        break;
      default:
        break;
    }

    ctx.globalAlpha = 1;

    if (p.label && p.choreId && p.kind !== 'exit' && p.kind !== 'shop') {
      ctx.fillStyle = done ? 'rgba(100,116,139,0.85)' : onList ? 'rgba(15,23,42,0.7)' : 'rgba(100,116,139,0.55)';
      ctx.font = '600 10px Nunito, sans-serif';
      ctx.fillText(done ? '✓ ' + p.label : p.label, p.x, p.y - 6);
    }
    if (p.choreId && done) {
      ctx.font = '16px sans-serif';
      ctx.fillText('✓', p.x + (p.w || 40) - 10, p.y + 20);
    }
  }

  function drawInteractGlow(ctx, p, anim) {
    const cx = p.x + (p.w || 50) / 2;
    const cy = p.y + (p.h || 50) / 2;
    const pulse = 0.5 + Math.sin(anim * 5) * 0.5;
    const g = ctx.createRadialGradient(cx, cy, 6, cx, cy, 56 + pulse * 14);
    g.addColorStop(0, `rgba(250, 204, 21, ${0.3 + pulse * 0.25})`);
    g.addColorStop(1, 'rgba(250, 204, 21, 0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(cx, cy, 58 + pulse * 12, 0, Math.PI * 2);
    ctx.fill();
    for (let i = 0; i < 8; i++) {
      const a = anim * 2.2 + (i / 8) * Math.PI * 2;
      ctx.fillStyle = `rgba(253, 224, 71, ${0.45 + pulse * 0.35})`;
      ctx.beginPath();
      ctx.arc(cx + Math.cos(a) * 40, cy + Math.sin(a) * 22, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawPlayer(ctx, state, player, anim, shirtImg, shirtSrc, glowing) {
    const moving = Math.abs(BlossomControls.getMovement().dx) > 0.05
      || Math.abs(BlossomControls.getMovement().dy) > 0.05;
    const namePos = BlossomAvatar.drawCharacter(ctx, {
      avatar: state.avatar || {},
      wardrobe: state.wardrobe,
      x: player.x,
      y: player.y,
      facing: player.facing,
      facingVisual: player.facingVisual ?? player.facing,
      anim,
      moving,
      shirtImg,
      glow: glowing,
      chubby: state.chubby,
      landSquash: player.landSquash || 0,
    });
    if (state.sick) {
      ctx.font = '14px sans-serif';
      ctx.fillText('🤧', player.x + 18, namePos.py - 8);
    }
    ctx.fillStyle = 'rgba(15, 23, 42, 0.55)';
    ctx.font = 'bold 12px Nunito, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(state.name || 'You', namePos.x + 1, namePos.py + 1);
    ctx.fillStyle = '#f8fafc';
    ctx.fillText(state.name || 'You', namePos.x, namePos.py);
    ctx.textAlign = 'left';
  }

  function drawCareerBadge(ctx, state) {
    const p = BlossomCareer.path(state);
    const rank = BlossomCareer.rankLabel(state);
    const w = 172;
    const g = ctx.createLinearGradient(14, 52, 14 + w, 82);
    g.addColorStop(0, 'rgba(15, 23, 42, 0.72)');
    g.addColorStop(1, 'rgba(30, 41, 59, 0.55)');
    ctx.fillStyle = g;
    roundRect(ctx, 14, 52, w, 30, 15);
    ctx.fill();
    ctx.fillStyle = '#f8fafc';
    ctx.font = '600 11px Nunito, sans-serif';
    ctx.fillText(`${p.emoji} ${rank}`, 26, 72);
  }

  function drawSceneContent(ctx, loc, props, anim, choresDone, nearId, todaysChores, state) {
    const phaseId = state?.timeOfDay || 'morning';
    drawSky(ctx, loc, anim, phaseId);
    const weather = BlossomWeather?.typeFor?.(loc.id, phaseId, state?.day) || 'none';
    if (weather !== 'none') {
      BlossomWeather.draw(ctx, BlossomWorld.W, BlossomWorld.H, loc.floorY, weather, anim);
    }
    if (loc.id === 'house') drawHouseInterior(ctx, loc, anim, phaseId);
    drawGround(ctx, loc, anim);
    const sorted = [...props].sort((a, b) => (a.y + (a.h || 0) * 0.5) - (b.y + (b.h || 0) * 0.5));
    sorted.forEach((p) => {
      if (p.kind === 'npc' && p.id === 'bonnie' && state?.level < BlossomCareer.BONNIE_LEVEL) return;
      if (p.kind === 'studio' && state?.careerPath !== 'tiktoker') return;
      drawProp(ctx, p, anim, choresDone, nearId, todaysChores, state);
    });
    if (BlossomPet?.visible?.(loc)) {
      BlossomPet.draw(ctx, anim);
    }
    if (phaseId === 'evening' || phaseId === 'night') {
      ctx.fillStyle = phaseId === 'night' ? 'rgba(15, 23, 42, 0.35)' : 'rgba(249, 115, 22, 0.08)';
      ctx.fillRect(0, 0, BlossomWorld.W, loc.floorY);
    }
    if (state?.currentRoom && loc.id === 'house') {
      drawRoomFloorLabel(ctx, loc, state.currentRoom, anim);
    }
  }

  function drawRoomFloorLabel(ctx, loc, roomId, anim) {
    const room = loc.rooms?.find((r) => r.id === roomId);
    if (!room) return;
    const pulse = 0.7 + Math.sin(anim * 3) * 0.15;
    const cx = room.x + room.w / 2;
    const cy = loc.floorY + 8;
    ctx.fillStyle = `rgba(15, 23, 42, ${0.55 * pulse})`;
    roundRect(ctx, cx - 52, cy - 10, 104, 22, 11);
    ctx.fill();
    ctx.fillStyle = '#fef9c3';
    ctx.font = '600 11px Nunito, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(room.label, cx, cy + 5);
    ctx.textAlign = 'left';
  }

  function drawInteractPrompt(ctx, prop, anim) {
    if (!prop) return;
    const cx = prop.x + (prop.w || 50) / 2;
    const cy = prop.y - 18 + Math.sin(anim * 5) * 3;
    const pulse = 0.6 + Math.sin(anim * 6) * 0.4;
    ctx.fillStyle = `rgba(15, 23, 42, ${0.75 * pulse})`;
    roundRect(ctx, cx - 16, cy - 14, 32, 28, 8);
    ctx.fill();
    ctx.strokeStyle = `rgba(250, 204, 21, ${0.5 + pulse * 0.4})`;
    ctx.lineWidth = 2;
    roundRect(ctx, cx - 16, cy - 14, 32, 28, 8);
    ctx.stroke();
    ctx.fillStyle = '#fde047';
    ctx.font = 'bold 14px Nunito, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('E', cx, cy + 5);
    ctx.textAlign = 'left';
  }

  function drawSpeechTail(ctx, x, y) {
    ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x - 8, y + 14);
    ctx.lineTo(x + 8, y + 14);
    ctx.closePath();
    ctx.fill();
  }

  function drawScene(ctx, loc, props, anim, choresDone, nearId, todaysChores, state) {
    const phaseId = state?.timeOfDay || 'morning';
    const wc = getWorldCanvas();
    const wctx = wc.getContext('2d');
    wctx.clearRect(0, 0, BlossomWorld.W, BlossomWorld.H);
    drawSceneContent(wctx, loc, props, anim, choresDone, nearId, todaysChores, state);
    BlossomGfx.finishFrame(wctx, BlossomWorld.W, BlossomWorld.H, { loc, phaseId, anim });
    ctx.drawImage(wc, 0, 0);
  }

  function drawChoreTracker(ctx, state) {
    const list = state.todaysChores || [];
    const done = state.choresDone || {};
    const total = list.length;
    const finished = list.filter((id) => done[id]).length;
    const w = 124;
    const h = 30;
    ctx.fillStyle = 'rgba(15, 23, 42, 0.62)';
    roundRect(ctx, BlossomWorld.W - w - 14, 14, w, h, 15);
    ctx.fill();
    ctx.fillStyle = '#f8fafc';
    ctx.font = '600 11px Nunito, sans-serif';
    ctx.fillText(`📋 ${finished}/${total} chores`, BlossomWorld.W - w, 34);
  }

  function drawLocationBadge(ctx, locName) {
    const g = ctx.createLinearGradient(14, 14, 164, 46);
    g.addColorStop(0, 'rgba(15, 23, 42, 0.68)');
    g.addColorStop(1, 'rgba(30, 41, 59, 0.52)');
    ctx.fillStyle = g;
    roundRect(ctx, 14, 14, 156, 34, 17);
    ctx.fill();
    ctx.fillStyle = '#f8fafc';
    ctx.font = '600 12px Nunito, sans-serif';
    ctx.fillText('📍 ' + locName, 26, 36);
  }

  function hitProp(px, py, p) {
    const w = p.w || 50;
    const h = p.h || 50;
    return px >= p.x && px <= p.x + w && py >= p.y && py <= p.y + h;
  }

  return {
    drawScene,
    drawPlayer,
    drawLocationBadge,
    drawChoreTracker,
    drawCareerBadge,
    drawInteractGlow,
    drawInteractPrompt,
    drawSpeechTail,
    hitProp,
    roundRect,
    invalidateCache: () => BlossomGfx?.invalidateLayerCache?.(),
  };
})();