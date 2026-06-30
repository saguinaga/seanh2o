/** Pet companion — follows player, reacts to chat/chores */
window.BlossomPet = (function () {
  const FOLLOW_LOCS = new Set(['house', 'yard', 'park']);
  let pet = { x: 360, y: 360, facing: 1, mood: 'idle', wag: 0, hop: 0 };

  function reset(player) {
    pet.x = (player?.x ?? 360) - 40;
    pet.y = (player?.y ?? 360) + 4;
    pet.facing = 1;
    pet.mood = 'idle';
    pet.wag = 0;
    pet.hop = 0;
  }

  function onChat(who) {
    if (/pet|mom/i.test(who)) {
      pet.mood = 'happy';
      pet.wag = 2.5;
      pet.hop = 1.2;
    }
  }

  function onChore() {
    pet.mood = 'proud';
    pet.hop = 1.8;
    pet.wag = 3;
  }

  function update(player, loc) {
    if (!FOLLOW_LOCS.has(loc?.id)) return;
    const dx = player.x - pet.x - 36 * pet.facing;
    const dy = player.y - pet.y;
    const dist = Math.hypot(dx, dy);
    if (dist > 52) {
      pet.x += dx * 0.06;
      pet.y += dy * 0.06;
      pet.facing = dx >= 0 ? 1 : -1;
      pet.mood = 'trot';
    } else if (pet.mood === 'trot') {
      pet.mood = 'idle';
    }
    pet.wag = Math.max(0, pet.wag - 0.02);
    pet.hop = Math.max(0, pet.hop - 0.03);
    pet.x = Math.max(24, Math.min((window.BlossomWorld?.W ?? 800) - 24, pet.x));
  }

  function draw(ctx, anim) {
    const wag = Math.sin(anim * (8 + pet.wag * 4)) * (4 + pet.wag * 3);
    const hop = pet.hop > 0 ? Math.sin(anim * 14) * pet.hop * 5 : Math.sin(anim * 3) * 0.8;
    const px = pet.x;
    const py = pet.y + hop;

    if (window.BlossomGfx?.groundShadow) {
      BlossomGfx.groundShadow(ctx, px, py + 6, 14, 5, 0.22);
    }

    ctx.save();
    ctx.translate(px, py);
    ctx.scale(pet.facing, 1);

    ctx.fillStyle = '#d97706';
    ctx.beginPath();
    ctx.ellipse(0, 0, 16, 11, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.ellipse(-6, -4, 9, 8, -0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#92400e';
    ctx.beginPath();
    ctx.moveTo(12, -2);
    ctx.lineTo(22 + wag * 0.2, -6 + wag);
    ctx.lineTo(14, 2);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.arc(-10, -6, 2.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(-9, -7, 0.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f472b6';
    ctx.beginPath();
    ctx.arc(-14, -2, 2.5, 0, Math.PI * 2);
    ctx.fill();
    if (pet.mood === 'happy' || pet.mood === 'proud') {
      ctx.strokeStyle = '#831843';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(2, -2, 4, 0.2, Math.PI - 0.2);
      ctx.stroke();
    }
    ctx.restore();
  }

  function visible(loc) {
    return FOLLOW_LOCS.has(loc?.id);
  }

  return { reset, update, draw, onChat, onChore, visible, get: () => pet };
})();