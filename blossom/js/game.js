/** Canvas world — multi-location exploration + interactions */
window.BlossomGame = (function () {
  let canvas, ctx, state, onMessage, onPersist;
  let player = { x: 400, y: 360, vy: 0, onGround: true, facing: 1 };
  let anim = 0;
  let shirtImg = null;
  let shirtSrc = '';
  let phaseTimer = 0;
  let transitionLock = 0;
  let nearInteract = null;

  const PHASE_MS = 90000;
  let started = false;
  let phaseInterval = null;

  function getLoc() {
    return BlossomWorld.getLocation(state.currentLocation || 'house');
  }

  function init(cvs, gameState, callbacks) {
    canvas = cvs;
    ctx = canvas.getContext('2d');
    state = gameState;
    if (!state.currentLocation) state.currentLocation = 'house';
    if (!state.todaysChores?.length) BlossomDay.assignDailyChores(state);
    onMessage = callbacks.onMessage;
    onPersist = callbacks.onPersist;
    player.x = state.position?.x ?? 400;
    player.y = state.position?.y ?? getLoc().floorY - 20;
    if (!started) {
      started = true;
      BlossomControls.init();
      resize();
      window.addEventListener('resize', resize);
      canvas.addEventListener('click', onTap);
      canvas.addEventListener('touchend', onTapTouch, { passive: false });
      window.addEventListener('keydown', onInteractKey);
      requestAnimationFrame(loop);
      if (phaseInterval) clearInterval(phaseInterval);
      phaseInterval = setInterval(tickPhase, 1000);
    }
    showReminder(BlossomDay.currentPhase(state).hint);
    updateHud();
  }

  function resize() {
    const wrap = canvas.parentElement;
    const aspect = BlossomWorld.W / BlossomWorld.H;
    let w = wrap.clientWidth;
    let h = wrap.clientHeight;
    if (w / h > aspect) w = h * aspect;
    else h = w / aspect;
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    canvas.width = BlossomWorld.W;
    canvas.height = BlossomWorld.H;
  }

  function scalePoint(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((clientX - rect.left) / rect.width) * BlossomWorld.W,
      y: ((clientY - rect.top) / rect.height) * BlossomWorld.H,
    };
  }

  function feetPos() {
    return { x: player.x, y: player.y };
  }

  function isInteractable(p) {
    return p.choreId || p.kind === 'exit' || p.kind === 'fridge'
      || (p.kind === 'shop' && (p.shop === 'cafe' || p.choreId));
  }

  function distanceToProp(ft, p) {
    const w = p.w || 50;
    const h = p.h || 50;
    const nx = Math.max(p.x, Math.min(ft.x, p.x + w));
    const ny = Math.max(p.y, Math.min(ft.y, p.y + h));
    return Math.hypot(ft.x - nx, ft.y - ny);
  }

  function findNearProp() {
    const loc = getLoc();
    const ft = feetPos();
    let best = null;
    let bestDist = 88;
    loc.props.forEach((p) => {
      if (!isInteractable(p)) return;
      const d = distanceToProp(ft, p);
      if (d < bestDist) {
        bestDist = d;
        best = p;
      }
    });
    return best;
  }

  function interactWithProp(prop) {
    if (!prop) return;
    if (tryTransition(prop)) return;
    if (prop.kind === 'fridge') {
      openFridge();
      return;
    }
    if (prop.kind === 'shop' && prop.shop === 'cafe') {
      openCafe();
      return;
    }
    if (prop.choreId) doChoreProp(prop);
  }

  function nearIdFor(p) {
    if (!p) return null;
    if (p.kind === 'exit') return `exit-${p.to}`;
    return p.choreId || p.kind;
  }

  function changeLocation(toId, spawn) {
    if (transitionLock > 0) return;
    const next = BlossomWorld.getLocation(toId);
    state.currentLocation = toId;
    player.x = spawn.x;
    player.y = spawn.y;
    state.position = { x: player.x, y: player.y };
    transitionLock = 45;
    window.BlossomAudio?.playSfx('ui');
    onMessage(`Walking to ${next.name}…`, 'info');
    updateHud();
    onPersist(state);
  }

  function tryTransition(prop) {
    if (prop?.kind === 'exit' && prop.to) {
      changeLocation(prop.to, prop.spawn);
      return true;
    }
    return false;
  }

  function onTap(e) {
    const p = scalePoint(e.clientX, e.clientY);
    handleInteract(p.x, p.y);
  }

  function onTapTouch(e) {
    if (!e.changedTouches?.[0]) return;
    e.preventDefault();
    const t = e.changedTouches[0];
    const p = scalePoint(t.clientX, t.clientY);
    handleInteract(p.x, p.y);
  }

  function handleInteract(x, y) {
    const loc = getLoc();
    for (const prop of loc.props) {
      if (!BlossomRender.hitProp(x, y, prop)) continue;
      if (!isInteractable(prop)) continue;
      interactWithProp(prop);
      return;
    }
  }

  function onInteractKey(e) {
    if (e.key !== 'e' && e.key !== 'Enter') return;
    if (document.querySelector('.modal-backdrop:not([hidden])')) return;
    if (nearInteract) {
      e.preventDefault();
      interactWithProp(nearInteract);
    }
  }

  function doChoreProp(prop) {
    const res = BlossomDay.doChore(state, prop.choreId);
    onMessage(res.msg, res.ok ? 'good' : 'warn');
    if (res.ok) {
      window.BlossomAudio?.playSfx('chore');
      onPersist(state);
    } else window.BlossomAudio?.playSfx('warn');
  }

  function openFridge() {
    const phase = BlossomDay.currentPhase(state);
    const meal = phase.meal;
    if (!meal) {
      onMessage('Kitchen is closed for now. Try the café on Main street for lunch!', 'warn');
      window.BlossomAudio?.playSfx('warn');
      return;
    }
    pickMeal(meal, BlossomDay.FOODS[meal]);
  }

  function openCafe() {
    const phase = BlossomDay.currentPhase(state);
    if (phase.meal !== 'lunch') {
      onMessage('Café is open for lunch in the afternoon.', 'warn');
      window.BlossomAudio?.playSfx('warn');
      return;
    }
    pickMeal('lunch', BlossomDay.FOODS.lunch);
  }

  function pickMeal(mealKey, foods) {
    const names = foods.map((f, i) => `${i + 1}. ${f.name} ($${f.price}) [${f.type}]`).join('\n');
    const pick = prompt(`Choose ${mealKey}:\n${names}\n\nEnter 1, 2, or 3:`);
    const idx = Number(pick) - 1;
    if (idx < 0 || idx > 2) return;
    const res = BlossomDay.eatMeal(state, foods[idx], mealKey);
    onMessage(res.msg, res.ok ? 'good' : 'warn');
    if (res.ok) {
      window.BlossomAudio?.playSfx('eat');
      onPersist(state);
    } else window.BlossomAudio?.playSfx('warn');
  }

  function showReminder(text) {
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
    updateHud();
  }

  function triggerFail() {
    state.alive = false;
    window.BlossomAudio?.playSfx('dayFail');
    onMessage('Oh no! You didn\'t get 50 stars...', 'bad');
    window.BlossomApp?.showDayModal(BlossomDay.evaluateDay(state));
    BlossomDay.resetAfterFail(state);
    onPersist(state);
  }

  function updateHud() {
    const loc = getLoc();
    const moneyEl = document.getElementById('hudMoney');
    const starsEl = document.getElementById('hudStars');
    const levelEl = document.getElementById('hudLevel');
    const phaseEl = document.getElementById('hudPhase');
    const locEl = document.getElementById('hudLocation');
    if (moneyEl) moneyEl.textContent = `$${state.money}`;
    if (starsEl) starsEl.textContent = `${state.stars}/${window.BLOSSOM_CONFIG.starsPerDay}`;
    if (levelEl) levelEl.textContent = `Lv ${state.level}`;
    if (phaseEl) phaseEl.textContent = BlossomDay.currentPhase(state).label;
    if (locEl) locEl.textContent = loc.name;
    const hint = document.getElementById('travelHint');
    if (hint) {
      const exits = loc.props.filter((p) => p.kind === 'exit');
      hint.textContent = exits.length
        ? 'Walk to green exits to travel · tap objects to interact'
        : 'Tap objects to interact';
    }
  }

  function loop(ts) {
    anim = ts / 1000;
    if (transitionLock > 0) transitionLock -= 1;
    update();
    draw();
    requestAnimationFrame(loop);
  }

  function update() {
    const loc = getLoc();
    const floorY = loc.floorY - 20;
    const { dx, dy, jump } = BlossomControls.getMovement();
    const speed = 2.9;
    player.x += dx * speed;
    player.y += dy * speed * 0.85;
    if (dx !== 0) player.facing = dx > 0 ? 1 : -1;
    if (jump && player.onGround) {
      player.vy = -7;
      player.onGround = false;
      window.BlossomAudio?.playSfx('jump');
    }
    window.BlossomAudio?.maybeStep(Math.abs(dx) > 0.1 || Math.abs(dy) > 0.1);
    player.vy += 0.35;
    player.y += player.vy;
    if (player.y > floorY) {
      player.y = floorY;
      player.vy = 0;
      player.onGround = true;
    }
    player.x = Math.max(30, Math.min(BlossomWorld.W - 30, player.x));
    player.y = Math.max(loc.floorY - 120, Math.min(floorY, player.y));
    state.position = { x: player.x, y: player.y };

    nearInteract = findNearProp();
    if (transitionLock <= 0 && nearInteract?.kind === 'exit') {
      if (Math.hypot(dx, dy) > 0.35 || BlossomControls.getMovement().jump) {
        tryTransition(nearInteract);
      }
    }

    const bubble = document.getElementById('npcBubble');
    if (bubble && nearInteract) {
      if (nearInteract.kind === 'exit') bubble.textContent = nearInteract.label + ' (walk into it)';
      else if (nearInteract.choreId) {
        const done = state.choresDone[nearInteract.choreId];
        const listed = BlossomDay.isChoreToday(state, nearInteract.choreId);
        if (done) bubble.textContent = `✓ ${nearInteract.label}`;
        else if (!listed) bubble.textContent = `${nearInteract.label} — not on today's list`;
        else bubble.textContent = `E or tap: ${nearInteract.label}`;
      } else if (nearInteract.kind === 'fridge') bubble.textContent = 'E or tap fridge to eat';
      else if (nearInteract.shop === 'cafe') bubble.textContent = 'E or tap café for lunch';
    }
  }

  function draw() {
    const loc = getLoc();
    ctx.clearRect(0, 0, BlossomWorld.W, BlossomWorld.H);
    if (transitionLock > 0) {
      ctx.fillStyle = `rgba(255, 247, 237, ${Math.min(0.55, transitionLock / 40)})`;
      ctx.fillRect(0, 0, BlossomWorld.W, BlossomWorld.H);
    }
    BlossomRender.drawScene(
      ctx, loc, loc.props, anim, state.choresDone || {}, nearIdFor(nearInteract), state.todaysChores
    );
    BlossomRender.drawPlayer(ctx, state, player, anim, shirtImg, shirtSrc);
    BlossomRender.drawLocationBadge(ctx, loc.name);
    BlossomRender.drawChoreTracker(ctx, state);

    if (avPatternLoad(state)) {
      /* shirt img async */
    }
  }

  function avPatternLoad(state) {
    const av = state.avatar || {};
    if (av.shirtPattern && av.shirtPattern !== shirtSrc) {
      shirtSrc = av.shirtPattern;
      shirtImg = new Image();
      shirtImg.src = shirtSrc;
    }
    return true;
  }

  function endDay() {
    const result = BlossomDay.evaluateDay(state);
    if (result.success) BlossomDay.startNewDay(state);
    else BlossomDay.resetAfterFail(state);
    state.currentLocation = 'house';
    player.x = 400;
    player.y = getLoc().floorY - 20;
    onPersist(state);
    updateHud();
    return result;
  }

  return { init, updateHud, endDay, showReminder };
})();