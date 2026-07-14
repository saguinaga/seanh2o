/** Full 3D third-person — Huntington Beach Surf City (Three.js) */
window.BlossomScene3D = (function () {
  const T = window.THREE;
  if (!T) {
    console.error('BlossomScene3D: THREE not loaded');
    return { isReady: () => false, init: () => false };
  }

  const SX = BlossomWorld3D?.SX || 0.11;
  const SZ = BlossomWorld3D?.SZ || 0.13;
  const HB = BlossomHBEnv?.P || {
    ocean: 0x0077be, sand: 0xf0d78c, palm: 0x166534, pier: 0x9a7b4f,
    shiplap: 0xf8fafc, trimBlue: 0x1d4ed8,
  };

  let renderer, scene, camera, clock;
  let ready = false;
  let container, hudCanvas, hudCtx;
  let locRoot, propRoots = [], playerRig, questPin, navLine;
  let currentLocId = '';
  let overworldBuilt = false;
  let oceanMesh, sunLight;
  let camYaw = Math.PI;
  const raycaster = new T.Raycaster();
  const pointer = new T.Vector2();
  const _v3a = new T.Vector3();
  const _v3b = new T.Vector3();

  function to3D(gx, gy, floorY) {
    const c = BlossomWorld3D?.legacyToWorld3D?.(gx, gy, floorY) || { wx: (gx - 400) * SX, wz: (floorY - gy) * SZ };
    return new T.Vector3(c.wx, 0, c.wz);
  }

  function playerVec(player) {
    if (player.wx != null && player.wz != null) return new T.Vector3(player.wx, 0, player.wz);
    return to3D(player.x, player.y, BlossomWorld.getLocation('house').floorY);
  }

  function wpVec(wp) {
    if (wp.wx != null) return new T.Vector3(wp.wx, 0, wp.wz);
    return to3D(wp.x, wp.y, BlossomWorld.getLocation(wp.locId || 'house').floorY);
  }

  function mat(color, opts) {
    return new T.MeshLambertMaterial({
      color,
      emissive: opts?.emissive || 0x000000,
      emissiveIntensity: opts?.emi ?? 0,
      transparent: opts?.transparent || false,
      opacity: opts?.opacity ?? 1,
    });
  }

  function mesh(geo, color, opts) {
    const m = new T.Mesh(geo, mat(color, opts));
    m.castShadow = true;
    m.receiveShadow = true;
    return m;
  }

  function place(obj, x, y, z) {
    obj.position.set(x, y, z);
    return obj;
  }

  function box(w, h, d, color, opts) {
    return mesh(new T.BoxGeometry(w, h, d), color, opts);
  }

  function cyl(rt, rb, h, color, seg) {
    return mesh(new T.CylinderGeometry(rt, rb, h, seg || 12), color);
  }

  function crispLabelTex(c) {
    const tex = new T.CanvasTexture(c);
    tex.colorSpace = T.SRGBColorSpace;
    tex.minFilter = T.LinearFilter;
    tex.magFilter = T.LinearFilter;
    tex.generateMipmaps = false;
    tex.needsUpdate = true;
    return tex;
  }

  function labelSprite(text, color, scale) {
    if (BlossomHBEnv?.wowNameplate) return BlossomHBEnv.wowNameplate(text, color || '#fff568', scale || 5);
    const pr = 2;
    const c = document.createElement('canvas');
    c.width = 480 * pr;
    c.height = 56 * pr;
    const ctx = c.getContext('2d');
    ctx.scale(pr, pr);
    ctx.font = 'bold 26px Arial, Helvetica, sans-serif';
    ctx.textAlign = 'center';
    ctx.lineWidth = 5;
    ctx.strokeStyle = '#000';
    ctx.strokeText(text, 240, 36);
    ctx.fillStyle = color || '#fff568';
    ctx.fillText(text, 240, 36);
    const sp = new T.Sprite(new T.SpriteMaterial({ map: crispLabelTex(c), transparent: true, depthTest: false }));
    sp.scale.set(scale || 5, 1.25, 1);
    sp.renderOrder = 999;
    return sp;
  }

  function questMarkerSprite() {
    const pr = 2;
    const c = document.createElement('canvas');
    c.width = 64 * pr;
    c.height = 96 * pr;
    const ctx = c.getContext('2d');
    ctx.scale(pr, pr);
    ctx.fillStyle = '#ffd100';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(32, 8);
    ctx.lineTo(52, 72);
    ctx.lineTo(12, 72);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.font = 'bold 40px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.lineWidth = 4;
    ctx.strokeText('!', 32, 62);
    ctx.fillStyle = '#1a1208';
    ctx.fillText('!', 32, 62);
    const sp = new T.Sprite(new T.SpriteMaterial({ map: crispLabelTex(c), transparent: true, depthTest: false }));
    sp.scale.set(1.8, 2.6, 1);
    sp.renderOrder = 1000;
    return sp;
  }

  function addPalm(group, scale, x, z) {
    const g = new T.Group();
    const s = scale || 1;
    const trunk = cyl(0.2 * s, 0.28 * s, 5 * s, 0x8b4513, 8);
    trunk.position.y = 2.5 * s;
    g.add(trunk);
    for (let i = 0; i < 6; i++) {
      const frond = mesh(new T.ConeGeometry(0.18 * s, 3.2 * s, 10), HB.palm, { rough: 0.68 });
      frond.position.y = 4.8 * s;
      frond.rotation.z = (i / 6) * Math.PI * 2;
      frond.rotation.x = 0.55;
      g.add(frond);
    }
    g.position.set(x, 0, z);
    group.add(g);
  }

  function buildPlayer(state) {
    const av = state.avatar || {};
    const skin = av.skin || '#f5d0a8';
    const shirt = av.shirtColor || '#5eead4';
    const pants = av.pantsColor || '#475569';
    const shoes = av.shoesColor || '#f8fafc';
    const hair = av.hairColor || '#4a3728';
    const hScale = (BlossomAvatar?.HEIGHT?.[av.height] || 1) * 1.12;
    const bScale = (BlossomAvatar?.BUILD?.[av.build] || 1) * 1.08;

    const rig = new T.Group();
    rig.name = 'playerRig';

    const body = new T.Group();
    body.name = 'body';

    const lShoe = box(0.42 * bScale, 0.22, 0.65, shoes);
    lShoe.position.set(-0.22, 0.11, 0.05);
    body.add(lShoe);
    const rShoe = box(0.42 * bScale, 0.22, 0.65, shoes);
    rShoe.position.set(0.22, 0.11, 0.05);
    body.add(rShoe);

    const pelvis = box(0.85 * bScale, 0.55, 0.5, pants);
    pelvis.position.y = 0.55;
    body.add(pelvis);

    const torso = box(0.95 * bScale, 1.15, 0.55, shirt);
    torso.position.y = 1.35;
    body.add(torso);

    const lArm = box(0.28 * bScale, 1.05, 0.28, shirt);
    lArm.position.set(-0.62 * bScale, 1.25, 0);
    lArm.name = 'lArm';
    body.add(lArm);
    const rArm = box(0.28 * bScale, 1.05, 0.28, shirt);
    rArm.position.set(0.62 * bScale, 1.25, 0);
    rArm.name = 'rArm';
    body.add(rArm);

    const head = mesh(new T.SphereGeometry(0.46 * hScale, 20, 20), skin);
    head.position.y = 2.42 * hScale;
    body.add(head);

    const hairMesh = mesh(
      new T.SphereGeometry(0.42 * hScale, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.55),
      hair
    );
    hairMesh.position.y = 2.55 * hScale;
    body.add(hairMesh);

    const ring = mesh(new T.RingGeometry(0.75, 1.05, 32), 0xfde047, { transparent: true, opacity: 0 });
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.06;
    ring.name = 'interactRing';
    body.add(ring);

    rig.add(body);

    const tag = labelSprite(state.name || 'You', '#40c040', 4.2);
    tag.position.y = 3.55 * hScale;
    tag.name = 'nameTag';
    rig.add(tag);

    scene.add(rig);
    return rig;
  }

  function buildShop(group, prop, theme) {
    if (BlossomHBEnv?.buildShopfront) {
      BlossomHBEnv.buildShopfront(group, prop, theme);
      return;
    }
    const w = (prop.w || 120) * SX;
    const h = 5.5;
    const d = 4.2;
    const body = box(w, h, d, theme.wall);
    body.position.y = h / 2;
    group.add(body);
  }

  function addProp(prop, locId, state) {
    const pos = BlossomWorld3D.propPos(prop, locId);
    const root = new T.Group();
    root.position.set(pos.wx, 0, pos.wz);
    root.userData.prop = prop;
    root.userData.wx = pos.wx;
    root.userData.wz = pos.wz;

    const done = prop.choreId && state.choresDone?.[prop.choreId];
    const onList = !prop.choreId || state.todaysChores?.includes(prop.choreId);

    switch (prop.kind) {
      case 'bed': {
        const frame = box(4.5, 0.55, 5.8, 0x7c3aed);
        frame.position.y = 0.28;
        root.add(frame);
        root.add(place(box(4, 0.6, 5.2, done ? 0xede9fe : 0xa78bfa), 0, 0.7, 0));
        break;
      }
      case 'fridge': {
        const f = box(1.5, 3.4, 1.3, 0x38bdf8, { emissive: 0x0ea5e9, emi: 0.08 });
        f.position.y = 1.7;
        root.add(f);
        break;
      }
      case 'sink': {
        root.add(place(box(3.8, 1.15, 2, 0xe2e8f0), 0, 0.58, 0));
        const basin = cyl(0.6, 0.55, 0.35, done ? 0x94a3b8 : 0x64748b);
        basin.position.y = 1.2;
        root.add(basin);
        break;
      }
      case 'desk':
        root.add(place(box(3.4, 0.22, 1.7, 0xfcd34d), 0, 1.35, 0));
        break;
      case 'couch':
        root.add(place(box(4.8, 0.95, 2.2, 0xf472b6), 0, 0.48, 0));
        break;
      case 'bath':
        root.add(place(box(2.2, 0.85, 2.6, 0x7dd3fc), 0, 0.42, 0));
        break;
      case 'broom': {
        const h = cyl(0.07, 0.07, 3, 0x78716c);
        h.position.y = 1.5;
        root.add(h);
        break;
      }
      case 'plant':
      case 'garden':
      case 'tree':
        addPalm(root, prop.scale || 1, 0, 0);
        if (prop.kind === 'garden') root.add(place(box(4.2, 0.55, 3.2, 0x92400e), 0, 0.28, 0));
        break;
      case 'trash': {
        const t = cyl(0.75, 0.7, 1.7, done ? 0x64748b : 0x475569);
        t.position.y = 0.85;
        root.add(t);
        break;
      }
      case 'mailbox':
        root.add(place(box(1, 0.75, 0.7, 0x2563eb), 0, 1.8, 0));
        root.add(place(cyl(0.12, 0.12, 1.7, 0x1d4ed8), 0, 0.85, 0));
        break;
      case 'shop': {
        const themes = BlossomHBEnv?.SHOPS || {};
        const theme = themes[prop.shop] || { wall: 0xfef9ee, trim: 0x1d4ed8, sign: prop.label, awning: 0xfde047 };
        buildShop(root, prop, theme);
        root.userData.neonAccent = theme.accent || 0xfde047;
        const shopName = prop.label || theme.sign || 'Shop';
        root.add(place(labelSprite(shopName, '#fff568', 4.8), 0, 9.5, 2.8));
        break;
      }
      case 'studio':
        root.add(place(box(0.9, 0.55, 0.55, 0x1e293b), 0, 1.9, 0));
        root.add(place(cyl(1, 1, 0.18, 0xfbbf24), 0, 0.09, 0));
        break;
      case 'artcenter':
        root.add(place(box(5.5, 3.6, 4, 0xa855f7), 0, 1.8, 0));
        root.add(place(labelSprite('🎭 HB Art Center', '#e9d5ff', 5), 0, 5, 0));
        break;
      case 'stage':
        root.add(place(box(6.5, 0.45, 4.2, 0xea580c), 0, 0.22, 0));
        break;
      case 'beachGym':
        root.add(place(box(5.2, 0.35, 4, HB.sand), 0, 0.18, 0));
        root.add(place(labelSprite('💪 City Beach workouts', '#86efac', 4.5), 0, 3.2, 0));
        break;
      case 'gym':
        root.add(place(box(5.8, 3.8, 4.2, 0x475569), 0, 1.9, 0));
        root.add(place(labelSprite('💪 City Beach', '#86efac', 5), 0, 5.2, 0));
        break;
      case 'volleyball':
      case 'playground':
        root.add(place(box(4.5, 0.2, 3.2, HB.sand), 0, 0.1, 0));
        root.add(place(box(0.12, 2.4, 0.12, 0xf8fafc), 0, 1.2, 0));
        root.add(place(labelSprite('🏐 Volleyball', '#fde047', 4), 0, 2.8, 0));
        break;
      case 'beach': {
        const sand = mesh(
          new T.PlaneGeometry((prop.w || 200) * SX, (prop.h || 100) * SZ),
          HB.sand,
          { rough: 0.95 }
        );
        sand.rotation.x = -Math.PI / 2;
        sand.position.y = 0.02;
        root.add(sand);
        break;
      }
      case 'pier':
        root.add(place(box(2.8, 0.35, 8, HB.pier), 0, 0.18, -2));
        root.add(place(labelSprite('HB Pier', '#fde047', 5), 0, 4, -4));
        break;
      case 'rubys':
        root.add(place(box(3.2, 2.8, 2.8, 0xdc2626), 0, 1.4, 0));
        root.add(place(labelSprite("Ruby's Diner", '#fef08a', 4.5), 0, 3.8, 0));
        break;
      case 'lifeguard':
        root.add(place(box(1.4, 3.8, 1.4, 0xea580c), 0, 1.9, 0));
        root.add(place(labelSprite(prop.label || '🛟 Lifeguard', '#fef08a', 4), 0, 4.5, 0));
        break;
      case 'pchArch':
        root.add(place(labelSprite(prop.label || 'Main St & PCH', '#fff568', 5.5), 0, 5, 0));
        break;
      case 'surfMuseum':
        root.add(place(box(6, 3.8, 5, 0xfef3c7), 0, 1.9, 0));
        root.add(place(labelSprite(prop.label || 'Surfing Museum', '#fff568', 5), 0, 5.5, 0));
        break;
      case 'usOpen':
        root.add(place(box(5, 4.2, 4, 0x1d4ed8), 0, 2.1, 0));
        root.add(place(labelSprite(prop.label || 'US Open of Surfing', '#fff568', 4.8), 0, 5.8, 0));
        break;
      case 'fireRings':
        for (let i = 0; i < 3; i++) {
          root.add(place(cyl(0.5, 0.55, 0.3, 0x52525b), -2 + i * 2, 0.15, 0));
          root.add(place(box(1.4, 0.3, 0.6, 0x78350f), -2 + i * 2, 0.45, 0));
        }
        root.add(place(labelSprite(prop.label || 'Fire rings', '#fde047', 4), 0, 2.5, 0));
        break;
      case 'pacCityArch':
        root.add(place(labelSprite(prop.label || 'Pacific City', '#fff568', 6), 0, 5.5, 0));
        break;
      case 'pcShop':
        root.add(place(box(5, 3.8, 4, 0xfef3c7), 0, 1.9, 0));
        root.add(place(labelSprite(prop.label || 'Pacific City shop', '#fff568', 4.5), 0, 5.2, 0));
        break;
      case 'strand':
        root.add(place(box(8, 0.15, 3, 0xd4c4a8), 0, 0.08, 0));
        root.add(place(labelSprite(prop.label || 'The Strand', '#fde047', 4.5), 0, 2.8, 0));
        break;
      case 'shorebirds':
      case 'ducks':
        [ -0.8, 0.5 ].forEach((dx, i) => {
          root.add(place(box(0.55, 0.38, 0.75, i ? 0xf59e0b : 0xfbbf24), dx, 0.2, 0));
        });
        break;
      case 'pond': {
        const water = mesh(
          new T.PlaneGeometry((prop.w || 200) * SX, (prop.h || 100) * SZ),
          HB.ocean,
          { rough: 0.1, metal: 0.45, transparent: true, opacity: 0.92 }
        );
        water.rotation.x = -Math.PI / 2;
        water.position.y = 0.04;
        water.userData.isOcean = true;
        root.add(water);
        break;
      }
      case 'bridge':
        root.add(place(box((prop.w || 80) * SX, 0.4, (prop.h || 40) * SZ, HB.pier), 0, 0.2, 0));
        break;
      case 'bench':
        root.add(place(box((prop.w || 90) * SX * 0.8, 0.28, 1.1, HB.pier), 0, 0.58, 0));
        break;
      case 'litter':
        if (!done) [ -0.5, 0.2, 0.7 ].forEach((lx) => {
          root.add(place(box(0.38, 0.28, 0.38, 0x64748b), lx, 0.14, 0));
        });
        break;
      case 'exit': {
        const arch = mesh(new T.TorusGeometry(1.8, 0.22, 8, 14, Math.PI), 0x22c55e, { emissive: 0x14532d, emi: 0.35 });
        arch.rotation.x = Math.PI / 2;
        arch.rotation.z = Math.PI / 2;
        arch.position.y = 2.2;
        root.add(arch);
        const pillarL = box(0.35, 3.2, 0.35, HB.trimBlue || 0x1d4ed8);
        pillarL.position.set(-1.6, 1.6, 0);
        root.add(pillarL);
        const pillarR = pillarL.clone();
        pillarR.position.x = 1.6;
        root.add(pillarR);
        const lbl = BlossomHBEnv?.labelSprite?.(prop.label || 'Go →', '#86efac', 5)
          || labelSprite(prop.label || 'Go →', '#86efac', 5);
        lbl.position.y = 4.5;
        root.add(lbl);
        break;
      }
      case 'houseFacade': {
        const body = box(8.5, 4.2, 6.5, HB.shiplap);
        body.position.y = 2.1;
        root.add(body);
        const roof = mesh(new T.ConeGeometry(5.8, 2.8, 4), 0x38bdf8);
        roof.position.y = 5.4;
        roof.rotation.y = Math.PI / 4;
        root.add(roof);
        root.add(place(labelSprite('🏠 Beach House', '#bae6fd', 6), 0, 6.5, 3.5));
        break;
      }
      case 'npc':
        if (prop.id === 'bonnie') {
          root.add(place(cyl(0.5, 0.58, 1.7, 0xbe185d, 12), 0, 0.85, 0));
          root.add(place(mesh(new T.SphereGeometry(0.45, 12, 12), 0xf5d0a8), 0, 2, 0));
          root.add(place(labelSprite('Bonnie', '#fda4af', 4), 0, 3.2, 0));
        }
        break;
      case 'lamp': {
        root.add(place(cyl(0.09, 0.11, 3.8, 0x64748b), 0, 1.9, 0));
        const bulb = new T.PointLight(0xfde047, 0.8, 14);
        bulb.position.y = 3.8;
        root.add(bulb);
        break;
      }
      default:
        break;
    }

    if (prop.label && !done && onList && (prop.choreId || prop.kind === 'fridge' || prop.kind === 'exit')) {
      const ring = mesh(new T.RingGeometry(1.6, 2.1, 28), 0xfde047, { transparent: true, opacity: 0.5 });
      ring.rotation.x = -Math.PI / 2;
      ring.position.y = 0.05;
      ring.userData.glow = true;
      root.add(ring);
    }

    if (prop.choreId && !onList && !done) root.visible = false;
    if (prop.kind === 'npc' && prop.id === 'bonnie' && state.level < BlossomCareer.BONNIE_LEVEL) root.visible = false;
    if (prop.kind === 'studio' && state.careerPath !== 'tiktoker') root.visible = false;

    locRoot.add(root);
    propRoots.push(root);
  }

  function buildBeachZone(root, gw, gd) {
    if (BlossomHBEnv?.buildPierBeach) {
      BlossomHBEnv.buildPierBeach(root, gw, gd);
      oceanMesh = root.getObjectByName('hbOcean') || null;
      return;
    }
  }

  function buildZoneShell(group, locId, loc) {
    const gs = BlossomWorld3D.groundSize(locId);
    const gw = gs.w;
    const gd = gs.d;
    const zone = BlossomWorld3D.getZone(locId);

    if (locId === 'house') {
      if (BlossomHBEnv?.buildBeachCottage) {
        BlossomHBEnv.buildBeachCottage(group, gw, gd, zone.rooms, loc.rooms);
      }
    } else if (locId === 'park') {
      buildBeachZone(group, gw, gd);
    } else if (locId === 'street') {
      if (BlossomHBEnv?.buildMainStreetStrip) {
        BlossomHBEnv.buildMainStreetStrip(group, gw, gd, { hero: true });
      }
    } else if (locId === 'pch') {
      if (BlossomHBEnv?.buildPCHStrip) {
        BlossomHBEnv.buildPCHStrip(group, gw, gd);
      }
    } else if (locId === 'pacCity') {
      if (BlossomHBEnv?.buildPacificCityStrip) {
        BlossomHBEnv.buildPacificCityStrip(group, gw, gd);
      }
    } else if (BlossomHBEnv?.buildCoastalPatio) {
      BlossomHBEnv.buildCoastalPatio(group, gw, gd);
    }
  }

  function buildOverworld(state) {
    if (locRoot) {
      scene.remove(locRoot);
      locRoot.traverse((o) => {
        if (o.geometry) o.geometry.dispose();
        if (o.material) {
          if (Array.isArray(o.material)) o.material.forEach((m) => m.dispose());
          else o.material.dispose();
        }
      });
    }
    propRoots = [];
    oceanMesh = null;
    locRoot = new T.Group();
    locRoot.name = 'overworld';
    scene.add(locRoot);

    if (BlossomHBEnv?.buildWorldBase) {
      BlossomHBEnv.buildWorldBase(locRoot, BlossomWorld3D.WORLD_BOUNDS);
      oceanMesh = locRoot.getObjectByName('hbOcean') || null;
    }

    Object.keys(BlossomWorld.LOCATIONS).forEach((locId) => {
      const loc = BlossomWorld.getLocation(locId);
      const a = BlossomWorld3D.anchor(locId);
      const shell = new T.Group();
      shell.name = `zone-${locId}`;
      shell.position.set(a.wx, 0, a.wz);
      buildZoneShell(shell, locId, loc);
      locRoot.add(shell);
      loc.props.forEach((p) => addProp(p, locId, state));
    });

    currentLocId = '__overworld__';
    overworldBuilt = true;
  }

  function buildLocation(loc, state) {
    if (locRoot) {
      scene.remove(locRoot);
      locRoot.traverse((o) => {
        if (o.geometry) o.geometry.dispose();
        if (o.material) {
          if (Array.isArray(o.material)) o.material.forEach((m) => m.dispose());
          else o.material.dispose();
        }
      });
    }
    propRoots = [];
    oceanMesh = null;
    locRoot = new T.Group();
    scene.add(locRoot);
    currentLocId = loc.id;
    const gs = BlossomWorld3D.groundSize(loc.id);
    const gw = gs.w;
    const gd = gs.d;
    const zone = BlossomWorld3D.getZone(loc.id);

    if (loc.id === 'house') {
      if (BlossomHBEnv?.buildBeachCottage) {
        BlossomHBEnv.buildBeachCottage(locRoot, gw, gd, zone.rooms, loc.rooms);
      }
    } else if (loc.id === 'park') {
      buildBeachZone(locRoot, gw, gd);
    } else if (loc.id === 'street') {
      if (BlossomHBEnv?.buildMainStreetStrip) {
        BlossomHBEnv.buildMainStreetStrip(locRoot, gw, gd, { hero: true });
        oceanMesh = locRoot.getObjectByName('hbOcean') || null;
      }
    } else if (loc.id === 'pch') {
      if (BlossomHBEnv?.buildPCHStrip) {
        BlossomHBEnv.buildPCHStrip(locRoot, gw, gd);
      }
    } else if (loc.id === 'pacCity') {
      if (BlossomHBEnv?.buildPacificCityStrip) {
        BlossomHBEnv.buildPacificCityStrip(locRoot, gw, gd);
        oceanMesh = locRoot.getObjectByName('hbOcean') || null;
      }
    } else if (BlossomHBEnv?.buildCoastalPatio) {
      BlossomHBEnv.buildCoastalPatio(locRoot, gw, gd);
      oceanMesh = locRoot.getObjectByName('hbOcean') || null;
    }

    loc.props.forEach((p) => addProp(p, loc.id, state));
  }

  function setSky(phaseId) {
    const table = {
      morning: 0x93c5fd,
      afternoon: 0x38bdf8,
      evening: 0xff7f50,
      night: 0x1e3a5f,
    };
    const col = table[phaseId] || table.morning;
    if (BlossomHBEnv?.skyGradient) {
      scene.background = BlossomHBEnv.skyGradient(phaseId);
    } else {
      scene.background = new T.Color(col);
    }
    const fogCol = phaseId === 'night' ? 0x1a2840 : phaseId === 'evening' ? 0xc47a50 : 0x87ceeb;
    scene.fog = new T.Fog(fogCol, 90, phaseId === 'night' ? 520 : 780);
    if (sunLight) {
      sunLight.intensity = phaseId === 'night' ? 0.42 : phaseId === 'evening' ? 1.05 : 1.52;
      sunLight.color.setHex(phaseId === 'evening' ? 0xffb07a : phaseId === 'night' ? 0xa8c8f0 : 0xfff8e7);
      if (phaseId === 'evening') sunLight.position.set(48, 28, 12);
      else if (phaseId === 'night') sunLight.position.set(20, 36, 8);
      else sunLight.position.set(32, 54, 20);
    }
  }

  function getDpr() {
    return Math.min(window.devicePixelRatio || 1, 3);
  }

  function init(canvas, wrap, hudCvs) {
    if (ready) return true;
    try {
      container = wrap;
      hudCanvas = hudCvs;
      hudCtx = hudCvs?.getContext('2d');

      renderer = new T.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'high-performance' });
      renderer.setPixelRatio(getDpr());
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = T.PCFShadowMap;
      renderer.outputColorSpace = T.SRGBColorSpace;
      renderer.toneMapping = T.ReinhardToneMapping;
      renderer.toneMappingExposure = 1.22;

      scene = new T.Scene();
      clock = new T.Clock();

      camera = new T.PerspectiveCamera(58, 1, 0.5, 500);

      scene.add(new T.AmbientLight(0xb8c8e0, 0.62));
      scene.add(new T.HemisphereLight(0x87ceeb, 0xc4a574, 0.45));
      sunLight = new T.DirectionalLight(0xfff0d0, 1.28);
      sunLight.position.set(32, 54, 20);
      sunLight.castShadow = true;
      sunLight.shadow.mapSize.set(4096, 4096);
      sunLight.shadow.bias = -0.0004;
      sunLight.shadow.normalBias = 0.02;
      sunLight.shadow.camera.near = 2;
      sunLight.shadow.camera.far = 120;
      sunLight.shadow.camera.left = -65;
      sunLight.shadow.camera.right = 65;
      sunLight.shadow.camera.top = 65;
      sunLight.shadow.camera.bottom = -65;
      scene.add(sunLight);
      const fill = new T.DirectionalLight(0xa8c8e8, 0.35);
      fill.position.set(-28, 24, -18);
      scene.add(fill);

      questPin = new T.Group();
      const pole = cyl(0.06, 0.06, 2.8, 0x666666, 6);
      pole.position.y = 1.4;
      questPin.add(pole);
      const qMark = questMarkerSprite();
      qMark.position.y = 3.2;
      questPin.add(qMark);
      questPin.visible = false;
      scene.add(questPin);

      navLine = new T.Line(
        new T.BufferGeometry(),
        new T.LineDashedMaterial({ color: 0xfff568, dashSize: 1.1, gapSize: 0.5, linewidth: 2 })
      );
      navLine.visible = false;
      scene.add(navLine);

      BlossomScene3DJuice?.init?.(scene);

      ready = true;
      return true;
    } catch (err) {
      console.error('BlossomScene3D init failed:', err);
      ready = false;
      return false;
    }
  }

  function warmStart(loc, state, player) {
    if (!ready) return;
    BlossomWorld3D.ensurePlayer3D(player, loc.id);
    if (BlossomWorld3D.isOverworld?.()) {
      if (!overworldBuilt) buildOverworld(state);
    } else {
      buildLocation(loc, state);
    }
    if (playerRig) {
      scene.remove(playerRig);
      playerRig = null;
    }
    playerRig = buildPlayer(state);
    const p = playerVec(player);
    playerRig.position.copy(p);
    camYaw = player.moveYaw ?? Math.PI;
    snapCamera(p);
    const loadEl = document.getElementById('gameLoad');
    if (loadEl) loadEl.hidden = true;
  }

  function snapCamera(p) {
    const dist = BlossomWorld3D.isOverworld?.() ? 27 : 15;
    const h = BlossomWorld3D.isOverworld?.() ? 14.5 : 9;
    camera.position.set(
      p.x - Math.sin(camYaw) * dist,
      h,
      p.z - Math.cos(camYaw) * dist
    );
    camera.lookAt(p.x, 2.8, p.z);
  }

  function rebuildIfNeeded(loc, state) {
    if (BlossomWorld3D.isOverworld?.()) return;
    if (loc.id !== currentLocId) buildLocation(loc, state);
  }

  function updatePlayer(state, player, floorY, nearInteract, moving, running) {
    if (!playerRig) playerRig = buildPlayer(state);
    const p = playerVec(player);
    playerRig.position.lerp(p, moving ? 0.48 : 0.32);
    const bobAmp = running ? 0.1 : 0.06;
    const bobSpd = running ? 14 : 10;
    const bob = moving ? Math.sin(clock.getElapsedTime() * bobSpd) * bobAmp : 0;
    playerRig.position.y = bob;

    const yaw = player.moveYaw ?? camYaw;
    const body = playerRig.getObjectByName('body');
    if (body) body.rotation.y = yaw;
    const swing = moving ? Math.sin(clock.getElapsedTime() * (running ? 14 : 10)) * (running ? 0.55 : 0.38) : 0;
    const lArm = body?.getObjectByName('lArm');
    const rArm = body?.getObjectByName('rArm');
    if (lArm) lArm.rotation.x = swing;
    if (rArm) rArm.rotation.x = -swing;

    const ring = playerRig.getObjectByName('interactRing');
    if (ring) {
      ring.material.opacity = nearInteract ? 0.7 + Math.sin(clock.getElapsedTime() * 6) * 0.25 : 0;
      ring.material.color.setHex(0xfff568);
    }
  }

  function updateThirdPersonCamera(player, floorY, navState, running) {
    const p = playerVec(player);
    if (player.moveYaw != null && playerMovingRecently(player) && !navState?.active) {
      camYaw = T.MathUtils.lerp(camYaw, player.moveYaw, 0.08);
    }

    const openWorld = BlossomWorld3D.isOverworld?.();
    let look = p.clone();
    let dist = openWorld ? 27 : 15;
    let h = openWorld ? 14.2 : 8.8;
    if (running) {
      dist -= openWorld ? 3 : 1.5;
      camera.fov = T.MathUtils.lerp(camera.fov, 62, 0.08);
    } else {
      camera.fov = T.MathUtils.lerp(camera.fov, 58, 0.06);
    }
    camera.updateProjectionMatrix();

    if (navState?.active && navState.waypoints?.length) {
      const wp = wpVec(navState.waypoints[0]);
      look.lerp(wp, 0.35);
      dist = openWorld ? 26 : 17;
      h = openWorld ? 13 : 9.5;
    } else if (navState?.arrived && navState.target) {
      const t = navState.target.wx != null
        ? new T.Vector3(navState.target.wx, 0, navState.target.wz)
        : wpVec({ x: navState.target.center?.x, y: navState.target.center?.y, locId: navState.target.locId });
      look.lerp(t, 0.4);
      dist = 12;
      h = 7;
    }

    const swoop = BlossomScene3DJuice?.travelSwoopOffset?.() || { h: 0, dist: 0 };
    _v3a.set(
      look.x - Math.sin(camYaw) * (dist + swoop.dist),
      h + swoop.h,
      look.z - Math.cos(camYaw) * (dist + swoop.dist)
    );
    camera.position.lerp(_v3a, 0.11);
    _v3b.set(look.x, 2.9, look.z);
    camera.lookAt(_v3b);
  }

  let lastMoveTick = 0;
  function playerMovingRecently(player) {
    return performance.now() - lastMoveTick < 400;
  }
  function notePlayerMoved() { lastMoveTick = performance.now(); }

  function updateQuestPin(navState, player, anim) {
    if (!navState?.active && !navState?.arrived) {
      questPin.visible = false;
      navLine.visible = false;
      return;
    }
    const wp = navState.waypoints?.[0];
    const target = navState.target;
    let pos;
    if (wp) pos = wpVec(wp);
    else if (target?.wx != null) pos = new T.Vector3(target.wx, 0, target.wz);
    else if (target?.center) pos = to3D(target.center.x, target.center.y, BlossomWorld.getLocation(target.locId || 'house').floorY);

    if (pos) {
      questPin.visible = true;
      questPin.position.set(pos.x, 2 + Math.sin(anim * 4) * 0.6, pos.z);
      questPin.rotation.y = anim * 2.5;
    }
    if (wp) {
      const pts = [playerVec(player), wpVec(wp)];
      navLine.geometry.setFromPoints(pts);
      navLine.computeLineDistances();
      navLine.visible = true;
    } else navLine.visible = false;
  }

  function renderFrame(opts) {
    if (!ready) return false;
    const { loc, state, player, anim, nearInteract, nav, transitionLock, phaseFade, moving, running, surface } = opts;

    rebuildIfNeeded(loc, state);
    const phaseId = state.timeOfDay || 'morning';
    setSky(phaseId);
    if (moving) notePlayerMoved();
    updatePlayer(state, player, loc.floorY, nearInteract, moving, running);
    updateThirdPersonCamera(player, loc.floorY, nav, running);
    updateQuestPin(nav, player, anim);

    if (!oceanMesh && locRoot) oceanMesh = locRoot.getObjectByName('hbOcean') || oceanMesh;
    if (oceanMesh) {
      const t = clock.getElapsedTime();
      oceanMesh.position.y = -0.05 + Math.sin(t * 1.3) * 0.14;
      oceanMesh.rotation.z = Math.sin(t * 0.35) * 0.01;
      if (oceanMesh.material) {
        oceanMesh.material.emissiveIntensity = 0.1 + Math.sin(t * 2.1) * 0.06;
      }
    }

    BlossomScene3DJuice?.update?.({
      dt: 0.016,
      t: anim,
      player,
      moving,
      running,
      locId: loc.id,
      phaseId,
      surface,
    });

    propRoots.forEach((root) => {
      if (root.userData.neonAccent != null) {
        root.traverse((c) => {
          if (c.isPointLight) c.intensity = 0.65;
          if (c.material?.emissiveIntensity != null && c.userData.neonSign) {
            c.material.emissiveIntensity = 0.45;
          }
        });
      }
      root.children.forEach((c) => {
        if (c.userData.glow && c.material) {
          c.material.opacity = 0.35 + Math.sin(anim * 4) * 0.28;
          c.rotation.z = anim * 0.6;
        }
      });
    });

    renderer.render(scene, camera);
    drawHud(opts);
    return true;
  }

  function drawHud(opts) {
    if (!hudCtx || !hudCanvas) return;
    const { loc, state, transitionLock, phaseFade } = opts;
    const dpr = getDpr();
    const w = hudCanvas.width / dpr;
    const h = hudCanvas.height / dpr;
    hudCtx.setTransform(1, 0, 0, 1, 0, 0);
    hudCtx.clearRect(0, 0, hudCanvas.width, hudCanvas.height);
    hudCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    hudCtx.imageSmoothingEnabled = true;
    if (hudCtx.imageSmoothingQuality) hudCtx.imageSmoothingQuality = 'high';

    if (phaseFade > 0) {
      hudCtx.fillStyle = `rgba(253, 224, 71, ${phaseFade * 0.35})`;
      hudCtx.fillRect(0, 0, w, h);
    }
    if (transitionLock > 0) {
      const t = transitionLock / 55;
      hudCtx.fillStyle = `rgba(125, 211, 252, ${Math.min(0.55, t * 0.6)})`;
      hudCtx.fillRect(0, 0, w, h);
      hudCtx.fillStyle = '#0c4a6e';
      hudCtx.font = '800 22px Fredoka, Nunito, sans-serif';
      hudCtx.textAlign = 'center';
      hudCtx.globalAlpha = 1 - t;
      hudCtx.fillText(loc.name, w / 2, h / 2 - 10);
      hudCtx.globalAlpha = 1;
      hudCtx.textAlign = 'left';
    }
    BlossomScene3DHud?.draw?.(hudCtx, w, h, {
      loc,
      state,
      player: opts.player,
      nearInteract: opts.nearInteract,
      anim: opts.anim || 0,
      running: opts.running,
      phaseFade: phaseFade || 0,
    });
  }

  function getCamYaw() { return camYaw; }
  function rotateCam(delta) {
    if (!delta) return;
    camYaw += delta;
  }

  /** Walk forward/right from live camera view on the ground plane */
  function getWalkBasis() {
    if (!camera) {
      return {
        forwardX: Math.sin(camYaw),
        forwardZ: Math.cos(camYaw),
        rightX: Math.cos(camYaw),
        rightZ: -Math.sin(camYaw),
      };
    }
    camera.getWorldDirection(_v3a);
    let fx = _v3a.x;
    let fz = _v3a.z;
    const len = Math.hypot(fx, fz);
    if (len < 0.001) {
      fx = Math.sin(camYaw);
      fz = Math.cos(camYaw);
    } else {
      fx /= len;
      fz /= len;
    }
    return { forwardX: fx, forwardZ: fz, rightX: -fz, rightZ: fx };
  }

  function resize(w, h) {
    if (!ready || !renderer) return;
    const cw = Math.max(w || 320, 320);
    const ch = Math.max(h || 240, 200);
    const dpr = getDpr();
    renderer.setPixelRatio(dpr);
    renderer.setSize(cw, ch, false);
    camera.aspect = cw / ch;
    camera.updateProjectionMatrix();
    if (hudCanvas) {
      hudCanvas.style.width = `${cw}px`;
      hudCanvas.style.height = `${ch}px`;
      hudCanvas.width = Math.floor(cw * dpr);
      hudCanvas.height = Math.floor(ch * dpr);
    }
    if (container) {
      const cvs = container.querySelector('#gameCanvas');
      if (cvs) {
        cvs.style.width = `${cw}px`;
        cvs.style.height = `${ch}px`;
      }
    }
  }

  function pickProp(clientX, clientY) {
    if (!ready) return null;
    const rect = (container?.querySelector('#gameCanvas') || container)?.getBoundingClientRect();
    if (!rect?.width) return null;
    pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    const hits = raycaster.intersectObjects(propRoots, true);
    for (const hit of hits) {
      let o = hit.object;
      while (o && !o.userData.prop) o = o.parent;
      if (o?.userData?.prop) return o.userData.prop;
    }
    return null;
  }

  function invalidateCache() {
    currentLocId = '';
    overworldBuilt = false;
  }
  function isReady() { return ready; }

  function triggerTravel() {
    BlossomScene3DJuice?.triggerTravelSwoop?.();
  }

  return {
    init, warmStart, renderFrame, resize, pickProp, invalidateCache, isReady, to3D,
    getCamYaw, rotateCam, getWalkBasis, playerVec, triggerTravel,
  };
})();