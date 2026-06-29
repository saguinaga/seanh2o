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
      props: [
        { kind: 'rug', x: 280, y: 340, w: 200, h: 60 },
        { kind: 'bed', x: 90, y: 130, w: 150, h: 88, choreId: 'bed', label: 'Make bed' },
        { kind: 'desk', x: 200, y: 228, w: 95, h: 62, choreId: 'homework', label: 'Homework' },
        { kind: 'sink', x: 500, y: 168, w: 95, h: 72, choreId: 'dishes', label: 'Dishes' },
        { kind: 'fridge', x: 710, y: 175, w: 72, h: 92, label: 'Fridge' },
        { kind: 'couch', x: 340, y: 298, w: 170, h: 72 },
        { kind: 'plant', x: 42, y: 288, w: 52, h: 58, choreId: 'plants', label: 'Water plants' },
        { kind: 'bath', x: 590, y: 138, w: 70, h: 55, choreId: 'teeth', label: 'Brush teeth' },
        { kind: 'broom', x: 300, y: 368, w: 110, h: 42, choreId: 'sweep', label: 'Sweep floor' },
        { kind: 'studio', x: 560, y: 248, w: 100, h: 90, label: 'Film corner' },
        { kind: 'exit', x: 748, y: 300, w: 52, h: 100, to: 'yard', spawn: { x: 90, y: 360 }, label: 'Go outside →' },
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
        { kind: 'exit', x: 0, y: 280, w: 55, h: 120, to: 'house', spawn: { x: 700, y: 360 }, label: '← Home' },
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
        { kind: 'shop', x: 320, y: 190, w: 130, h: 180, shop: 'cafe', label: 'Café' },
        { kind: 'shop', x: 530, y: 175, w: 150, h: 200, shop: 'salon', label: 'Bonnie\'s Salon' },
        { kind: 'npc', id: 'bonnie', x: 520, y: 330, w: 50, h: 70, label: 'Bonnie' },
        { kind: 'bench', x: 700, y: 330, w: 80, h: 45 },
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

  return {
    W,
    H,
    FLOOR,
    LOCATIONS,
    getLocation,
    choresForLocation,
    getFridgeProp,
    getCafeProp,
  };
})();