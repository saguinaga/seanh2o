/** 3D HUD — clean coastal-luxury overlay (minimap + prompts only; stats live in HTML sidebar) */
window.BlossomScene3DHud = (function () {
  const ZONE_TINT = {
    house: '#7dd3fc',
    yard: '#86efac',
    street: '#fcd34d',
    pch: '#67e8f9',
    pacCity: '#fbbf24',
    park: '#fda4af',
  };

  let zoneFlash = 0;
  let zoneFlashName = '';

  function triggerZoneFlash(name) {
    zoneFlashName = name || '';
    zoneFlash = 1;
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

  function glassPanel(ctx, x, y, w, h, alpha) {
    ctx.save();
    roundRect(ctx, x, y, w, h, 14);
    ctx.fillStyle = `rgba(15, 23, 42, ${alpha ?? 0.72})`;
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.14)';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();
  }

  function label(ctx, text, x, y, size, color, weight) {
    ctx.font = `${weight || 600} ${size}px Nunito, system-ui, sans-serif`;
    ctx.textAlign = 'left';
    ctx.fillStyle = color || '#f8fafc';
    ctx.fillText(text, x, y);
  }

  function drawMinimap(ctx, w, h, player, locId) {
    if (!BlossomWorld3D?.isOverworld?.()) return;
    const mmW = 118;
    const mmH = 92;
    const mx = w - mmW - 12;
    const my = 12;

    glassPanel(ctx, mx, my, mmW, mmH, 0.78);
    const pad = 10;
    const ix = mx + pad;
    const iy = my + pad;
    const iw = mmW - pad * 2;
    const ih = mmH - pad * 2 - 14;

    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(ix, iy, iw, ih * 0.38);
    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(ix, iy + ih * 0.38, iw, ih * 0.62);

    const bounds = BlossomWorld3D.WORLD_BOUNDS || { minX: -325, maxX: 870, minZ: -110, maxZ: 110 };
    const spanX = bounds.maxX - bounds.minX;
    const spanZ = bounds.maxZ - bounds.minZ;
    const mapX = (wx) => ix + ((wx - bounds.minX) / spanX) * iw;
    const mapZ = (wz) => iy + ((wz - bounds.minZ) / spanZ) * ih;

    (BlossomWorld3D.minimapZones?.() || []).forEach((z) => {
      const cx = mapX(z.wx);
      const cz = mapZ(z.wz);
      const zw = (z.halfW * 2 / spanX) * iw;
      const zh = (z.halfD * 2 / spanZ) * ih;
      ctx.fillStyle = z.id === locId ? 'rgba(56, 189, 248, 0.45)' : 'rgba(148, 163, 184, 0.28)';
      ctx.fillRect(cx - zw / 2, cz - zh / 2, zw, zh);
    });

    if (player?.wx != null) {
      const px = mapX(player.wx);
      const pz = mapZ(player.wz);
      ctx.fillStyle = '#f43f5e';
      ctx.beginPath();
      ctx.arc(px, pz, 4, 0, Math.PI * 2);
      ctx.fill();
      const yaw = player.moveYaw ?? 0;
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(px, pz);
      ctx.lineTo(px + Math.sin(yaw) * 9, pz + Math.cos(yaw) * 9);
      ctx.stroke();
    }

    label(ctx, 'Surf City', mx + 12, my + mmH - 8, 9, '#94a3b8', 700);
  }

  function drawStamina(ctx, w, stamina, running) {
    const s = stamina ?? 100;
    if (s >= 99.5 && !running) return;
    const barW = 88;
    const x = w - barW - 12;
    const y = 112;
    glassPanel(ctx, x - 4, y - 10, barW + 8, 16, 0.55);
    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    ctx.fillRect(x, y, barW, 4);
    ctx.fillStyle = s < 18 ? '#f87171' : '#34d399';
    ctx.fillRect(x, y, barW * (s / 100), 4);
    label(ctx, running ? 'Sprint' : 'Stamina', x, y - 2, 8, '#cbd5e1', 600);
  }

  function drawInteractPrompt(ctx, w, h, nearInteract) {
    if (!nearInteract) return;
    const text = nearInteract.label || nearInteract.kind || 'Interact';
    const padX = 18;
    ctx.font = '600 14px Nunito, system-ui, sans-serif';
    const tw = ctx.measureText(text).width;
    const pw = tw + padX * 2 + 36;
    const px = (w - pw) / 2;
    const py = h - 52;
    glassPanel(ctx, px, py, pw, 34, 0.82);
    label(ctx, 'E', px + 14, py + 22, 13, '#38bdf8', 800);
    label(ctx, text, px + 36, py + 22, 13, '#f8fafc', 600);
  }

  function drawZoneFlash(ctx, w, h) {
    if (zoneFlash <= 0) return;
    zoneFlash = Math.max(0, zoneFlash - 0.028);
    const t = zoneFlash;
    if (!zoneFlashName || t <= 0.25) return;
    const alpha = Math.min(1, (t - 0.25) * 2.2);
    ctx.save();
    ctx.globalAlpha = alpha;
    const text = zoneFlashName;
    ctx.font = '700 22px Nunito, system-ui, sans-serif';
    const tw = ctx.measureText(text).width;
    const px = (w - tw - 32) / 2;
    const py = h * 0.22;
    glassPanel(ctx, px, py, tw + 32, 40, 0.75);
    label(ctx, text, px + 16, py + 26, 18, '#f8fafc', 700);
    ctx.restore();
  }

  function draw(ctx, w, h, opts) {
    const { loc, nearInteract, running, phaseFade, stamina } = opts;

    drawMinimap(ctx, w, h, opts.player, loc?.id);
    drawStamina(ctx, w, stamina, running);

    if (phaseFade > 0) {
      ctx.fillStyle = `rgba(255, 245, 220, ${phaseFade * 0.14})`;
      ctx.fillRect(0, 0, w, h);
    }

    drawZoneFlash(ctx, w, h);
    drawInteractPrompt(ctx, w, h, nearInteract);
  }

  return { draw, triggerZoneFlash };
})();