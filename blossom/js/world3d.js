/** 3D overworld — full HB: 9th St → Main Street → PCH → Pacific City → Pier */
window.BlossomWorld3D = (function () {
  const SX = 0.11;
  const SZ = 0.13;
  const OVERWORLD = true;

  const ZONE_ANCHORS = {
    house: { wx: -268, wz: 0 },
    yard: { wx: -138, wz: 0 },
    street: { wx: 82, wz: 0 },
    pch: { wx: 268, wz: 0 },
    pacCity: { wx: 498, wz: 0 },
    park: { wx: 738, wz: 0 },
  };

  const ZONES = {
    house: {
      halfW: 44,
      halfD: 36,
      spawn: { wx: -258, wz: 18 },
      rooms: [
        { id: 'bedroom', minX: -38, maxX: -8, minZ: -10, maxZ: 28 },
        { id: 'living', minX: -10, maxX: 16, minZ: -10, maxZ: 28 },
        { id: 'kitchen', minX: 14, maxX: 34, minZ: -14, maxZ: 20 },
        { id: 'bath', minX: 30, maxX: 40, minZ: -6, maxZ: 28 },
      ],
    },
    yard: {
      halfW: 52,
      halfD: 56,
      spawn: { wx: -158, wz: 14 },
    },
    street: {
      halfW: 148,
      halfD: 68,
      spawn: { wx: -52, wz: 16 },
    },
    pch: {
      halfW: 78,
      halfD: 72,
      spawn: { wx: 218, wz: 14 },
    },
    pacCity: {
      halfW: 142,
      halfD: 86,
      spawn: { wx: 408, wz: 14 },
    },
    park: {
      halfW: 108,
      halfD: 88,
      spawn: { wx: 658, wz: 16 },
    },
  };

  const WORLD_BOUNDS = {
    minX: -325,
    maxX: 870,
    minZ: -110,
    maxZ: 110,
  };

  function anchor(locId) {
    return ZONE_ANCHORS[locId] || { wx: 0, wz: 0 };
  }

  function isOverworld() {
    return OVERWORLD;
  }

  function propKey(p) {
    if (p.choreId) return p.choreId;
    if (p.kind === 'exit' && p.to) return `exit-${p.to}`;
    if (p.kind === 'npc' && p.id) return `npc-${p.id}`;
    if (p.kind === 'shop' && p.shop) return `shop-${p.shop}`;
    if (p.kind === 'tree') return `tree-${p.x}-${p.y}`;
    if (p.kind === 'bench') return `bench-${p.x}`;
    if (p.kind === 'lamp') return `lamp-${p.x}`;
    if (p.kind === 'pcShop') return `pcShop-${p.x}`;
    return `${p.kind}-${p.x}`;
  }

  const LAYOUTS = {
    house: {
      bed: { wx: -30, wz: 6 },
      homework: { wx: -20, wz: 14 },
      plants: { wx: -36, wz: 18 },
      couch: { wx: 2, wz: 10 },
      rug: { wx: 4, wz: 18 },
      sweep: { wx: 10, wz: 16 },
      studio: { wx: -4, wz: -2 },
      dishes: { wx: 22, wz: -4 },
      fridge: { wx: 30, wz: -6 },
      teeth: { wx: 38, wz: 8 },
      'exit-yard': { wx: 38, wz: 22 },
    },
    yard: {
      houseFacade: { wx: -40, wz: -8 },
      fence: { wx: 0, wz: 28 },
      path: { wx: 0, wz: 12 },
      trash: { wx: 28, wz: 10 },
      plants_out: { wx: 8, wz: -4 },
      mailbox: { wx: -18, wz: 14 },
      'tree-500-200': { wx: 12, wz: -14 },
      'tree-680-220': { wx: 32, wz: -10 },
      'exit-house': { wx: -44, wz: 4 },
      'exit-street': { wx: 48, wz: 8 },
    },
    street: {
      road: { wx: 0, wz: 26 },
      'artcenter-4': { wx: -128, wz: -10 },
      'shop-sugarShack': { wx: -108, wz: -14 },
      'shop-jans': { wx: -82, wz: -14 },
      'shop-nokaoi': { wx: -56, wz: -14 },
      'shop-cafe': { wx: -28, wz: -14 },
      'shop-market': { wx: 0, wz: -14 },
      'shop-boutique': { wx: 28, wz: -12 },
      'shop-salon': { wx: 56, wz: -14 },
      'shop-wellness': { wx: 82, wz: -10 },
      'npc-bonnie': { wx: 48, wz: 14 },
      'bench-720': { wx: 118, wz: 14 },
      'lamp-280': { wx: -62, wz: 4 },
      'lamp-480': { wx: 12, wz: 4 },
      litter: { wx: -14, wz: 20 },
      'tree-50-210': { wx: -118, wz: -6 },
      'exit-yard': { wx: -138, wz: 6 },
      'exit-pch': { wx: 138, wz: 4 },
    },
    pch: {
      road: { wx: 0, wz: 22 },
      'pchArch-120': { wx: -28, wz: 8 },
      'surfMuseum-40': { wx: -48, wz: -20 },
      'bench-200': { wx: 18, wz: 12 },
      'bench-380': { wx: 42, wz: 10 },
      'tree-680': { wx: 58, wz: -6 },
      'exit-street': { wx: -68, wz: 6 },
      'exit-pacCity': { wx: 68, wz: 4 },
    },
    pacCity: {
      road: { wx: 0, wz: 22 },
      'pacCityArch-380': { wx: -8, wz: -6 },
      'pcShop-60': { wx: -72, wz: -18 },
      'pcShop-180': { wx: -48, wz: -18 },
      'pcShop-300': { wx: -24, wz: -18 },
      'pcShop-520': { wx: 18, wz: -18 },
      'strand-0': { wx: -58, wz: 22 },
      'lifeguard-280': { wx: -8, wz: -10 },
      'beachGym-420': { wx: 32, wz: -8 },
      'usOpen-620': { wx: 68, wz: -14 },
      'shorebirds-500': { wx: 52, wz: 20 },
      'fireRings-680': { wx: 88, wz: 24 },
      'bench-200': { wx: -18, wz: 12 },
      'bench-450': { wx: 28, wz: 10 },
      'tree-28-205': { wx: -62, wz: -8 },
      'exit-pch': { wx: -128, wz: 6 },
      'exit-park': { wx: 128, wz: 4 },
    },
    park: {
      'beach-0': { wx: -18, wz: 24 },
      'pier-500': { wx: 42, wz: -14 },
      'rubys-620': { wx: 52, wz: -18 },
      playground: { wx: -48, wz: 4 },
      ducks: { wx: 8, wz: 16 },
      'bench-175': { wx: -32, wz: 12 },
      'bench-410': { wx: -8, wz: 10 },
      'tree-28-205': { wx: -52, wz: -8 },
      'exit-pacCity': { wx: -98, wz: 6 },
    },
  };

  function toWorldPos(local, locId) {
    const a = anchor(locId);
    return { wx: local.wx + a.wx, wz: local.wz + a.wz };
  }

  function getZone(locId) {
    return ZONES[locId] || ZONES.house;
  }

  function getBounds(locId) {
    const z = getZone(locId);
    const a = anchor(locId);
    return {
      minX: a.wx - z.halfW + 1.5,
      maxX: a.wx + z.halfW - 1.5,
      minZ: a.wz - z.halfD + 1.5,
      maxZ: a.wz + z.halfD - 1.5,
      halfW: z.halfW,
      halfD: z.halfD,
    };
  }

  function locationAt(wx, wz) {
    const order = ['park', 'pacCity', 'pch', 'street', 'yard', 'house'];
    for (const id of order) {
      const b = getBounds(id);
      if (wx >= b.minX && wx <= b.maxX && wz >= b.minZ && wz <= b.maxZ) return id;
    }
    if (wx < -200) return 'house';
    if (wx < -80) return 'yard';
    if (wx < 210) return 'street';
    if (wx < 380) return 'pch';
    if (wx < 640) return 'pacCity';
    return 'park';
  }

  function legacyToWorld3D(gx, gy, floorY) {
    return {
      wx: (gx - 400) * SX,
      wz: (floorY - gy) * SZ,
    };
  }

  function world3DToLegacy(wx, wz, floorY) {
    return {
      x: wx / SX + 400,
      y: floorY - wz / SZ,
    };
  }

  function propPos(prop, locId) {
    const layout = LAYOUTS[locId];
    const key = propKey(prop);
    let local;
    if (layout?.[key]) {
      local = { ...layout[key] };
    } else {
      const floorY = BlossomWorld.getLocation(locId).floorY;
      local = legacyToWorld3D(
        prop.x + (prop.w || 50) / 2,
        prop.y + (prop.h || 50) / 2,
        floorY
      );
    }
    return toWorldPos(local, locId);
  }

  function propCenter3D(prop, locId) {
    const p = propPos(prop, locId);
    return { wx: p.wx, wz: p.wz, x: p.wx, y: p.wz };
  }

  function spawn3D(locId, spawn2d) {
    const zone = getZone(locId);
    if (spawn2d?.wx != null && !OVERWORLD) return { wx: spawn2d.wx, wz: spawn2d.wz };
    if (spawn2d?.wx != null && OVERWORLD) {
      return toWorldPos({ wx: spawn2d.wx, wz: spawn2d.wz }, locId);
    }
    if (spawn2d?.x != null) {
      const floorY = BlossomWorld.getLocation(locId).floorY;
      const local = legacyToWorld3D(spawn2d.x, spawn2d.y, floorY);
      const a = anchor(locId);
      const localFromAnchor = { wx: local.wx - a.wx, wz: local.wz - a.wz };
      return toWorldPos(localFromAnchor, locId);
    }
    if (OVERWORLD && zone.spawn) {
      return { ...zone.spawn };
    }
    return toWorldPos(zone.spawn || { wx: 0, wz: 0 }, locId);
  }

  function ensurePlayer3D(player, locId) {
    const loc = BlossomWorld.getLocation(locId);
    const floorY = loc.floorY;
    if (player.wx == null || player.wz == null) {
      if (player.x != null && !OVERWORLD) {
        const c = legacyToWorld3D(player.x, player.y, floorY);
        player.wx = c.wx;
        player.wz = c.wz;
      } else if (player.x != null && OVERWORLD) {
        const sp = spawn3D(locId, { x: player.x, y: player.y });
        player.wx = sp.wx;
        player.wz = sp.wz;
      } else {
        const sp = spawn3D(locId, null);
        player.wx = sp.wx;
        player.wz = sp.wz;
      }
    }
    syncLegacy(player, floorY);
    return player;
  }

  function syncLegacy(player, floorY) {
    if (player.wx == null) return player;
    const leg = world3DToLegacy(player.wx, player.wz, floorY);
    player.x = leg.x;
    player.y = leg.y;
    return player;
  }

  function clampPlayer(player, locId) {
    if (OVERWORLD) {
      const b = WORLD_BOUNDS;
      player.wx = Math.max(b.minX, Math.min(b.maxX, player.wx));
      player.wz = Math.max(b.minZ, Math.min(b.maxZ, player.wz));
      return player;
    }
    const b = getBounds(locId);
    player.wx = Math.max(b.minX, Math.min(b.maxX, player.wx));
    player.wz = Math.max(b.minZ, Math.min(b.maxZ, player.wz));
    return player;
  }

  function getRoomAt3D(wx, wz, loc) {
    const zone = getZone(loc.id);
    const a = anchor(loc.id);
    if (!zone.rooms) return BlossomWorld.getRoomAt(playerXToLegacy(wx - a.wx), loc);
    const room = zone.rooms.find(
      (r) => wx >= a.wx + r.minX && wx <= a.wx + r.maxX
        && wz >= a.wz + r.minZ && wz <= a.wz + r.maxZ
    );
    return room?.id || null;
  }

  function playerXToLegacy(wx) {
    return wx / SX + 400;
  }

  function distance3D(ax, az, bx, bz) {
    return Math.hypot(ax - bx, az - bz);
  }

  function distanceToProp3D(player, prop, locId) {
    const c = propPos(prop, locId);
    return distance3D(player.wx, player.wz, c.wx, c.wz);
  }

  function groundSize(locId) {
    const z = getZone(locId);
    return { w: z.halfW * 2, d: z.halfD * 2 };
  }

  function worldSize() {
    return {
      w: WORLD_BOUNDS.maxX - WORLD_BOUNDS.minX,
      d: WORLD_BOUNDS.maxZ - WORLD_BOUNDS.minZ,
    };
  }

  function minimapZones() {
    return Object.keys(ZONE_ANCHORS).map((id) => ({
      id,
      wx: ZONE_ANCHORS[id].wx,
      wz: ZONE_ANCHORS[id].wz,
      halfW: ZONES[id]?.halfW || 40,
      halfD: ZONES[id]?.halfD || 40,
    }));
  }

  return {
    SX,
    SZ,
    OVERWORLD,
    ZONE_ANCHORS,
    WORLD_BOUNDS,
    ZONES,
    minimapZones,
    anchor,
    isOverworld,
    getZone,
    getBounds,
    locationAt,
    legacyToWorld3D,
    world3DToLegacy,
    propPos,
    propCenter3D,
    propKey,
    spawn3D,
    ensurePlayer3D,
    syncLegacy,
    clampPlayer,
    getRoomAt3D,
    distance3D,
    distanceToProp3D,
    groundSize,
    worldSize,
  };
})();