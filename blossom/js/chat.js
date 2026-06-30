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
        `Bonnie: "The harbor breeze is lovely this ${c.phase}, isn't it?"`,
        'Bonnie: "Finish your chores — stars add up faster than you think!"',
        'Bonnie: "Bloom Boutique has cute fits if you\'ve got spare cash."',
      ]);
    }

    if (c.near?.shop === 'boutique') {
      if (help) return 'Clerk: "Earn stars and cash on Main street, then try something new on!"';
      return pick([
        'Clerk: "That color would look amazing on you!"',
        'Clerk: "We just got striped tees — very harbor-chic."',
      ]);
    }

    if (c.near?.shop === 'cafe') {
      if (c.phase === 'afternoon') return 'Barista: "Lunch rush! Pick a meal for +5⭐ energy."';
      return 'Barista: "Kitchen opens for lunch in the afternoon — see you then!"';
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
        const em = { salon: '💇', broadway: '🎭', tiktoker: '📱' }[c.career] || '✨';
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
      if (greet) return `Neighbor: "Hey ${c.name}! Lovely ${c.phase} in the harbor."`;
      return pick([
        'Neighbor: "Water the garden when it\'s on your list — quick 5⭐."',
        'Pet: *happy spin*',
        'Neighbor: "I heard Bonnie\'s hiring level 3 dreamers!"',
      ]);
    }

    if (c.loc === 'street') {
      if (work) {
        if (c.career === 'broadway') return 'Passerby: "Harbor Stage is past the park — break a leg!"';
        if (c.career === 'tiktoker') return 'Passerby: "Film corner at home, post from the studio shift!"';
        return 'Passerby: "Bonnie\'s Salon hires harbor talent — you\'ve got this!"';
      }
      if (help) return 'Passerby: "Shops line Main street — café for lunch, boutique for style."';
      return pick([
        'Passerby: "Pick up litter when you see it — neighbors appreciate it!"',
        `Passerby: "Pretty ${c.phase} light on the cobblestones."`,
        'Street musician: *soft whistle*',
      ]);
    }

    if (c.loc === 'park') {
      if (help) return 'Park ranger: "Feed the ducks or tidy the playground for stars!"';
      return pick([
        'Park ranger: "Leaves drift in the afternoon — cozy harbor park."',
        'Duck: *quack quack*',
        'Park ranger: "Harbor Stage hosts Broadway dreamers at night."',
      ]);
    }

    if (thanks) return `${c.name}: "Spreading good vibes!"`;
    if (greet) return `You: "Hello harbor! (${c.stars}⭐)"`;
    return pick([
      `You: "${text}" — the harbor echoes kindly.`,
      'A gentle breeze carries your words away.',
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
    el.innerHTML = entries.map((e) => (
      `<div class="chat-log__line"><span class="chat-log__who">${e.who}</span> ${e.text}</div>`
    )).join('');
    el.scrollTop = el.scrollHeight;
  }

  function appendLog(who, text, store) {
    store.push({ who, text });
    while (store.length > MAX_LOG) store.shift();
    renderLog(store);
  }

  function send(text, state, near, logStore) {
    const trimmed = (text || '').trim();
    if (!trimmed) return null;
    const c = ctx(state, near);
    appendLog('You', trimmed, logStore);
    const reply = replyFor(trimmed, c);
    const who = speakerFrom(reply);
    const body = bodyFrom(reply);
    appendLog(who, body, logStore);
    window.BlossomPet?.onChat?.(who);
    return { reply, who, body };
  }

  return { send, replyFor, ctx, appendLog, speakerFrom, bodyFrom };
})();