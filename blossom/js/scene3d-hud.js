/** 2008 MMO HUD — bronze frames, parchment minimap, yellow zone text */
window.BlossomScene3DHud = (function () {
  const ZONE_TINT = {
    house: '#8ecae6',
    yard: '#90be6d',
    street: '#ffd166',
    pch: '#56cfe1',
    pacCity: '#f9c74f',
    park: '#f4978e',
  };

  let zoneFlash = 0;
  let zoneFlashName = '';

  function triggerZoneFlash(name) {
    zoneFlashName = name || '';
    zoneFlash = 1;
  }

  function wowText(ctx, text, x, y, size, color) {
    ctx.font = `bold ${size}px Arial, Helvetica, sans-serif`;
    ctx.textAlign = 'left';
    ctx.lineWidth = Math.max(2, size * 0.14);
    ctx.strokeStyle = '#000';
    ctx.strokeText(text, x, y);
    ctx.fillStyle = color || '#fff568';
    ctx.fillText(text, x, y);
  }

  function wowTextCenter(ctx, text, x, y, size, color) {
    ctx.font = `bold ${size}px Arial, Helvetica, sans-serif`;
    ctx.textAlign = 'center';
    ctx.lineWidth = Math.max(2, size * 0.14);
    ctx.strokeStyle = '#000';
    ctx.strokeText(text, x, y);
    ctx.fillStyle = color || '#fff568';
    ctx.fillText(text, x, y);
    ctx.textAlign = 'left';
  }

  function drawWowPanel(ctx, x, y, w, h) {
    const outer = ctx.createLinearGradient(x, y, x, y + h);
    outer.addColorStop(0, '#9a7b4a');
    outer.addColorStop(0.45, '#c9a227');
    outer.addColorStop(1, '#4a3728');
    ctx.fillStyle = outer;
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = 'rgba(8, 6, 4, 0.82)';
    ctx.fillRect(x + 3, y + 3, w - 6, h - 6);
    ctx.strokeStyle = '#e8c547';
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
    ctx.strokeStyle = '#2d1f0f';
    ctx.strokeRect(x + 3.5, y + 3.5, w - 7, h - 7);
  }

  function drawUnitFrame(ctx, x, y, w, h, title, sub, tint) {
    drawWowPanel(ctx, x, y, w, h);
    ctx.fillStyle = tint || '#fff568';
    ctx.fillRect(x + 5, y + 5, w - 10, 4);
    wowText(ctx, title, x + 10, y + 24, 13, '#fff568');
    if (sub) wowText(ctx, sub, x + 10, y + 40, 11, '#f0e6c8');
  }

  function drawMinimap(ctx, w, h, player, locId) {
    if (!BlossomWorld3D?.isOverworld?.()) return;
    const mmW = 132;
    const mmH = 108;
    const mx = w - mmW - 10;
    const my = h - mmH - 10;

    drawWowPanel(ctx, mx, my, mmW, mmH);
    const pad = 8;
    const ix = mx + pad;
    const iy = my + pad;
    const iw = mmW - pad * 2;
    const ih = mmH - pad * 2 - 12;

    ctx.fillStyle = '#c4b08a';
    ctx.fillRect(ix, iy, iw, ih);
    ctx.fillStyle = '#8bb8d4';
    ctx.fillRect(ix, iy, iw, ih * 0.42);

    const bounds = BlossomWorld3D.WORLD_BOUNDS || { minX: -175, maxX: 252, minZ: -88, maxZ: 88 };
    const spanX = bounds.maxX - bounds.minX;
    const spanZ = bounds.maxZ - bounds.minZ;
    const mapX = (wx) => ix + ((wx - bounds.minX) / spanX) * iw;
    const mapZ = (wz) => iy + ((wz - bounds.minZ) / spanZ) * ih;

    (BlossomWorld3D.minimapZones?.() || []).forEach((z) => {
      const cx = mapX(z.wx);
      const cz = mapZ(z.wz);
      const zw = (z.halfW * 2 / spanX) * iw;
      const zh = (z.halfD * 2 / spanZ) * ih;
      ctx.fillStyle = z.id === locId ? 'rgba(255, 209, 102, 0.55)' : 'rgba(144, 190, 109, 0.35)';
      ctx.fillRect(cx - zw / 2, cz - zh / 2, zw, zh);
      ctx.fillStyle = '#2d1f0f';
      ctx.font = 'bold 8px Arial, sans-serif';
      ctx.textAlign = 'center';
      const labels = { house: '9th St', yard: 'Hood', street: 'Main St', pch: 'PCH', pacCity: 'Pac City', park: 'Pier' };
      ctx.fillText(labels[z.id] || z.id, cx, cz + 3);
      ctx.textAlign = 'left';
    });

    if (player?.wx != null) {
      const px = mapX(player.wx);
      const pz = mapZ(player.wz);
      ctx.fillStyle = '#e63946';
      ctx.fillRect(px - 3, pz - 3, 6, 6);
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 1;
      ctx.strokeRect(px - 3.5, pz - 3.5, 7, 7);
      const yaw = player.moveYaw ?? 0;
      ctx.strokeStyle = '#fff568';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(px, pz);
      ctx.lineTo(px + Math.sin(yaw) * 10, pz + Math.cos(yaw) * 10);
      ctx.stroke();
    }

    wowText(ctx, 'WORLD MAP', mx + 10, my + mmH - 6, 9, '#e8c547');
  }

  function drawQuestTracker(ctx, state) {
    const list = state.todaysChores || [];
    const done = state.choresDone || {};
    const finished = list.filter((id) => done[id]).length;
    const y = 118;
    drawWowPanel(ctx, 10, y, 178, 54);
    wowText(ctx, 'Daily Objectives', 18, y + 20, 12, '#fff568');
    wowText(ctx, `${finished} / ${list.length} complete`, 18, y + 38, 11, finished === list.length ? '#40c040' : '#f0e6c8');
  }

  function drawInteractPrompt(ctx, w, h, nearInteract) {
    if (!nearInteract) return;
    const label = nearInteract.label || nearInteract.kind || 'Interact';
    wowTextCenter(ctx, `[E] ${label}`, w / 2, h - 36, 15, '#fff568');
  }

  function drawZoneFlash(ctx, w, h) {
    if (zoneFlash <= 0) return;
    zoneFlash = Math.max(0, zoneFlash - 0.028);
    const t = zoneFlash;
    if (zoneFlashName && t > 0.3) {
      const alpha = Math.min(1, (t - 0.3) * 2.4);
      ctx.globalAlpha = alpha;
      const size = Math.min(32, w * 0.07);
      wowTextCenter(ctx, zoneFlashName, w / 2, h * 0.3, size, '#fff568');
      ctx.globalAlpha = 1;
      wowTextCenter(ctx, '✦ Discovered ✦', w / 2, h * 0.3 + size + 8, 13, '#f0e6c8');
    }
  }

  function draw(ctx, w, h, opts) {
    const { loc, state, player, nearInteract, running, phaseFade } = opts;
    const tint = ZONE_TINT[loc?.id] || '#fff568';

    drawUnitFrame(ctx, 10, 10, 188, 52, loc?.name || 'Huntington Beach', null, tint);

    const p = BlossomCareer.path(state);
    const rank = BlossomCareer.rankLabel(state);
    drawUnitFrame(ctx, 10, 68, 188, 44, `${p.emoji} ${rank}`, 'Career path', '#c9a227');

    drawQuestTracker(ctx, state);
    drawMinimap(ctx, w, h, player, loc?.id);

    if (running) {
      wowText(ctx, '>> RUN', w - 78, 22, 12, '#40c040');
    } else {
      ctx.fillStyle = '#a09070';
      ctx.font = '10px Arial, sans-serif';
      ctx.fillText('Shift — run', w - 78, 22);
    }

    if (phaseFade > 0) {
      ctx.fillStyle = `rgba(255, 245, 180, ${phaseFade * 0.22})`;
      ctx.fillRect(0, 0, w, h);
    }

    drawZoneFlash(ctx, w, h);
    drawInteractPrompt(ctx, w, h, nearInteract);

    wowText(ctx, '9th St → Main → PCH → Pac City → Pier', 12, h - 8, 9, '#c9a227');
  }

  return { draw, triggerZoneFlash };
})();