/** Canvas world — exploration, chores, careers, Bonnie */
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
    if (!state.careerPath) state.careerPath = 'salon';
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
    checkBonnieOffer();
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

  function workPropKind() {
    const site = BlossomCareer.workSiteFor(state);
    return site.kind;
  }

  function isWorkProp(p) {
    if (p.kind === 'npc' && p.id === 'bonnie') return true;
    const site = BlossomCareer.workSiteFor(state);
    if (site.kind === 'shop' && p.kind === 'shop' && p.shop === site.shop) return true;
    if (p.kind === site.kind) return true;
    return false;
  }

  function isInteractable(p) {
    if (p.choreId || p.kind === 'exit' || p.kind === 'fridge') return true;
    if (p.kind === 'shop' && (p.shop === 'cafe' || p.choreId)) return true;
    if (isWorkProp(p)) return true;
    return false;
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
    let bestDist = 92;
    loc.props.forEach((p) => {
      if (p.kind === 'npc' && p.id === 'bonnie' && state.level < BlossomCareer.BONNIE_LEVEL) return;
      if (!isInteractable(p)) return;
      const d = distanceToProp(ft, p);
      if (d < bestDist) {
        bestDist = d;
        best = p;
      }
    });
    return best;
  }

  function nearIdFor(p) {
    if (!p) return null;
    if (p.kind === 'exit') return `exit-${p.to}`;
    if (p.kind === 'npc' && p.id === 'bonnie') return 'bonnie';
    if (p.kind === 'shop' && p.shop === 'salon') return 'salon-work';
    if (p.kind === 'stage') return 'stage-work';
    if (p.kind === 'studio') return 'studio-work';
    return p.choreId || p.kind;
  }

  function checkBonnieOffer() {
    if (BlossomCareer.shouldOfferBonnie(state)) {
      window.BlossomApp?.showBonnieModal(BlossomCareer.bonnieOffer(state));
    }
  }

  function startShift(pretend) {
    const check = pretend ? BlossomCareer.canPlayPretend(state) : BlossomCareer.canWorkShift(state);
    if (!check.ok) {
      onMessage(check.msg, 'warn');
      window.BlossomAudio?.playSfx('warn');
      return;
    }
    BlossomShift.open({
      pretend,
      theme: state.careerPath,
      onDone: (result) => {
        if (result.cancelled) return;
        const res = BlossomCareer.completeShift(state, result.score, result.pretend);
        onMessage(res.msg, res.ok ? 'good' : 'warn');
        if (res.promoted) window.BlossomAudio?.playSfx('dayWin');
        else window.BlossomAudio?.playSfx('chore');
        onPersist(state);
        updateHud();
      },
    });
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
    if (prop.kind === 'npc' && prop.id === 'bonnie') {
      if (BlossomCareer.shouldOfferBonnie(state)) {
        window.BlossomApp?.showBonnieModal(BlossomCareer.bonnieOffer(state));
      } else if (!BlossomCareer.isHired(state) && BlossomCareer.isAdult(state)) {
        onMessage('Bonnie: "Reach level 3 and I\'ll hire you!"', 'info');
      } else {
        onMessage('Bonnie: "Welcome back, sweetie — hop inside for your shift!"', 'info');
      }
      return;
    }
    if (prop.kind === 'shop' && prop.shop === 'salon' && state.careerPath === 'salon') {
      if (BlossomCareer.isChild(state)) {
        startShift(true);
      } else {
        startShift(false);
      }
      return;
    }
    if (prop.kind === 'stage' && state.careerPath === 'broadway') {
      startShift(BlossomCareer.isChild(state));
      return;
    }
    if (prop.kind === 'studio' && state.careerPath === 'tiktoker') {
      startShift(BlossomCareer.isChild(state));
      return;
    }
    if (prop.choreId) doChoreProp(prop);
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
    if (BlossomShift.isActive()) return;
    const p = scalePoint(e.clientX, e.clientY);
    handleInteract(p.x, p.y);
  }

  function onTapTouch(e) {
    if (BlossomShift.isActive()) return;
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
    if (BlossomShift.isActive()) return;
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
    const careerEl = document.getElementById('hudCareer');
    if (moneyEl) moneyEl.textContent = `$${state.money}`;
    if (starsEl) starsEl.textContent = `${state.stars}/${window.BLOSSOM_CONFIG.starsPerDay}`;
    if (levelEl) levelEl.textContent = `Lv ${state.level}`;
    if (phaseEl) phaseEl.textContent = BlossomDay.currentPhase(state).label;
    if (locEl) locEl.textContent = loc.name;
    if (careerEl) {
      const p = BlossomCareer.path(state);
      careerEl.textContent = `${p.emoji} ${BlossomCareer.rankLabel(state)}`;
    }
    const hint = document.getElementById('travelHint');
    if (hint) {
      const exits = loc.props.filter((p) => p.kind === 'exit');
      hint.textContent = exits.length
        ? 'Green exits travel · E at salon/stage/studio for work'
        : 'E or tap to interact';
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
      const cp = BlossomCareer.path(state);
      if (nearInteract.kind === 'exit') bubble.textContent = nearInteract.label + ' (walk into it)';
      else if (nearInteract.kind === 'npc' && nearInteract.id === 'bonnie') {
        bubble.textContent = BlossomCareer.shouldOfferBonnie(state)
          ? 'Bonnie wants to talk — E to hear the job offer!'
          : 'Bonnie: "Pop in for your shift, honey!"';
      } else if (nearInteract.kind === 'shop' && nearInteract.shop === 'salon' && state.careerPath === 'salon') {
        bubble.textContent = BlossomCareer.isChild(state)
          ? `E: ${cp.playLabel} (pretend!)`
          : `E: ${cp.workLabel}`;
      } else if (nearInteract.kind === 'stage' && state.careerPath === 'broadway') {
        bubble.textContent = `E: ${BlossomCareer.isChild(state) ? cp.playLabel : cp.workLabel}`;
      } else if (nearInteract.kind === 'studio' && state.careerPath === 'tiktoker') {
        bubble.textContent = `E: ${BlossomCareer.isChild(state) ? cp.playLabel : cp.workLabel}`;
      } else if (nearInteract.choreId) {
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
      ctx, loc, loc.props, anim, state.choresDone || {}, nearIdFor(nearInteract), state.todaysChores, state
    );
    BlossomRender.drawPlayer(ctx, state, player, anim, shirtImg, shirtSrc);
    BlossomRender.drawLocationBadge(ctx, loc.name);
    BlossomRender.drawCareerBadge(ctx, state);
    BlossomRender.drawChoreTracker(ctx, state);
    avPatternLoad(state);
  }

  function avPatternLoad(st) {
    const av = st.avatar || {};
    if (av.shirtPattern && av.shirtPattern !== shirtSrc) {
      shirtSrc = av.shirtPattern;
      shirtImg = new Image();
      shirtImg.src = shirtSrc;
    }
  }

  function endDay() {
    const prevLevel = state.level;
    const result = BlossomDay.evaluateDay(state);
    if (result.success) {
      const bills = BlossomDay.startNewDay(state);
      if (bills?.msg) onMessage(bills.msg, bills.ok ? 'info' : 'warn');
    } else {
      BlossomDay.resetAfterFail(state);
    }
    if (state.level >= BlossomCareer.BONNIE_LEVEL && prevLevel < BlossomCareer.BONNIE_LEVEL) {
      checkBonnieOffer();
    }
    state.currentLocation = 'house';
    player.x = 400;
    player.y = getLoc().floorY - 20;
    onPersist(state);
    updateHud();
    return result;
  }

  function onBonnieAccepted() {
    const res = BlossomCareer.acceptBonnieOffer(state);
    onMessage(res.msg, 'good');
    onPersist(state);
    updateHud();
  }

  return { init, updateHud, endDay, showReminder, onBonnieAccepted, checkBonnieOffer };
})();