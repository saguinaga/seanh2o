/**
 * Blossom local dev — static files + SpaceXAI (xAI) chat proxy.
 * Usage: copy blossom/.env.example → blossom/.env, set XAI_API_KEY, then npm run blossom
 * Open: http://localhost:3000/blossom/play.html (or BLOSSOM_PORT)
 */
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

function loadDotEnv() {
  const envPath = path.join(__dirname, '.env');
  if (!fs.existsSync(envPath)) return;
  const text = fs.readFileSync(envPath, 'utf8');
  text.split('\n').forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const eq = trimmed.indexOf('=');
    if (eq < 1) return;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = val;
  });
}

loadDotEnv();

const PORT = Number(process.env.BLOSSOM_PORT || 3000);
const XAI_API_KEY = process.env.XAI_API_KEY || '';
const XAI_MODEL = 'grok-4.5';
const XAI_BASE = 'https://api.x.ai/v1';

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
};

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

function personaFor(ctx) {
  const near = (ctx.nearLabel || '').toLowerCase();
  const loc = ctx.loc || '';
  if (near.includes('bonnie')) {
    return 'Bonnie — salon owner on Main Street HB, warm mentor, grew up near 9th Street.';
  }
  if (near.includes('surfing museum') || near.includes('surf museum')) {
    return 'Curator — International Surfing Museum on PCH, Surf City history, boards from every era.';
  }
  if (near.includes('main st & pch') || near.includes('pch intersection')) {
    return 'Local — Main Street & PCH corner, points you toward Pacific City and the pier.';
  }
  if (near.includes('pacific city') || near.includes('plant food') || near.includes('mendocino')
    || near.includes('steelcraft') || near.includes('boots') || near.includes('strand')) {
    return 'Jordan — Pacific City regular, boardwalk shops, The Strand, sunset walks to the pier.';
  }
  if (loc === 'pacCity') {
    return 'Pacific City locals — boardwalk, City Beach, US Open zone, fire rings, Strand to the pier.';
  }
  if (loc === 'pch') {
    return 'PCH locals — highway breeze, surf museum, gateway to Pacific City and Main Street.';
  }
  if (near.includes('sugar shack')) {
    return 'Lynn — Sugar Shack Cafe on Main Street, breakfast regulars, knows every surfer\'s order.';
  }
  if (near.includes("jan's") || near.includes('jans') || near.includes('health bar')) {
    return 'Alex — Jan\'s Health Bar on Main, smoothies and bowls, wellness crowd, local since forever.';
  }
  if (near.includes('no ka oi') || near.includes('nokaoi')) {
    return 'Kai — No Ka Oi on Main Street, Hawaiian plates, island aloha, HB local favorite.';
  }
  if (near.includes('wahoo') || near.includes('café') || near.includes('cafe') || near.includes('taco')) {
    return 'Eddie — crew at Wahoo\'s Fish Tacos on Main (started in HB!), lunch expert, knows every regular.';
  }
  if (near.includes('boutique') || near.includes('bloom')) {
    return 'Jade — stylist at Bloom Boutique on Main, fashion-forward, downtown HB native.';
  }
  if (near.includes('market') || near.includes('grocery')) {
    return 'Rosa — clerk at downtown market on Main, Sunday farmers market gossip, fresh produce tips.';
  }
  if (near.includes('wellness') || near.includes('main st wellness')) {
    return 'Dr. Kim — Main St Wellness coach, calm and encouraging, PCH morning walks.';
  }
  if (near.includes('beach') || near.includes('workout') || near.includes('trainer') || near.includes('gym')
    || near.includes('us open') || near.includes('fire ring') || near.includes('lifeguard')) {
    return 'Tyler — City Beach trainer in Pacific City, sand reps, US Open week energy, pier runs.';
  }
  if (near.includes('ruby')) {
    return 'Dana — host at Ruby\'s Diner on the Huntington Beach Pier, burgers, shakes, pier history.';
  }
  if (near.includes('art center') || near.includes('broadway')) {
    return 'Mia — HB Art Center on Main Street, theater kid energy, knows every local show.';
  }
  if (near.includes('pier') || ctx.loc === 'park') {
    return 'Lifeguard Pat — Huntington City Beach & pier, shorebirds, volleyball, Ruby\'s at the end.';
  }
  if (ctx.loc === 'street') {
    return 'Locals on Main Street HB — Sugar Shack, Jan\'s, No Ka Oi, Wahoo\'s, Bonnie\'s, pier at PCH.';
  }
  if (ctx.loc === 'yard') {
    return 'Neighbor Sam — alley toward Main & PCH, mailbox/trash tips, walks to Wahoo\'s.';
  }
  if (ctx.loc === 'house') {
    return 'Mom — 9th Street cottage a few blocks from Main, chores, meals, proud HB parent energy.';
  }
  return 'A friendly Huntington Beach local who lives near Main Street and walks to the pier.';
}

function npcSystemPrompt(ctx) {
  const persona = personaFor(ctx);
  const chores = ctx.undoneChores?.length
    ? `Today's undone chores: ${ctx.undoneChores.join(', ')}.`
    : 'All listed chores done for now.';
  const meals = ctx.mealsLeft?.length
    ? `Meals still needed: ${ctx.mealsLeft.join(', ')}.`
    : 'All meals eaten today.';
  const loop = ctx.worldLoop || '9th St → Main Street → PCH → Pacific City → Pier';
  return [
    `You are an NPC in "Blossom Life" — a cozy 3D life-sim in Huntington Beach. Open world loop: ${loop}.`,
    `Speak ONLY as: ${persona}`,
    `Player "${ctx.name || 'You'}" · Level ${ctx.level || 1} · ${ctx.stars || 0}/${ctx.starGoal || 50} stars · $${ctx.money ?? 10}.`,
    `Zone: ${ctx.locationName || ctx.zoneLabel || ctx.loc} · ${ctx.phase || 'morning'} · Dream path: ${ctx.career || 'salon'}.`,
    `Nearby: ${ctx.nearLabel || 'open area'}. ${chores} ${meals}`,
    'Rules:',
    '- Reply in character. Format exactly: "Name: dialogue" (speaker name, colon, then words).',
    '- 2-3 vivid sentences. Warm Surf City energy — Main St eats, PCH breeze, Pacific City boardwalk, Ruby\'s pier.',
    '- Give practical game tips when asked (chores, meals, walk east to Pacific City/pier, career shifts, stars).',
    '- Never mention AI, APIs, models, or being a language model.',
    '- Stay under 320 characters total.',
  ].join('\n');
}

function buildMessages(payload) {
  const { message, context, history } = payload;
  const messages = [{ role: 'system', content: npcSystemPrompt(context || {}) }];
  (history || []).slice(-8).forEach((h) => {
    if (h.role && h.content) messages.push({ role: h.role, content: h.content });
  });
  messages.push({ role: 'user', content: message });
  return messages;
}

async function xaiChat(messages, stream) {
  return fetch(`${XAI_BASE}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${XAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: XAI_MODEL,
      messages,
      max_tokens: 320,
      temperature: 0.82,
      stream: Boolean(stream),
    }),
  });
}

async function proxyChat(payload) {
  if (!XAI_API_KEY) {
    return { ok: false, error: 'no_key', message: 'Set XAI_API_KEY in blossom/.env for SpaceXAI chat.' };
  }
  const res = await xaiChat(buildMessages(payload), false);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const errMsg = data?.error?.message || data?.message || res.statusText;
    return { ok: false, error: 'api_error', message: errMsg };
  }
  const text = data?.choices?.[0]?.message?.content?.trim();
  if (!text) return { ok: false, error: 'empty', message: 'Empty response from SpaceXAI' };
  return { ok: true, reply: text, model: XAI_MODEL, provider: 'SpaceXAI' };
}

async function proxyChatStream(payload, res) {
  if (!XAI_API_KEY) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: false, error: 'no_key' }));
    return;
  }
  const xaiRes = await xaiChat(buildMessages(payload), true);
  if (!xaiRes.ok) {
    const data = await xaiRes.json().catch(() => ({}));
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      ok: false,
      error: 'api_error',
      message: data?.error?.message || xaiRes.statusText,
    }));
    return;
  }

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  });

  const decoder = new TextDecoder();
  let buffer = '';
  for await (const chunk of xaiRes.body) {
    buffer += decoder.decode(chunk, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';
    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const data = line.slice(6).trim();
      if (data === '[DONE]') {
        res.write('data: [DONE]\n\n');
        continue;
      }
      try {
        const json = JSON.parse(data);
        const token = json.choices?.[0]?.delta?.content;
        if (token) res.write(`data: ${JSON.stringify({ token })}\n\n`);
      } catch { /* skip malformed */ }
    }
  }
  res.write('data: [DONE]\n\n');
  res.end();
}

function pathname(req) {
  return decodeURIComponent((req.url || '/').split('?')[0]);
}

function serveStatic(req, res) {
  let rel = pathname(req);
  if (rel === '/' || rel === '/blossom/play' || rel === '/blossom/play/') {
    rel = '/blossom/play.html';
  }
  const filePath = path.join(ROOT, rel.replace(/^\//, ''));
  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403); res.end('Forbidden'); return;
  }
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404); res.end('Not found'); return;
    }
    const ext = path.extname(filePath).toLowerCase();
    const headers = { 'Content-Type': MIME[ext] || 'application/octet-stream' };
    if (/\/blossom\//.test(rel)) {
      headers['Cache-Control'] = 'no-store, no-cache, must-revalidate';
      headers.Pragma = 'no-cache';
      headers.Expires = '0';
    }
    res.writeHead(200, headers);
    res.end(data);
  });
}

const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204); res.end(); return;
  }

  const pathOnly = pathname(req);

  if (pathOnly === '/api/blossom/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      ok: true,
      ai: Boolean(XAI_API_KEY),
      model: XAI_MODEL,
      provider: 'SpaceXAI',
      stream: true,
    }));
    return;
  }

  if (pathOnly === '/api/blossom/chat/stream' && req.method === 'POST') {
    try {
      const body = await readBody(req);
      const payload = JSON.parse(body || '{}');
      await proxyChatStream(payload, res);
    } catch (e) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: false, error: 'server', message: e.message }));
    }
    return;
  }

  if (pathOnly === '/api/blossom/chat' && req.method === 'POST') {
    try {
      const body = await readBody(req);
      const payload = JSON.parse(body || '{}');
      const result = await proxyChat(payload);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(result));
    } catch (e) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: false, error: 'server', message: e.message }));
    }
    return;
  }

  serveStatic(req, res);
});

server.listen(PORT, () => {
  console.log(`\n🏄 Blossom dev server → http://localhost:${PORT}/blossom/play.html`);
  console.log(`   SpaceXAI (xAI): ${XAI_API_KEY ? `ON · ${XAI_MODEL} · streaming` : 'OFF — set XAI_API_KEY in blossom/.env'}\n`);
});