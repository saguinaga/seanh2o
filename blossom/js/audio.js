/**
 * Laid-back HB beach bed — procedural (no external files).
 * Slow coastal groove, nylon-guitar plucks, ocean wash, mellow pads.
 */
window.BlossomAudio = (function () {
  let enabled = true;
  let unlocked = false;
  let ctx = null;
  let master = null;
  let ambientBus = null;
  let sfxBus = null;
  let grooveBus = null;
  let groovePanner = null;
  let ambientRunning = false;
  let grooveTimer = null;
  let currentLocId = 'yard';
  let windSource = null;
  let waveSource = null;
  let padNodes = [];
  let lastStep = 0;
  let locAmbience = null;
  let currentLocAmb = '';

  const BPM = 74;
  const BEAT_SEC = 60 / BPM;
  let nextBeatTime = 0;
  let beatIdx = 0;

  // G major · laid-back surf-city changes (I–IV–vi–V)
  const CHORDS = [
    { root: 98, third: 123.47, fifth: 146.83, plucks: [196, 246.94, 293.66], name: 'G' },
    { root: 65.41, third: 82.41, fifth: 98, plucks: [261.63, 329.63, 392], name: 'C' },
    { root: 110, third: 130.81, fifth: 164.81, plucks: [220, 261.63, 329.63], name: 'Am' },
    { root: 73.42, third: 92.5, fifth: 110, plucks: [293.66, 369.99, 440], name: 'D' },
  ];
  const MELODY = [392, 440, 493.88, 523.25, 587.33, 659.25, 739.99];
  const melodyIdx = { i: 0 };

  function ensureCtx() {
    if (ctx) return ctx;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.46;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -22;
    comp.knee.value = 18;
    comp.ratio.value = 2.2;
    comp.attack.value = 0.012;
    comp.release.value = 0.35;
    master.connect(comp);
    comp.connect(ctx.destination);
    ambientBus = ctx.createGain();
    ambientBus.gain.value = 0.68;
    ambientBus.connect(master);
    grooveBus = ctx.createGain();
    grooveBus.gain.value = 0.34;
    groovePanner = ctx.createStereoPanner();
    groovePanner.pan.value = 0;
    grooveBus.connect(groovePanner);
    groovePanner.connect(master);
    sfxBus = ctx.createGain();
    sfxBus.gain.value = 0.92;
    sfxBus.connect(master);
    return ctx;
  }

  async function unlock() {
    const c = ensureCtx();
    if (!c) return false;
    try {
      if (c.state === 'suspended') await c.resume();
    } catch {
      return false;
    }
    unlocked = true;
    if (enabled) startAmbient();
    return true;
  }

  function setEnabled(on) {
    enabled = on;
    if (!ctx || !master) return;
    master.gain.setTargetAtTime(on ? 0.46 : 0, ctx.currentTime, 0.35);
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
    src.buffer = noiseBuffer(4);
    src.loop = true;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 680;
    filter.Q.value = 0.35;
    const gain = ctx.createGain();
    gain.gain.value = 0.042;
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.06;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 0.014;
    lfo.connect(lfoGain);
    lfoGain.connect(gain.gain);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(ambientBus);
    src.start();
    lfo.start();
    windSource = { src, lfo, gain, filter };
  }

  function startWaves() {
    if (waveSource || !ctx) return;
    const src = ctx.createBufferSource();
    src.buffer = noiseBuffer(6);
    src.loop = true;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 280;
    filter.Q.value = 0.6;
    const gain = ctx.createGain();
    gain.gain.value = 0.078;
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.14;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 0.028;
    lfo.connect(lfoGain);
    lfoGain.connect(gain.gain);
    const lfo2 = ctx.createOscillator();
    lfo2.frequency.value = 0.05;
    const lfo2Gain = ctx.createGain();
    lfo2Gain.gain.value = 0.012;
    lfo2.connect(lfo2Gain);
    lfo2Gain.connect(filter.frequency);
    filter.frequency.value = 320;
    src.connect(filter);
    filter.connect(gain);
    gain.connect(ambientBus);
    src.start();
    lfo.start();
    lfo2.start();
    waveSource = { src, lfo, lfo2, gain, filter };
  }

  function startPad() {
    const chord = [98, 123.47, 146.83, 196, 246.94];
    chord.forEach((f, i) => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = f;
      const gain = ctx.createGain();
      gain.gain.value = 0.018 + (i % 2) * 0.004;
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 880;
      const lfo = ctx.createOscillator();
      lfo.frequency.value = 0.03 + i * 0.004;
      const lfoG = ctx.createGain();
      lfoG.gain.value = 0.004;
      lfo.connect(lfoG);
      lfoG.connect(gain.gain);
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ambientBus);
      osc.start();
      lfo.start();
      osc.detune.value = (i - 2) * 4;
      padNodes.push(osc, lfo);
    });
  }

  function playSoftKick(t, vol = 0.14) {
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(72, t);
    osc.frequency.exponentialRampToValueAtTime(42, t + 0.12);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(vol, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
    osc.connect(gain);
    gain.connect(grooveBus);
    osc.start(t);
    osc.stop(t + 0.24);
  }

  function playBrush(t, vol = 0.05) {
    const src = ctx.createBufferSource();
    src.buffer = noiseBuffer(0.08);
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 2400;
    filter.Q.value = 0.5;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(vol, t + 0.006);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.14);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(grooveBus);
    src.start(t);
    src.stop(t + 0.16);
  }

  function playHat(t, vol = 0.022, open = false) {
    const src = ctx.createBufferSource();
    src.buffer = noiseBuffer(0.05);
    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 5200;
    const gain = ctx.createGain();
    const dur = open ? 0.12 : 0.028;
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(vol, t + 0.004);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(grooveBus);
    src.start(t);
    src.stop(t + dur + 0.02);
  }

  function playBass(freq, t, dur = 0.55, vol = 0.09) {
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, t);
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 280;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(vol, t + 0.04);
    gain.gain.setValueAtTime(vol * 0.7, t + dur * 0.75);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(grooveBus);
    osc.start(t);
    osc.stop(t + dur + 0.08);
  }

  function playGuitarStrum(chord, t, vol = 0.055) {
    (chord.plucks || []).forEach((f, i) => {
      playPluck(f, t + i * 0.018, 0.42, vol * (1 - i * 0.12), 'nylon');
    });
  }

  function playPluck(freq, t, dur = 0.38, vol = 0.07, tone = 'nylon') {
    const osc = ctx.createOscillator();
    osc.type = tone === 'nylon' ? 'sine' : 'triangle';
    osc.frequency.setValueAtTime(freq, t);
    if (tone === 'nylon') {
      osc.frequency.exponentialRampToValueAtTime(freq * 0.992, t + dur * 0.6);
    }
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = tone === 'nylon' ? 1400 : 1800;
    filter.Q.value = 0.6;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(vol, t + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(grooveBus);
    osc.start(t);
    osc.stop(t + dur + 0.05);
  }

  function playLazyLead(t, vol = 0.05) {
    const note = MELODY[melodyIdx.i % MELODY.length];
    melodyIdx.i += 1;
    playPluck(note, t, 0.55, vol, 'nylon');
    if (Math.random() < 0.35) {
      playPluck(note * 1.5, t + BEAT_SEC * 0.5, 0.35, vol * 0.45, 'nylon');
    }
  }

  function playWhistle(freq, duration = 1.4, volume = 0.12) {
    playPluck(freq, ctx.currentTime, duration * 0.6, volume * 0.85);
  }

  function locGrooveMix(locId) {
    const table = {
      house: { vol: 0.22, pan: -0.35, waves: 0.9 },
      yard: { vol: 0.28, pan: -0.22, waves: 1 },
      street: { vol: 0.36, pan: -0.06, waves: 1 },
      pch: { vol: 0.3, pan: 0.14, waves: 1.15 },
      pacCity: { vol: 0.32, pan: 0.28, waves: 1.25 },
      park: { vol: 0.26, pan: 0.42, waves: 1.35 },
    };
    return table[locId] || table.yard;
  }

  function applyGrooveMix(locId) {
    if (!ctx || !grooveBus || !groovePanner) return;
    const mix = locGrooveMix(locId);
    grooveBus.gain.setTargetAtTime(mix.vol, ctx.currentTime, 0.8);
    groovePanner.pan.setTargetAtTime(mix.pan, ctx.currentTime, 0.9);
    if (waveSource?.gain) {
      waveSource.gain.gain.setTargetAtTime(0.078 * (mix.waves || 1), ctx.currentTime, 1.2);
    }
  }

  function scheduleBeat(beat, t) {
    const barBeat = beat % 4;
    const bar = Math.floor(beat / 4) % CHORDS.length;
    const chord = CHORDS[bar];

    if (barBeat === 0) playSoftKick(t, 0.12);
    if (barBeat === 2) playBrush(t, 0.04);
    if (barBeat === 1 || barBeat === 3) playHat(t + BEAT_SEC * 0.5, 0.016);

    if (barBeat === 0) {
      playBass(chord.root, t, BEAT_SEC * 3.6, 0.08);
      playGuitarStrum(chord, t + BEAT_SEC * 0.08, 0.05);
    }
    if (barBeat === 2) {
      playGuitarStrum(chord, t + BEAT_SEC * 0.12, 0.042);
    }

    if (barBeat === 1 && beat % 8 === 1) {
      playPluck(chord.third * 2, t + BEAT_SEC * 0.2, 0.48, 0.04, 'nylon');
    }
    if (barBeat === 3 && beat % 8 === 7) {
      playLazyLead(t + BEAT_SEC * 0.15, 0.042);
    }
  }

  function grooveScheduler() {
    if (!enabled || !unlocked || !ctx) return;
    const horizon = 0.14;
    while (nextBeatTime < ctx.currentTime + horizon) {
      scheduleBeat(beatIdx, nextBeatTime);
      nextBeatTime += BEAT_SEC;
      beatIdx += 1;
    }
  }

  function startGroove() {
    if (grooveTimer || !ctx) return;
    nextBeatTime = ctx.currentTime + 0.08;
    beatIdx = 0;
    grooveTimer = setInterval(grooveScheduler, 30);
    grooveScheduler();
  }

  function stopGroove() {
    if (grooveTimer) {
      clearInterval(grooveTimer);
      grooveTimer = null;
    }
  }

  function stopLocAmbience() {
    if (!locAmbience) return;
    try {
      locAmbience.nodes.forEach((n) => {
        try { n.stop?.(); n.disconnect?.(); } catch { /* noop */ }
      });
    } catch { /* noop */ }
    if (locAmbience.timer) clearInterval(locAmbience.timer);
    locAmbience = null;
    currentLocAmb = '';
  }

  function setLocationAmbience(locId, roomId) {
    const key = `${locId}-${roomId || ''}`;
    if (!ctx || !enabled || !unlocked) return;
    if (locId !== currentLocId) {
      currentLocId = locId;
      applyGrooveMix(locId);
    }
    if (key === currentLocAmb) return;
    stopLocAmbience();
    currentLocAmb = key;
    const nodes = [];
    const t = ctx.currentTime;

    function loopNoise(vol, freq, type = 'lowpass') {
      const src = ctx.createBufferSource();
      src.buffer = noiseBuffer(2);
      src.loop = true;
      const filter = ctx.createBiquadFilter();
      filter.type = type;
      filter.frequency.value = freq;
      const gain = ctx.createGain();
      gain.gain.value = vol;
      src.connect(filter);
      filter.connect(gain);
      gain.connect(ambientBus);
      src.start(t);
      nodes.push(src);
      return { src, gain };
    }

    let timer = null;
    if (locId === 'yard' || locId === 'house') {
      loopNoise(0.008, 2200, 'bandpass');
    } else if (locId === 'street') {
      loopNoise(0.01, 520, 'lowpass');
    } else if (locId === 'house' && roomId === 'kitchen') {
      loopNoise(0.008, 140, 'lowpass');
    } else if (locId === 'pch' || locId === 'pacCity' || locId === 'park') {
      loopNoise(0.014, 380, 'bandpass');
      timer = setInterval(() => {
        if (!enabled || !unlocked) return;
        playPluck(329.63 + Math.random() * 60, ctx.currentTime, 0.5, 0.028, 'nylon');
      }, 14000 + Math.random() * 8000);
      nodes.push({ stop: () => clearInterval(timer) });
    }

    locAmbience = { nodes, timer };
  }

  function startAmbient() {
    if (!ctx || !enabled || ambientRunning) return;
    startWind();
    startWaves();
    startPad();
    startGroove();
    ambientRunning = true;
  }

  function stopAmbient() {
    stopGroove();
    stopLocAmbience();
    if (windSource) {
      try {
        windSource.src.stop();
        windSource.lfo.stop();
      } catch { /* already stopped */ }
      windSource = null;
    }
    if (waveSource) {
      try {
        waveSource.src.stop();
        waveSource.lfo.stop();
        waveSource.lfo2.stop();
      } catch { /* already stopped */ }
      waveSource = null;
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
      setTimeout(() => tone(f, 'triangle', 0.5, baseVol - i * 0.02), i * 80);
    });
  }

  function playSfx(name) {
    if (!enabled || !unlocked) return;
    switch (name) {
      case 'star':
        chime([523.25, 659.25, 783.99], 0.13);
        break;
      case 'eat':
        playPluck(440, ctx.currentTime, 0.18, 0.11);
        setTimeout(() => playPluck(554.37, ctx.currentTime, 0.22, 0.09), 70);
        break;
      case 'chore':
        playPluck(392, ctx.currentTime, 0.2, 0.06, 'nylon');
        setTimeout(() => chime([493.88, 587.33], 0.08), 120);
        break;
      case 'jump':
        tone(180, 'sine', 0.18, 0.07);
        break;
      case 'step':
        tone(90 + Math.random() * 20, 'sine', 0.06, 0.025);
        break;
      case 'stepWood':
        tone(110 + Math.random() * 15, 'triangle', 0.05, 0.022);
        break;
      case 'stepTile':
        tone(220 + Math.random() * 30, 'sine', 0.04, 0.018);
        break;
      case 'stepGrass':
        tone(70 + Math.random() * 20, 'sine', 0.07, 0.02);
        break;
      case 'stepPavement':
        playHat(ctx.currentTime, 0.03);
        break;
      case 'phaseShift':
        chime([392, 493.88, 587.33], 0.1);
        setTimeout(() => playPluck(659.25, ctx.currentTime, 0.55, 0.08), 180);
        break;
      case 'ui':
        playPluck(660, ctx.currentTime, 0.1, 0.06);
        break;
      case 'chat':
        playPluck(MELODY[Math.floor(Math.random() * 4)], ctx.currentTime, 0.4, 0.07);
        break;
      case 'dayWin':
        chime([293.66, 369.99, 440, 587.33], 0.14);
        setTimeout(() => playPluck(659.25, ctx.currentTime, 0.7, 0.1), 350);
        setTimeout(() => playBrush(ctx.currentTime), 480);
        break;
      case 'dayFail':
        tone(220, 'sine', 0.5, 0.09);
        setTimeout(() => tone(164.81, 'triangle', 0.7, 0.07), 200);
        break;
      case 'warn':
        tone(277.18, 'triangle', 0.2, 0.07);
        break;
      case 'travel':
        playPluck(440, ctx.currentTime, 0.35, 0.05, 'nylon');
        setTimeout(() => chime([523.25, 659.25], 0.08), 140);
        break;
      case 'combo':
        chime([523.25, 659.25, 783.99, 987.77], 0.15);
        break;
      case 'shiftStart':
        playPluck(523.25, ctx.currentTime, 0.3, 0.07, 'nylon');
        setTimeout(() => playBrush(ctx.currentTime), 80);
        break;
      case 'shiftPerfect':
        chime([587.33, 739.99, 880], 0.15);
        setTimeout(() => playPluck(880, ctx.currentTime, 0.6, 0.11), 180);
        break;
      case 'levelUp':
        chime([329.63, 392, 493.88, 659.25], 0.14);
        setTimeout(() => chime([523.25, 659.25, 783.99], 0.12), 320);
        break;
      case 'sparkle':
        playPluck(880 + Math.random() * 200, ctx.currentTime, 0.14, 0.06);
        break;
      default:
        break;
    }
  }

  function maybeStep(isMoving, surface) {
    if (!isMoving || !enabled || !unlocked) return;
    const now = Date.now();
    const gap = surface === 'grass' ? 380 : 320;
    if (now - lastStep < gap) return;
    lastStep = now;
    const map = { wood: 'stepWood', tile: 'stepTile', grass: 'stepGrass', pavement: 'stepPavement', sand: 'stepGrass' };
    playSfx(map[surface] || 'step');
  }

  function playPhaseTransition() {
    playSfx('phaseShift');
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
    playPhaseTransition,
    setLocationAmbience,
    isEnabled: () => enabled,
  };
})();