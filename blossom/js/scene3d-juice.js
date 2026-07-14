/** 3D juice — dust, sparkles, seagulls, sun corona, breeze, travel swoop */
window.BlossomScene3DJuice = (function () {
  const T = window.THREE;
  if (!T) return {};

  let dustPts = null;
  let dustGeo = null;
  let sparklePts = null;
  let sparkleGeo = null;
  let breezePts = null;
  let breezeGeo = null;
  let seagulls = [];
  let sunGroup = null;
  let sunMesh = null;
  let godRays = null;
  let travelSwoop = 0;

  const DUST_MAX = 140;
  const SPARKLE_MAX = 60;
  const dustPool = [];
  const sparklePool = [];
  let dustIdx = 0;
  let sparkleIdx = 0;

  function init(scene) {
    dustGeo = new T.BufferGeometry();
    const pos = new Float32Array(DUST_MAX * 3);
    const col = new Float32Array(DUST_MAX * 3);
    dustGeo.setAttribute('position', new T.BufferAttribute(pos, 3));
    dustGeo.setAttribute('color', new T.BufferAttribute(col, 3));
    dustPts = new T.Points(
      dustGeo,
      new T.PointsMaterial({
        size: 0.28,
        vertexColors: true,
        transparent: true,
        opacity: 0.55,
        depthWrite: false,
        blending: T.AdditiveBlending,
        sizeAttenuation: true,
      })
    );
    dustPts.frustumCulled = false;
    scene.add(dustPts);

    sparkleGeo = new T.BufferGeometry();
    const sPos = new Float32Array(SPARKLE_MAX * 3);
    const sCol = new Float32Array(SPARKLE_MAX * 3);
    sparkleGeo.setAttribute('position', new T.BufferAttribute(sPos, 3));
    sparkleGeo.setAttribute('color', new T.BufferAttribute(sCol, 3));
    sparklePts = new T.Points(
      sparkleGeo,
      new T.PointsMaterial({
        size: 0.45,
        vertexColors: true,
        transparent: true,
        opacity: 0.5,
        depthWrite: false,
        blending: T.AdditiveBlending,
        sizeAttenuation: true,
      })
    );
    sparklePts.frustumCulled = false;
    scene.add(sparklePts);

    breezeGeo = new T.BufferGeometry();
    const bPos = new Float32Array(100 * 3);
    breezeGeo.setAttribute('position', new T.BufferAttribute(bPos, 3));
    breezePts = new T.Points(
      breezeGeo,
      new T.PointsMaterial({
        size: 0.1,
        color: 0xffffff,
        transparent: true,
        opacity: 0.42,
        depthWrite: false,
        blending: T.AdditiveBlending,
      })
    );
    breezePts.frustumCulled = false;
    scene.add(breezePts);

    sunGroup = new T.Group();
    sunGroup.name = 'hbSunGroup';
    sunGroup.position.set(55, 42, -80);

    const core = new T.Mesh(
      new T.SphereGeometry(7, 24, 24),
      new T.MeshBasicMaterial({ color: 0xfff8e7, transparent: true, opacity: 0.92 })
    );
    sunGroup.add(core);
    sunMesh = core;

    const glow = new T.Mesh(
      new T.SphereGeometry(9, 24, 24),
      new T.MeshBasicMaterial({ color: 0xffe4a8, transparent: true, opacity: 0.22, depthWrite: false })
    );
    sunGroup.add(glow);

    scene.add(sunGroup);

    godRays = new T.Group();
    godRays.name = 'hbGodRays';
    godRays.visible = false;
    scene.add(godRays);

    for (let i = 0; i < 8; i++) {
      const g = new T.Group();
      const body = new T.Mesh(
        new T.ConeGeometry(0.18, 0.55, 4),
        new T.MeshBasicMaterial({ color: 0xf8fafc })
      );
      body.rotation.x = Math.PI / 2;
      g.add(body);
      const wingL = new T.Mesh(new T.PlaneGeometry(1.1, 0.28), new T.MeshBasicMaterial({
        color: 0xe2e8f0, side: T.DoubleSide, transparent: true, opacity: 0.9,
      }));
      wingL.position.set(-0.5, 0, 0);
      g.add(wingL);
      const wingR = wingL.clone();
      wingR.position.x = 0.5;
      g.add(wingR);
      g.userData = {
        phase: Math.random() * Math.PI * 2,
        speed: 0.14 + Math.random() * 0.14,
        radius: 28 + Math.random() * 40,
        height: 16 + Math.random() * 12,
        cx: (Math.random() - 0.5) * 60,
        cz: -25 - Math.random() * 40,
        wingL,
        wingR,
      };
      scene.add(g);
      seagulls.push(g);
    }

    for (let i = 0; i < SPARKLE_MAX; i++) {
      sparklePool[i] = {
        x: (Math.random() - 0.5) * 120,
        y: 0.15,
        z: -40 - Math.random() * 60,
        life: Math.random(),
        phase: Math.random() * Math.PI * 2,
        spd: 0.3 + Math.random() * 0.5,
      };
    }
  }

  function spawnDust(wx, wz, running, surface) {
    const n = running ? 2 : 1;
    const sand = surface === 'grass' || surface === 'wood' || surface === 'sand';
    const col = sand ? [0.68, 0.52, 0.34] : [0.5, 0.54, 0.58];
    const spread = running ? 0.55 : 0.35;
    for (let i = 0; i < n; i++) {
      const slot = dustIdx % DUST_MAX;
      dustIdx += 1;
      dustPool[slot] = {
        x: wx + (Math.random() - 0.5) * spread,
        y: 0.08 + Math.random() * 0.05,
        z: wz + (Math.random() - 0.5) * spread,
        vx: (Math.random() - 0.5) * 0.04,
        vy: -0.01 - Math.random() * 0.02,
        vz: (Math.random() - 0.5) * 0.04,
        life: running ? 0.55 : 0.75,
        col,
      };
    }
  }

  function updateDust(dt) {
    if (!dustGeo) return;
    const pos = dustGeo.attributes.position.array;
    const col = dustGeo.attributes.color.array;
    for (let i = 0; i < DUST_MAX; i++) {
      const p = dustPool[i];
      if (!p || p.life <= 0) {
        pos[i * 3 + 1] = -999;
        continue;
      }
      p.life -= dt * 2.4;
      p.x += p.vx;
      p.y += p.vy;
      p.z += p.vz;
      p.vy *= 0.9;
      pos[i * 3] = p.x;
      pos[i * 3 + 1] = p.y;
      pos[i * 3 + 2] = p.z;
      const a = Math.max(0, p.life);
      col[i * 3] = p.col[0] * a;
      col[i * 3 + 1] = p.col[1] * a;
      col[i * 3 + 2] = p.col[2] * a;
    }
    dustGeo.attributes.position.needsUpdate = true;
    dustGeo.attributes.color.needsUpdate = true;
  }

  function updateSparkles(t, locId) {
    if (!sparkleGeo) return;
    const show = locId !== 'house';
    sparklePts.visible = false;
    if (!show) return;
    const pos = sparkleGeo.attributes.position.array;
    const col = sparkleGeo.attributes.color.array;
    for (let i = 0; i < SPARKLE_MAX; i++) {
      const p = sparklePool[i];
      p.life += 0.016 * p.spd;
      if (p.life > 1) {
        p.life = 0;
        p.x = (Math.random() - 0.5) * 140;
        p.z = -30 - Math.random() * 80;
      }
      const shimmer = 0.5 + Math.sin(t * 6 + p.phase) * 0.5;
      pos[i * 3] = p.x + Math.sin(t * 0.3 + p.phase) * 2;
      pos[i * 3 + 1] = 0.2 + shimmer * 0.4;
      pos[i * 3 + 2] = p.z;
      col[i * 3] = 0.6 + shimmer * 0.4;
      col[i * 3 + 1] = 0.85 + shimmer * 0.15;
      col[i * 3 + 2] = 1;
    }
    sparkleGeo.attributes.position.needsUpdate = true;
    sparkleGeo.attributes.color.needsUpdate = true;
  }

  function updateBreeze(t, locId) {
    if (!breezeGeo || locId === 'house') {
      if (breezePts) breezePts.visible = false;
      return;
    }
    breezePts.visible = true;
    const pos = breezeGeo.attributes.position.array;
    for (let i = 0; i < 100; i++) {
      const ph = i * 0.65 + t * 0.45;
      pos[i * 3] = Math.sin(ph) * 55 + Math.cos(ph * 0.28) * 14;
      pos[i * 3 + 1] = 1.8 + (i % 10) * 0.45 + Math.sin(t * 1.2 + i) * 0.35;
      pos[i * 3 + 2] = -18 + (i % 25) * 2.8 + Math.cos(ph * 0.45) * 10;
    }
    breezeGeo.attributes.position.needsUpdate = true;
  }

  function updateSeagulls(t) {
    seagulls.forEach((g) => {
      const d = g.userData;
      const ang = t * d.speed + d.phase;
      g.position.set(
        d.cx + Math.cos(ang) * d.radius,
        d.height + Math.sin(ang * 2) * 2,
        d.cz + Math.sin(ang) * d.radius * 0.45
      );
      g.rotation.y = ang + Math.PI / 2;
      const flap = Math.sin(t * 9 + d.phase) * 0.55;
      d.wingL.rotation.z = flap;
      d.wingR.rotation.z = -flap;
    });
  }

  function updateSun(phaseId, t) {
    if (!sunGroup) return;
    const table = {
      morning: { op: 0.75, y: 38, scale: 1, rays: 0.85 },
      afternoon: { op: 0.92, y: 48, scale: 1.08, rays: 1 },
      evening: { op: 0.55, y: 22, scale: 0.95, rays: 0.65 },
      night: { op: 0.06, y: 30, scale: 0.7, rays: 0.05 },
    };
    const p = table[phaseId] || table.morning;
    sunMesh.material.opacity = p.op;
    sunGroup.position.y = p.y + Math.sin(t * 0.15) * 0.5;
    const pulse = 1 + Math.sin(t * 0.8) * 0.04;
    sunGroup.scale.setScalar(p.scale * pulse);
    sunGroup.children.forEach((c, i) => {
      if (i > 0 && c.material) {
        c.material.opacity = (i === 1 ? 0.35 : i === 2 ? 0.18 : 0.12) * (p.op / 0.75);
        if (i > 2) c.rotation.z = (i - 3) / 8 * Math.PI + t * 0.02;
      }
    });
    if (godRays) {
      godRays.position.copy(sunGroup.position);
      godRays.visible = p.rays > 0.1;
      godRays.rotation.y = t * 0.04;
      godRays.children.forEach((ray, i) => {
        if (ray.material) {
          ray.material.opacity = (0.07 - i * 0.008) * p.rays * (0.85 + Math.sin(t * 1.5 + i) * 0.15);
        }
      });
    }
  }

  function triggerTravelSwoop() {
    travelSwoop = 1;
  }

  function travelSwoopOffset() {
    if (travelSwoop <= 0) return { h: 0, dist: 0 };
    travelSwoop = Math.max(0, travelSwoop - 0.028);
    const t = travelSwoop;
    return { h: t * 12, dist: -t * 6 };
  }

  function drawVignette() {
    /* crisp — no edge darkening overlay */
  }

  function update(opts) {
    const { dt, t, player, moving, running, locId, phaseId, surface } = opts;
    if (moving && player?.wx != null) {
      spawnDust(player.wx, player.wz, running, surface);
    }
    updateDust(dt || 0.016);
    updateSparkles(t, locId);
    updateBreeze(t, locId);
    updateSeagulls(t);
    updateSun(phaseId, t);
  }

  return {
    init, update, triggerTravelSwoop, travelSwoopOffset, drawVignette,
  };
})();