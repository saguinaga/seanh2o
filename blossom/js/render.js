/** Higher-fidelity canvas rendering for Blossom Life */
window.BlossomRender = (function () {
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

  function shadow(ctx, color = 'rgba(0,0,0,0.18)', blur = 12, ox = 0, oy = 6) {
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
    if (phaseId === 'evening' || phaseId === 'night') {
      g.addColorStop(0, '#1e3a5f');
      g.addColorStop(0.5, '#7c3aed');
      g.addColorStop(1, loc.sky[2]);
    } else {
      g.addColorStop(0, loc.sky[0]);
      g.addColorStop(0.55, loc.sky[1]);
      g.addColorStop(1, loc.sky[2]);
    }
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, BlossomWorld.W, loc.floorY);

    const hillSets = {
      house: ['#86efac88', '#4ade8066', '#22c55e44'],
      yard: ['#6ee7b788', '#34d39966', '#10b98144'],
      street: ['#93c5fd88', '#60a5fa55', '#3b82f644'],
      park: ['#a7f3d088', '#6ee7b766', '#34d39944'],
    };
    BlossomArt.drawHills(ctx, loc.floorY, hillSets[loc.id] || hillSets.house, anim);

    if (phaseId !== 'night') {
      BlossomArt.drawSun(ctx, 680, phaseId === 'evening' ? 120 : 68, 28, anim);
    } else {
      ctx.fillStyle = '#fef9c3';
      [[100, 60], [250, 40], [500, 55], [700, 35]].forEach(([sx, sy], i) => {
        ctx.beginPath();
        ctx.arc(sx + Math.sin(anim * 0.5 + i) * 4, sy, 1.5, 0, Math.PI * 2);
        ctx.fill();
      });
    }

    ctx.fillStyle = 'rgba(255,255,255,0.82)';
    [[120, 70, 55], [340, 45, 70], [580, 90, 45], [220, 110, 35]].forEach(([cx, cy, s], i) => {
      const drift = Math.sin(anim * 0.3 + i) * 10;
      ctx.beginPath();
      ctx.arc(cx + drift, cy, s * 0.45, 0, Math.PI * 2);
      ctx.arc(cx + s * 0.35 + drift, cy - 8, s * 0.38, 0, Math.PI * 2);
      ctx.arc(cx - s * 0.25 + drift, cy - 4, s * 0.32, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  function drawHouseInterior(ctx, loc, anim) {
    const wallGrad = ctx.createLinearGradient(0, 80, 0, loc.floorY);
    wallGrad.addColorStop(0, '#fffbeb');
    wallGrad.addColorStop(0.6, '#fef3c7');
    wallGrad.addColorStop(1, '#fde68a');
    ctx.fillStyle = wallGrad;
    ctx.fillRect(0, 80, BlossomWorld.W, loc.floorY - 80);
    ctx.fillStyle = BlossomArt.noisePattern(ctx, 64, 64, 'rgba(255,255,255,0.03)', 'rgba(0,0,0,0.04)');
    ctx.fillRect(0, 80, BlossomWorld.W, loc.floorY - 80);

    BlossomArt.drawWindow(ctx, 70, 115, 100, 75, anim, true);
    BlossomArt.drawWindow(ctx, 635, 108, 110, 85, anim, true);

    ctx.fillStyle = '#f97316';
    ctx.fillRect(0, loc.floorY - 14, BlossomWorld.W, 14);
    ctx.fillStyle = '#ea580c';
    for (let i = 0; i < BlossomWorld.W; i += 48) ctx.fillRect(i, loc.floorY - 14, 24, 4);
  }

  function drawGround(ctx, loc) {
    const g = ctx.createLinearGradient(0, loc.floorY, 0, BlossomWorld.H);
    g.addColorStop(0, loc.ground);
    g.addColorStop(1, loc.groundAccent);
    ctx.fillStyle = g;
    ctx.fillRect(0, loc.floorY, BlossomWorld.W, BlossomWorld.H - loc.floorY);

    if (loc.id === 'house') {
      ctx.strokeStyle = 'rgba(0,0,0,0.06)';
      for (let i = 0; i < BlossomWorld.W; i += 36) {
        ctx.beginPath();
        ctx.moveTo(i, loc.floorY);
        ctx.lineTo(i + 18, BlossomWorld.H);
        ctx.stroke();
      }
    } else if (loc.id === 'street') {
      ctx.fillStyle = '#475569';
      ctx.fillRect(0, loc.floorY + 8, BlossomWorld.W, 8);
      ctx.strokeStyle = '#fbbf24';
      ctx.setLineDash([18, 14]);
      ctx.beginPath();
      ctx.moveTo(0, loc.floorY + 55);
      ctx.lineTo(BlossomWorld.W, loc.floorY + 55);
      ctx.stroke();
      ctx.setLineDash([]);
    } else {
      BlossomArt.grassFill(ctx, 0, loc.floorY, BlossomWorld.W, BlossomWorld.H - loc.floorY);
      ctx.fillStyle = 'rgba(255,255,255,0.1)';
      for (let i = 0; i < 28; i++) {
        ctx.beginPath();
        ctx.ellipse((i * 97) % BlossomWorld.W, loc.floorY + 16 + (i % 4) * 7, 4, 2, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  function drawTree(ctx, x, y, scale, anim) {
    const s = scale || 1;
    shadow(ctx, 'rgba(0,0,0,0.2)', 10, 0, 5);
    ctx.fillStyle = '#78350f';
    roundRect(ctx, x - 8 * s, y + 40 * s, 16 * s, 50 * s, 4);
    ctx.fill();
    clearShadow(ctx);
    const sway = Math.sin(anim * 1.5) * 2;
    ctx.fillStyle = '#166534';
    ctx.beginPath();
    ctx.moveTo(x + sway, y - 30 * s);
    ctx.lineTo(x + 42 * s + sway, y + 35 * s);
    ctx.lineTo(x - 42 * s + sway, y + 35 * s);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#22c55e';
    ctx.beginPath();
    ctx.arc(x + sway, y + 5 * s, 28 * s, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawProp(ctx, p, anim, choresDone, nearId, todaysChores, state) {
    const pulse = 0.5 + Math.sin(anim * 4) * 0.5;
    const done = p.choreId && choresDone[p.choreId];
    const onList = !p.choreId || todaysChores?.includes(p.choreId);
    const near = p.choreId === nearId || (p.kind === 'exit' && nearId === `exit-${p.to}`)
      || (p.kind === 'npc' && nearId === 'bonnie')
      || (p.kind === 'shop' && p.shop === 'salon' && nearId === 'salon-work')
      || (p.kind === 'stage' && nearId === 'stage-work')
      || (p.kind === 'studio' && nearId === 'studio-work');

    if (p.choreId && !onList && !done) {
      ctx.globalAlpha = 0.45;
    }

    const interactHighlight = p.choreId || p.kind === 'exit' || p.kind === 'fridge'
      || p.kind === 'npc' || p.kind === 'stage' || p.kind === 'studio'
      || (p.kind === 'shop' && (p.choreId || p.shop === 'salon'));
    if (interactHighlight) {
      if (near && (!p.choreId || (!done && onList))) {
        ctx.strokeStyle = `rgba(250, 204, 21, ${0.5 + pulse * 0.4})`;
        ctx.lineWidth = 3;
        roundRect(ctx, p.x - 4, p.y - 4, (p.w || 60) + 8, (p.h || 60) + 8, 10);
        ctx.stroke();
      }
    }

    switch (p.kind) {
      case 'rug':
        ctx.fillStyle = '#fda4af';
        roundRect(ctx, p.x, p.y, p.w, p.h, 12);
        ctx.fill();
        break;
      case 'bed':
        shadow(ctx);
        ctx.fillStyle = '#c4b5fd';
        roundRect(ctx, p.x, p.y, p.w, p.h, 10);
        ctx.fill();
        ctx.fillStyle = '#ede9fe';
        roundRect(ctx, p.x + 10, p.y + 8, p.w - 20, 28, 8);
        ctx.fill();
        clearShadow(ctx);
        break;
      case 'desk':
        shadow(ctx);
        ctx.fillStyle = '#d97706';
        roundRect(ctx, p.x, p.y + 20, p.w, p.h - 20, 6);
        ctx.fill();
        ctx.fillStyle = '#fcd34d';
        ctx.fillRect(p.x + 4, p.y, p.w - 8, 24);
        clearShadow(ctx);
        break;
      case 'sink':
        shadow(ctx);
        ctx.fillStyle = '#e2e8f0';
        roundRect(ctx, p.x, p.y, p.w, p.h, 8);
        ctx.fill();
        ctx.fillStyle = '#94a3b8';
        ctx.beginPath();
        ctx.ellipse(p.x + p.w / 2, p.y + 35, 22, 14, 0, 0, Math.PI * 2);
        ctx.fill();
        clearShadow(ctx);
        break;
      case 'fridge':
        shadow(ctx);
        ctx.fillStyle = '#6ee7b7';
        roundRect(ctx, p.x, p.y, p.w, p.h, 8);
        ctx.fill();
        ctx.strokeStyle = '#059669';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.fillStyle = '#047857';
        ctx.fillRect(p.x + p.w - 12, p.y + 30, 4, 20);
        clearShadow(ctx);
        break;
      case 'couch':
        shadow(ctx);
        ctx.fillStyle = '#f9a8d4';
        roundRect(ctx, p.x, p.y + 20, p.w, p.h - 20, 12);
        ctx.fill();
        roundRect(ctx, p.x + 8, p.y, p.w - 16, 30, 10);
        ctx.fill();
        clearShadow(ctx);
        break;
      case 'plant':
      case 'garden':
        drawTree(ctx, p.x + (p.w || 40) / 2, p.y, 0.55, anim);
        if (p.kind === 'garden') {
          ctx.fillStyle = '#a16207';
          roundRect(ctx, p.x, p.y + 40, p.w, p.h - 40, 6);
          ctx.fill();
        }
        break;
      case 'bath':
        ctx.fillStyle = '#bae6fd';
        roundRect(ctx, p.x, p.y, p.w, p.h, 8);
        ctx.fill();
        break;
      case 'broom':
        ctx.fillStyle = '#a8a29e';
        ctx.fillRect(p.x + 40, p.y, 8, 30);
        ctx.fillStyle = '#fbbf24';
        ctx.beginPath();
        ctx.moveTo(p.x, p.y + 20);
        ctx.lineTo(p.x + 45, p.y + 5);
        ctx.lineTo(p.x + 45, p.y + 35);
        ctx.closePath();
        ctx.fill();
        break;
      case 'houseFacade':
        ctx.fillStyle = '#fef3c7';
        roundRect(ctx, p.x + 20, p.y + 60, 160, 200, 8);
        ctx.fill();
        ctx.fillStyle = '#7c3aed';
        ctx.beginPath();
        ctx.moveTo(p.x + 10, p.y + 70);
        ctx.lineTo(p.x + 100, p.y + 20);
        ctx.lineTo(p.x + 190, p.y + 70);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#38bdf8';
        roundRect(ctx, p.x + 130, p.y + 200, 50, 90, 6);
        ctx.fill();
        break;
      case 'fence':
        ctx.fillStyle = '#d6d3d1';
        for (let i = 0; i < 16; i++) {
          ctx.fillRect(p.x + i * 50, p.y, 8, p.h);
          ctx.fillRect(p.x + i * 50 - 5, p.y + 15, 58, 6);
        }
        break;
      case 'path':
        ctx.fillStyle = '#d6d3d1';
        roundRect(ctx, p.x, p.y, p.w, p.h, 20);
        ctx.fill();
        break;
      case 'trash':
        shadow(ctx);
        ctx.fillStyle = '#64748b';
        roundRect(ctx, p.x, p.y, p.w, p.h, 6);
        ctx.fill();
        ctx.fillStyle = '#334155';
        ctx.fillRect(p.x + 8, p.y - 8, p.w - 16, 10);
        clearShadow(ctx);
        break;
      case 'mailbox':
        shadow(ctx);
        ctx.fillStyle = '#1e40af';
        roundRect(ctx, p.x, p.y + 15, p.w, p.h - 15, 4);
        ctx.fill();
        ctx.fillStyle = '#1e3a8a';
        ctx.fillRect(p.x + 20, p.y + 35, p.w - 10, 6);
        clearShadow(ctx);
        break;
      case 'road':
        ctx.fillStyle = '#334155';
        ctx.fillRect(p.x, p.y, p.w, p.h);
        break;
      case 'shop':
        if (p.shop === 'salon') {
          BlossomArt.drawSalonRich(ctx, p, anim);
        } else {
          shadow(ctx, 'rgba(0,0,0,0.25)', 16, 0, 8);
          const colors = { market: '#fef08a', cafe: '#fecdd3' };
          ctx.fillStyle = colors[p.shop] || '#e2e8f0';
          roundRect(ctx, p.x, p.y + 40, p.w, p.h - 40, 6);
          ctx.fill();
          BlossomArt.drawAwning(ctx, p.x, p.y + 28, p.w, colors[p.shop] || '#e2e8f0');
          ctx.fillStyle = '#475569';
          ctx.fillRect(p.x, p.y + 30, p.w, 14);
          BlossomArt.drawWindow(ctx, p.x + 18, p.y + 72, p.w - 36, 55, anim, true);
          clearShadow(ctx);
          ctx.fillStyle = '#334155';
          ctx.font = 'bold 12px Fredoka, Nunito, sans-serif';
          ctx.fillText(p.label || p.shop, p.x + 10, p.y + 22);
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
      case 'studio':
        BlossomArt.drawStudio(ctx, p, anim);
        break;
      case 'bench':
        ctx.fillStyle = '#92400e';
        roundRect(ctx, p.x, p.y + 15, p.w, p.h - 15, 4);
        ctx.fill();
        ctx.fillRect(p.x + 8, p.y, 8, 20);
        ctx.fillRect(p.x + p.w - 16, p.y, 8, 20);
        break;
      case 'lamp':
        ctx.fillStyle = '#64748b';
        ctx.fillRect(p.x, p.y + 20, 6, 80);
        ctx.fillStyle = '#fef08a';
        ctx.beginPath();
        ctx.arc(p.x + 3, p.y + 18, 12, 0, Math.PI * 2);
        ctx.fill();
        break;
      case 'pond':
        ctx.fillStyle = '#0ea5e9';
        ctx.beginPath();
        ctx.ellipse(p.x + p.w / 2, p.y + p.h / 2, p.w / 2, p.h / 2, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.25)';
        ctx.beginPath();
        ctx.ellipse(p.x + p.w * 0.35, p.y + p.h * 0.35, 30, 10, -0.4, 0, Math.PI * 2);
        ctx.fill();
        break;
      case 'bridge':
        ctx.fillStyle = '#a16207';
        roundRect(ctx, p.x, p.y, p.w, p.h, 6);
        ctx.fill();
        break;
      case 'ducks':
        ctx.font = '22px serif';
        ctx.fillText('🦆', p.x, p.y + 28);
        ctx.fillText('🦆', p.x + 28, p.y + 22);
        break;
      case 'playground':
        ctx.fillStyle = '#f97316';
        roundRect(ctx, p.x, p.y + 50, p.w, p.h - 50, 8);
        ctx.fill();
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.moveTo(p.x + 20, p.y + 50);
        ctx.lineTo(p.x + 50, p.y);
        ctx.lineTo(p.x + 80, p.y + 50);
        ctx.closePath();
        ctx.fill();
        break;
      case 'exit':
        ctx.fillStyle = `rgba(74, 222, 128, ${0.25 + pulse * 0.2})`;
        roundRect(ctx, p.x, p.y, p.w, p.h, 10);
        ctx.fill();
        ctx.strokeStyle = '#22c55e';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.fillStyle = '#166534';
        ctx.font = 'bold 11px Nunito, sans-serif';
        ctx.fillText(p.label || 'Go', p.x + 6, p.y + p.h / 2);
        break;
      case 'tree':
        drawTree(ctx, p.x, p.y, p.scale || 1, anim);
        break;
      case 'litter':
        ctx.font = '18px sans-serif';
        ctx.fillText('🗑️', p.x + 10, p.y + 24);
        break;
      default:
        break;
    }

    ctx.globalAlpha = 1;

    if (p.label && p.choreId && p.kind !== 'exit' && p.kind !== 'shop') {
      ctx.fillStyle = done ? 'rgba(100,116,139,0.8)' : onList ? 'rgba(15,23,42,0.65)' : 'rgba(100,116,139,0.55)';
      ctx.font = '10px Nunito, sans-serif';
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
    const g = ctx.createRadialGradient(cx, cy, 8, cx, cy, 48 + pulse * 12);
    g.addColorStop(0, `rgba(250, 204, 21, ${0.25 + pulse * 0.2})`);
    g.addColorStop(1, 'rgba(250, 204, 21, 0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(cx, cy, 52 + pulse * 10, 0, Math.PI * 2);
    ctx.fill();
    for (let i = 0; i < 6; i++) {
      const a = anim * 2 + (i / 6) * Math.PI * 2;
      ctx.fillStyle = `rgba(253, 224, 71, ${0.4 + pulse * 0.3})`;
      ctx.beginPath();
      ctx.arc(cx + Math.cos(a) * 36, cy + Math.sin(a) * 20, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawPlayer(ctx, state, player, anim, shirtImg, shirtSrc, glowing) {
    const av = state.avatar || {};
    const moving = Math.abs(BlossomControls.getMovement().dx) > 0.05
      || Math.abs(BlossomControls.getMovement().dy) > 0.05;
    const bob = Math.sin(anim * (moving ? 10 : 3)) * (moving ? 3 : 0.8);
    const leg = moving ? Math.sin(anim * 12) * 5 : 0;
    const px = player.x;
    const py = player.y + bob;
    const scale = state.chubby ? 1.12 : 1;

    if (glowing) {
      const g = ctx.createRadialGradient(px, py - 20, 4, px, py - 20, 38);
      g.addColorStop(0, 'rgba(74, 222, 128, 0.35)');
      g.addColorStop(1, 'rgba(74, 222, 128, 0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(px, py - 20, 38, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillStyle = 'rgba(0,0,0,0.15)';
    ctx.beginPath();
    ctx.ellipse(px, py + 4, 14 * scale, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.save();
    ctx.translate(px, py);
    ctx.scale(player.facing * scale, scale);

    ctx.fillStyle = av.skin || '#f5d0a8';
    ctx.beginPath();
    ctx.ellipse(0, -40, 15, 17, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = av.hair || '#4a3728';
    ctx.beginPath();
    ctx.arc(0, -50, 16, Math.PI, 0);
    ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,0.15)';
    ctx.beginPath();
    ctx.arc(-6, -46, 2, 0, Math.PI * 2);
    ctx.arc(6, -46, 2, 0, Math.PI * 2);
    ctx.fill();

    if (av.shirtPattern && shirtImg?.complete) {
      ctx.drawImage(shirtImg, -18, -30, 36, 30);
    } else {
      ctx.fillStyle = av.shirtColor || '#5eead4';
      roundRect(ctx, -17, -30, 34, 28, 6);
      ctx.fill();
    }

    ctx.fillStyle = av.skin || '#f5d0a8';
    roundRect(ctx, -6, -2, 12, 20, 4);
    ctx.fill();
    ctx.fillRect(-15, -22, 9, 7);
    ctx.fillRect(6, -22, 9, 7);
    ctx.fillRect(-9 + leg, 18, 7, 14);
    ctx.fillRect(2 - leg, 18, 7, 14);

    if (state.sick) {
      ctx.font = '14px sans-serif';
      ctx.fillText('🤧', 14, -54);
    }

    ctx.restore();

    ctx.fillStyle = '#1e293b';
    ctx.font = 'bold 12px Nunito, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(state.name || 'You', px, py - 62);
    ctx.textAlign = 'left';
  }

  function drawCareerBadge(ctx, state) {
    const p = BlossomCareer.path(state);
    const rank = BlossomCareer.rankLabel(state);
    const w = 168;
    ctx.fillStyle = 'rgba(15, 23, 42, 0.55)';
    roundRect(ctx, 14, 52, w, 30, 15);
    ctx.fill();
    ctx.fillStyle = '#f8fafc';
    ctx.font = '600 11px Nunito, sans-serif';
    ctx.fillText(`${p.emoji} ${rank}`, 26, 72);
  }

  function drawScene(ctx, loc, props, anim, choresDone, nearId, todaysChores, state) {
    const phaseId = state?.timeOfDay || 'morning';
    drawSky(ctx, loc, anim, phaseId);
    if (loc.id === 'house') drawHouseInterior(ctx, loc, anim);
    drawGround(ctx, loc);
    props.forEach((p) => {
      if (p.kind === 'npc' && p.id === 'bonnie' && state?.level < BlossomCareer.BONNIE_LEVEL) return;
      drawProp(ctx, p, anim, choresDone, nearId, todaysChores, state);
    });
    BlossomArt.vignette(ctx, BlossomWorld.W, BlossomWorld.H);
  }

  function drawChoreTracker(ctx, state) {
    const list = state.todaysChores || [];
    const done = state.choresDone || {};
    const total = list.length;
    const finished = list.filter((id) => done[id]).length;
    const w = 118;
    const h = 28;
    ctx.fillStyle = 'rgba(15, 23, 42, 0.5)';
    roundRect(ctx, BlossomWorld.W - w - 14, 14, w, h, 14);
    ctx.fill();
    ctx.fillStyle = '#f8fafc';
    ctx.font = '600 11px Nunito, sans-serif';
    ctx.fillText(`📋 ${finished}/${total} chores`, BlossomWorld.W - w, 33);
  }

  function drawLocationBadge(ctx, locName) {
    ctx.fillStyle = 'rgba(15, 23, 42, 0.55)';
    roundRect(ctx, 14, 14, 150, 32, 16);
    ctx.fill();
    ctx.fillStyle = '#f8fafc';
    ctx.font = '600 12px Nunito, sans-serif';
    ctx.fillText('📍 ' + locName, 26, 35);
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
    hitProp,
    roundRect,
  };
})();