/** Zone + landmark discovery — stars, money, HUD flash */
window.BlossomDiscovery = (function () {
  const ZONE_REWARDS = {
    yard: { stars: 2, money: 1, label: '9th Street neighborhood' },
    street: { stars: 5, money: 3, label: 'Main Street downtown' },
    pch: { stars: 5, money: 2, label: 'Pacific Coast Highway' },
    pacCity: { stars: 8, money: 5, label: 'Pacific City' },
    park: { stars: 10, money: 5, label: 'Huntington Beach Pier' },
  };

  const LANDMARKS = [
    { id: 'pch-arch', name: 'Main & PCH', wx: 240, wz: 8, r: 14, stars: 3, money: 2 },
    { id: 'surf-museum', name: 'Surf Museum', wx: 220, wz: -20, r: 12, stars: 4, money: 2 },
    { id: 'pac-city-arch', name: 'Pacific City Arch', wx: 490, wz: -6, r: 14, stars: 5, money: 3 },
    { id: 'us-open', name: 'US Open Zone', wx: 566, wz: -14, r: 14, stars: 4, money: 2 },
    { id: 'pier', name: 'HB Pier', wx: 780, wz: -14, r: 16, stars: 8, money: 4 },
    { id: 'rubys', name: "Ruby's Diner", wx: 790, wz: -18, r: 12, stars: 5, money: 3 },
  ];

  function ensure(state) {
    if (!state.discoveredZones) state.discoveredZones = {};
    if (!state.discoveredLandmarks) state.discoveredLandmarks = {};
  }

  function zoneReward(zoneId, state) {
    ensure(state);
    if (state.discoveredZones[zoneId]) return null;
    const rw = ZONE_REWARDS[zoneId];
    if (!rw) return null;
    state.discoveredZones[zoneId] = true;
    state.stars = (state.stars || 0) + rw.stars;
    state.money = (state.money || 0) + rw.money;
    return rw;
  }

  function checkLandmarks(state, player) {
    ensure(state);
    if (player.wx == null) return null;
    for (const lm of LANDMARKS) {
      if (state.discoveredLandmarks[lm.id]) continue;
      if (Math.hypot(player.wx - lm.wx, player.wz - lm.wz) > lm.r) continue;
      state.discoveredLandmarks[lm.id] = true;
      state.stars = (state.stars || 0) + lm.stars;
      state.money = (state.money || 0) + (lm.money || 0);
      return lm;
    }
    return null;
  }

  function progress(state) {
    ensure(state);
    const zones = Object.keys(ZONE_REWARDS).length;
    const zDone = Object.keys(ZONE_REWARDS).filter((id) => state.discoveredZones[id]).length;
    const lDone = LANDMARKS.filter((lm) => state.discoveredLandmarks[lm.id]).length;
    return { zones: zDone, zonesTotal: zones, landmarks: lDone, landmarksTotal: LANDMARKS.length };
  }

  return { zoneReward, checkLandmarks, progress, LANDMARKS, ZONE_REWARDS };
})();