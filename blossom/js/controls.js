/** WASD / arrows + mobile virtual joystick + mouse orbit (3D) */
window.BlossomControls = (function () {
  /** Semantic movement — up/down = forward/back, left/right = strafe (never swapped) */
  const MOVE_BY_CODE = {
    ArrowUp: 'up',
    ArrowDown: 'down',
    ArrowLeft: 'left',
    ArrowRight: 'right',
    KeyW: 'up',
    KeyS: 'down',
    KeyA: 'left',
    KeyD: 'right',
  };

  const moveKeys = new Set();
  const modKeys = new Set();
  let joystick = { active: false, dx: 0, dy: 0, jump: false };
  let mode3d = false;
  let mouseOrbit = { active: false, pending: false, lastX: 0, startX: 0, delta: 0, dragged: false };
  let orbitCanvas = null;
  const DRAG_ORBIT_THRESHOLD = 10;

  function isTypingTarget(el) {
    const node = el || document.activeElement;
    if (!node || node === document.body || node === document.documentElement) return false;
    if (node.isContentEditable) return true;
    const tag = node.tagName;
    if (tag !== 'INPUT' && tag !== 'TEXTAREA' && tag !== 'SELECT') return false;
    const type = (node.type || '').toLowerCase();
    if (type === 'checkbox' || type === 'radio' || type === 'button' || type === 'submit' || type === 'file') {
      return false;
    }
    return !node.readOnly && !node.disabled;
  }

  function clearMovementKeys() {
    moveKeys.clear();
    modKeys.clear();
  }

  function clearAllInput() {
    clearMovementKeys();
    mouseOrbit.pending = false;
    mouseOrbit.active = false;
    mouseOrbit.delta = 0;
    mouseOrbit.dragged = false;
    orbitCanvas?.classList.remove('orbit-drag');
    joystick = { active: false, dx: 0, dy: 0, jump: false };
    const knob = document.getElementById('joystickKnob');
    if (knob) knob.style.transform = 'translate(-50%, -50%)';
  }

  function movementIdFromEvent(e) {
    return MOVE_BY_CODE[e.code] || null;
  }

  function isMovementArrow(e) {
    return e.code === 'ArrowUp' || e.code === 'ArrowDown'
      || e.code === 'ArrowLeft' || e.code === 'ArrowRight';
  }

  function readAxes() {
    let dx = 0;
    let dy = 0;
    if (moveKeys.has('up')) dy -= 1;
    if (moveKeys.has('down')) dy += 1;
    if (moveKeys.has('left')) dx -= 1;
    if (moveKeys.has('right')) dx += 1;
    if (joystick.active) {
      dx = joystick.dx;
      dy = joystick.dy;
    }
    const len = Math.hypot(dx, dy);
    if (len > 1) {
      dx /= len;
      dy /= len;
    }
    return { dx, dy, len };
  }

  function set3DMode(on) {
    mode3d = !!on;
  }

  function canInstantOrbit(e) {
    return e.button === 2 || e.button === 1 || (e.button === 0 && e.shiftKey);
  }

  function initPointerOrbit(canvas) {
    orbitCanvas = canvas;
    if (!canvas) return;
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    canvas.addEventListener('mousedown', (e) => {
      if (!mode3d || isTypingTarget()) return;
      if (canInstantOrbit(e)) {
        mouseOrbit.active = true;
        mouseOrbit.pending = false;
        mouseOrbit.lastX = e.clientX;
        mouseOrbit.startX = e.clientX;
        mouseOrbit.delta = 0;
        mouseOrbit.dragged = true;
        orbitCanvas?.classList.add('orbit-drag');
        e.preventDefault();
        return;
      }
      if (e.button === 0) {
        mouseOrbit.pending = true;
        mouseOrbit.active = false;
        mouseOrbit.lastX = e.clientX;
        mouseOrbit.startX = e.clientX;
        mouseOrbit.delta = 0;
        mouseOrbit.dragged = false;
      }
    });
    window.addEventListener('mousemove', (e) => {
      if (mouseOrbit.pending && !mouseOrbit.active) {
        if (Math.abs(e.clientX - mouseOrbit.startX) >= DRAG_ORBIT_THRESHOLD) {
          mouseOrbit.active = true;
          mouseOrbit.dragged = true;
          orbitCanvas?.classList.add('orbit-drag');
        }
      }
      if (!mouseOrbit.active) return;
      const orbitDx = e.clientX - mouseOrbit.lastX;
      mouseOrbit.lastX = e.clientX;
      mouseOrbit.delta += orbitDx * 0.0052;
      e.preventDefault();
    });
    const endOrbit = () => {
      mouseOrbit.pending = false;
      mouseOrbit.active = false;
      orbitCanvas?.classList.remove('orbit-drag');
    };
    window.addEventListener('mouseup', endOrbit);
    window.addEventListener('blur', clearAllInput);
  }

  function consumedPointerClick() {
    const wasDrag = mouseOrbit.dragged;
    mouseOrbit.dragged = false;
    return wasDrag;
  }

  function onKeyDown(e) {
    if (isTypingTarget(e.target)) return;

    const moveId = movementIdFromEvent(e);
    if (moveId) {
      e.preventDefault();
      moveKeys.add(moveId);
      return;
    }

    if (isMovementArrow(e)) e.preventDefault();
    if (e.code === 'Space') {
      e.preventDefault();
      modKeys.add('space');
    }
    if (e.code === 'ShiftLeft' || e.code === 'ShiftRight' || e.key === 'Shift') {
      modKeys.add('shift');
    }
    if (e.code === 'KeyQ') modKeys.add('q');
    if (e.code === 'KeyE') modKeys.add('e');
    if (e.code === 'BracketLeft' || e.code === 'BracketRight') {
      e.preventDefault();
      adjustWalkMultiplier(e.code === 'BracketRight' ? 0.1 : -0.1);
    }
  }

  function adjustWalkMultiplier(delta) {
    const cfg = window.BLOSSOM_CONFIG;
    if (!cfg) return;
    const next = Math.round(Math.max(0.5, Math.min(2, (cfg.walkSpeedMultiplier || 1) + delta)) * 10) / 10;
    cfg.walkSpeedMultiplier = next;
    try { localStorage.setItem('blossom-walk-mult', String(next)); } catch (_) {}
    window.BlossomGame?.onSpeedMultiplier?.(next);
  }

  function onKeyUp(e) {
    if (isTypingTarget(e.target)) return;

    const moveId = movementIdFromEvent(e);
    if (moveId) {
      e.preventDefault();
      moveKeys.delete(moveId);
      return;
    }

    if (e.code === 'Space') modKeys.delete('space');
    if (e.code === 'ShiftLeft' || e.code === 'ShiftRight' || e.key === 'Shift') {
      modKeys.delete('shift');
    }
    if (e.code === 'KeyQ') modKeys.delete('q');
    if (e.code === 'KeyE') modKeys.delete('e');
  }

  function init() {
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) clearAllInput();
    });
    document.addEventListener('focusin', (e) => {
      if (isTypingTarget(e.target)) clearMovementKeys();
    });
    document.addEventListener('focusout', (e) => {
      if (isTypingTarget(e.target)) clearMovementKeys();
    });
    initJoystick();
  }

  function initJoystick() {
    const base = document.getElementById('joystickBase');
    const knob = document.getElementById('joystickKnob');
    const jumpBtn = document.getElementById('jumpBtn');
    if (!base || !knob) return;

    const radius = 52;
    let touchId = null;
    let origin = { x: 0, y: 0 };

    function setKnob(dx, dy) {
      const dist = Math.hypot(dx, dy);
      const max = radius - 18;
      const scale = dist > max ? max / dist : 1;
      const x = dx * scale;
      const y = dy * scale;
      knob.style.transform = `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`;
      joystick.dx = x / max;
      joystick.dy = y / max;
      joystick.active = dist > 8;
    }

    function reset() {
      knob.style.transform = 'translate(-50%, -50%)';
      joystick = { active: false, dx: 0, dy: 0, jump: joystick.jump };
      touchId = null;
    }

    function onStart(e) {
      e.preventDefault();
      const t = e.changedTouches ? e.changedTouches[0] : e;
      touchId = t.identifier ?? 'mouse';
      const rect = base.getBoundingClientRect();
      origin = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
      move(t.clientX, t.clientY);
    }

    function move(cx, cy) {
      setKnob(cx - origin.x, cy - origin.y);
    }

    function onMove(e) {
      if (touchId === null) return;
      e.preventDefault();
      const list = e.changedTouches || [e];
      for (const t of list) {
        if ((t.identifier ?? 'mouse') === touchId) move(t.clientX, t.clientY);
      }
    }

    function onEnd(e) {
      e.preventDefault();
      reset();
    }

    base.addEventListener('touchstart', onStart, { passive: false });
    base.addEventListener('touchmove', onMove, { passive: false });
    base.addEventListener('touchend', onEnd, { passive: false });
    base.addEventListener('mousedown', onStart);
    window.addEventListener('mousemove', (e) => { if (touchId === 'mouse') onMove(e); });
    window.addEventListener('mouseup', (e) => { if (touchId === 'mouse') onEnd(e); });

    jumpBtn?.addEventListener('click', () => { joystick.jump = true; });
    jumpBtn?.addEventListener('touchstart', (e) => {
      e.preventDefault();
      joystick.jump = true;
    });
  }

  function getMovement() {
    const jump = modKeys.has('space') || joystick.jump;
    const run = modKeys.has('shift');
    const turnL = modKeys.has('q');
    const turnR = modKeys.has('e');
    joystick.jump = false;

    const { dx, dy, len } = readAxes();
    if (mode3d) {
      const camTurn = mouseOrbit.delta;
      mouseOrbit.delta = 0;
      return {
        mode3d: true,
        dx,
        dy,
        camTurn,
        jump,
        run,
        turnL,
        turnR,
        moving: len > 0.08,
      };
    }

    return { dx, dy, jump, run, turnL, turnR, moving: len > 0.08 };
  }

  return { init, getMovement, isTypingTarget, set3DMode, initPointerOrbit, consumedPointerClick };
})();