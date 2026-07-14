/** Huntington Beach Main Street — shared 3D environment kit */
window.BlossomHBEnv = (function () {
  const T = window.THREE;
  if (!T) return {};

  const P = {
    ocean: 0x0077be,
    oceanDeep: 0x005a8f,
    sky: 0x5eb8e8,
    sand: 0xf0d78c,
    sandDeep: 0xe4c76b,
    walk: 0xc5c9d0,
    walkEdge: 0x6b7280,
    walkCurb: 0x9ca3af,
    mcRoof: 0x64748b,
    pch: 0x3f3f46,
    pchLine: 0xfacc15,
    shiplap: 0xf8fafc,
    stucco: 0xfef9ee,
    trimBlue: 0x1d4ed8,
    trimOrange: 0xea580c,
    terracotta: 0xb45309,
    palm: 0x166534,
    trunk: 0x92400e,
    pier: 0x9a7b4f,
    glow: 0xfff7ed,
    hbYellow: 0xfde047,
  };

  function mat(color, opts) {
    const m = new T.MeshLambertMaterial({
      color,
      emissive: opts?.emissive || 0x000000,
      emissiveIntensity: opts?.emi ?? 0,
      transparent: opts?.transparent || false,
      opacity: opts?.opacity ?? 1,
      map: opts?.map || null,
    });
    return m;
  }

  function wowNameplate(text, _color, scale) {
    const pr = 2;
    const label = (text || '').slice(0, 42);
    const c = document.createElement('canvas');
    c.width = 512 * pr;
    c.height = 48 * pr;
    const ctx = c.getContext('2d');
    ctx.scale(pr, pr);
    ctx.font = '600 17px Nunito, system-ui, sans-serif';
    const tw = ctx.measureText(label).width;
    const pw = Math.min(480, tw + 28);
    const px = (512 - pw) / 2;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.94)';
    ctx.beginPath();
    const r = 10;
    const py = 6;
    const ph = 34;
    ctx.moveTo(px + r, py);
    ctx.arcTo(px + pw, py, px + pw, py + ph, r);
    ctx.arcTo(px + pw, py + ph, px, py + ph, r);
    ctx.arcTo(px, py + ph, px, py, r);
    ctx.arcTo(px, py, px + pw, py, r);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(15, 23, 42, 0.12)';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fillStyle = '#1e293b';
    ctx.textAlign = 'center';
    ctx.fillText(label, 256, 28);
    const tex = new T.CanvasTexture(c);
    tex.colorSpace = T.SRGBColorSpace;
    tex.minFilter = T.LinearFilter;
    tex.magFilter = T.LinearFilter;
    tex.generateMipmaps = false;
    const sp = new T.Sprite(new T.SpriteMaterial({ map: tex, transparent: true, depthTest: true }));
    sp.scale.set(scale || 3.2, 0.72, 1);
    sp.renderOrder = 12;
    return sp;
  }

  function mesh(geo, color, opts) {
    const m = new T.Mesh(geo, mat(color, opts));
    m.castShadow = true;
    m.receiveShadow = true;
    return m;
  }

  function box(w, h, d, color, opts) {
    return mesh(new T.BoxGeometry(w, h, d), color, opts);
  }

  function cyl(rt, rb, h, color, seg, opts) {
    return mesh(new T.CylinderGeometry(rt, rb, h, seg || 12), color, opts);
  }

  function place(obj, x, y, z) {
    obj.position.set(x, y, z);
    return obj;
  }

  function canvasTex(w, h, draw) {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    const ctx = c.getContext('2d');
    draw(ctx, w, h);
    const tex = new T.CanvasTexture(c);
    tex.wrapS = tex.wrapT = T.RepeatWrapping;
    tex.colorSpace = T.SRGBColorSpace;
    tex.minFilter = T.LinearMipmapLinearFilter;
    tex.magFilter = T.LinearFilter;
    tex.anisotropy = 8;
    tex.needsUpdate = true;
    return tex;
  }

  function texSand() {
    return canvasTex(512, 512, (ctx, w, h) => {
      ctx.fillStyle = '#f0d78c';
      ctx.fillRect(0, 0, w, h);
      for (let i = 0; i < 2200; i++) {
        const g = 205 + Math.random() * 42;
        ctx.fillStyle = `rgb(${g},${g - 22},${g - 58})`;
        ctx.fillRect(Math.random() * w, Math.random() * h, 1 + Math.random() * 2, 1 + Math.random() * 2);
      }
      for (let i = 0; i < 80; i++) {
        ctx.fillStyle = `rgba(255,255,255,${0.08 + Math.random() * 0.12})`;
        ctx.fillRect(Math.random() * w, Math.random() * h, 3, 1);
      }
    });
  }

  function texSidewalk() {
    const slab = 16;
    return canvasTex(128, 128, (ctx, w, h) => {
      ctx.fillStyle = '#b8bcc4';
      ctx.fillRect(0, 0, w, h);
      for (let y = 0; y < h; y += slab) {
        for (let x = 0; x < w; x += slab) {
          const v = ((x / slab) + (y / slab)) % 2 === 0 ? 6 : 0;
          ctx.fillStyle = `rgb(${197 + v},${201 + v},${208 + v})`;
          ctx.fillRect(x + 1, y + 1, slab - 2, slab - 2);
        }
      }
      ctx.strokeStyle = 'rgba(71,85,105,0.4)';
      ctx.lineWidth = 1;
      for (let x = 0; x <= w; x += slab) {
        ctx.beginPath();
        ctx.moveTo(x + 0.5, 0);
        ctx.lineTo(x + 0.5, h);
        ctx.stroke();
      }
      for (let y = 0; y <= h; y += slab) {
        ctx.beginPath();
        ctx.moveTo(0, y + 0.5);
        ctx.lineTo(w, y + 0.5);
        ctx.stroke();
      }
    });
  }

  function texPCH() {
    return canvasTex(256, 128, (ctx, w, h) => {
      ctx.fillStyle = '#3f3f46';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#facc15';
      const cy = h / 2;
      ctx.fillRect(0, cy - 5, w, 3);
      ctx.fillRect(0, cy + 2, w, 3);
      for (let x = 0; x < w; x += 28) {
        ctx.fillStyle = 'rgba(255,255,255,0.55)';
        ctx.fillRect(x, cy - 1, 10, 2);
      }
    });
  }

  function labelSprite(text, color, scale) {
    return wowNameplate(text, color, Math.min(3.6, (scale || 4) * 0.42));
  }

  function skyGradient(phaseId) {
    const phases = {
      morning: { top: '#4a9fd4', mid: '#87ceeb', low: '#f5e6c8' },
      afternoon: { top: '#3d8cc4', mid: '#6eb5e0', low: '#e8d4a8' },
      evening: { top: '#c45c26', mid: '#e88b4a', low: '#4a3058' },
      night: { top: '#1a2840', mid: '#2a3a5c', low: '#0c1020' },
    };
    const p = phases[phaseId] || phases.morning;
    return canvasTex(4, 512, (ctx, w, h) => {
      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, p.top);
      g.addColorStop(0.45, p.mid);
      g.addColorStop(1, p.low);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
    });
  }

  function addOcean(root, gw, z) {
    const ocean = mesh(
      new T.PlaneGeometry(gw * 1.8, 72),
      P.ocean,
      { emissive: 0x003d66, emi: 0.08 }
    );
    ocean.rotation.x = -Math.PI / 2;
    ocean.position.set(0, -0.08, z);
    ocean.name = 'hbOcean';
    root.add(ocean);
    const deep = mesh(new T.PlaneGeometry(gw * 1.6, 40), P.oceanDeep, { rough: 0.08, metal: 0.4, transparent: true, opacity: 0.5 });
    deep.rotation.x = -Math.PI / 2;
    deep.position.set(0, -0.12, z - 18);
    root.add(deep);
    const foam = mesh(new T.PlaneGeometry(gw * 1.4, 8), 0xffffff, { emissive: 0xffffff, emi: 0.25, transparent: true, opacity: 0.42, rough: 0.15 });
    foam.rotation.x = -Math.PI / 2;
    foam.position.set(0, 0.03, z + 34);
    root.add(foam);
    return ocean;
  }

  function addPalm(root, scale, x, z) {
    const g = new T.Group();
    const s = scale || 1;
    const trunk = cyl(0.22 * s, 0.3 * s, 5.5 * s, P.trunk, 10);
    trunk.position.y = 2.75 * s;
    g.add(trunk);
    for (let i = 0; i < 7; i++) {
      const frond = mesh(new T.ConeGeometry(0.2 * s, 3.6 * s, 10), P.palm, { rough: 0.72 });
      frond.position.y = 5.2 * s;
      frond.rotation.z = (i / 7) * Math.PI * 2;
      frond.rotation.x = 0.5 + (i % 2) * 0.08;
      g.add(frond);
    }
    g.position.set(x, 0, z);
    root.add(g);
  }

  function addStreetLamp(root, x, z) {
    const g = new T.Group();
    g.add(place(cyl(0.1, 0.12, 4.2, 0x52525b), 0, 2.1, 0));
    const arm = box(1.2, 0.12, 0.12, 0x52525b);
    arm.position.set(0.5, 4.1, 0);
    g.add(arm);
    const bulb = mesh(new T.SphereGeometry(0.22, 10, 10), P.hbYellow, { emissive: 0xfbbf24, emi: 0.85, rough: 0.3 });
    bulb.position.set(1.05, 4, 0);
    g.add(bulb);
    const light = new T.PointLight(0xffe4a8, 0.9, 18);
    light.position.set(1.05, 4, 0);
    g.add(light);
    g.position.set(x, 0, z);
    root.add(g);
  }

  function addSurfboard(root, x, z, rot, color) {
    const board = box(0.14, 2.4, 0.62, color || P.trimOrange);
    board.position.set(x, 1.2, z);
    board.rotation.z = rot || 0.3;
    root.add(board);
  }

  function addStringLights(root, x0, x1, z, y) {
    const span = x1 - x0;
    const segs = 8;
    for (let i = 0; i <= segs; i++) {
      const t = i / segs;
      const x = x0 + span * t;
      const sag = Math.sin(t * Math.PI) * 0.6;
      if (i > 0) {
        const wire = mesh(new T.CylinderGeometry(0.02, 0.02, span / segs + 0.2, 4), 0x1e293b);
        wire.position.set(x - span / segs / 2, y - sag / 2, z);
        wire.rotation.z = Math.PI / 2;
        root.add(wire);
      }
      const bulb = mesh(new T.SphereGeometry(0.12, 8, 8), P.hbYellow, { emissive: 0xfbbf24, emi: 0.7 });
      bulb.position.set(x, y - sag, z);
      root.add(bulb);
    }
  }

  function pchLayer(root, gw, z) {
    const t = texPCH();
    t.repeat.set(gw / 18, 1);
    const road = mesh(new T.PlaneGeometry(gw, 20), P.pch, { map: t, rough: 0.45, metal: 0.15 });
    road.rotation.x = -Math.PI / 2;
    road.position.set(0, 0.025, z);
    root.add(road);
  }

  function sidewalkLayer(root, gw, z, depth) {
    const d = depth || 12;
    const t = texSidewalk();
    t.repeat.set(Math.max(2, gw / 8), Math.max(2, d / 8));
    const walk = mesh(new T.PlaneGeometry(gw, d), P.walk, { map: t });
    walk.rotation.x = -Math.PI / 2;
    walk.position.set(0, 0.045, z);
    root.add(walk);
    const curbH = 0.32;
    const curbW = 0.45;
    [-d / 2 + curbW / 2, d / 2 - curbW / 2].forEach((off) => {
      const curb = box(gw + 0.8, curbH, curbW, P.walkCurb);
      curb.position.set(0, curbH / 2, z + off);
      root.add(curb);
    });
  }

  /** Flat-roof Minecraft-style block building */
  function mcBuilding(root, x, z, w, h, d, wallCol, roofCol) {
    const body = box(w, h, d, wallCol);
    body.position.set(x, h / 2, z);
    root.add(body);
    const roof = box(w + 0.35, 0.55, d + 0.35, roofCol || P.mcRoof);
    roof.position.set(x, h + 0.28, z);
    root.add(roof);
    return body;
  }

  function mcShopFace(root, x, z, w, h, d, wallCol, trimCol) {
    mcBuilding(root, x, z, w, h, d, wallCol, trimCol || P.mcRoof);
    const win = box(Math.min(2.8, w * 0.38), 1.8, 0.45, 0x334155);
    win.position.set(x - w * 0.18, h * 0.58, z + d / 2 + 0.23);
    root.add(win);
    const door = box(1.5, 2.6, 0.45, 0x5c4033);
    door.position.set(x + w * 0.22, 1.3, z + d / 2 + 0.23);
    root.add(door);
    const awning = box(w + 0.5, 0.45, 1.2, trimCol || P.hbYellow);
    awning.position.set(x, h - 0.15, z + d / 2 + 0.65);
    root.add(awning);
  }

  function sandLayer(root, gw, z, depth) {
    const t = texSand();
    t.repeat.set(gw / 20, (depth || 14) / 20);
    const sand = mesh(new T.PlaneGeometry(gw, depth || 14), P.sand, { map: t, rough: 0.96 });
    sand.rotation.x = -Math.PI / 2;
    sand.position.set(0, 0.015, z);
    root.add(sand);
  }

  function addHBArch(root, x, z) {
    const arch = mesh(new T.TorusGeometry(5.5, 0.45, 10, 24, Math.PI), P.trimBlue, { rough: 0.5 });
    arch.rotation.x = Math.PI / 2;
    arch.rotation.z = Math.PI / 2;
    arch.position.set(x, 5.5, z);
    root.add(arch);
    const pL = cyl(0.5, 0.55, 5.5, P.stucco);
    pL.position.set(x - 5.2, 2.75, z);
    root.add(pL);
    const pR = pL.clone();
    pR.position.x = x + 5.2;
    root.add(pR);

  }

  function addBench(root, x, z) {
    const seat = box(2.4, 0.2, 0.9, P.pier);
    seat.position.set(x, 0.65, z);
    root.add(seat);
    [-0.9, 0.9].forEach((dx) => {
      const leg = box(0.15, 0.65, 0.15, 0x52525b);
      leg.position.set(x + dx, 0.32, z);
      root.add(leg);
    });
  }

  /** Main Street HB — hero strip used as DNA for outdoor zones */
  /** PCH connector — Main Street & PCH arch, surf museum */
  function buildPCHStrip(root, gw, gd) {
    sidewalkLayer(root, gw * 0.7, -6, 14);
    pchLayer(root, gw, 18);
    sidewalkLayer(root, gw * 0.55, 10, 12);

    root.add(place(wowNameplate('PACIFIC COAST HIGHWAY', '#fff568', 9), 0, 11, -22));
    addHBArch(root, -gw * 0.28, -4);
    root.add(place(wowNameplate('Main St & PCH', '#fff568', 5), -gw * 0.28, 10, -2));

    mcShopFace(root, -gw * 0.36, -12, 14, 5, 10, 0xfef3c7, 0xca8a04);
    root.add(place(wowNameplate('International Surfing Museum', '#1e293b', 4.2), -gw * 0.36, 7.5, -6));

    [-gw * 0.2, 0, gw * 0.22].forEach((px, i) => {
      addPalm(root, 0.9 + (i % 2) * 0.15, px, -10 - (i % 2));
      if (i % 2 === 0) addStreetLamp(root, px, 8);
    });
    [-gw * 0.15, gw * 0.18].forEach((bx) => addBench(root, bx, 12));
    root.add(place(wowNameplate('→ Pacific City', '#86efac', 5), gw * 0.32, 6, 8));
  }

  /** Pacific City HB — boardwalk, shops, City Beach, Strand */
  function buildPacificCityStrip(root, gw, gd) {
    addOcean(root, gw * 1.15, -gd * 0.52);
    sandLayer(root, gw, -gd * 0.34, gd * 0.58);
    pchLayer(root, gw * 0.75, 20);
    sidewalkLayer(root, gw * 0.85, 6, 16);

    root.add(place(wowNameplate('PACIFIC CITY', '#fff568', 12), 0, 13, -30));
    root.add(place(wowNameplate('Huntington Beach', '#86efac', 7), 0, 8, -22));

    const archL = box(1.2, 5.5, 1.2, 0xf8fafc);
    archL.position.set(-6, 2.75, -8);
    root.add(archL);
    const archR = archL.clone();
    archR.position.x = 6;
    root.add(archR);
    const archTop = mesh(new T.TorusGeometry(6, 0.35, 8, 16, Math.PI), 0x1d4ed8);
    archTop.rotation.z = Math.PI / 2;
    archTop.position.set(0, 5.5, -8);
    root.add(archTop);

    const shopColors = [0xfef3c7, 0xd1fae5, 0xffedd5, 0xe0e7ff];
    const shopTrims = [0xca8a04, 0x059669, 0xea580c, 0x4f46e5];
    const shopNames = ['Plant Food & Wine', 'Mendocino Farms', 'Boots', 'SteelCraft'];
    [-gw * 0.38, -gw * 0.18, gw * 0.02, gw * 0.24].forEach((px, i) => {
      mcShopFace(root, px, -14, 10, 5, 6, shopColors[i], shopTrims[i]);
      root.add(place(wowNameplate(shopNames[i], '#1e293b', 3.6), px, 7.2, -10));
    });

    const strand = mesh(new T.PlaneGeometry(gw * 0.35, 8), 0xd4c4a8, { rough: 0.88 });
    strand.rotation.x = -Math.PI / 2;
    strand.position.set(-gw * 0.32, 0.06, 18);
    root.add(strand);
    root.add(place(wowNameplate('The Strand', '#fde047', 5), -gw * 0.32, 3, 18));

    [-gw * 0.32, -gw * 0.1, gw * 0.14, gw * 0.34, gw * 0.42].forEach((px, i) => {
      addPalm(root, 1.1 + (i % 2) * 0.2, px, -20 - (i % 3));
      if (i % 2 === 0) addStreetLamp(root, px + 3, 10);
    });

    mcBuilding(root, -gw * 0.04, 2, 2.8, 5.5, 2.8, 0xea580c, 0xffffff);
    root.add(place(wowNameplate('Lifeguard · City Beach', '#1e293b', 3.8), -gw * 0.04, 7.2, 2));

    mcBuilding(root, gw * 0.34, -10, 10, 5.5, 8, 0x1d4ed8, P.hbYellow);
    root.add(place(wowNameplate('US Open of Surfing', '#1e293b', 4), gw * 0.34, 7.5, -6));

    for (let i = 0; i < 4; i++) {
      const ring = cyl(0.55, 0.6, 0.35, 0x52525b);
      ring.position.set(gw * 0.26 + i * 5, 0.18, 22);
      root.add(ring);
      const log = box(1.8, 0.35, 0.7, 0x78350f);
      log.position.set(gw * 0.26 + i * 5, 0.5, 22);
      root.add(log);
    }
    root.add(place(wowNameplate('City Beach fire rings', '#fde047', 4.5), gw * 0.34, 3, 24));

    [-gw * 0.22, 0, gw * 0.22].forEach((bx) => addBench(root, bx, 14));
    addSurfboard(root, gw * 0.18, 14, 0.3, 0xf97316);
    addSurfboard(root, -gw * 0.24, 12, -0.2, 0x38bdf8);
    addSurfboard(root, gw * 0.08, 16, 0.15, 0x22c55e);
  }

  function buildMainStreetStrip(root, gw, gd, opts) {
    const hero = opts?.hero !== false;
    addOcean(root, gw, -gd * 0.52);
    sandLayer(root, gw, -gd * 0.28, 18);
    sidewalkLayer(root, gw, -4, 16);
    if (hero) {
      addHBArch(root, 0, -20);

      addStringLights(root, -gw * 0.42, gw * 0.42, -10, 7);
      [-gw * 0.38, gw * 0.38].forEach((fx) => {
        const flag = box(0.08, 3.5, 1.8, P.trimBlue, { rough: 0.5 });
        flag.position.set(fx, 1.75, -8);
        root.add(flag);
        const cloth = mesh(new T.PlaneGeometry(1.6, 1.1), P.hbYellow, { emissive: 0xfde047, emi: 0.2, rough: 0.6, transparent: true, opacity: 0.92 });
        cloth.position.set(fx + (fx < 0 ? -0.9 : 0.9), 2.8, -8);
        cloth.rotation.y = fx < 0 ? Math.PI / 2 : -Math.PI / 2;
        root.add(cloth);
      });
    }
    [-gw * 0.42, -gw * 0.2, 0, gw * 0.2, gw * 0.38].forEach((px, i) => {
      addPalm(root, 1.1 + (i % 2) * 0.25, px, -12 - (i % 3));
      if (i % 2 === 0) addStreetLamp(root, px + 4, 3);
    });
    pchLayer(root, gw, 20);
    sidewalkLayer(root, gw, 10, 12);
    [-gw * 0.35, -8, 14, gw * 0.3].forEach((bx) => addBench(root, bx, 8));
    addSurfboard(root, -gw * 0.32, 7, 0.4, 0xf97316);
    addSurfboard(root, gw * 0.22, 6, -0.25, 0x38bdf8);
    addSurfboard(root, gw * 0.35, 8, 0.15, 0x22c55e);
    addSurfboard(root, -gw * 0.15, 5, -0.1, 0xa855f7);
    const rack = box(2.5, 1.2, 0.4, 0x52525b);
    rack.position.set(gw * 0.28, 0.6, 6);
    root.add(rack);
  }

  function buildPierBeach(root, gw, gd) {
    const t = texSand();
    t.repeat.set(4, 4);
    const sand = mesh(new T.PlaneGeometry(gw, gd), P.sand, { map: t, rough: 0.95 });
    sand.rotation.x = -Math.PI / 2;
    root.add(sand);
    addOcean(root, gw, -gd * 0.48);

    const pierW = 13;
    const pierLen = 62;
    const pierDeck = mesh(new T.PlaneGeometry(pierW, pierLen), P.pier, { rough: 0.92 });
    pierDeck.rotation.x = -Math.PI / 2;
    pierDeck.position.set(12, 0.12, -30);
    root.add(pierDeck);

    for (let i = 0; i < 14; i++) {
      const pylon = cyl(0.38, 0.42, 4, P.pier, 8);
      pylon.position.set(8 + (i % 2) * pierW, 2, -8 - i * 3.6);
      root.add(pylon);
    }

    mcBuilding(root, 12, -54, pierW, 3.5, 4, 0xdc2626, 0xffffff);
    mcBuilding(root, -28, 8, 2.4, 4.5, 2.4, 0xea580c, 0xffffff);

    for (let i = 0; i < 5; i++) {
      const umbrella = cyl(0.04, 0.04, 2.5, 0x94a3b8);
      umbrella.position.set(-18 + i * 9, 1.25, 12);
      root.add(umbrella);
      const canopy = mesh(new T.ConeGeometry(1.8, 0.5, 8, 1), [0xef4444, 0x3b82f6, 0xfacc15, 0x22c55e, 0xf472b6][i], { rough: 0.7 });
      canopy.position.set(-18 + i * 9, 2.8, 12);
      root.add(canopy);
    }

    [ -gw * 0.35, -8, 20, gw * 0.38 ].forEach((px, i) => addPalm(root, 1 + i * 0.08, px, 4 + (i % 2) * 3));
    addSurfboard(root, 24, 14, -0.2, 0xf97316);
    addSurfboard(root, 26, 15, 0.35, 0x38bdf8);
  }

  function buildCoastalPatio(root, gw, gd) {
    sandLayer(root, gw, -8, gd * 0.45);
    sidewalkLayer(root, gw * 0.7, 10, 8);
    pchLayer(root, gw * 0.55, 22);

    mcBuilding(root, -32, -6, 14, 5, 8, P.shiplap, P.mcRoof);
    const porch = mesh(new T.PlaneGeometry(10, 5), P.pier, { rough: 0.9 });
    porch.rotation.x = -Math.PI / 2;
    porch.position.set(-32, 0.2, 2);
    root.add(porch);

    for (let i = 0; i < 8; i++) {
      const picket = box(0.15, 1.4, 0.15, P.shiplap);
      picket.position.set(-20 + i * 2.2, 0.7, 24);
      root.add(picket);
    }
    const fenceTop = box(18, 0.12, 0.2, P.shiplap);
    fenceTop.position.set(-11, 1.45, 24);
    root.add(fenceTop);


    addOcean(root, gw, -gd * 0.42);
    [ -28, -8, 12, 30 ].forEach((px, i) => addPalm(root, 0.95 + (i % 2) * 0.15, px, -14 + (i % 3)));
    addStreetLamp(root, 0, 14);
    addStreetLamp(root, 22, 12);
    addSurfboard(root, 18, 8, 0.3, P.trimOrange);
  }

  function buildBeachCottage(root, gw, gd, rooms, locRooms) {
    const floorT = texSand();
    floorT.repeat.set(3, 3);
    const base = mesh(new T.PlaneGeometry(gw, gd), P.sandDeep, { map: floorT, rough: 0.9 });
    base.rotation.x = -Math.PI / 2;
    root.add(base);

    (rooms || []).forEach((room) => {
      const rx = (room.minX + room.maxX) / 2;
      const rw = room.maxX - room.minX;
      const rz = (room.minZ + room.maxZ) / 2;
      const rd = room.maxZ - room.minZ;
      const meta = locRooms?.find((r) => r.id === room.id);
      const floorCol = meta?.floor ? parseInt(meta.floor.replace('#', ''), 16) : P.stucco;
      const floor = mesh(new T.PlaneGeometry(rw - 0.5, rd - 0.5), floorCol, { rough: 0.85 });
      floor.rotation.x = -Math.PI / 2;
      floor.position.set(rx, 0.04, rz);
      root.add(floor);

      const wall = box(rw, 5.4, 0.4, P.shiplap);
      wall.position.set(rx, 2.7, room.minZ + 0.2);
      root.add(wall);

      const w1 = box(0.4, 5.4, rd, P.shiplap);
      w1.position.set(room.minX + 0.2, 2.7, rz);
      root.add(w1);
      const w2 = box(0.4, 5.4, rd, P.shiplap);
      w2.position.set(room.maxX - 0.2, 2.7, rz);
      root.add(w2);

      if (room.id === 'living') {
        const rug = mesh(new T.PlaneGeometry(4, 3), 0xd97706, { rough: 0.95 });
        rug.rotation.x = -Math.PI / 2;
        rug.position.set(rx, 0.06, rz + 2);
        root.add(rug);
      }

    });

    const porch = mesh(new T.PlaneGeometry(12, 7), P.pier, { rough: 0.88 });
    porch.rotation.x = -Math.PI / 2;
    porch.position.set(36, 0.08, 22);
    root.add(porch);
    for (let i = 0; i < 6; i++) {
      root.add(place(cyl(0.08, 0.08, 1.2, P.pier), -32 + i * 2.5, 0.6, 25));
    }
    root.add(place(wowNameplate('9th Street Cottage', '#1e293b', 3), 0, 7.2, -16));
    addSurfboard(root, 34, 20, 0.25, P.trimOrange);
    addPalm(root, 0.8, -36, 20);
    addPalm(root, 0.9, 30, 18);
  }

  const SHOPS = {
    market: { wall: 0xfef08a, trim: 0xca8a04, awning: 0xfde047, sign: '🛒 Main St Market', accent: 0x16a34a },
    boutique: { wall: 0xfce7f3, trim: 0xdb2777, awning: 0xf472b6, sign: '👗 Bloom Boutique', accent: 0xec4899 },
    sugarShack: { wall: 0xfff7ed, trim: 0xb45309, awning: 0xfcd34d, sign: '☕ Sugar Shack Cafe', accent: 0xd97706 },
    jans: { wall: 0xecfdf5, trim: 0x059669, awning: 0x6ee7b7, sign: "🥗 Jan's Health Bar", accent: 0x10b981 },
    nokaoi: { wall: 0xfef3c7, trim: 0x0d9488, awning: 0x2dd4bf, sign: '🌺 No Ka Oi', accent: 0x14b8a6 },
    cafe: { wall: 0xffedd5, trim: 0xc2410c, awning: 0xfb923c, sign: "🌮 Wahoo's · HB Original", accent: 0xea580c },
    salon: { wall: 0xfae8ff, trim: 0xa21caf, awning: 0xe879f9, sign: "💇 Bonnie's · Main St", accent: 0xc026d3 },
    wellness: { wall: 0xd1fae5, trim: 0x059669, awning: 0x6ee7b7, sign: '🧘 Main St Wellness', accent: 0x10b981 },
  };

  function buildShopfront(group, prop, theme) {
    const w = 8;
    const h = 6;
    const d = 6;
    const t = theme || SHOPS[prop.shop] || SHOPS.cafe;

    const body = box(w, h, d, t.wall);
    body.position.y = h / 2;
    group.add(body);

    const roof = box(w + 0.4, 0.55, d + 0.4, t.trim);
    roof.position.y = h + 0.28;
    group.add(roof);

    const win = box(3, 2, 0.45, 0x334155);
    win.position.set(-1.4, h * 0.58, d / 2 + 0.23);
    group.add(win);

    const door = box(1.6, 2.8, 0.45, 0x5c4033);
    door.position.set(2.2, 1.4, d / 2 + 0.23);
    group.add(door);

    const awning = box(w + 0.55, 0.45, 1.25, t.awning);
    awning.position.set(0, h - 0.2, d / 2 + 0.7);
    group.add(awning);

    const signBand = box(w * 0.75, 0.35, 0.35, t.accent);
    signBand.position.set(0, h + 0.65, d / 2 + 0.35);
    group.add(signBand);

    group.add(place(wowNameplate(t.sign, '#1e293b', 3.2), 0, h + 1.35, d / 2 + 1.05));
  }

  /** Continuous ground + PCH connector for overworld traversal */
  function buildWorldBase(root, bounds) {
    const cx = (bounds.minX + bounds.maxX) / 2;
    const cz = (bounds.minZ + bounds.maxZ) / 2;
    const w = bounds.maxX - bounds.minX + 40;
    const d = bounds.maxZ - bounds.minZ + 40;

    const grassT = texSand();
    grassT.repeat.set(w / 24, d / 24);
    const base = mesh(new T.PlaneGeometry(w, d), 0x7cb868, { map: grassT });
    base.rotation.x = -Math.PI / 2;
    base.position.set(cx, -0.02, cz);
    base.receiveShadow = true;
    root.add(base);

    const pchT = texPCH();
    pchT.repeat.set((w * 0.92) / 18, 1);
    const pch = mesh(new T.PlaneGeometry(w * 0.92, 14), 0x4a4a52, { map: pchT });
    pch.rotation.x = -Math.PI / 2;
    pch.position.set(cx, 0.01, cz + 18);
    root.add(pch);

    const walkZ = 16;
    const walkW = w * 0.96;
    const walkD = 14;
    const walkT = texSidewalk();
    walkT.repeat.set(walkW / 8, walkD / 8);
    const walk = mesh(new T.PlaneGeometry(walkW, walkD), P.walk, { map: walkT });
    walk.rotation.x = -Math.PI / 2;
    walk.position.set(cx, 0.045, walkZ);
    root.add(walk);
    const curbH = 0.32;
    const curbW = 0.45;
    [-walkD / 2 + curbW / 2, walkD / 2 - curbW / 2].forEach((off) => {
      const curb = box(walkW + 1, curbH, curbW, P.walkCurb);
      curb.position.set(cx, curbH / 2, walkZ + off);
      root.add(curb);
    });

    addOcean(root, w + 60, cz - d * 0.42);

    for (let i = 0; i < 18; i++) {
      const px = bounds.minX + 20 + (i / 17) * (w - 40);
      const pz = cz - 6 + (i % 3) * 4;
      addPalm(root, 0.85 + (i % 4) * 0.12, px, pz);
    }
    [-w * 0.38, -w * 0.12, w * 0.15, w * 0.38].forEach((bx, i) => {
      addBench(root, cx + bx, cz + 22 + (i % 2) * 3);
    });
  }

  return {
    P,
    skyGradient,
    buildMainStreetStrip,
    buildPCHStrip,
    buildPacificCityStrip,
    buildPierBeach,
    buildCoastalPatio,
    buildBeachCottage,
    buildWorldBase,
    buildShopfront,
    addPalm,
    addStreetLamp,
    addOcean,
    SHOPS,
    labelSprite,
    wowNameplate,
  };
})();