/**
 * Cozy coastal ambient + gentle SFX (Puffin Rock-ish).
 * Procedural Web Audio — no external files.
 */
window.BlossomAudio = (function () {
  let enabled = true;
  let unlocked = false;
  let ctx = null;
  let master = null;
  let ambientBus = null;
  let sfxBus = null;
  let ambientRunning = false;
  let melodyTimer = null;
  let windSource = null;
  let padNodes = [];
  let lastStep = 0;

  // D major pentatonic — soft whistle/flute feel
  const MELODY = [293.66, 329.63, 369.99, 440, 493.88, 587.33, 659.25];

  function ensureCtx() {
    if (ctx) return ctx;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.5;
    master.connect(ctx.destination);
    ambientBus = ctx.createGain();
    ambientBus.gain.value = 0.65;
    ambientBus.connect(master);
    sfxBus = ctx.createGain();
    sfxBus.gain.value = 0.9;
    sfxBus.connect(master);
    return ctx;
  }

  async function unlock() {
    const c = ensureCtx();
    if (!c) return false;
    if (c.state === 'suspended') await c.resume();
    unlocked = true;
    if (enabled) startAmbient();
    return true;
  }

  function setEnabled(on) {
    enabled = on;
    if (!ctx || !master) return;
    master.gain.setTargetAtTime(on ? 0.5 : 0, ctx.currentTime, 0.35);
    if (on && unlocked) startAmbient();
    else stopAmbient();
  }

  function noiseBuffer(seconds = 2) {
    const len = Math.floor(ctx.sampleRate * seconds);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < len; i++) {
      const white = Math.random() * 2 - 1;
      last = (last + 0.02 * white) / 1.02;
      data[i] = last * 2.5;
    }
    return buf;
  }

  function startWind() {
    if (windSource || !ctx) return;
    const src = ctx.createBufferSource();
    src.buffer = noiseBuffer(3);
    src.loop = true;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 520;
    filter.Q.value = 0.4;
    const gain = ctx.createGain();
    gain.gain.value = 0.045;
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.08;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 0.018;
    lfo.connect(lfoGain);
    lfoGain.connect(gain.gain);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(ambientBus);
    src.start();
    lfo.start();
    windSource = { src, lfo, gain, filter };
  }

  function startPad() {
    const freqs = [146.83, 220, 293.66];
    freqs.forEach((f, i) => {
      const osc = ctx.createOscillator();
      osc.type = i === 0 ? 'sine' : 'triangle';
      osc.frequency.value = f;
      const gain = ctx.createGain();
      gain.gain.value = 0.018 + i * 0.004;
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 900;
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ambientBus);
      osc.start();
      osc.detune.value = i * 7;
      padNodes.push(osc);
    });
  }

  function playWhistle(freq, duration = 1.4, volume = 0.12) {
    if (!enabled || !unlocked || !ctx) return;
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    osc.type = 'sine';
    osc2.type = 'triangle';
    osc.frequency.value = freq;
    osc2.frequency.value = freq * 1.005;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 1400;
    filter.Q.value = 0.8;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(volume, t + 0.35);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
    osc.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(ambientBus);
    osc.start(t);
    osc2.start(t);
    osc.stop(t + duration + 0.1);
    osc2.stop(t + duration + 0.1);
  }

  function scheduleMelody() {
    if (melodyTimer) clearInterval(melodyTimer);
    const tick = () => {
      if (!enabled || !unlocked) return;
      const note = MELODY[Math.floor(Math.random() * MELODY.length)];
      playWhistle(note, 1.2 + Math.random() * 0.8, 0.09);
    };
    melodyTimer = setInterval(tick, 5200 + Math.random() * 2800);
    setTimeout(tick, 800);
  }

  function startAmbient() {
    if (!ctx || !enabled || ambientRunning) return;
    startWind();
    startPad();
    scheduleMelody();
    ambientRunning = true;
  }

  function stopAmbient() {
    if (melodyTimer) {
      clearInterval(melodyTimer);
      melodyTimer = null;
    }
    if (windSource) {
      try {
        windSource.src.stop();
        windSource.lfo.stop();
      } catch { /* already stopped */ }
      windSource = null;
    }
    padNodes.forEach((osc) => {
      try { osc.stop(); } catch { /* noop */ }
    });
    padNodes = [];
    ambientRunning = false;
  }

  function tone(freq, type, duration, volume, bus, attack = 0.02) {
    if (!enabled || !unlocked || !ctx) return;
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(volume, t + attack);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
    osc.connect(gain);
    gain.connect(bus || sfxBus);
    osc.start(t);
    osc.stop(t + duration + 0.05);
  }

  function chime(arpeggio, baseVol = 0.14) {
    arpeggio.forEach((f, i) => {
      setTimeout(() => tone(f, 'sine', 0.55, baseVol - i * 0.02), i * 90);
    });
  }

  function playSfx(name) {
    if (!enabled || !unlocked) return;
    switch (name) {
      case 'star':
        chime([523.25, 659.25, 783.99], 0.12);
        break;
      case 'eat':
        tone(440, 'sine', 0.15, 0.1);
        setTimeout(() => tone(554.37, 'triangle', 0.2, 0.08), 80);
        break;
      case 'chore':
        tone(329.63, 'triangle', 0.25, 0.11);
        setTimeout(() => chime([392, 493.88], 0.1), 120);
        break;
      case 'jump':
        tone(180, 'sine', 0.18, 0.07);
        break;
      case 'step':
        tone(90 + Math.random() * 20, 'sine', 0.06, 0.025);
        break;
      case 'ui':
        tone(660, 'sine', 0.08, 0.06);
        break;
      case 'chat':
        playWhistle(MELODY[Math.floor(Math.random() * 4)], 0.5, 0.07);
        break;
      case 'dayWin':
        chime([293.66, 369.99, 440, 587.33], 0.13);
        setTimeout(() => playWhistle(659.25, 1.6, 0.1), 400);
        break;
      case 'dayFail':
        tone(220, 'sine', 0.5, 0.09);
        setTimeout(() => tone(164.81, 'triangle', 0.7, 0.07), 200);
        break;
      case 'warn':
        tone(277.18, 'triangle', 0.2, 0.07);
        break;
      default:
        break;
    }
  }

  function maybeStep(isMoving) {
    if (!isMoving || !enabled || !unlocked) return;
    const now = Date.now();
    if (now - lastStep < 340) return;
    lastStep = now;
    playSfx('step');
  }

  function bindUnlockOnGesture() {
    const once = () => {
      unlock();
      document.removeEventListener('pointerdown', once);
      document.removeEventListener('keydown', once);
    };
    document.addEventListener('pointerdown', once, { passive: true });
    document.addEventListener('keydown', once);
  }

  bindUnlockOnGesture();

  return {
    unlock,
    setEnabled,
    playSfx,
    maybeStep,
    isEnabled: () => enabled,
  };
})();