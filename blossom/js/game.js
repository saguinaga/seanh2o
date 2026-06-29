/** Canvas world, player, interactions */
window.BlossomGame = (function () {
  let canvas, ctx, state, onMessage, onPersist;
  let player = { x: 400, y: 320, vy: 0, onGround: true, facing: 1 };
  let anim = 0;
  let shirtImg = null;
  let shirtSrc = '';
  let reminder = '';
  let reminderTimer = 0;
  let phaseTimer = 0;
  const PHASE_MS = 90000;

  const ROOM = { w: 800, h: 480, floorY: 400 };
  let started = false;
  let phaseInterval = null;

  function init(cvs, gameState, callbacks) {
    canvas = cvs;
    ctx = canvas.getContext('2d');
    state = gameState;
    onMessage = callbacks.onMessage;
    onPersist = callbacks.onPersist;
    player.x = state.position?.x ?? 400;
    player.y = state.position?.y ?? 320;
    if (!started) {
      started = true;
      BlossomControls.init();
      resize();
      window.addEventListener('resize', resize);
      canvas.addEventListener('click', onTap);
      canvas.addEventListener('touchend', onTapTouch, { passive: false });
      requestAnimationFrame(loop);
      if (phaseInterval) clearInterval(phaseInterval);
      phaseInterval = setInterval(tickPhase, 1000);
    }
    showReminder(BlossomDay.currentPhase(state).hint);
    updateHud();
  }

  function resize() {
    const wrap = canvas.parentElement;
    const aspect = ROOM.w / ROOM.h;
    let w = wrap.clientWidth;
    let h = wrap.clientHeight;
    if (w / h > aspect) w = h * aspect;
    else h = w / aspect;
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    canvas.width = ROOM.w;
    canvas.height = ROOM.h;
  }

  function scalePoint(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((clientX - rect.left) / rect.width) * ROOM.w,
      y: ((clientY - rect.top) / rect.height) * ROOM.h,
    };
  }

  function near(px, py, zone) {
    return px >= zone.x && px <= zone.x + zone.w && py >= zone.y && py <= zone.y + zone.h;
  }

  function onTap(e) {
    const p = scalePoint(e.clientX, e.clientY);
    tryInteract(p.x, p.y);
  }

  function onTapTouch(e) {
    if (!e.changedTouches?.[0]) return;
    e.preventDefault();
    const t = e.changedTouches[0];
    const p = scalePoint(t.clientX, t.clientY);
    tryInteract(p.x, p.y);
  }

  function tryInteract(x, y) {
    const fridge = BlossomDay.FRIDGE;
    if (near(x, y, fridge)) {
      openFridge();
      return;
    }
    for (const chore of BlossomDay.CHORES) {
      if (near(x, y, chore)) {
        const res = BlossomDay.doChore(state, chore.id);
        onMessage(res.msg, res.ok ? 'good' : 'warn');
        if (res.ok) onPersist(state);
        return;
      }
    }
  }

  function openFridge() {
    const phase = BlossomDay.currentPhase(state);
    const meal = phase.meal;
    if (!meal) {
      onMessage('Kitchen is closed for now. Finish your evening routine!', 'warn');
      return;
    }
    const foods = BlossomDay.FOODS[meal];
    const names = foods.map((f, i) => `${i + 1}. ${f.name} ($${f.price}) [${f.type}]`).join('\n');
    const pick = prompt(`Choose ${meal}:\n${names}\n\nEnter 1, 2, or 3:`);
    const idx = Number(pick) - 1;
    if (idx < 0 || idx > 2) return;
    const res = BlossomDay.eatMeal(state, foods[idx], meal);
    onMessage(res.msg, res.ok ? 'good' : 'warn');
    if (res.ok) onPersist(state);
  }

  function showReminder(text) {
    reminder = text;
    reminderTimer = 8;
    const el = document.getElementById('dayReminder');
    if (el) {
      el.textContent = text;
      el.hidden = false;
    }
  }

  function tickPhase() {
    phaseTimer += 1000;
    if (phaseTimer >= PHASE_MS) {
      phaseTimer = 0;
      const next = BlossomDay.advancePhase(state);
      if (next) {
        showReminder(next.hint);
        onPersist(state);
      } else if (state.stars < window.BLOSSOM_CONFIG.starsPerDay) {
        triggerFail();
      }
    }
    if (reminderTimer > 0) {
      reminderTimer -= 1;
      if (reminderTimer <= 0) {
        const el = document.getElementById('dayReminder');
        if (el) el.hidden = true;
      }
    }
    updateHud();
  }

  function triggerFail() {
    state.alive = false;
    onMessage('Oh no! You didn\'t get 50 stars...', 'bad');
    window.BlossomApp?.showDayModal(BlossomDay.evaluateDay(state));
    BlossomDay.resetAfterFail(state);
    onPersist(state);
  }

  function updateHud() {
    const moneyEl = document.getElementById('hudMoney');
    const starsEl = document.getElementById('hudStars');
    const levelEl = document.getElementById('hudLevel');
    const phaseEl = document.getElementById('hudPhase');
    if (moneyEl) moneyEl.textContent = `$${state.money}`;
    if (starsEl) starsEl.textContent = `${state.stars}/${window.BLOSSOM_CONFIG.starsPerDay}`;
    if (levelEl) levelEl.textContent = `Lv ${state.level}`;
    if (phaseEl) phaseEl.textContent = BlossomDay.currentPhase(state).label;
  }

  function loop(ts) {
    anim = ts / 1000;
    update();
    draw();
    requestAnimationFrame(loop);
  }

  function update() {
    const { dx, dy, jump } = BlossomControls.getMovement();
    const speed = 2.8;
    player.x += dx * speed;
    player.y += dy * speed * 0.85;
    if (dx !== 0) player.facing = dx > 0 ? 1 : -1;
    if (jump && player.onGround) {
      player.vy = -7;
      player.onGround = false;
    }
    player.vy += 0.35;
    player.y += player.vy;
    if (player.y > ROOM.floorY - 20) {
      player.y = ROOM.floorY - 20;
      player.vy = 0;
      player.onGround = true;
    }
    player.x = Math.max(30, Math.min(ROOM.w - 30, player.x));
    player.y = Math.max(ROOM.floorY - 120, Math.min(ROOM.floorY - 20, player.y));
    state.position = { x: player.x, y: player.y };
  }

  function drawRoom() {
    const g = ctx.createLinearGradient(0, 0, 0, ROOM.h);
    g.addColorStop(0, '#fef3c7');
    g.addColorStop(0.5, '#fde68a');
    g.addColorStop(1, '#d4a574');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, ROOM.w, ROOM.h);

    ctx.fillStyle = '#a8d5ba';
    ctx.fillRect(0, ROOM.floorY, ROOM.w, ROOM.h - ROOM.floorY);
    ctx.strokeStyle = '#7cb895';
    ctx.lineWidth = 3;
    for (let i = 0; i < ROOM.w; i += 40) {
      ctx.beginPath();
      ctx.moveTo(i, ROOM.floorY);
      ctx.lineTo(i + 20, ROOM.h);
      ctx.stroke();
    }

    drawWindow(80, 60, 120, 80);
    drawWindow(600, 60, 120, 80);

    drawFurniture('Bed', 100, 120, 140, 90, '#c4b5fd');
    drawFurniture('Desk', 180, 220, 90, 60, '#fcd34d');
    drawFurniture('Sink', 500, 170, 90, 70, '#93c5fd');
    drawFurniture('Fridge', BlossomDay.FRIDGE.x, BlossomDay.FRIDGE.y, BlossomDay.FRIDGE.w, BlossomDay.FRIDGE.h, '#6ee7b7', true);
    drawFurniture('Couch', 350, 300, 160, 70, '#f9a8d4');
    drawFurniture('Plant', 40, 280, 50, 60, '#86efac');

    ctx.fillStyle = 'rgba(0,0,0,0.06)';
    ctx.font = '11px Nunito, sans-serif';
    BlossomDay.CHORES.forEach((c) => {
      ctx.fillText(c.label, c.x, c.y - 4);
    });
    ctx.fillText('Fridge — tap to eat', BlossomDay.FRIDGE.x, BlossomDay.FRIDGE.y - 6);
  }

  function drawWindow(x, y, w, h) {
    ctx.fillStyle = '#bae6fd';
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 4;
    ctx.strokeRect(x, y, w, h);
    ctx.beginPath();
    ctx.moveTo(x + w / 2, y);
    ctx.lineTo(x + w / 2, y + h);
    ctx.moveTo(x, y + h / 2);
    ctx.lineTo(x + w, y + h / 2);
    ctx.stroke();
  }

  function drawFurniture(label, x, y, w, h, color, highlight) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w, h);
    if (highlight) {
      ctx.strokeStyle = '#059669';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.strokeRect(x - 2, y - 2, w + 4, h + 4);
      ctx.setLineDash([]);
    }
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.font = 'bold 10px Nunito, sans-serif';
    ctx.fillText(label, x + 6, y + 14);
  }

  function drawPlayer() {
    const av = state.avatar || {};
    const bob = Math.sin(anim * 6) * (BlossomControls.getMovement().dx || BlossomControls.getMovement().dy ? 2 : 0.5);
    const px = player.x;
    const py = player.y + bob;
    const scale = state.chubby ? 1.15 : 1;

    ctx.save();
    ctx.translate(px, py);
    ctx.scale(player.facing * scale, scale);

    ctx.fillStyle = av.skin || '#f5d0a8';
    ctx.beginPath();
    ctx.ellipse(0, -38, 14, 16, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = av.hair || '#4a3728';
    ctx.beginPath();
    ctx.arc(0, -48, 15, Math.PI, 0);
    ctx.fill();

    if (av.shirtPattern) {
      if (av.shirtPattern !== shirtSrc) {
        shirtSrc = av.shirtPattern;
        shirtImg = new Image();
        shirtImg.src = shirtSrc;
      }
      if (shirtImg?.complete) ctx.drawImage(shirtImg, -18, -28, 36, 28);
      else {
        ctx.fillStyle = av.shirtColor || '#5eead4';
        ctx.fillRect(-16, -28, 32, 26);
      }
    } else {
      ctx.fillStyle = av.shirtColor || '#5eead4';
      ctx.fillRect(-16, -28, 32, 26);
    }

    ctx.fillStyle = av.skin || '#f5d0a8';
    ctx.fillRect(-5, -2, 10, 18);
    ctx.fillRect(-14, -20, 8, 6);
    ctx.fillRect(6, -20, 8, 6);
    ctx.fillRect(-8, 16, 6, 14);
    ctx.fillRect(2, 16, 6, 14);

    if (state.sick) {
      ctx.fillStyle = '#93c5fd';
      ctx.font = '14px sans-serif';
      ctx.fillText('🤧', 12, -50);
    }

    ctx.restore();

    ctx.fillStyle = '#334155';
    ctx.font = 'bold 12px Nunito, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(state.name || 'You', px, py - 58);
    ctx.textAlign = 'left';
  }

  function draw() {
    ctx.clearRect(0, 0, ROOM.w, ROOM.h);
    drawRoom();
    drawPlayer();
  }

  function endDay() {
    const result = BlossomDay.evaluateDay(state);
    if (result.success) BlossomDay.startNewDay(state);
    else BlossomDay.resetAfterFail(state);
    onPersist(state);
    return result;
  }

  return { init, updateHud, endDay, showReminder };
})();