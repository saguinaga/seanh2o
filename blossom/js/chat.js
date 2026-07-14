/** Context-aware NPC chat + message log */
window.BlossomChat = (function () {
  const MAX_LOG = 24;

  function ctx(state, near) {
    return {
      loc: state?.currentLocation || 'house',
      phase: state?.timeOfDay || 'morning',
      career: state?.careerPath || 'salon',
      near,
      name: state?.name || 'You',
      stars: state?.stars || 0,
      level: state?.level || 1,
      room: state?.currentRoom || null,
    };
  }

  function pick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function replyFor(text, c) {
    const lower = (text || '').toLowerCase().trim();
    const greet = /^(hi|hey|hello|sup|yo)\b/.test(lower);
    const thanks = /thank|ty|thx/.test(lower);
    const help = /help|how|what|where|star|chore/.test(lower);
    const work = /work|job|shift|salon|stage|film|tiktok|career/.test(lower);

    if (c.near?.kind === 'npc' && c.near.id === 'bonnie') {
      if (thanks) return `Bonnie: "You're so welcome, ${c.name}! Keep shining."`;
      if (work) {
        if (c.career === 'salon') return 'Bonnie: "Pop into the salon — I saved you a chair for your shift!"';
        return 'Bonnie: "Dream big, honey. Main street has something for every path."';
      }
      if (greet) return `Bonnie: "Hey ${c.name}! Your hair could run this town someday."`;
      return pick([
        `Bonnie: "The PCH breeze off Main Street is lovely this ${c.phase}, isn't it?"`,
        'Bonnie: "Finish your chores — stars add up faster than you think!"',
        'Bonnie: "Bloom Boutique has cute fits if you\'ve got spare cash."',
      ]);
    }

    if (c.near?.shop === 'wellness') {
      if (c.career === 'coach') return 'Coach mentor: "Ready for a session? Hit E when the green zone lines up!"';
      return 'Reception: "We offer life coaching here — pick the coach path to lead sessions."';
    }

    if (c.near?.kind === 'beachGym' || c.near?.kind === 'gym') {
      if (c.career === 'trainer') return 'Beach coach: "Pier workout shift — sand warm-up, reps, ocean cool-down!"';
      return 'Local: "City Beach trainers run afternoon shifts by the pier."';
    }

    if (c.near?.shop === 'boutique') {
      if (help) return 'Clerk: "Earn stars and cash on Main street, then try something new on!"';
      return pick([
        'Clerk: "That color would look amazing on you!"',
        'Clerk: "We just got striped tees — very downtown HB."',
      ]);
    }

    if (c.near?.shop === 'sugarShack') {
      if (c.phase === 'afternoon') return 'Sugar Shack: "Main St classic — grab lunch for +5⭐!"';
      return 'Sugar Shack: "We\'re the morning spot locals hit before the pier — lunch opens afternoon!"';
    }
    if (c.near?.shop === 'jans') {
      if (c.phase === 'afternoon') return "Jan's: \"Smoothie bowl lunch? Tap to order — +5⭐ energy.\"";
      return "Jan's: \"Health bar on Main — afternoon lunch hour, you know the drill.\"";
    }
    if (c.near?.shop === 'nokaoi') {
      if (c.phase === 'afternoon') return 'No Ka Oi: "Hawaiian plate lunch — loco moco vibes, +5⭐!"';
      return 'No Ka Oi: "Island kitchen fires up for lunch in the afternoon — aloha from Main St."';
    }
    if (c.near?.shop === 'cafe') {
      if (c.phase === 'afternoon') return "Wahoo's crew: \"Fish taco lunch rush! Pick a meal for +5⭐.\"";
      return "Wahoo's crew: \"Kitchen opens for lunch in the afternoon — HB original since '88!\"";
    }

    if (c.near?.shop === 'market') {
      return 'Shopkeeper: "Fresh fruit for grocery errands — check your chore list!"';
    }

    if (c.loc === 'house') {
      if (thanks) return `Mom: "Anytime, sweetheart. I'm proud of you, ${c.name}."`;
      if (help) {
        if (c.room === 'kitchen') return 'Mom: "Dishes by the sink — E to interact when they\'re on today\'s list."';
        if (c.room === 'bedroom') return 'Mom: "Make your bed and homework first — easy stars!"';
        return 'Mom: "Green exit by the front door leads outside for yard chores."';
      }
      if (work) {
        const em = { salon: '💇', broadway: '🎭', tiktoker: '📱', coach: '🌱', trainer: '💪' }[c.career] || '✨';
        return `Mom: "Follow your ${em} dream — practice at home, work on Main street."`;
      }
      if (greet) return `Mom: "Morning, ${c.name}! ${c.stars} stars so far — keep blooming."`;
      return pick([
        `Mom: "It's ${c.phase} — don't skip ${c.phase === 'morning' ? 'breakfast' : c.phase === 'afternoon' ? 'lunch' : 'dinner'}!`,
        'Mom: "Sweep the living room when it\'s on your chore list."',
        'Pet: *wags tail and boops your leg*',
      ]);
    }

    if (c.loc === 'yard') {
      if (help) return 'Neighbor: "Mailbox and trash are easy stars — green path to Main street!"';
      if (greet) return `Neighbor: "Hey ${c.name}! Lovely ${c.phase} — you heading to Main & PCH?"`;
      return pick([
        'Neighbor: "Water the garden when it\'s on your list — quick 5⭐."',
        'Pet: *happy spin*',
        'Neighbor: "I heard Bonnie\'s hiring level 3 dreamers!"',
      ]);
    }

    if (c.loc === 'street') {
      if (work) {
        if (c.career === 'broadway') return 'Passerby: "HB Art Center is on Main — break a leg!"';
        if (c.career === 'tiktoker') return 'Passerby: "Film corner at home, post from the studio shift!"';
        if (c.career === 'coach') return 'Passerby: "Main St Wellness — great coaching path!"';
        if (c.career === 'trainer') return 'Passerby: "Pacific City beach gym — sand reps before the pier!"';
        return 'Passerby: "Bonnie\'s on Main hires local talent — you\'ve got this!"';
      }
      if (help) return 'Passerby: "Sugar Shack, Jan\'s, No Ka Oi, Wahoo\'s on Main — then PCH east to Pacific City and the pier."';
      return pick([
        'Passerby: "Pick up litter when you see it — neighbors appreciate it!"',
        `Passerby: "Pretty ${c.phase} light on the cobblestones."`,
        'Street musician: *soft whistle*',
      ]);
    }

    if (c.loc === 'pch') {
      if (help) return 'Local: "Surf museum behind you — walk east to Pacific City, then the pier."';
      if (c.near?.kind === 'surfMuseum') return 'Curator: "Surf City history starts here — Pacific City is just down PCH."';
      if (greet) return `Local: "Hey ${c.name}! Main Street west, Pacific City east — big ${c.phase} out here."`;
      return pick([
        'Local: "Main & PCH — you can smell the ocean from here."',
        'Local: "International Surfing Museum is worth a peek before you hit Pacific City."',
        'Seagull: *screech over the highway*',
      ]);
    }

    if (c.loc === 'pacCity') {
      if (work && c.career === 'trainer') return 'Beach coach: "Pacific City gym shift — sand warm-up, pier cool-down!"';
      if (help) return 'Local: "Boardwalk shops, The Strand, fire rings — pier is east past US Open banners."';
      if (c.near?.kind === 'pcShop') return `Shopper: "${c.near.label || 'Pacific City'} — best sunset spot before Ruby\'s."`;
      if (c.near?.kind === 'usOpen') return 'Surfer: "US Open week the whole beach vibes different — you\'ll see."';
      if (greet) return `Local: "Welcome to Pacific City, ${c.name}! Strand to the sand, pier at the end."`;
      return pick([
        'Local: "Pacific City boardwalk — Mendocino Farms lunch, then the pier."',
        'Local: "Fire rings fill up at sunset — locals know the good spots."',
        'Local: "Walk The Strand — it\'s the whole HB beach experience."',
        'Seabird: *squawk squawk*',
      ]);
    }

    if (c.loc === 'park') {
      if (help) return 'Lifeguard: "Feed shorebirds or tidy volleyball courts — Ruby\'s is at the end of the pier!"';
      if (c.near?.kind === 'rubys') return "Ruby's host: \"Burgers and shakes since the pier opened — classic HB.\"";
      return pick([
        'Local: "Best sunset from the pier — walk Main to Pacific City like we always do."',
        'Seabird: *squawk squawk*',
        'Local: "US Open week the whole beach vibes different — you\'ll see."',
        'Local: "Volleyball courts fill up by afternoon — locals know the good nets."',
      ]);
    }

    if (thanks) return `${c.name}: "Spreading good vibes!"`;
    if (greet) return `You: "Hey Main Street! (${c.stars}⭐)"`;
    return pick([
      `You: "${text}" — the ocean breeze carries it toward the pier.`,
      'A salty breeze off City Beach carries your words away.',
      `You (${c.career} path): *practices quietly*`,
    ]);
  }

  function speakerFrom(reply) {
    const idx = reply.indexOf(':');
    if (idx > 0 && idx < 24) return reply.slice(0, idx).trim();
    return '…';
  }

  function bodyFrom(reply) {
    const idx = reply.indexOf(':');
    if (idx > 0 && idx < 24) return reply.slice(idx + 1).trim();
    return reply;
  }

  function renderLog(entries) {
    const el = document.getElementById('chatLog');
    if (!el) return;
    el.innerHTML = entries.map((e) => {
      const tail = e.streaming ? '<span class="chat-log__cursor">▌</span>' : '';
      const ai = e.streaming ? ' chat-log__line--stream' : '';
      return `<div class="chat-log__line${ai}"><span class="chat-log__who">${e.who}</span> ${e.text}${tail}</div>`;
    }).join('');
    el.scrollTop = el.scrollHeight;
  }

  function appendLog(who, text, store) {
    store.push({ who, text });
    while (store.length > MAX_LOG) store.shift();
    renderLog(store);
  }

  function replyLocal(text, state, near, logStore) {
    const c = ctx(state, near);
    const reply = replyFor(text, c);
    const who = speakerFrom(reply);
    const body = bodyFrom(reply);
    appendLog(who, body, logStore);
    window.BlossomPet?.onChat?.(who);
    return { reply, who, body, ai: false };
  }

  function sendLocal(text, state, near, logStore) {
    const trimmed = (text || '').trim();
    if (!trimmed) return null;
    appendLog('You', trimmed, logStore);
    return replyLocal(trimmed, state, near, logStore);
  }

  function send(text, state, near, logStore) {
    return sendLocal(text, state, near, logStore);
  }

  function beginStreamLine(store) {
    const entry = { who: '…', text: '', streaming: true };
    store.push(entry);
    renderLog(store);
    return entry;
  }

  function finishStreamLine(entry, reply, store) {
    entry.streaming = false;
    entry.who = speakerFrom(reply);
    entry.text = bodyFrom(reply);
    renderLog(store);
    return { who: entry.who, body: entry.text };
  }

  async function sendAsync(text, state, near, logStore) {
    const trimmed = (text || '').trim();
    if (!trimmed) return null;
    appendLog('You', trimmed, logStore);

    const typingEl = document.getElementById('chatTyping');
    if (typingEl) {
      typingEl.hidden = false;
      typingEl.textContent = 'NPC is thinking…';
    }

    let reply = null;
    let usedAi = false;
    if (window.BlossomAI) {
      const aiOn = await BlossomAI.isEnabled();
      if (aiOn) {
        const streamLine = beginStreamLine(logStore);
        if (typingEl) typingEl.textContent = 'SpaceXAI is typing…';
        const onToken = (partial) => {
          streamLine.text = bodyFrom(partial) || partial;
          if (partial.includes(':')) streamLine.who = speakerFrom(partial);
          renderLog(logStore);
        };
        if (BlossomAI.supportsStream?.()) {
          reply = await BlossomAI.chatStream(trimmed, state, near, logStore, onToken);
        }
        if (!reply) {
          streamLine.text = '…';
          reply = await BlossomAI.chat(trimmed, state, near, logStore);
          if (reply) onToken(reply);
        }
        if (reply) {
          const parsed = finishStreamLine(streamLine, reply, logStore);
          usedAi = true;
          if (typingEl) typingEl.hidden = true;
          window.BlossomPet?.onChat?.(parsed.who);
          return { reply, who: parsed.who, body: parsed.body, ai: true };
        }
        logStore.pop();
        renderLog(logStore);
      }
    }

    if (typingEl) typingEl.hidden = true;
    return replyLocal(trimmed, state, near, logStore);
  }

  return { send, sendAsync, sendLocal, replyFor, ctx, appendLog, speakerFrom, bodyFrom };
})();