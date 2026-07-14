/** Refresh Grok OAuth token for xAI API calls. Writes token to stdout. */
import fs from 'fs';
import path from 'path';

const authPath = path.join(process.env.USERPROFILE || process.env.HOME || '', '.grok', 'auth.json');
const auth = JSON.parse(fs.readFileSync(authPath, 'utf8'));
const entry = Object.values(auth)[0];
const clientId = entry.oidc_client_id || 'b1a00492-073a-47ea-816f-4c329264a828';
const refresh = entry.refresh_token;
const expires = entry.expires_at ? Date.parse(entry.expires_at) : 0;

if (entry.key && expires > Date.now() + 120000) {
  process.stdout.write(entry.key);
  process.exit(0);
}

if (!refresh) {
  process.stderr.write('No refresh_token in ~/.grok/auth.json — log into Grok CLI\n');
  process.exit(1);
}

const body = new URLSearchParams({
  grant_type: 'refresh_token',
  refresh_token: refresh,
  client_id: clientId,
});
const res = await fetch('https://auth.x.ai/token', {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body,
});
const data = await res.json().catch(() => ({}));
if (!res.ok || !data.access_token) {
  process.stderr.write(data.error || data.message || res.statusText || 'token refresh failed\n');
  process.exit(1);
}

entry.key = data.access_token;
if (data.refresh_token) entry.refresh_token = data.refresh_token;
if (data.expires_in) {
  entry.expires_at = new Date(Date.now() + Number(data.expires_in) * 1000).toISOString();
}
const key = Object.keys(auth)[0];
auth[key] = entry;
fs.writeFileSync(authPath, JSON.stringify(auth, null, 2));
process.stdout.write(data.access_token);