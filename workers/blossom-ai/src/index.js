const XAI_BASE = 'https://api.x.ai/v1';
const XAI_MODEL = 'grok-4.5-latest';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  });
}

function personaFor(ctx) {
  const near = String(ctx.nearLabel || '').toLowerCase();
  const loc = String(ctx.loc || '');
  if (near.includes('bonnie')) return 'Bonnie — salon owner on Main Street HB, warm mentor.';
  if (near.includes('surf museum')) return 'Curator — International Surfing Museum on PCH.';
  if (near.includes('pacific city') || loc === 'pacCity') return 'Jordan — Pacific City regular, boardwalk and pier walks.';
  if (near.includes('ruby')) return "Dana — Ruby's Diner on the Huntington Beach Pier.";
  if (loc === 'street') return 'Locals on Main Street HB — eats, shops, pier at PCH.';
  if (loc === 'house') return 'Mom — 9th Street cottage, chores, meals, proud HB parent.';
  return 'A friendly Huntington Beach local near Main Street.';
}

function npcSystemPrompt(ctx) {
  const persona = personaFor(ctx);
  const chores = ctx.undoneChores?.length
    ? `Today's undone chores: ${ctx.undoneChores.join(', ')}.`
    : 'All listed chores done for now.';
  const meals = ctx.mealsLeft?.length
    ? `Meals still needed: ${ctx.mealsLeft.join(', ')}.`
    : 'All meals eaten today.';
  return [
    'You are an NPC in "Blossom Life" — a cozy 3D life-sim in Huntington Beach, California.',
    `Speak ONLY as: ${persona}`,
    `Player "${ctx.name || 'You'}" · Level ${ctx.level || 1} · ${ctx.stars || 0}/${ctx.starGoal || 50} stars · $${ctx.money ?? 10}.`,
    `Zone: ${ctx.locationName || ctx.zoneLabel || ctx.loc} · ${ctx.phase || 'morning'}.`,
    `Nearby: ${ctx.nearLabel || 'open area'}. ${chores} ${meals}`,
    'Rules:',
    '- Reply in character. Format exactly: "Name: dialogue".',
    '- 2-3 vivid sentences. Warm Surf City energy.',
    '- Never mention AI, APIs, or models.',
    '- Stay under 320 characters total.',
  ].join('\n');
}

function buildMessages(payload) {
  const { message, context, history } = payload;
  const messages = [{ role: 'system', content: npcSystemPrompt(context || {}) }];
  (history || []).slice(-10).forEach((h) => {
    if (h.role && h.content) messages.push({ role: h.role, content: h.content });
  });
  messages.push({ role: 'user', content: message || '' });
  return messages;
}

async function xaiChat(env, messages, stream) {
  const key = env.XAI_API_KEY;
  return fetch(`${XAI_BASE}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: XAI_MODEL,
      messages,
      max_tokens: 320,
      temperature: 0.82,
      stream,
    }),
  });
}

async function proxyChat(env, payload) {
  if (!env.XAI_API_KEY) return { ok: false, error: 'no_key' };
  const res = await xaiChat(env, buildMessages(payload), false);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return { ok: false, error: 'api_error', message: data?.error?.message || res.statusText };
  }
  const text = data?.choices?.[0]?.message?.content?.trim();
  if (!text) return { ok: false, error: 'empty' };
  return { ok: true, reply: text, model: XAI_MODEL };
}

async function proxyChatStream(env, payload) {
  if (!env.XAI_API_KEY) return json({ ok: false, error: 'no_key' });
  const xaiRes = await xaiChat(env, buildMessages(payload), true);
  if (!xaiRes.ok) {
    const data = await xaiRes.json().catch(() => ({}));
    return json({ ok: false, error: 'api_error', message: data?.error?.message || xaiRes.statusText });
  }
  const headers = {
    ...cors,
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  };
  const stream = new ReadableStream({
    async start(controller) {
      const enc = new TextEncoder();
      const dec = new TextDecoder();
      let buffer = '';
      const reader = xaiRes.body.getReader();
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += dec.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';
          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            const data = line.slice(6).trim();
            if (data === '[DONE]') {
              controller.enqueue(enc.encode('data: [DONE]\n\n'));
              continue;
            }
            try {
              const j = JSON.parse(data);
              const token = j.choices?.[0]?.delta?.content;
              if (token) controller.enqueue(enc.encode(`data: ${JSON.stringify({ token })}\n\n`));
            } catch { /* skip */ }
          }
        }
        controller.enqueue(enc.encode('data: [DONE]\n\n'));
      } finally {
        controller.close();
      }
    },
  });
  return new Response(stream, { headers });
}

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: cors });
    }
    const url = new URL(request.url);
    const path = url.pathname.replace(/\/$/, '') || '/';

    if (path === '/health' || path.endsWith('/health')) {
      return json({
        ok: true,
        ai: Boolean(env.XAI_API_KEY),
        model: XAI_MODEL,
        stream: true,
      });
    }

    if ((path === '/chat/stream' || path.endsWith('/chat/stream')) && request.method === 'POST') {
      try {
        const payload = await request.json();
        return await proxyChatStream(env, payload);
      } catch (e) {
        return json({ ok: false, error: 'server', message: String(e) }, 500);
      }
    }

    if ((path === '/chat' || path.endsWith('/chat')) && request.method === 'POST') {
      try {
        const payload = await request.json();
        return json(await proxyChat(env, payload));
      } catch (e) {
        return json({ ok: false, error: 'server', message: String(e) }, 500);
      }
    }

    return json({ ok: false, error: 'not_found', path }, 404);
  },
};