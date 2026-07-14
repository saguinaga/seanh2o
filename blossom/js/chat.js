/** NPC chat — grok-4.5-latest via server proxy, no scripted fallback */
window.BlossomChat = (function () {
  const MAX_LOG = 24;
  const OFFLINE_MSG = "Nobody's around to talk right now — keep exploring Surf City.";
  const BUSY_MSG = 'Hold on — someone nearby is still talking.';
  const FAIL_MSG = "Couldn't get a reply — try again in a moment.";

  function speakerFrom(reply) {
    const idx = reply.indexOf(':');
    if (idx > 0 && idx < 24) return reply.slice(0, idx).trim();
    return 'Local';
  }

  function bodyFrom(reply) {
    const idx = reply.indexOf(':');
    if (idx > 0 && idx < 24) return reply.slice(idx + 1).trim();
    return reply;
  }

  function userError(err) {
    const msg = String(err || '').toLowerCase();
    if (msg === 'busy') return BUSY_MSG;
    if (msg.includes('no_key') || msg.includes('not_found') || msg.includes('unavailable') || msg.includes('offline')) {
      return OFFLINE_MSG;
    }
    return FAIL_MSG;
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
    const body = userError(message);
    appendLog('Note', body, store, { error: true });
    return { who: 'Note', body, ai: false, error: true };
  }

  async function sendAsync(text, state, near, logStore) {
    const trimmed = (text || '').trim();
    if (!trimmed) return null;
    if (!window.BlossomAI?.isLive?.()) return failReply(logStore, 'offline');
    appendLog('You', trimmed, logStore);

    const typingEl = document.getElementById('chatTyping');
    if (typingEl) {
      typingEl.hidden = false;
      typingEl.textContent = '…';
    }

    if (!window.BlossomAI?.hasEndpoint?.()) {
      if (typingEl) typingEl.hidden = true;
      return failReply(logStore, 'offline');
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