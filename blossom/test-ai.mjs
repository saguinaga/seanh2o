/**
 * Blossom AI smoke test — health + one chat round-trip.
 * Local:  BLOSSOM_PORT=3002 node blossom/test-ai.mjs
 * Prod:   node blossom/test-ai.mjs  (defaults to Cloudflare worker)
 */
const base = (process.env.BLOSSOM_AI_BASE || 'https://blossom-ai-proxy.smart-horse.workers.dev').replace(/\/$/, '');
const anon = process.env.SUPABASE_ANON_KEY || '';

async function get(path, headers = {}) {
  const res = await fetch(`${base}${path}`, { headers, signal: AbortSignal.timeout(10000) });
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = { raw: text }; }
  return { res, data };
}

async function post(path, body, headers = {}) {
  const res = await fetch(`${base}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(45000),
  });
  const data = await res.json().catch(() => ({}));
  return { res, data };
}

function sbHeaders() {
  if (!base.includes('supabase.co') || !anon) return {};
  return { Authorization: `Bearer ${anon}`, apikey: anon };
}

const ctx = {
  name: 'Test',
  level: 1,
  stars: 0,
  starGoal: 35,
  money: 10,
  loc: 'house',
  locationName: 'Home',
  zoneLabel: '9th Street cottage',
  phase: 'morning',
  career: 'salon',
  nearLabel: 'kitchen fridge (9th Street cottage)',
  undoneChores: ['Make bed', 'Take out trash'],
  mealsLeft: ['breakfast'],
};

let failed = 0;

console.log(`\nBlossom AI test → ${base}\n`);

const health = await get('/health');
console.log('HEALTH', health.res.status, JSON.stringify(health.data));
if (!health.res.ok || health.data?.code === 'NOT_FOUND') {
  console.error('FAIL: health endpoint missing or not deployed');
  failed++;
} else if (!health.data?.ai) {
  console.error('FAIL: XAI_API_KEY not configured on server');
  failed++;
} else if (!String(health.data?.model || '').startsWith('grok-4.5')) {
  console.error('FAIL: expected grok-4.5-latest, got', health.data?.model);
  failed++;
} else {
  console.log('OK: health');
}

if (!failed) {
  const chat = await post('/chat', {
    message: 'What should I do first today?',
    model: 'grok-4.5-latest',
    context: ctx,
    history: [],
  }, sbHeaders());
  console.log('CHAT', chat.res.status, chat.data?.ok ? 'ok' : chat.data);
  if (!chat.res.ok || !chat.data?.ok || !chat.data?.reply) {
    console.error('FAIL: chat', chat.data?.message || chat.data?.error);
    failed++;
  } else if (!chat.data.reply.includes(':')) {
    console.error('FAIL: reply missing "Name: dialogue" format:', chat.data.reply);
    failed++;
  } else {
    console.log('OK: reply →', chat.data.reply.slice(0, 120) + (chat.data.reply.length > 120 ? '…' : ''));
  }
}

console.log(failed ? `\n${failed} check(s) failed\n` : '\nAll checks passed\n');
process.exit(failed ? 1 : 0);