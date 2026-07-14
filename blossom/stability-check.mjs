/** Prod stability gate — exit 0 only if game shell + Grok 4.5 are up */
const checks = [
  { name: 'play.html', url: 'https://seanaguinaga.com/blossom/play.html', match: /blossom-build/ },
  { name: 'config.js', url: 'https://seanaguinaga.com/blossom/js/config.js', match: /aiChatEnabled\s*=\s*true/ },
  { name: 'grok-health', url: 'https://blossom-ai-proxy.smart-horse.workers.dev/health', match: /grok-4\.5/ },
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

process.exit(failed ? 1 : 0);