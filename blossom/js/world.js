/** Locations, props, exits — downtown HB local loop (9th St → Main → Pier) */
window.BlossomWorld = (function () {
  const W = 800;
  const H = 480;
  const FLOOR = 400;

  const L = window.BlossomHBLocal || {};
  const locMeta = (id) => L.loc?.(id) || {};
  const shopMeta = (key) => L.shop?.(key) || {};
  const EX = L.EXITS || {};
  const CH = L.CHORES || {};

  const LOCATIONS = {
    house: {
      id: 'house',
      name: locMeta('house').name || '9th Street Cottage',
      floorY: FLOOR,
      sky: ['#5eb8e8', '#93c5fd', '#fff7ed'],
      ground: '#f0d78c',
      groundAccent: '#e4c76b',
      rooms: [
        { id: 'bedroom', label: 'Bedroom', x: 0, w: 252, wall: '#f8fafc', floor: '#fef9ee', trim: '#1d4ed8' },
        { id: 'living', label: 'Living room', x: 252, w: 260, wall: '#fff7ed', floor: '#fde68a', trim: '#ea580c' },
        { id: 'kitchen', label: 'Kitchen', x: 512, w: 172, wall: '#f8fafc', floor: '#e7e5e4', trim: '#1d4ed8' },
        { id: 'bath', label: 'Bathroom', x: 684, w: 116, wall: '#e0f2fe', floor: '#bae6fd', trim: '#0284c7' },
      ],
      walls: [
        { x: 252, doorY: 308, doorH: 88 },
        { x: 512, doorY: 308, doorH: 88 },
      ],
      props: [
        { kind: 'bed', x: 38, y: 298, w: 148, h: 90, choreId: 'bed', label: 'Make bed', room: 'bedroom' },
        { kind: 'desk', x: 148, y: 322, w: 88, h: 58, choreId: 'homework', label: 'Homework', room: 'bedroom' },
        { kind: 'plant', x: 18, y: 328, w: 46, h: 54, choreId: 'plants', label: 'Water plants', room: 'bedroom' },
        { kind: 'couch', x: 288, y: 312, w: 168, h: 76, room: 'living' },
        { kind: 'rug', x: 318, y: 358, w: 128, h: 36, room: 'living' },
        { kind: 'broom', x: 418, y: 348, w: 92, h: 40, choreId: 'sweep', label: 'Sweep floor', room: 'living' },
        { kind: 'studio', x: 262, y: 272, w: 86, h: 78, label: 'Film corner', room: 'living' },
        { kind: 'sink', x: 524, y: 286, w: 90, h: 70, choreId: 'dishes', label: 'Dishes', room: 'kitchen' },
        { kind: 'fridge', x: 612, y: 274, w: 64, h: 92, label: 'Fridge', room: 'kitchen' },
        { kind: 'bath', x: 702, y: 296, w: 64, h: 54, choreId: 'teeth', label: 'Brush teeth', room: 'bath' },
        { kind: 'exit', x: 728, y: 308, w: 58, h: 92, to: 'yard', spawn: { x: 90, y: 360 }, label: EX.toYard || '→ Main & PCH', room: 'bath' },
      ],
    },
    yard: {
      id: 'yard',
      name: locMeta('yard').name || 'Alley to Main & PCH',
      floorY: FLOOR,
      sky: ['#38bdf8', '#7dd3fc', '#fef9c3'],
      ground: '#f0d78c',
      groundAccent: '#e4c76b',
      props: [
        { kind: 'houseFacade', x: 0, y: 120, w: 200, h: 280 },
        { kind: 'fence', x: 0, y: 320, w: 800, h: 80 },
        { kind: 'path', x: 180, y: 360, w: 520, h: 120 },
        { kind: 'trash', x: 620, y: 330, w: 70, h: 55, choreId: 'trash', label: 'Take out trash' },
        { kind: 'garden', x: 400, y: 310, w: 120, h: 70, choreId: 'plants_out', label: 'Water garden' },
        { kind: 'mailbox', x: 250, y: 340, w: 48, h: 60, choreId: 'mailbox', label: 'Check mail' },
        { kind: 'tree', x: 500, y: 200, scale: 1 },
        { kind: 'tree', x: 680, y: 220, scale: 0.85 },
        { kind: 'exit', x: 0, y: 280, w: 55, h: 120, to: 'house', spawn: { x: 360, y: 360 }, label: EX.toHouse || '← 9th Street home' },
        { kind: 'exit', x: 745, y: 300, w: 55, h: 100, to: 'street', spawn: { x: 80, y: 360 }, label: EX.toStreet || '→ Main Street downtown' },
      ],
    },
    street: {
      id: 'street',
      name: locMeta('street').name || 'Main Street',
      floorY: FLOOR,
      sky: ['#38bdf8', '#7dd3fc', '#fff7ed'],
      ground: '#c8c8cc',
      groundAccent: '#3f3f46',
      props: [
        { kind: 'road', x: 0, y: 370, w: 800, h: 110 },
        { kind: 'artcenter', x: 4, y: 205, w: 68, h: 108, label: 'HB Art Center' },
        { kind: 'shop', x: 78, y: 188, w: 92, h: 172, shop: 'sugarShack', label: shopMeta('sugarShack').label || 'Sugar Shack Cafe' },
        { kind: 'shop', x: 176, y: 188, w: 92, h: 172, shop: 'jans', label: shopMeta('jans').label || "Jan's Health Bar" },
        { kind: 'shop', x: 274, y: 186, w: 98, h: 176, shop: 'nokaoi', label: shopMeta('nokaoi').label || 'No Ka Oi' },
        { kind: 'shop', x: 378, y: 186, w: 98, h: 176, shop: 'cafe', label: shopMeta('cafe').label || "Wahoo's Fish Tacos" },
        { kind: 'shop', x: 482, y: 190, w: 88, h: 168, shop: 'market', choreId: 'groceries', label: CH.groceries || shopMeta('market').label || 'Grocery run' },
        { kind: 'shop', x: 576, y: 192, w: 82, h: 166, shop: 'boutique', label: shopMeta('boutique').label || 'Bloom Boutique' },
        { kind: 'shop', x: 664, y: 178, w: 62, h: 178, shop: 'salon', label: shopMeta('salon').label || "Bonnie's Salon" },
        { kind: 'shop', x: 730, y: 190, w: 62, h: 166, shop: 'wellness', label: shopMeta('wellness').label || 'Main St Wellness' },
        { kind: 'npc', id: 'bonnie', x: 648, y: 330, w: 50, h: 70, label: 'Bonnie' },
        { kind: 'bench', x: 720, y: 330, w: 70, h: 45 },
        { kind: 'lamp', x: 280, y: 250 },
        { kind: 'lamp', x: 480, y: 250 },
        { kind: 'litter', x: 420, y: 355, w: 100, h: 40, choreId: 'litter', label: CH.litter || 'Pick up litter on Main' },
        { kind: 'tree', x: 50, y: 210, scale: 0.9 },
        { kind: 'exit', x: 0, y: 300, w: 50, h: 100, to: 'yard', spawn: { x: 700, y: 360 }, label: '← Alley home' },
        { kind: 'exit', x: 748, y: 300, w: 52, h: 100, to: 'pch', spawn: { x: 80, y: 360 }, label: EX.toPCH || '→ Pacific Coast Hwy' },
      ],
    },
    pch: {
      id: 'pch',
      name: locMeta('pch').name || 'Pacific Coast Highway',
      floorY: FLOOR,
      sky: ['#4a9fd4', '#87ceeb', '#f5e6c8'],
      ground: '#c8c8cc',
      groundAccent: '#3f3f46',
      props: [
        { kind: 'road', x: 0, y: 360, w: 800, h: 110 },
        { kind: 'pchArch', x: 120, y: 280, w: 100, h: 80, label: L.LANDMARKS?.mainPch || 'Main Street & PCH' },
        { kind: 'surfMuseum', x: 40, y: 200, w: 90, h: 100, label: L.LANDMARKS?.surfMuseum || 'International Surfing Museum' },
        { kind: 'bench', x: 200, y: 305, w: 90, h: 48 },
        { kind: 'bench', x: 380, y: 295, w: 90, h: 48 },
        { kind: 'tree', x: 680, y: 205, scale: 0.7 },
        { kind: 'exit', x: 0, y: 290, w: 52, h: 110, to: 'street', spawn: { x: 720, y: 360 }, label: EX.fromPCH || '← Main Street' },
        { kind: 'exit', x: 748, y: 290, w: 52, h: 110, to: 'pacCity', spawn: { x: 80, y: 360 }, label: EX.toPacCity || '→ Pacific City' },
      ],
    },
    pacCity: {
      id: 'pacCity',
      name: locMeta('pacCity').name || 'Pacific City',
      floorY: FLOOR,
      sky: ['#5eb0d8', '#87ceeb', '#fef3c7'],
      ground: '#e8c872',
      groundAccent: '#d4a843',
      props: [
        { kind: 'road', x: 0, y: 360, w: 800, h: 110 },
        { kind: 'pacCityArch', x: 380, y: 240, w: 120, h: 90, label: L.LANDMARKS?.pacCity || 'Pacific City' },
        { kind: 'pcShop', x: 60, y: 200, w: 85, h: 95, label: 'Plant Food & Wine' },
        { kind: 'pcShop', x: 180, y: 198, w: 85, h: 95, label: 'Mendocino Farms' },
        { kind: 'pcShop', x: 300, y: 195, w: 90, h: 98, label: 'Boots' },
        { kind: 'pcShop', x: 520, y: 195, w: 90, h: 98, label: 'SteelCraft' },
        { kind: 'strand', x: 0, y: 340, w: 200, h: 80, label: L.LANDMARKS?.strand || 'The Strand · beach path' },
        { kind: 'lifeguard', x: 280, y: 220, w: 58, h: 115, label: 'Lifeguard tower · City Beach' },
        { kind: 'beachGym', x: 420, y: 245, w: 125, h: 105, label: L.CAREER_SITES?.trainer || 'City Beach workouts' },
        { kind: 'usOpen', x: 620, y: 210, w: 80, h: 90, label: L.LANDMARKS?.usOpen || 'US Open of Surfing' },
        { kind: 'shorebirds', x: 500, y: 315, w: 140, h: 58, choreId: 'ducks', label: CH.ducks || 'Feed shorebirds on the sand' },
        { kind: 'fireRings', x: 680, y: 330, w: 120, h: 60, label: 'City Beach fire rings' },
        { kind: 'bench', x: 200, y: 305, w: 90, h: 48 },
        { kind: 'bench', x: 450, y: 295, w: 90, h: 48 },
        { kind: 'tree', x: 28, y: 205, scale: 0.65 },
        { kind: 'exit', x: 0, y: 290, w: 52, h: 110, to: 'pch', spawn: { x: 720, y: 360 }, label: EX.fromPacCity || '← Pacific Coast Hwy' },
        { kind: 'exit', x: 748, y: 290, w: 52, h: 110, to: 'park', spawn: { x: 70, y: 360 }, label: EX.toPier || '→ HB Pier' },
      ],
    },
    park: {
      id: 'park',
      name: locMeta('park').name || 'Huntington Beach Pier',
      floorY: FLOOR,
      sky: ['#0077be', '#38bdf8', '#fef9c3'],
      ground: '#e8c872',
      groundAccent: '#d4a843',
      props: [
        { kind: 'beach', x: 0, y: 340, w: 800, h: 140 },
        { kind: 'pier', x: 500, y: 155, w: 280, h: 250, label: L.LANDMARKS?.pier || 'Huntington Beach Pier' },
        { kind: 'rubys', x: 620, y: 180, w: 115, h: 95, label: L.LANDMARKS?.rubys || "Ruby's Diner" },
        { kind: 'volleyball', x: 65, y: 268, w: 155, h: 90, choreId: 'playground', label: CH.playground || 'Tidy beach volleyball courts' },
        { kind: 'bench', x: 175, y: 305, w: 90, h: 48 },
        { kind: 'bench', x: 410, y: 295, w: 90, h: 48 },
        { kind: 'tree', x: 28, y: 205, scale: 0.65 },
        { kind: 'exit', x: 0, y: 290, w: 52, h: 110, to: 'pacCity', spawn: { x: 720, y: 360 }, label: EX.fromPier || '← Pacific City' },
      ],
    },
  };

  function getLocation(id) {
    return LOCATIONS[id || 'house'] || LOCATIONS.house;
  }

  function choresForLocation(locId) {
    const loc = getLocation(locId);
    return loc.props.filter((p) => p.choreId).map((p) => p.choreId);
  }

  function findProp(locId, predicate) {
    return getLocation(locId).props.find(predicate);
  }

  function getFridgeProp(locId) {
    return findProp(locId, (p) => p.kind === 'fridge');
  }

  function getCafeProp(locId) {
    return findProp(locId, (p) => p.kind === 'shop' && p.shop === 'cafe');
  }

  function getRoomAt(x, loc) {
    if (!loc?.rooms?.length) return null;
    const room = loc.rooms.find((r) => x >= r.x && x < r.x + r.w);
    return room?.id || null;
  }

  function footSurface(loc, roomId) {
    if (loc.id === 'street') return 'pavement';
    if (loc.id === 'pch') return 'pavement';
    if (loc.id === 'pacCity' || loc.id === 'park') return 'sand';
    if (loc.id === 'yard') return 'grass';
    if (loc.id === 'house') {
      if (roomId === 'kitchen' || roomId === 'bath') return 'tile';
      return 'wood';
    }
    return 'wood';
  }

  function findPropByChore(choreId) {
    for (const locId of Object.keys(LOCATIONS)) {
      const prop = getLocation(locId).props.find((p) => p.choreId === choreId);
      if (prop) return { locId, prop };
    }
    return null;
  }

  return {
    W,
    H,
    FLOOR,
    LOCATIONS,
    getLocation,
    choresForLocation,
    getFridgeProp,
    getCafeProp,
    getRoomAt,
    footSurface,
    findPropByChore,
  };
})();