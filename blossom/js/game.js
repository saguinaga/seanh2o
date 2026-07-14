/** Canvas world — exploration, chores, careers, Bonnie */
window.BlossomGame = (function () {
  const FX_STUB = {
    update() {}, draw() {}, drawAmbient() {}, applyShake() {},
    screenFlash() {}, screenShake() {}, floatText() {}, burst() {},
    starBurst() {}, confetti() {}, travelBurst() {},
  };
  function fx() { return window.BlossomFx || FX_STUB; }

  let canvas, ctx, state, onMessage, onPersist;
  let player = {
    x: 400, y: 360, wx: null, wz: null, vy: 0, onGround: true,
    facing: 1, facingVisual: 1, landSquash: 0, wasAirborne: false, moveYaw: Math.PI,
  };
  let playerMoving = false;
  let playerRunning = false;
  let footSurface = 'wood';
  let anim = 0;
  let chatLog = [];
  let phaseFade = 0;
  let shirtImg = null;
  let shirtSrc = '';
  let phaseTimer = 0;
  let transitionLock = 0;
  let nearInteract = null;
  let lastTs = 0;
  let frameDt = 1 / 60;
  let stamina = 100;
  let camera = { x: 400, y: 240, zoom: 1 };
  let nav = {
    active: false, arrived: false, waypoints: [], target: null,
    taskId: null, taskLabel: '', autoSpeed: 3.1,
  };

  function phaseMs() {
    const cfg = window.BLOSSOM_CONFIG;
    return (state?.day || 1) <= 2 ? cfg.phaseMsEarly : cfg.phaseMsNormal;
  }
  let started = false;
  let phaseInterval = null;
  let dpr = 1;
  let use3d = false;
  let hudCanvas = null;

  function getLoc() {
    return BlossomWorld.getLocation(state.currentLocation || 'house');
  }

  /** Graceful degrade — keep full 2D canvas game if WebGL/3D fails */
  function fallbackTo2D(message) {
    if (!canvas) return;
    use3d = false;
    canvas.closest('.game-stage')?.classList?.remove('game-stage--3d');
    canvas.closest('.game-play-area')?.classList?.remove('game-play-area--3d');
    BlossomControls.set3DMode?.(false);
    if (!ctx) ctx = canvas.getContext('2d');
    window.BlossomBoot?.hideLoad?.();
    if (hudCanvas) hudCanvas.style.display = 'none';
    resize();
    if (message) onMessage?.(message, 'info');
  }

  function init(cvs, gameState, callbacks) {
    canvas = cvs;
    state = gameState;
    if (!state.currentLocation) state.currentLocation = 'house';
    if (!state.todaysChores?.length || state.todaysChores.length > 3) BlossomDay.assignDailyChores(state);
    if (!state.todayEventId) window.BlossomToday?.assign?.(state);
    if (!state.careerPath) state.careerPath = 'salon';
    BlossomAvatar.migrate(state);
    onMessage = callbacks.onMessage;
    onPersist = callbacks.onPersist;
    try {
      const mult = parseFloat(localStorage.getItem('blossom-walk-mult'));
      if (mult >= 0.5 && mult <= 2) window.BLOSSOM_CONFIG.walkSpeedMultiplier = mult;
    } catch (_) {}
    const loc0 = getLoc();
    player.x = state.position?.x ?? 360;
    player.y = state.position?.y ?? loc0.floorY - 20;
    if (state.position?.wx != null) {
      player.wx = state.position.wx;
      player.wz = state.position.wz;
    }
    BlossomWorld3D?.ensurePlayer3D?.(player, loc0.id);
    camera.x = player.x;
    camera.y = player.y - 30;
    BlossomPet?.reset?.(player);
    hudCanvas = document.getElementById('gameHud');
    window.BlossomBoot?.ensureLoadClears?.(7000);
    if (!window.THREE || !BlossomScene3D?.init?.(canvas, canvas.parentElement, hudCanvas)) {
      fallbackTo2D('Classic 2D mode — 3D unavailable on this device.');
    } else {
      use3d = true;
      ctx = hudCanvas?.getContext('2d') || null;
      if (hudCanvas) hudCanvas.style.display = '';
      const stageEl = canvas.closest('.game-stage');
      const playEl = canvas.closest('.game-play-area');
      stageEl?.classList?.add('game-stage--3d');
      playEl?.classList?.add('game-play-area--3d');
      BlossomControls.set3DMode?.(true);
      BlossomControls.initPointerOrbit?.(canvas);
      window.BlossomBoot?.setLoadStatus?.('Starting 3D world…');
      try {
        BlossomScene3D.warmStart(getLoc(), state, player);
      } catch (err) {
        console.error('BlossomScene3D warmStart failed:', err);
        fallbackTo2D('Classic 2D mode — 3D had a hiccup. Game still works!');
      }
    }
    if (!started) {
      started = true;
      BlossomControls.init();
      resize();
      requestAnimationFrame(() => resize());
      setTimeout(() => resize(), 120);
      window.addEventListener('resize', resize);
      canvas.addEventListener('click', onTap);
      canvas.addEventListener('touchend', onTapTouch, { passive: false });
      window.addEventListener('keydown', onInteractKey);
      window.addEventListener('keydown', onPhotoKey);
      requestAnimationFrame(loop);
      if (phaseInterval) clearInterval(phaseInterval);
      phaseInterval = setInterval(tickPhase, 1000);
    }
    const hint = (state.day || 1) <= 3
      ? BlossomGuide.phaseHint(state)
      : BlossomDay.currentPhase(state).hint;
    showReminder(hint);
    checkBonnieOffer();
    updateHud();
  }

  function resize() {
    const wrap = canvas.parentElement;
    let w = wrap.clientWidth;
    let h = wrap.clientHeight;
    if (use3d) {
      if (w < 10 || h < 10) {
        const area = wrap.closest('.game-play-area');
        w = area?.clientWidth || wrap.offsetWidth || window.innerWidth;
        h = area?.clientHeight || wrap.offsetHeight || Math.floor(window.innerHeight * 0.55);
      }
      canvas.style.width = '100%';
      canvas.style.height = '100%';
      if (hudCanvas) {
        hudCanvas.style.width = '100%';
        hudCanvas.style.height = '100%';
      }
      BlossomScene3D.resize(w, h);
      return;
    }
    const aspect = BlossomWorld.W / BlossomWorld.H;
    if (w / h > aspect) w = h * aspect;
    else h = w / aspect;
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    if (hudCanvas) {
      hudCanvas.style.width = `${w}px`;
      hudCanvas.style.height = `${h}px`;
    }
    dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    canvas.width = Math.floor(BlossomWorld.W * dpr);
    canvas.height = Math.floor(BlossomWorld.H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.imageSmoothingEnabled = true;
    if (ctx.imageSmoothingQuality) ctx.imageSmoothingQuality = 'high';
  }

  function scalePoint(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((clientX - rect.left) / rect.width) * BlossomWorld.W,
      y: ((clientY - rect.top) / rect.height) * BlossomWorld.H,
    };
  }

  function feetPos() {
    if (use3d && player.wx != null) return { x: player.wx, y: player.wz, wx: player.wx, wz: player.wz };
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
    if (p.kind === 'shop' && (BlossomHBLocal?.isRestaurant?.(p.shop) || p.shop === 'boutique' || p.choreId)) return true;
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
    const ft = feetPos();
    let best = null;
    const openWorld = use3d && BlossomWorld3D.isOverworld?.();
    let bestDist = use3d ? (openWorld ? 7.2 : 5.5) : 92;
    const zoneIds = openWorld ? Object.keys(BlossomWorld.LOCATIONS) : [getLoc().id];
    zoneIds.forEach((locId) => {
      const loc = BlossomWorld.getLocation(locId);
      loc.props.forEach((p) => {
      if (p.kind === 'npc' && p.id === 'bonnie' && state.level < BlossomCareer.BONNIE_LEVEL) return;
      if (!isInteractable(p)) return;
      const d = use3d
        ? BlossomWorld3D.distanceToProp3D(player, p, locId)
        : distanceToProp(ft, p);
      if (d < bestDist) {
        bestDist = d;
        best = p;
      }
      });
    });
    return best;
  }

  function nearIdFor(p) {
    if (!p) return null;
    if (p.kind === 'exit') return `exit-${p.to}`;
    if (p.kind === 'npc' && p.id === 'bonnie') return 'bonnie';
    if (p.kind === 'shop' && p.shop === 'boutique') return 'boutique';
    if (p.kind === 'shop' && p.shop === 'salon') return 'salon-work';
    if (p.kind === 'shop' && p.shop === 'wellness') return 'wellness-work';
    if (p.kind === 'artcenter') return 'artcenter-work';
    if (p.kind === 'stage') return 'stage-work';
    if (p.kind === 'studio') return 'studio-work';
    if (p.kind === 'beachGym') return 'beachGym-work';
    if (p.kind === 'gym') return 'gym-work';
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
        if (result.perfect) {
          fx().confetti();
          fx().screenFlash('#c084fc', 0.4);
          fx().screenShake(10);
        } else if (res.promoted) {
          fx().starBurst(player.x, player.y - 40);
          window.BlossomAudio?.playSfx('levelUp');
        } else {
          fx().burst(player.x, player.y - 30, { color: '#4ade80' });
        }
        fx().floatText(player.x, player.y - 55, `+$${res.pay} +${res.stars}⭐`, '#fde047');
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
    if (prop.kind === 'shop' && BlossomHBLocal?.isRestaurant?.(prop.shop)) {
      openRestaurant(prop);
      return;
    }
    if (prop.kind === 'shop' && prop.shop === 'boutique') {
      BlossomBoutique.open(state, { onPersist, onMessage });
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
    if (prop.kind === 'artcenter' && state.careerPath === 'broadway') {
      startShift(BlossomCareer.isChild(state));
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
    if (prop.kind === 'shop' && prop.shop === 'wellness' && state.careerPath === 'coach') {
      startShift(BlossomCareer.isChild(state));
      return;
    }
    if ((prop.kind === 'beachGym' || prop.kind === 'gym') && state.careerPath === 'trainer') {
      startShift(BlossomCareer.isChild(state));
      return;
    }
    if (prop.choreId) doChoreProp(prop);
  }

  function haptic(ms) {
    try { if (navigator.vibrate) navigator.vibrate(ms || 14); } catch { /* noop */ }
  }

  function changeLocation(toId, spawn, silent) {
    if (transitionLock > 0 && !nav.active) return;
    const next = BlossomWorld.getLocation(toId);
    const openWorld = use3d && BlossomWorld3D.isOverworld?.();
    state.currentLocation = toId;
    if (use3d) {
      const sp = BlossomWorld3D.spawn3D(toId, spawn);
      player.wx = sp.wx;
      player.wz = sp.wz;
      BlossomWorld3D.syncLegacy(player, next.floorY);
      state.currentRoom = BlossomWorld3D.getRoomAt3D(player.wx, player.wz, next);
    } else {
      player.x = spawn.x;
      player.y = spawn.y;
      state.currentRoom = BlossomWorld.getRoomAt(spawn.x, next);
    }
    state.position = { x: player.x, y: player.y, wx: player.wx, wz: player.wz };
    transitionLock = openWorld ? (silent ? 6 : 12) : (silent ? 28 : 55);
    if (!openWorld) {
      BlossomRender.invalidateCache?.();
      BlossomScene3D?.invalidateCache?.();
      if (use3d) {
        BlossomScene3D?.triggerTravel?.();
        BlossomScene3D?.warmStart?.(next, state, player);
      }
    }
    BlossomPet?.reset?.(player);
    if (!silent) {
      if (!openWorld) {
        window.BlossomAudio?.playSfx('travel');
        fx().travelBurst();
        fx().screenFlash('#4ade80', 0.3);
      }
      window.BlossomApp?.showTravelBanner(next.name, next.id);
    }
    updateHud();
    onPersist(state);
  }

  function updateZoneFromPosition() {
    if (!use3d || !BlossomWorld3D.isOverworld?.()) return;
    const nextId = BlossomWorld3D.locationAt(player.wx, player.wz);
    if (nextId === state.currentLocation) return;
    const next = BlossomWorld.getLocation(nextId);
    state.currentLocation = nextId;
    state.currentRoom = BlossomWorld3D.getRoomAt3D(player.wx, player.wz, next);
    transitionLock = 22;
    phaseFade = Math.max(phaseFade, 0.45);
    BlossomScene3D?.triggerTravel?.();
    BlossomScene3DHud?.triggerZoneFlash?.(next.name);
    window.BlossomAudio?.playSfx('travel');
    fx().screenFlash('#38bdf8', 0.22);
    const disc = BlossomDiscovery?.zoneReward?.(nextId, state);
    if (disc) {
      fx().starBurst(player.x, player.y - 40);
      fx().floatText(player.x, player.y - 58, `+${disc.stars}⭐ +$${disc.money}`, '#fde047');
      window.BlossomApp?.showTravelBanner(next.name, nextId, `First visit! +${disc.stars}⭐ +$${disc.money}`);
      onPersist(state);
    } else {
      window.BlossomApp?.showTravelBanner(next.name, nextId);
    }
    updateHud();
  }

  function clearNavigation() {
    nav.active = false;
    nav.arrived = false;
    nav.waypoints = [];
    nav.target = null;
    nav.taskId = null;
    nav.taskLabel = '';
  }

  function goToTask(taskId) {
    if (BlossomNavigate.taskIsDone(state, taskId)) {
      onMessage('That task is already done!', 'info');
      return;
    }
    const plan = BlossomNavigate.planNavigation(taskId, state);
    if (!plan?.target) {
      onMessage('Could not find that task on the map.', 'warn');
      return;
    }
    const task = BlossomNavigate.buildNavigableTasks(state).find((t) => t.id === taskId);
    nav.taskId = taskId;
    nav.taskLabel = task?.label || taskId;
    nav.target = plan.target;
    nav.waypoints = [...plan.waypoints];
    nav.active = true;
    nav.arrived = false;
    window.BlossomAudio?.playSfx('ui');
    onMessage(`Heading to ${nav.taskLabel}…`, 'info');
    if (state.guideExpanded === false && BlossomGuide.isMobileGuide()) {
      state.guideExpanded = true;
      BlossomGuide.setGuideExpanded(true);
    }
  }

  function advanceNavWaypoint() {
    if (!nav.waypoints.length) {
      nav.active = false;
      nav.arrived = true;
      fx().floatText(player.x, player.y - 50, 'Tap E to complete!', '#fde047');
      window.BlossomAudio?.playSfx('star');
      return;
    }
    const wp = nav.waypoints[0];
    if (wp.type === 'exit') {
      if (BlossomWorld3D.isOverworld?.()) {
        nav.waypoints.shift();
        return;
      }
      changeLocation(wp.to, wp.spawn, true);
      nav.waypoints.shift();
      return;
    }
    if (wp.type === 'target') {
      nav.waypoints.shift();
      nav.active = false;
      nav.arrived = true;
      fx().floatText(wp.x, wp.y - 40, 'Tap E to complete!', '#fde047');
      window.BlossomAudio?.playSfx('star');
    }
  }

  function updateNavigation() {
    if (!nav.active || !nav.waypoints.length) return;
    const wp = nav.waypoints[0];
    const loc = getLoc();
    if (use3d) {
      const tx = wp.wx ?? wp.x;
      const tz = wp.wz ?? wp.y;
      const dist = BlossomWorld3D.distance3D(player.wx, player.wz, tx, tz);
      if (dist < 2.4) {
        advanceNavWaypoint();
        return;
      }
      const angle = Math.atan2(tx - player.wx, tz - player.wz);
      const openWorld = BlossomWorld3D.isOverworld?.();
      const spd = get3DMoveSpeed(false, openWorld) * frameDt;
      player.wx += Math.sin(angle) * spd;
      player.wz += Math.cos(angle) * spd;
      player.moveYaw = angle;
      player.facing = tx > player.wx ? 1 : -1;
      player.facingVisual = player.facing;
      BlossomWorld3D.clampPlayer(player, loc.id);
      BlossomWorld3D.syncLegacy(player, loc.floorY);
      state.position = { x: player.x, y: player.y, wx: player.wx, wz: player.wz };
      return;
    }
    const dist = Math.hypot(player.x - wp.x, player.y - wp.y);
    if (dist < 14) {
      advanceNavWaypoint();
      return;
    }
    const angle = Math.atan2(wp.y - player.y, wp.x - player.x);
    player.x += Math.cos(angle) * nav.autoSpeed;
    player.y += Math.sin(angle) * nav.autoSpeed * 0.88;
    player.facing = wp.x > player.x ? 1 : -1;
    player.facingVisual = player.facing;
    const floorY = loc.floorY - 20;
    player.x = Math.max(30, Math.min(BlossomWorld.W - 30, player.x));
    player.y = Math.max(loc.floorY - 120, Math.min(floorY, player.y));
    state.position = { x: player.x, y: player.y };
  }

  function get3DMoveSpeed(run, openWorld) {
    const cfg = window.BLOSSOM_CONFIG;
    const mult = cfg.walkSpeedMultiplier ?? 1;
    const walk = openWorld ? (cfg.walkSpeedOpen ?? 3.6) : (cfg.walkSpeedIndoor ?? 2.4);
    const runSpd = openWorld ? (cfg.runSpeedOpen ?? 6.2) : (cfg.runSpeedIndoor ?? 4);
    return (run ? runSpd : walk) * mult;
  }

  function apply3DMovement(loc, mv, dt) {
    const orbit = (mv.turnL ? 0.048 : 0) + (mv.turnR && !nearInteract ? -0.048 : 0) + (mv.camTurn || 0);
    if (orbit) BlossomScene3D.rotateCam(orbit);

    const dx = mv.dx ?? 0;
    const dy = mv.dy ?? 0;
    if (Math.hypot(dx, dy) < 0.08) return;

    const basis = BlossomScene3D.getWalkBasis(player);
    const openWorld = BlossomWorld3D.isOverworld?.();
    const speed = get3DMoveSpeed(mv.run, openWorld) * dt;
    let mx = basis.forwardX * (-dy) + basis.rightX * dx;
    let mz = basis.forwardZ * (-dy) + basis.rightZ * dx;
    const mlen = Math.hypot(mx, mz);
    if (mlen < 0.001) return;
    mx /= mlen;
    mz /= mlen;
    player.wx += mx * speed;
    player.wz += mz * speed;
    player.moveYaw = Math.atan2(mx, mz);
    if (dx !== 0) player.facing = dx > 0 ? 1 : -1;
    BlossomWorld3D.clampPlayer(player, loc.id);
    BlossomWorld3D.syncLegacy(player, loc.floorY);
    state.position = { x: player.x, y: player.y, wx: player.wx, wz: player.wz };
  }

  function updateCamera() {
    let focusX = player.x;
    let focusY = player.y - 30;
    let targetZoom = 1;
    if (nav.active && nav.waypoints.length) {
      const wp = nav.waypoints[0];
      focusX = (player.x + wp.x) * 0.45;
      focusY = (player.y + wp.y) * 0.45 - 20;
      targetZoom = 1.12;
    } else if (nav.arrived && nav.target?.center) {
      focusX = (player.x + nav.target.center.x) * 0.5;
      focusY = (nav.target.center.y + player.y) * 0.45 - 24;
      targetZoom = 1.18;
    }
    camera.x += (focusX - camera.x) * 0.09;
    camera.y += (focusY - camera.y) * 0.09;
    camera.zoom += (targetZoom - camera.zoom) * 0.07;
  }

  function tryTransition(prop) {
    if (prop?.kind === 'exit' && prop.to) {
      if (BlossomWorld3D.isOverworld?.()) return false;
      changeLocation(prop.to, prop.spawn);
      return true;
    }
    return false;
  }

  function onTap(e) {
    if (BlossomShift.isActive()) return;
    if (BlossomControls.consumedPointerClick?.()) return;
    const p = scalePoint(e.clientX, e.clientY);
    handleInteract(p.x, p.y, e.clientX, e.clientY);
  }

  function onTapTouch(e) {
    if (BlossomShift.isActive()) return;
    if (!e.changedTouches?.[0]) return;
    e.preventDefault();
    const t = e.changedTouches[0];
    const p = scalePoint(t.clientX, t.clientY);
    handleInteract(p.x, p.y, t.clientX, t.clientY);
  }

  function handleInteract(x, y, clientX, clientY) {
    if (use3d && clientX != null) {
      const prop = BlossomScene3D.pickProp(clientX, clientY);
      if (prop && isInteractable(prop)) {
        interactWithProp(prop);
        return;
      }
    }
    const loc = getLoc();
    for (const prop of loc.props) {
      if (!BlossomRender.hitProp(x, y, prop)) continue;
      if (!isInteractable(prop)) continue;
      interactWithProp(prop);
      return;
    }
  }

  function onPhotoKey(e) {
    if (BlossomControls.isTypingTarget?.()) return;
    if (e.key?.toLowerCase() !== 'p') return;
    if (document.querySelector('.modal-backdrop:not([hidden])')) return;
    e.preventDefault();
    window.BlossomPhoto?.toggle?.();
  }

  function onInteractKey(e) {
    if (BlossomControls.isTypingTarget?.()) return;
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
      const cx = prop.x + (prop.w || 40) / 2;
      const cy = prop.y + 10;
      fx().starBurst(cx, cy);
      fx().floatText(cx, cy - 20, '+5 ⭐', '#fde047');
      window.BlossomAudio?.playSfx('star');
      haptic(18);
      BlossomPet?.onChore?.();
      if (nav.taskId === prop.choreId) clearNavigation();
      onPersist(state);
    } else window.BlossomAudio?.playSfx('warn');
  }

  function openFridge() {
    const phase = BlossomDay.currentPhase(state);
    const meal = phase.meal;
    if (!meal) {
      onMessage('Kitchen is closed for now. Hit Main Street — Sugar Shack, Jan\'s, No Ka Oi, or Wahoo\'s!', 'warn');
      window.BlossomAudio?.playSfx('warn');
      return;
    }
    pickMeal(meal, BlossomDay.FOODS[meal], 'fridge');
  }

  function openRestaurant(prop) {
    const phase = BlossomDay.currentPhase(state);
    const name = prop?.label || BlossomHBLocal?.shop?.(prop?.shop)?.label || 'Main Street';
    if (phase.meal !== 'lunch') {
      onMessage(`${name} serves lunch in the afternoon.`, 'warn');
      window.BlossomAudio?.playSfx('warn');
      return;
    }
    pickMeal('lunch', BlossomDay.FOODS.lunch, prop?.shop || 'cafe');
  }

  function pickMeal(mealKey, foods, source) {
    window.BlossomMeal?.open({
      mealKey,
      foods,
      state,
      source: source || 'fridge',
      onPick: (idx) => {
        const res = BlossomDay.eatMeal(state, foods[idx], mealKey);
        onMessage(res.msg, res.ok ? 'good' : 'warn');
        if (res.ok) {
          fx().starBurst(player.x, player.y - 45);
          fx().floatText(player.x, player.y - 60, `+${window.BLOSSOM_CONFIG?.starsPerMeal ?? 5} ⭐`, '#fda4af');
          fx().burst(player.x, player.y - 50, { color: '#fbbf24', count: 8 });
          window.BlossomAudio?.playSfx('eat');
          haptic(16);
          if (nav.taskId === mealKey) clearNavigation();
          onPersist(state);
          updateHud();
        } else {
          window.BlossomAudio?.playSfx('warn');
        }
      },
    });
  }

  function showReminder(text) {
    const el = document.getElementById('dayReminder');
    if (el) {
      el.textContent = text;
      el.hidden = false;
      el.classList.remove('day-reminder--pop');
      void el.offsetWidth;
      el.classList.add('day-reminder--pop');
    }
    fx().screenFlash('#bae6fd', 0.15);
  }

  function tickPhase() {
    phaseTimer += 1000;
    if (phaseTimer >= phaseMs()) {
      phaseTimer = 0;
      if (BlossomPhoto?.isActive?.()) return;
      const next = BlossomDay.advancePhase(state);
      if (next) {
        phaseFade = 1;
        window.BlossomAudio?.playPhaseTransition?.();
        const hint = (state.day || 1) <= 3 ? BlossomGuide.phaseHint(state) : next.hint;
        showReminder(hint);
        onPersist(state);
      } else {
        const goal = BlossomGuide.starsGoal(state);
        showReminder(
          state.stars >= goal
            ? `You hit ${goal}⭐! Tap End day when you're ready 🌸`
            : BlossomGuide.phaseHint(state)
        );
      }
    }
    updateHud();
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
    const goal = BlossomGuide.starsGoal(state);
    if (starsEl) {
      starsEl.textContent = `${state.stars}/${goal}`;
      starsEl.classList.toggle('hud-stars--hot', state.stars >= goal * 0.75);
      starsEl.classList.toggle('hud-stars--pulse', state.stars >= goal - 5);
    }
    if (levelEl) levelEl.textContent = `Lv ${state.level}`;
    if (phaseEl) phaseEl.textContent = BlossomDay.currentPhase(state).label;
    if (locEl) {
      locEl.textContent = loc.name;
      locEl.dataset.zone = loc.id || '';
    }
    if (careerEl) {
      const p = BlossomCareer.path(state);
      const streak = state.bloomStreak > 0 ? ` · 🔥${state.bloomStreak}` : '';
      careerEl.textContent = `${p.emoji} ${BlossomCareer.rankLabel(state)}${streak}`;
    }
    document.querySelector('.game-stage')?.classList.toggle('game-stage--quiet', (state.day || 1) > 2);
    window.BlossomToday?.renderCard?.(state);
    const hint = document.getElementById('travelHint');
    if (hint) {
      if ((state.day || 1) <= 3 && state.stars < goal) {
        hint.textContent = BlossomGuide.nextStep(state).hint;
      } else {
        const exits = loc.props.filter((p) => p.kind === 'exit');
        hint.textContent = exits.length
          ? 'Green exits travel · E at your job site for work'
          : 'E or tap to interact';
      }
    }
    BlossomGuide.updatePanel(state);
  }

  function loop(ts) {
    try {
      const dt = lastTs ? (ts - lastTs) / 1000 : 0.016;
      frameDt = Math.min(Math.max(dt, 0.001), 0.05);
      lastTs = ts;
      anim = ts / 1000;
      if (transitionLock > 0) transitionLock -= 1;
      if (phaseFade > 0) phaseFade = Math.max(0, phaseFade - 0.018);
      fx().update(dt);
      update();
      draw();
    } catch (err) {
      console.error('Blossom loop error:', err);
    }
    requestAnimationFrame(loop);
  }

  function update() {
    let loc = getLoc();
    const floorY = loc.floorY - 20;
    const mv = BlossomControls.getMovement();
    const { dx, dy, jump, run } = mv;
    const speed = 2.9;
    playerMoving = mv.moving || Math.abs(dx) > 0.08 || Math.abs(dy) > 0.08;
    const wantsRun = run && playerMoving && !nav.active;
    const canSprint = stamina > 6;
    if (use3d && wantsRun && canSprint) {
      stamina = Math.max(0, stamina - 38 * frameDt);
    } else {
      stamina = Math.min(100, stamina + 28 * frameDt);
    }
    playerRunning = wantsRun && canSprint;
    if (use3d && wantsRun && !canSprint) mv = { ...mv, run: false };

    if (use3d) {
      BlossomWorld3D.ensurePlayer3D(player, loc.id);
      if (nav.active) {
        updateNavigation();
        playerMoving = true;
      } else {
        const userDriving = mv.moving || mv.camTurn || mv.turnL || mv.turnR;
        if (userDriving) clearNavigation();
        apply3DMovement(loc, mv, frameDt);
      }
      if (!nav.active && jump) window.BlossomAudio?.playSfx('jump');
    } else if (nav.active) {
      updateNavigation();
      playerMoving = true;
    } else {
      if (dx !== 0 || dy !== 0) clearNavigation();
      player.x += dx * speed;
      player.y += dy * speed * 0.85;
      if (playerMoving) {
        player.moveYaw = Math.atan2(dx || 0, -(dy || 0.001));
        if (dx !== 0) player.facing = dx > 0 ? 1 : -1;
      }
      if (jump && player.onGround) {
        player.vy = -7;
        player.onGround = false;
        player.wasAirborne = true;
        window.BlossomAudio?.playSfx('jump');
      }
      player.vy += 0.35;
      player.y += player.vy;
      if (player.y > floorY) {
        if (player.wasAirborne && player.vy > 2) player.landSquash = 1;
        player.y = floorY;
        player.vy = 0;
        player.onGround = true;
        player.wasAirborne = false;
      }
      player.landSquash = Math.max(0, (player.landSquash || 0) - 0.12);
      player.x = Math.max(30, Math.min(BlossomWorld.W - 30, player.x));
      player.y = Math.max(loc.floorY - 120, Math.min(floorY, player.y));
      state.position = { x: player.x, y: player.y };
    }

    player.facingVisual += (player.facing - player.facingVisual) * 0.22;
    updateZoneFromPosition();
    loc = getLoc();
    const roomId = use3d
      ? BlossomWorld3D.getRoomAt3D(player.wx, player.wz, loc)
      : BlossomWorld.getRoomAt(player.x, loc);
    state.currentRoom = roomId;
    footSurface = BlossomWorld.footSurface(loc, roomId);
    window.BlossomAudio?.maybeStep(playerMoving, footSurface);
    window.BlossomAudio?.setLocationAmbience?.(loc.id, roomId);
    BlossomPet?.update?.(player, loc);

    nearInteract = findNearProp();
    if (use3d) {
      const lm = BlossomDiscovery?.checkLandmarks?.(state, player);
      if (lm) {
        BlossomScene3DHud?.triggerZoneFlash?.(`✦ ${lm.name}`);
        fx().confetti?.();
        fx().floatText(player.x, player.y - 62, `Landmark! +${lm.stars}⭐`, '#f472b6');
        window.BlossomAudio?.playSfx('levelUp');
        onMessage(`Passport stamp: ${lm.name}`, 'good');
        onPersist(state);
        updateHud();
      }
    }
    if (!BlossomWorld3D.isOverworld?.() && !nav.active && transitionLock <= 0 && nearInteract?.kind === 'exit') {
      const movingInto = use3d
        ? playerMoving
        : Math.hypot(dx, dy) > 0.35 || jump;
      if (movingInto) tryTransition(nearInteract);
    }
    if (nav.arrived && nav.target?.prop) {
      const match = nearInteract && (
        (nearInteract.choreId && nearInteract.choreId === nav.target.prop.choreId)
        || (nearInteract.kind === nav.target.prop.kind && nearInteract.kind === 'fridge')
        || (nearInteract.kind === 'shop' && nav.target.prop.kind === 'shop' && nearInteract.shop === nav.target.prop.shop)
      );
      if (match) clearNavigation();
    }
    updateCamera();

    const bubble = document.getElementById('npcBubble');
    const goal = BlossomGuide.starsGoal(state);
    if (bubble && !nearInteract && (state.day || 1) <= 2 && state.stars < goal) {
      bubble.textContent = `📖 ${BlossomGuide.nextStep(state).hint}`;
      bubble.classList.remove('npc-bubble--chat', 'npc-bubble--ai', 'npc-bubble--zone');
    } else if (bubble && !nearInteract) {
      const hb = BlossomHBLocal?.loc?.(loc.id);
      bubble.textContent = hb?.blurb || 'Walk east toward Main Street and the pier.';
      bubble.classList.add('npc-bubble--zone');
      bubble.classList.remove('npc-bubble--chat', 'npc-bubble--ai');
    } else if (bubble && nearInteract) {
      bubble.classList.remove('npc-bubble--zone', 'npc-bubble--ai');
      const localLine = BlossomLocals?.greeting?.(nearInteract, state);
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
      } else if ((nearInteract.kind === 'artcenter' || nearInteract.kind === 'stage') && state.careerPath === 'broadway') {
        bubble.textContent = `E: ${BlossomCareer.isChild(state) ? cp.playLabel : cp.workLabel}`;
      } else if (nearInteract.kind === 'studio' && state.careerPath === 'tiktoker') {
        bubble.textContent = `E: ${BlossomCareer.isChild(state) ? cp.playLabel : cp.workLabel}`;
      } else if (nearInteract.kind === 'shop' && nearInteract.shop === 'wellness' && state.careerPath === 'coach') {
        bubble.textContent = `E: ${BlossomCareer.isChild(state) ? cp.playLabel : cp.workLabel}`;
      } else if ((nearInteract.kind === 'beachGym' || nearInteract.kind === 'gym') && state.careerPath === 'trainer') {
        bubble.textContent = `E: ${BlossomCareer.isChild(state) ? cp.playLabel : cp.workLabel}`;
      } else if (nearInteract.choreId) {
        const done = state.choresDone[nearInteract.choreId];
        const listed = BlossomDay.isChoreToday(state, nearInteract.choreId);
        if (done) bubble.textContent = `✓ ${nearInteract.label}`;
        else if (!listed) bubble.textContent = `${nearInteract.label} — not on today's list`;
        else bubble.textContent = `E or tap: ${nearInteract.label}`;
      } else if (nearInteract.kind === 'fridge') bubble.textContent = 'E or tap fridge to eat';
      else if (nearInteract.shop === 'boutique') bubble.textContent = 'E — Bloom Boutique · buy new clothes!';
      else if (BlossomHBLocal?.isRestaurant?.(nearInteract.shop)) {
        bubble.textContent = `E or tap ${nearInteract.label || 'restaurant'} for lunch`;
      } else if (localLine) {
        bubble.textContent = localLine;
      }
    }
  }

  function draw() {
    const loc = getLoc();
    if (use3d && BlossomScene3D?.isReady?.()) {
      BlossomScene3D.renderFrame({
        loc,
        state,
        player,
        anim,
        nearInteract,
        nav,
        camera,
        transitionLock,
        phaseFade,
        moving: playerMoving,
        running: playerRunning,
        stamina,
        surface: footSurface,
        choresDone: state.choresDone || {},
        todaysChores: state.todaysChores,
      });
      avPatternLoad(state);
      return;
    }
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.save();
    fx().applyShake(ctx);
    ctx.save();
    ctx.translate(BlossomWorld.W / 2, BlossomWorld.H / 2);
    ctx.scale(camera.zoom, camera.zoom);
    ctx.translate(-camera.x, -camera.y);
    BlossomRender.drawScene(
      ctx, loc, loc.props, anim, state.choresDone || {}, nearIdFor(nearInteract), state.todaysChores, state
    );
    fx().drawAmbient(ctx, loc.floorY, state.timeOfDay || 'morning');
    if ((nav.active || nav.arrived) && !BlossomPhoto?.isActive?.()) {
      BlossomRender.drawQuestOverlay(ctx, {
        active: nav.active,
        arrived: nav.arrived,
        waypoints: nav.waypoints,
        target: nav.target,
        taskLabel: nav.taskLabel,
        playerX: player.x,
        playerY: player.y,
      }, anim);
    }
    if (nearInteract && !BlossomPhoto?.isActive?.()) {
      BlossomRender.drawInteractGlow(ctx, nearInteract, anim);
      BlossomRender.drawInteractPrompt(ctx, nearInteract, anim);
    }
    BlossomRender.drawPlayer(ctx, state, player, anim, shirtImg, shirtSrc, Boolean(nearInteract));
    ctx.restore();
    if (BlossomPet?.visible?.(loc)) {
      /* drawn in world layer */
    }
    fx().draw(ctx);
    ctx.restore();
    if (phaseFade > 0) {
      phaseFade = Math.max(0, phaseFade - 0.025);
      ctx.fillStyle = `rgba(253, 224, 71, ${phaseFade * 0.35})`;
      ctx.fillRect(0, 0, BlossomWorld.W, BlossomWorld.H);
    }
    if (transitionLock > 0) {
      const t = transitionLock / 55;
      ctx.fillStyle = `rgba(255, 247, 237, ${Math.min(0.65, t * 0.7)})`;
      ctx.fillRect(0, 0, BlossomWorld.W, BlossomWorld.H);
      ctx.fillStyle = '#166534';
      ctx.font = '800 22px Fredoka, Nunito, sans-serif';
      ctx.textAlign = 'center';
      ctx.globalAlpha = 1 - t;
      ctx.fillText(loc.name, BlossomWorld.W / 2, BlossomWorld.H / 2 - 10);
      ctx.globalAlpha = 1;
      ctx.textAlign = 'left';
    }
    if (!BlossomPhoto?.isActive?.()) {
      BlossomRender.drawLocationBadge(ctx, loc.name);
      BlossomRender.drawCareerBadge(ctx, state);
      BlossomRender.drawChoreTracker(ctx, state);
    }
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
    if (state.level > prevLevel) {
      fx().confetti();
      fx().screenFlash('#f472b6', 0.35);
      window.BlossomAudio?.playSfx('levelUp');
    }
    if (state.level >= BlossomCareer.BONNIE_LEVEL && prevLevel < BlossomCareer.BONNIE_LEVEL) {
      checkBonnieOffer();
    }
    state.currentLocation = 'house';
    const home = getLoc();
    player.x = 400;
    player.y = home.floorY - 20;
    if (use3d) {
      const sp = BlossomWorld3D.spawn3D('house', null);
      player.wx = sp.wx;
      player.wz = sp.wz;
      BlossomWorld3D.syncLegacy(player, home.floorY);
    }
    if (!BlossomWorld3D.isOverworld?.()) {
      BlossomScene3D?.invalidateCache?.();
    }
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

  function getNearInteract() {
    return nearInteract;
  }

  function getChatLog() {
    return chatLog;
  }

  async function sendChatMessage(text) {
    const result = await BlossomChat?.sendAsync?.(text, state, nearInteract, chatLog);
    if (result) {
      const bubble = document.getElementById('npcBubble');
      if (bubble) {
        bubble.textContent = result.body;
        bubble.classList.add('npc-bubble--chat');
        bubble.classList.toggle('npc-bubble--ai', Boolean(result.ai));
        bubble.classList.remove('npc-bubble--zone');
      }
      window.BlossomAudio?.playSfx('chat');
    }
    return result;
  }

  function onSpeedMultiplier(mult) {
    onMessage?.(`Walk speed ×${mult.toFixed(1)}  ([ slower · ] faster)`, 'info');
  }

  return {
    init, updateHud, endDay, showReminder, onBonnieAccepted, checkBonnieOffer,
    getNearInteract, getChatLog, sendChatMessage, haptic, goToTask, clearNavigation,
    onSpeedMultiplier,
  };
})();