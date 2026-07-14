/** Grok 4.5 NPC chat — no scripted fallback */
window.BlossomChat = (function () {
  const MAX_LOG = 24;
  const MODEL = 'Grok 4.5';

  function speakerFrom(reply) {
    const idx = reply.indexOf(':');
    if (idx > 0 && idx < 24) return reply.slice(0, idx).trim();
    return MODEL;
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
      let cls = '';
      if (e.streaming) cls += ' chat-log__line--stream';
      if (e.ai) cls += ' chat-log__line--ai';
      if (e.error) cls += ' chat-log__line--error';
      return `<div class="chat-log__line${cls}"><span class="chat-log__who">${e.who}</span> ${e.text}${tail}</div>`;
    }).join('');
    el.scrollTop = el.scrollHeight;
  }

  function appendLog(who, text, store, opts) {
    store.push({ who, text, ai: Boolean(opts?.ai), error: Boolean(opts?.error) });
    while (store.length > MAX_LOG) store.shift();
    renderLog(store);
  }

  function beginStreamLine(store) {
    const entry = { who: '…', text: '', streaming: true, ai: true };
    store.push(entry);
    renderLog(store);
    return entry;
  }

  function finishStreamLine(entry, reply, store) {
    entry.streaming = false;
    entry.ai = true;
    entry.who = speakerFrom(reply);
    entry.text = bodyFrom(reply);
    renderLog(store);
    return { who: entry.who, body: entry.text };
  }

  function failReply(store, message) {
    const body = message || 'Grok 4.5 offline — set XAI_API_KEY (local: blossom/.env · prod: Supabase secret + deploy).';
    appendLog(MODEL, body, store, { error: true });
    return { who: MODEL, body, ai: false, error: true };
  }

  async function sendAsync(text, state, near, logStore) {
    const trimmed = (text || '').trim();
    if (!trimmed) return null;
    appendLog('You', trimmed, logStore);

    const typingEl = document.getElementById('chatTyping');
    if (typingEl) {
      typingEl.hidden = false;
      typingEl.textContent = 'Grok 4.5 is thinking…';
    }

    if (!window.BlossomAI?.hasEndpoint?.()) {
      if (typingEl) typingEl.hidden = true;
      return failReply(logStore, 'Grok 4.5 endpoint missing.');
    }

    const streamLine = beginStreamLine(logStore);
    const onToken = (partial) => {
      streamLine.text = bodyFrom(partial) || partial;
      if (partial.includes(':')) streamLine.who = speakerFrom(partial);
      renderLog(logStore);
    };

    let reply = null;
    let errMsg = null;
    if (BlossomAI.supportsStream?.()) {
      const streamRes = await BlossomAI.chatStream(trimmed, state, near, logStore, onToken);
      if (streamRes?.reply) reply = streamRes.reply;
      else if (streamRes?.error) errMsg = streamRes.error;
    }
    if (!reply) {
      streamLine.text = '…';
      const chatRes = await BlossomAI.chat(trimmed, state, near, logStore);
      if (chatRes?.reply) {
        reply = chatRes.reply;
        onToken(reply);
      } else if (chatRes?.error) {
        errMsg = chatRes.error;
      }
    }

    if (typingEl) typingEl.hidden = true;

    if (reply) {
      const parsed = finishStreamLine(streamLine, reply, logStore);
      window.BlossomPet?.onChat?.(parsed.who);
      return { reply, who: parsed.who, body: parsed.body, ai: true };
    }

    logStore.pop();
    renderLog(logStore);
    return failReply(logStore, errMsg);
  }

  return { sendAsync, appendLog, speakerFrom, bodyFrom };
})();