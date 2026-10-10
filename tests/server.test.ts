import { test, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../server.js';
import { parseImage } from '../src/services/image.js';
const image = 'data:image/png;base64,aGVsbG8=';
const original = { gemini: process.env.GEMINI_API_KEY, replicate: process.env.REPLICATE_API_TOKEN };
afterEach(() => {
  for (const [key, value] of [['GEMINI_API_KEY', original.gemini], ['REPLICATE_API_TOKEN', original.replicate]]) {
    if (value === undefined) delete process.env[key!]; else process.env[key!] = value;
  }
});
async function request(body: unknown, deps?: Parameters<typeof createApp>[0], endpoint = '/api/colorize') {
  const server = createApp(deps, (_req, res, next) => { res.locals.userId = 'test'; next(); }).listen(0, '127.0.0.1');
  await new Promise<void>(resolve => server.once('listening', resolve));
  try {
    const address = server.address() as { port: number };
    const response = await fetch(`http://127.0.0.1:${address.port}${endpoint}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    return { status: response.status, body: await response.json() };
  } finally { await new Promise<void>(resolve => server.close(() => resolve())); }
}
test('preserves PNG MIME and rejects remote or malformed images', () => {
  assert.equal(parseImage(image).mimeType, 'image/png');
  for (const value of [null, 'https://example.com/photo.jpg', 'data:image/jpeg;base64,???']) assert.throws(() => parseImage(value), TypeError);
});
test('missing credentials returns 503, client keys cannot override configuration', async () => {
  delete process.env.GEMINI_API_KEY; delete process.env.REPLICATE_API_TOKEN;
  assert.equal((await request({ imageBase64: image, apiKey: 'client-secret' })).status, 503);
  assert.equal((await request({ imageBase64: image }, undefined, '/api/analyze-photo')).status, 503);
});
test('validates image and service before calling providers', async () => {
  assert.equal((await request({ imageBase64: 'https://example.com' })).status, 400);
  assert.equal((await request({ imageBase64: image, service: 'other' })).status, 400);
});
test('explicit Replicate uses only Replicate credential and never falls back', async () => {
  process.env.GEMINI_API_KEY = 'gemini-secret'; process.env.REPLICATE_API_TOKEN = 'replicate-secret';
  let geminiCalls = 0;
  const result = await request({ imageBase64: image, service: 'replicate', apiKey: 'client-secret' }, {
    colorizePhotoWithGemini: async () => { geminiCalls++; return image; },
    restoreWithReplicate: async ({ token }) => { assert.equal(token, 'replicate-secret'); throw new Error('secret upstream detail'); }
  });
  assert.equal(result.status, 502); assert.equal(geminiCalls, 0); assert.ok(!JSON.stringify(result).includes('secret'));
});
test('auto falls back to Gemini; explicit Gemini bypasses Replicate', async () => {
  process.env.GEMINI_API_KEY = 'gemini-secret'; process.env.REPLICATE_API_TOKEN = 'replicate-secret';
  let replicateCalls = 0;
  const deps = { colorizePhotoWithGemini: async () => image, restoreWithReplicate: async () => { replicateCalls++; throw new Error('failed'); } };
  const result = await request({ imageBase64: image, service: 'auto' }, deps);
  assert.equal(result.body.provider, 'gemini');
  assert.equal((await request({ imageBase64: image, service: 'gemini' }, deps)).status, 200);
  assert.equal(replicateCalls, 1);
});
