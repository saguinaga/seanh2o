/** WASD / arrows + mobile virtual joystick */
window.BlossomControls = (function () {
  const keys = new Set();
  let joystick = { active: false, dx: 0, dy: 0, jump: false };

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
    ['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'space', ' '].forEach((k) => keys.delete(k));
  }

  function init() {
    window.addEventListener('keydown', (e) => {
      if (isTypingTarget(e.target)) return;
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) e.preventDefault();
      keys.add(e.key.toLowerCase());
      if (e.key === ' ') keys.add('space');
    });
    window.addEventListener('keyup', (e) => {
      if (isTypingTarget(e.target)) return;
      keys.delete(e.key.toLowerCase());
      if (e.key === ' ') keys.delete('space');
    });
    document.addEventListener('focusin', (e) => {
      if (isTypingTarget(e.target)) clearMovementKeys();
    });
    document.addEventListener('focusout', clearMovementKeys);
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
    let dx = 0;
    let dy = 0;
    if (keys.has('w') || keys.has('arrowup')) dy -= 1;
    if (keys.has('s') || keys.has('arrowdown')) dy += 1;
    if (keys.has('a') || keys.has('arrowleft')) dx -= 1;
    if (keys.has('d') || keys.has('arrowright')) dx += 1;
    if (joystick.active) {
      dx = joystick.dx;
      dy = joystick.dy;
    }
    const len = Math.hypot(dx, dy);
    if (len > 1) { dx /= len; dy /= len; }
    const jump = keys.has('space') || joystick.jump;
    joystick.jump = false;
    return { dx, dy, jump };
  }

  return { init, getMovement, isTypingTarget };
})();