/** Extract only numeric status and machine identifiers, never raw provider text. */
export function aiErrorDetails(error: unknown) {
  const value = error as { status?: unknown; message?: unknown; name?: unknown } | null;
  let parsed: any;
  if (typeof value?.message === 'string') {
    try { parsed = JSON.parse(value.message); } catch { /* Non-JSON errors remain private. */ }
  }
  const rawStatus = value?.status ?? parsed?.error?.code;
  const status = typeof rawStatus === 'number' && rawStatus >= 400 && rawStatus <= 599 ? rawStatus : undefined;
  const allowed = new Set(['API_KEY_INVALID', 'API_KEY_EXPIRED', 'API_KEY_SERVICE_BLOCKED', 'SERVICE_DISABLED', 'BILLING_DISABLED', 'RATE_LIMIT_EXCEEDED', 'CONSUMER_INVALID']);
  const reason = parsed?.error?.details?.map((item: any) => item.reason).find((item: unknown) => allowed.has(item as string));
  const code = status === 429 ? 'AI_QUOTA_EXCEEDED' : status === 401 || status === 403 || reason?.startsWith('API_KEY_') ? 'AI_ACCESS_DENIED' : status === 404 ? 'AI_MODEL_UNAVAILABLE' : status === 400 ? 'AI_REQUEST_REJECTED' : 'AI_PROVIDER_FAILED';
  const messages: Record<string, string> = {
    AI_QUOTA_EXCEEDED: 'AI quota exceeded. Check the Gemini API quota and billing.',
    AI_ACCESS_DENIED: 'Gemini access denied. Check the server API key and its permissions.',
    AI_MODEL_UNAVAILABLE: 'The configured AI model is unavailable for this API key.',
    AI_REQUEST_REJECTED: 'Gemini rejected the request. Check the image and API configuration.',
    AI_PROVIDER_FAILED: 'AI processing failed. Please retry.'
  };
  return { status, reason, code, message: messages[code] };
}
