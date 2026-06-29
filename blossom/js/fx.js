/** Particles, float text, shake, flash — game juice */
window.BlossomFx = (function () {
  let particles = [];
  let texts = [];
  let shake = 0;
  let flash = 0;
  let flashColor = '#fef08a';
  let ambient = [];
  let time = 0;
  let ambientReady = false;
  const FALLBACK_W = 800;
  const FALLBACK_H = 480;

  function rand(a, b) { return a + Math.random() * (b - a); }

  function worldW() {
    return window.BlossomWorld?.W ?? FALLBACK_W;
  }

  function worldH() {
    return window.BlossomWorld?.H ?? FALLBACK_H;
  }

  function ensureAmbient() {
    if (ambientReady) return;
    initAmbient();
    ambientReady = true;
  }

  function initAmbient() {
    const W = worldW();
    const H = worldH();
    ambient = [];
    for (let i = 0; i < 24; i++) {
      ambient.push({
        x: Math.random() * W,
        y: Math.random() * H * 0.7,
        s: rand(1.5, 3.5),
        sp: rand(0.2, 0.8),
        ph: Math.random() * Math.PI * 2,
        kind: Math.random() > 0.6 ? 'firefly' : 'petal',
      });
    }
  }

  function burst(x, y, opts = {}) {
    const n = opts.count || 18;
    const color = opts.color || '#fde047';
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + rand(-0.2, 0.2);
      const sp = rand(1.5, 5.5);
      particles.push({
        x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 1.5,
        life: 1, decay: rand(0.02, 0.045), size: rand(2, 5), color,
        grav: 0.08, kind: 'dot',
      });
    }
  }

  function starBurst(x, y) {
    const colors = ['#fde047', '#fbbf24', '#f472b6', '#a78bfa', '#4ade80'];
    for (let i = 0; i < 14; i++) {
      particles.push({
        x, y, vx: rand(-4, 4), vy: rand(-5, -1),
        life: 1, decay: 0.025, size: rand(3, 6),
        color: colors[i % colors.length], grav: 0.05, kind: 'star',
        spin: rand(0, Math.PI * 2),
      });
    }
  }

  function confetti() {
    ensureAmbient();
    const colors = ['#f472b6', '#4ade80', '#38bdf8', '#fde047', '#c084fc', '#fb7185'];
    for (let i = 0; i < 80; i++) {
      particles.push({
        x: rand(0, worldW()), y: rand(-40, -5),
        vx: rand(-2, 2), vy: rand(2, 6),
        life: 1, decay: 0.004, size: rand(4, 8),
        color: colors[i % colors.length], grav: 0.06, kind: 'confetti',
        spin: rand(0, 6), rot: rand(0, Math.PI),
      });
    }
  }

  function floatText(x, y, text, color = '#fef08a') {
    texts.push({ x, y, text, color, life: 1, vy: -1.2, scale: 0.6 });
  }

  function screenShake(amount = 8) {
    shake = Math.max(shake, amount);
  }

  function screenFlash(color = '#fef08a', strength = 0.35) {
    flashColor = color;
    flash = Math.max(flash, strength);
  }

  function travelBurst() {
    ensureAmbient();
    for (let i = 0; i < 30; i++) {
      particles.push({
        x: rand(0, worldW()), y: rand(100, worldH()),
        vx: rand(-6, 6), vy: rand(-2, 2),
        life: 1, decay: 0.03, size: rand(3, 7),
        color: 'rgba(74, 222, 128, 0.8)', grav: 0, kind: 'dot',
      });
    }
  }

  function update(dt) {
    ensureAmbient();
    time += dt;
    shake *= 0.82;
    flash *= 0.88;
    particles = particles.filter((p) => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += p.grav;
      p.life -= p.decay;
      if (p.spin) p.rot = (p.rot || 0) + p.spin * 0.1;
      return p.life > 0;
    });
    texts = texts.filter((t) => {
      t.y += t.vy;
      t.life -= 0.018;
      t.scale = Math.min(1.1, t.scale + 0.06);
      return t.life > 0;
    });
    ambient.forEach((a) => {
      a.x += Math.sin(time * a.sp + a.ph) * 0.35;
      a.y += Math.cos(time * a.sp * 0.7 + a.ph) * 0.2;
      const W = worldW();
      if (a.x < -10) a.x = W + 10;
      if (a.x > W + 10) a.x = -10;
    });
  }

  function drawAmbient(ctx, floorY, phaseId) {
    ensureAmbient();
    ambient.forEach((a) => {
      if (a.y > floorY + 20) return;
      const alpha = 0.35 + Math.sin(time * 2 + a.ph) * 0.25;
      if (a.kind === 'firefly') {
        const g = ctx.createRadialGradient(a.x, a.y, 0, a.x, a.y, a.s * 4);
        g.addColorStop(0, `rgba(253, 224, 71, ${alpha})`);
        g.addColorStop(1, 'rgba(253, 224, 71, 0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(a.x, a.y, a.s * 4, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.globalAlpha = alpha * 0.7;
        ctx.fillStyle = phaseId === 'night' ? '#c4b5fd' : '#fda4af';
        ctx.beginPath();
        ctx.ellipse(a.x, a.y, a.s, a.s * 0.6, time + a.ph, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }
    });
  }

  function draw(ctx) {
    particles.forEach((p) => {
      ctx.globalAlpha = Math.max(0, p.life);
      if (p.kind === 'star') {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot || 0);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        for (let i = 0; i < 4; i++) {
          const a = (i / 4) * Math.PI * 2;
          ctx.lineTo(Math.cos(a) * p.size, Math.sin(a) * p.size);
          ctx.lineTo(Math.cos(a + 0.4) * p.size * 0.35, Math.sin(a + 0.4) * p.size * 0.35);
        }
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      } else if (p.kind === 'confetti') {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot || 0);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        ctx.restore();
      } else {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    });

    texts.forEach((t) => {
      ctx.save();
      ctx.globalAlpha = t.life;
      ctx.translate(t.x, t.y);
      ctx.scale(t.scale, t.scale);
      ctx.font = '800 15px Fredoka, Nunito, sans-serif';
      ctx.textAlign = 'center';
      ctx.strokeStyle = 'rgba(15, 23, 42, 0.5)';
      ctx.lineWidth = 3;
      ctx.strokeText(t.text, 0, 0);
      ctx.fillStyle = t.color;
      ctx.fillText(t.text, 0, 0);
      ctx.restore();
    });

    if (flash > 0.02) {
      ctx.fillStyle = flashColor;
      ctx.globalAlpha = flash * 0.45;
      ctx.fillRect(0, 0, worldW(), worldH());
      ctx.globalAlpha = 1;
    }
  }

  function applyShake(ctx) {
    if (shake > 0.4) {
      const ox = (Math.random() - 0.5) * shake;
      const oy = (Math.random() - 0.5) * shake;
      ctx.translate(ox, oy);
    }
  }

  return {
    burst, starBurst, confetti, floatText, screenShake, screenFlash,
    travelBurst, update, draw, drawAmbient, applyShake,
  };
})();