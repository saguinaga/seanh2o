/** Locations, props, exits — leave the house for outdoor chores */
window.BlossomWorld = (function () {
  const W = 800;
  const H = 480;
  const FLOOR = 400;

  const LOCATIONS = {
    house: {
      id: 'house',
      name: 'Home',
      floorY: FLOOR,
      sky: ['#e8f4fc', '#fef3c7', '#fde68a'],
      ground: '#b8956b',
      groundAccent: '#9a7b55',
      rooms: [
        { id: 'bedroom', label: 'Bedroom', x: 0, w: 252, wall: '#ede9fe', floor: '#c9b896', trim: '#a78bfa' },
        { id: 'living', label: 'Living room', x: 252, w: 260, wall: '#fef9c3', floor: '#b8956b', trim: '#f59e0b' },
        { id: 'kitchen', label: 'Kitchen', x: 512, w: 172, wall: '#fff1f2', floor: '#d6d3d1', trim: '#f472b6' },
        { id: 'bath', label: 'Bathroom', x: 684, w: 116, wall: '#e0f2fe', floor: '#93c5fd', trim: '#38bdf8' },
      ],
      walls: [
        { x: 252, doorY: 308, doorH: 88 },
        { x: 512, doorY: 308, doorH: 88 },
      ],
      props: [
        /* Bedroom — back wall */
        { kind: 'bed', x: 38, y: 298, w: 148, h: 90, choreId: 'bed', label: 'Make bed', room: 'bedroom' },
        { kind: 'desk', x: 148, y: 322, w: 88, h: 58, choreId: 'homework', label: 'Homework', room: 'bedroom' },
        { kind: 'plant', x: 18, y: 328, w: 46, h: 54, choreId: 'plants', label: 'Water plants', room: 'bedroom' },
        /* Living room */
        { kind: 'couch', x: 288, y: 312, w: 168, h: 76, room: 'living' },
        { kind: 'rug', x: 318, y: 358, w: 128, h: 36, room: 'living' },
        { kind: 'broom', x: 418, y: 348, w: 92, h: 40, choreId: 'sweep', label: 'Sweep floor', room: 'living' },
        { kind: 'studio', x: 262, y: 272, w: 86, h: 78, label: 'Film corner', room: 'living' },
        /* Kitchen — counters along back wall */
        { kind: 'sink', x: 524, y: 286, w: 90, h: 70, choreId: 'dishes', label: 'Dishes', room: 'kitchen' },
        { kind: 'fridge', x: 612, y: 274, w: 64, h: 92, label: 'Fridge', room: 'kitchen' },
        /* Bathroom */
        { kind: 'bath', x: 702, y: 296, w: 64, h: 54, choreId: 'teeth', label: 'Brush teeth', room: 'bath' },
        /* Front door */
        { kind: 'exit', x: 728, y: 308, w: 58, h: 92, to: 'yard', spawn: { x: 90, y: 360 }, label: 'Go outside →', room: 'bath' },
      ],
    },
    yard: {
      id: 'yard',
      name: 'Front yard',
      floorY: FLOOR,
      sky: ['#7dd3fc', '#bae6fd', '#ecfdf5'],
      ground: '#4ade80',
      groundAccent: '#22c55e',
      props: [
        { kind: 'houseFacade', x: 0, y: 120, w: 200, h: 280 },
        { kind: 'fence', x: 0, y: 320, w: 800, h: 80 },
        { kind: 'path', x: 180, y: 360, w: 520, h: 120 },
        { kind: 'trash', x: 620, y: 330, w: 70, h: 55, choreId: 'trash', label: 'Take out trash' },
        { kind: 'garden', x: 400, y: 310, w: 120, h: 70, choreId: 'plants_out', label: 'Water garden' },
        { kind: 'mailbox', x: 250, y: 340, w: 48, h: 60, choreId: 'mailbox', label: 'Check mail' },
        { kind: 'tree', x: 500, y: 200, scale: 1 },
        { kind: 'tree', x: 680, y: 220, scale: 0.85 },
        { kind: 'exit', x: 0, y: 280, w: 55, h: 120, to: 'house', spawn: { x: 360, y: 360 }, label: '← Home' },
        { kind: 'exit', x: 745, y: 300, w: 55, h: 100, to: 'street', spawn: { x: 80, y: 360 }, label: 'Main street →' },
      ],
    },
    street: {
      id: 'street',
      name: 'Main street',
      floorY: FLOOR,
      sky: ['#93c5fd', '#e0f2fe', '#fef9c3'],
      ground: '#94a3b8',
      groundAccent: '#64748b',
      props: [
        { kind: 'road', x: 0, y: 370, w: 800, h: 110 },
        { kind: 'shop', x: 120, y: 180, w: 140, h: 190, shop: 'market', choreId: 'groceries', label: 'Market errand' },
        { kind: 'shop', x: 300, y: 192, w: 115, h: 178, shop: 'boutique', label: 'Bloom Boutique' },
        { kind: 'shop', x: 430, y: 190, w: 130, h: 180, shop: 'cafe', label: 'Café' },
        { kind: 'shop', x: 575, y: 175, w: 150, h: 200, shop: 'salon', label: 'Bonnie\'s Salon' },
        { kind: 'npc', id: 'bonnie', x: 565, y: 330, w: 50, h: 70, label: 'Bonnie' },
        { kind: 'bench', x: 720, y: 330, w: 70, h: 45 },
        { kind: 'lamp', x: 280, y: 250 },
        { kind: 'lamp', x: 480, y: 250 },
        { kind: 'litter', x: 420, y: 355, w: 100, h: 40, choreId: 'litter', label: 'Pick up litter' },
        { kind: 'tree', x: 50, y: 210, scale: 0.9 },
        { kind: 'exit', x: 0, y: 300, w: 50, h: 100, to: 'yard', spawn: { x: 700, y: 360 }, label: '← Yard' },
        { kind: 'exit', x: 748, y: 300, w: 52, h: 100, to: 'park', spawn: { x: 70, y: 360 }, label: 'Park →' },
      ],
    },
    park: {
      id: 'park',
      name: 'Harbor park',
      floorY: FLOOR,
      sky: ['#38bdf8', '#a7f3d0', '#ecfccb'],
      ground: '#86efac',
      groundAccent: '#4ade80',
      props: [
        { kind: 'pond', x: 480, y: 300, w: 260, h: 100 },
        { kind: 'bridge', x: 440, y: 330, w: 80, h: 40 },
        { kind: 'bench', x: 200, y: 320, w: 90, h: 48 },
        { kind: 'bench', x: 350, y: 310, w: 90, h: 48 },
        { kind: 'ducks', x: 560, y: 340, w: 90, h: 50, choreId: 'ducks', label: 'Feed ducks' },
        { kind: 'playground', x: 80, y: 260, w: 140, h: 100, choreId: 'playground', label: 'Tidy playground' },
        { kind: 'stage', x: 300, y: 200, w: 160, h: 120, label: 'Harbor Stage' },
        { kind: 'tree', x: 300, y: 180, scale: 1.1 },
        { kind: 'tree', x: 650, y: 200, scale: 1 },
        { kind: 'tree', x: 150, y: 220, scale: 0.75 },
        { kind: 'exit', x: 0, y: 290, w: 52, h: 110, to: 'street', spawn: { x: 720, y: 360 }, label: '← Main street' },
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
    if (loc.id === 'yard' || loc.id === 'park') return 'grass';
    if (loc.id === 'house') {
      if (roomId === 'kitchen' || roomId === 'bath') return 'tile';
      return 'wood';
    }
    return 'wood';
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
  };
})();