/** Authored NPC / shop greetings — no AI */
window.BlossomLocals = (function () {
  const SHOP = {
    sugarShack: [
      'Sugar Shack crew: "Morning regulars already lined up — grab lunch later for stars!"',
      'Barista: "Main Street smells like espresso and salt air today."',
    ],
    jans: [
      'Jan\'s crew: "Smoothie weather. Your bloom list still got room?"',
      'Regular: "Jan says hi — health bar\'s hopping this afternoon."',
    ],
    nokaoi: [
      'No Ka Oi: "Aloha! Plate lunch hits different after a pier walk."',
      'Chef: "We save the good poke for locals who explore."',
    ],
    cafe: [
      'Wahoo\'s crew: "HB original fish tacos — Quinn\'s dad approved."',
      'Counter: "PCH surfers just rolled in. You blooming today?"',
    ],
    market: [
      'Clerk: "Grocery bloom? Grab list items and head back to 9th."',
      'Neighbor: "Market run counts — stars add up quick."',
    ],
    boutique: [
      'Jade: "New fits drop when you earn Main Street stamps."',
      'Jade: "Bloom Boutique loves a passport collector."',
    ],
    salon: [
      'Bonnie: "Honey, chair\'s open if your career bloom is work today."',
      'Bonnie: "Main Street salon energy — you look ready to bloom."',
    ],
    wellness: [
      'Coach: "Breathe in — wellness bloom is about showing up."',
      'Reception: "Session slots fill up after lunch phase."',
    ],
  };

  const SPOT = {
    bonnie: [
      'Bonnie: "Level up and I\'ll put you to work for real — Surf City style."',
      'Bonnie: "Pop in when your career bloom says salon — E to interact."',
    ],
    artcenter: [
      'Director: "Broadway bloom? Hit your marks at the Art Center."',
    ],
    pier: [
      'Local: "End of the pier — Ruby\'s smells like fries and nostalgia."',
    ],
    rubys: [
      'Host: "Ruby\'s at the pier — landmark stamp worth the walk."',
    ],
    pchArch: [
      'Tourist: "Main meets PCH — stamp this moment in your passport."',
    ],
    pacCityArch: [
      'Skater: "Pacific City arch — boardwalk starts here."',
    ],
    surfMuseum: [
      'Curator: "Surf history on PCH — museum bloom when you\'re ready."',
    ],
  };

  function key(near) {
    if (!near) return null;
    if (near.kind === 'npc' && near.id) return `npc-${near.id}`;
    if (near.kind === 'shop' && near.shop) return near.shop;
    if (SPOT[near.kind]) return near.kind;
    return null;
  }

  function pool(near) {
    if (!near) return null;
    if (near.kind === 'npc' && near.id === 'bonnie') return SPOT.bonnie;
    if (near.kind === 'shop' && near.shop) return SHOP[near.shop];
    return SPOT[near.kind] || null;
  }

  function greeting(near, state) {
    const lines = pool(near);
    if (!lines?.length) return null;
    const day = state?.day || 1;
    const k = key(near) || 'x';
    const idx = (day + k.length) % lines.length;
    return lines[idx];
  }

  return { greeting };
})();