import { test, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../server.js';
const originalFetch = globalThis.fetch;
const envKeys = ['SUPABASE_URL', 'SUPABASE_PUBLISHABLE_KEY', 'AUTH_ALLOWED_EMAILS'];
const originalEnv = Object.fromEntries(envKeys.map(key => [key, process.env[key]]));
afterEach(() => { globalThis.fetch = originalFetch; for (const key of envKeys) { if (originalEnv[key] === undefined) delete process.env[key]; else process.env[key] = originalEnv[key]; } });
async function run(callback: (url: string) => Promise<void>) {
  const server = createApp().listen(0, '127.0.0.1');
  await new Promise<void>(resolve => server.once('listening', resolve));
  try { await callback(`http://127.0.0.1:${(server.address() as { port: number }).port}`); }
  finally { await new Promise<void>(resolve => server.close(() => resolve())); }
}
function configure() { process.env.SUPABASE_URL = 'https://auth-test.supabase.co'; process.env.SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_test'; process.env.AUTH_ALLOWED_EMAILS = 'invited@example.com'; }
function userMock(email: string, confirmed = true) {
  globalThis.fetch = async (input, init) => {
    if (String(input).startsWith('https://auth-test.supabase.co/auth/v1/user')) {
      assert.equal(new Headers(init?.headers).get('authorization'), 'Bearer verified-token');
      return new Response(JSON.stringify({ id: 'verified-id', email, email_confirmed_at: confirmed ? '2026-10-10' : null }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }
    return originalFetch(input, init);
  };
}
test('missing configuration fails closed, health stays public', async () => {
  for (const key of envKeys) delete process.env[key];
  await run(async url => { assert.equal((await fetch(url + '/api/health')).status, 200); assert.equal((await fetch(url + '/api/colorize', { method: 'POST' })).status, 503); });
});
test('both paid endpoints reject anonymous callers before parsing a body', async () => {
  configure();
  await run(async url => { for (const route of ['/api/colorize', '/api/analyze-photo', '/api/photos']) assert.equal((await fetch(url + route, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: 'bad-json' })).status, 401); });
});
test('confirmed and approved email is required after server verification', async () => {
  configure(); userMock('outsider@example.com');
  await run(async url => { assert.equal((await fetch(url + '/api/auth/me', { headers: { Authorization: 'Bearer verified-token' } })).status, 403); });
  userMock('invited@example.com', false);
  await run(async url => { assert.equal((await fetch(url + '/api/auth/me', { headers: { Authorization: 'Bearer verified-token' } })).status, 403); });
});
test('verified approved session can access account endpoint', async () => {
  configure(); userMock('invited@example.com');
  await run(async url => { const response = await fetch(url + '/api/auth/me', { headers: { Authorization: 'Bearer verified-token' } }); assert.equal(response.status, 200); assert.deepEqual(await response.json(), { userId: 'verified-id' }); });
});
test('forged tokens and empty allowlist are rejected', async () => {
  configure();
  globalThis.fetch = async (input, init) => String(input).startsWith('https://auth-test.supabase.co') ? new Response(JSON.stringify({ message: 'Invalid JWT' }), { status: 401 }) : originalFetch(input, init);
  await run(async url => { assert.equal((await fetch(url + '/api/auth/me', { headers: { Authorization: 'Bearer forged' } })).status, 401); });
  process.env.AUTH_ALLOWED_EMAILS = '';
  await run(async url => { assert.equal((await fetch(url + '/api/auth/me', { headers: { Authorization: 'Bearer forged' } })).status, 503); });
});

test('internal worker rejects anonymous callers independently of user authentication', async () => {
  await run(async url => { assert.equal((await fetch(url + '/api/internal/process-job', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({jobId:'fake'}) })).status, 401); });
});
