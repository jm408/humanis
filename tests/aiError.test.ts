import { test } from 'node:test';
import assert from 'node:assert/strict';
import { aiErrorDetails } from '../src/services/aiError.js';
test('logs machine details and never raw provider messages or keys', () => {
  const result = aiErrorDetails({ status: 403, message: JSON.stringify({ error: { message: 'secret-key photo-data', details: [{ reason: 'API_KEY_SERVICE_BLOCKED' }] } }) });
  assert.equal(result.code, 'AI_ACCESS_DENIED'); assert.equal(result.reason, 'API_KEY_SERVICE_BLOCKED');
  assert.ok(!JSON.stringify(result).includes('secret-key'));
  assert.ok(!JSON.stringify(aiErrorDetails({ message: 'secret-key' })).includes('secret-key'));
});
test('distinguishes quota, model and malformed request failures', () => {
  assert.equal(aiErrorDetails({ status: 429 }).code, 'AI_QUOTA_EXCEEDED');
  assert.equal(aiErrorDetails({ status: 404 }).code, 'AI_MODEL_UNAVAILABLE');
  assert.equal(aiErrorDetails({ status: 400 }).code, 'AI_REQUEST_REJECTED');
});
