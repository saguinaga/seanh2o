/** Grok 4.5 ambient NPC lines when you walk up to locals (uses tokens) */
window.BlossomAmbientChat = (function () {
  const COOLDOWN_MS = 38000;
  const SHOW_MS = 14000;
  const WARMUP_MS = 2200;

  let nearKey = null;
  let nearSince = 0;
  let fetchedForKey = null;
  let cooldowns = {};
  let fetching = false;
  let line = null;
  let showUntil = 0;

  function keyFor(near) {
    if (!near) return null;
    if (near.kind === 'npc' && near.id) return `npc-${near.id}`;
    if (near.kind === 'shop' && near.shop) return `shop-${near.shop}`;
    if (near.kind === 'artcenter') return 'artcenter';
    if (near.kind === 'surfMuseum') return 'surf-museum';
    if (near.kind === 'rubys') return 'rubys';
    if (near.kind === 'pchArch') return 'pch-arch';
    if (near.kind === 'pier') return 'pier';
    if (near.kind === 'pacCityArch') return 'pac-arch';
    return near.kind || null;
  }

  function canSpeak(near) {
    if (!near || !window.BlossomAI?.isLive?.()) return false;
    if (near.kind === 'npc') return true;
    if (near.kind === 'shop') return Boolean(BlossomHBLocal?.SHOPS?.[near.shop]?.npc);
    return ['artcenter', 'surfMuseum', 'rubys', 'pchArch', 'pier', 'pacCityArch'].includes(near.kind);
  }

  async function pull(state, near) {
    const k = keyFor(near);
    if (!k || fetching || (cooldowns[k] || 0) > Date.now()) return;
    fetching = true;
    try {
      const res = await BlossomAI.chat(
        'The player just walked up. One vivid in-character greeting (2 sentences max) — hint what they can do here. Format: "Name: dialogue".',
        state,
        near,
        []
      );
      if (res?.reply) {
        line = res.reply.trim();
        showUntil = Date.now() + SHOW_MS;
        cooldowns[k] = Date.now() + COOLDOWN_MS;
        fetchedForKey = k;
      }
    } catch (_) { /* silent */ }
    finally { fetching = false; }
  }

  function tick(state, near) {
    const k = keyFor(near);
    const now = performance.now();
    if (!canSpeak(near)) {
      nearKey = null;
      nearSince = 0;
      if (Date.now() > showUntil) line = null;
      return;
    }
    if (k !== nearKey) {
      nearKey = k;
      nearSince = now;
      if (fetchedForKey !== k) line = null;
    } else if (now - nearSince >= WARMUP_MS && fetchedForKey !== k && !fetching) {
      pull(state, near);
    }
  }

  function getBubble() {
    if (line && Date.now() < showUntil) return { text: line, ai: true };
    return null;
  }

  function clearOnUserChat() {
    line = null;
    showUntil = 0;
  }

  return { tick, getBubble, clearOnUserChat };
})();