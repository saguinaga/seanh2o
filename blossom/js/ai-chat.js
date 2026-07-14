/** SpaceXAI (xAI) NPC chat — server proxy only, key never in browser */
window.BlossomAI = (function () {
  let enabled = null;
  let streaming = false;
  let model = 'grok-4.5';
  let pending = false;

  function apiBase() {
    const base = window.BLOSSOM_CONFIG?.aiChatBase;
    if (base) return String(base).replace(/\/$/, '');
    const cfg = window.BLOSSOM_CONFIG?.aiChatEndpoint;
    if (cfg) {
      if (cfg.includes('/functions/v1/')) return cfg.replace(/\/chat\/?$/, '');
      if (cfg.endsWith('/chat')) return cfg.slice(0, -5);
      return cfg;
    }
    if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
      return `${location.origin}/api/blossom`;
    }
    const sb = window.BLOSSOM_CONFIG?.supabaseUrl;
    if (sb) return `${sb}/functions/v1/blossom-ai`;
    return null;
  }

  function fetchHeaders() {
    const h = { 'Content-Type': 'application/json' };
    const base = apiBase();
    const key = window.BLOSSOM_CONFIG?.supabaseAnonKey;
    if (base?.includes('supabase.co') && key) {
      h.Authorization = `Bearer ${key}`;
      h.apikey = key;
    }
    return h;
  }

  function endpoint() {
    const base = apiBase();
    return base ? `${base}/chat` : null;
  }

  function streamEndpoint() {
    const base = apiBase();
    return base ? `${base}/chat/stream` : null;
  }

  function healthUrl() {
    const base = apiBase();
    return base ? `${base}/health` : null;
  }

  function zoneLabel(locId) {
    const table = {
      house: '9th Street cottage',
      yard: '9th Street neighborhood',
      street: 'Main Street downtown HB',
      pch: 'Pacific Coast Highway (PCH)',
      pacCity: 'Pacific City HB',
      park: 'Huntington Beach Pier',
    };
    return table[locId] || BlossomHBLocal?.loc?.(locId)?.name || locId;
  }

  function nearLabel(near, locId) {
    if (!near) return `open area in ${zoneLabel(locId)}`;
    if (near.kind === 'npc' && near.id === 'bonnie') return "Bonnie's Salon on Main Street";
    if (near.kind === 'fridge') return 'kitchen fridge (9th Street cottage)';
    if (near.kind === 'rubys') return "Ruby's Diner — end of Huntington Beach Pier";
    if (near.kind === 'artcenter') return 'HB Art Center on Main Street';
    if (near.kind === 'pchArch') return 'Main Street & PCH intersection';
    if (near.kind === 'surfMuseum') return 'International Surfing Museum on PCH';
    if (near.kind === 'pacCityArch') return 'Pacific City entrance arch';
    if (near.kind === 'pcShop') return `${near.label || 'shop'} in Pacific City`;
    if (near.kind === 'strand') return 'The Strand beach path in Pacific City';
    if (near.kind === 'beachGym') return 'City Beach workouts in Pacific City';
    if (near.kind === 'volleyball') return 'beach volleyball courts by the pier';
    if (near.kind === 'lifeguard') return 'lifeguard tower at Pacific City / City Beach';
    if (near.kind === 'usOpen') return 'US Open of Surfing zone in Pacific City';
    if (near.kind === 'fireRings') return 'City Beach fire rings in Pacific City';
    if (near.kind === 'pier') return 'Huntington Beach Pier';
    if (near.kind === 'exit') return near.label || 'travel exit';
    if (near.choreId) return `${near.label || near.choreId} chore`;
    if (near.kind === 'shop' && near.shop === 'sugarShack') return 'Sugar Shack Cafe on Main Street';
    if (near.kind === 'shop' && near.shop === 'jans') return "Jan's Health Bar on Main Street";
    if (near.kind === 'shop' && near.shop === 'nokaoi') return 'No Ka Oi on Main Street';
    if (near.kind === 'shop') return `${near.label || near.shop} on Main Street`;
    return near.label || near.kind || `spot in ${zoneLabel(locId)}`;
  }

  function buildContext(state, near) {
    const locId = state.currentLocation || 'house';
    const loc = BlossomWorld.getLocation(locId);
    const done = state.choresDone || {};
    const list = state.todaysChores || [];
    const undoneChores = list.filter((id) => !done[id]).map((id) => {
      return BlossomNavigate?.CHORE_LABELS?.[id] || id;
    });
    const meals = state.mealsEaten || {};
    const mealsLeft = [];
    if (!meals.breakfast) mealsLeft.push('breakfast');
    if (!meals.lunch) mealsLeft.push('lunch');
    if (!meals.dinner) mealsLeft.push('dinner');
    const goal = BlossomGuide?.starsGoal?.(state) ?? 50;
    return {
      name: state.name,
      level: state.level,
      stars: state.stars,
      starGoal: goal,
      money: state.money,
      loc: locId,
      locationName: loc.name,
      zoneLabel: zoneLabel(locId),
      worldLoop: '9th St → Main Street → PCH → Pacific City → Pier',
      phase: state.timeOfDay || BlossomDay.currentPhase(state).id,
      career: state.careerPath,
      room: state.currentRoom,
      nearLabel: nearLabel(near, locId),
      undoneChores,
      mealsLeft,
    };
  }

  function historyFromLog(logStore) {
    return (logStore || []).slice(-10).map((e) => ({
      role: e.who === 'You' ? 'user' : 'assistant',
      content: e.who === 'You' ? e.text : `${e.who}: ${e.text}`,
    }));
  }

  function setBadge(on, meta) {
    const badge = document.getElementById('chatAiBadge');
    const input = document.getElementById('chatInput');
    if (badge) {
      badge.hidden = false;
      badge.classList.toggle('chat-ai-badge--on', on);
      badge.classList.toggle('chat-ai-badge--off', !on);
      badge.textContent = on
        ? `✨ Grok 4.5 · ${meta?.model || model}`
        : '💬 Scripted NPCs — Grok 4.5 loading…';
    }
    if (input) {
      input.placeholder = on
        ? 'Talk to HB locals… (Grok 4.5)'
        : 'Talk to NPCs… (Grok 4.5 connects when ready)';
    }
  }

  async function probe() {
    const health = healthUrl();
    if (!health) {
      enabled = false;
      setBadge(false);
      return false;
    }
    try {
      const res = await fetch(health, {
        headers: fetchHeaders(),
        signal: AbortSignal.timeout(4500),
      });
      const data = await res.json();
      enabled = Boolean(data?.ai);
      streaming = Boolean(data?.stream);
      model = data?.model || model;
      setBadge(enabled, data);
      return enabled;
    } catch {
      enabled = false;
      setBadge(false);
      return false;
    }
  }

  async function isEnabled() {
    if (enabled === null) await probe();
    return enabled;
  }

  function supportsStream() {
    return streaming;
  }

  async function parseSseStream(res, onToken) {
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let full = '';
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';
      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const data = line.slice(6).trim();
        if (data === '[DONE]') continue;
        try {
          const json = JSON.parse(data);
          if (json.token) {
            full += json.token;
            onToken?.(full);
          }
        } catch { /* skip */ }
      }
    }
    return full.trim() || null;
  }

  async function chatStream(message, state, near, logStore, onToken) {
    const ep = streamEndpoint();
    if (!ep || pending) return null;
    pending = true;
    try {
      const res = await fetch(ep, {
        method: 'POST',
        headers: fetchHeaders(),
        body: JSON.stringify({
          message,
          context: buildContext(state, near),
          history: historyFromLog(logStore),
        }),
        signal: AbortSignal.timeout(30000),
      });
      const ct = res.headers.get('content-type') || '';
      if (ct.includes('text/event-stream') && res.ok) {
        return await parseSseStream(res, onToken);
      }
      const data = await res.json().catch(() => ({}));
      if (data?.ok && data.reply) {
        onToken?.(data.reply);
        return data.reply.trim();
      }
      return null;
    } catch {
      return null;
    } finally {
      pending = false;
    }
  }

  async function chat(message, state, near, logStore) {
    const ep = endpoint();
    if (!ep || pending) return null;
    pending = true;
    try {
      const res = await fetch(ep, {
        method: 'POST',
        headers: fetchHeaders(),
        body: JSON.stringify({
          message,
          context: buildContext(state, near),
          history: historyFromLog(logStore),
        }),
        signal: AbortSignal.timeout(28000),
      });
      const data = await res.json();
      if (!data?.ok || !data.reply) return null;
      return data.reply.trim();
    } catch {
      return null;
    } finally {
      pending = false;
    }
  }

  return {
    chat,
    chatStream,
    isEnabled,
    supportsStream,
    probe,
    nearLabel,
    buildContext,
    setBadge,
  };
})();