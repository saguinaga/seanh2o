/** Prod stability gate — exit 0 only if game shell + Grok 4.5 are up */
const checks = [
  { name: 'play.html', url: 'https://seanaguinaga.com/blossom/play.html', match: /blossom-build/ },
  { name: 'config.js', url: 'https://seanaguinaga.com/blossom/js/config.js', match: /blossom-ai-proxy/ },
  { name: 'ai-health', url: 'https://blossom-ai-proxy.smart-horse.workers.dev/health', match: /"ai":true/ },
];

let failed = 0;
for (const c of checks) {
  const res = await fetch(c.url, { signal: AbortSignal.timeout(12000) });
  const text = await res.text();
  if (!res.ok || !c.match.test(text)) {
    console.error('FAIL', c.name, res.status);
    failed++;
  } else {
    console.log('OK', c.name);
  }
}

const chat = await fetch('https://blossom-ai-proxy.smart-horse.workers.dev/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: 'ping',
    context: { name: 'Test', loc: 'house', nearLabel: 'fridge' },
    history: [],
  }),
  signal: AbortSignal.timeout(45000),
});
const data = await chat.json().catch(() => ({}));
if (!chat.ok || !data.ok || !data.reply) {
  console.error('FAIL chat', data);
  failed++;
} else {
  console.log('OK chat', data.reply.slice(0, 60) + '…');
}

process.exit(failed ? 1 : 0);