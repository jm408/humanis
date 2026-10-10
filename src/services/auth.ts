import { createClient } from '@supabase/supabase-js';
import type { RequestHandler } from 'express';
export const requireAuth: RequestHandler = async (req, res, next) => {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY;
  const allowed = (process.env.AUTH_ALLOWED_EMAILS || '').split(';').map(email => email.trim().toLowerCase()).filter(Boolean);
  if (!url || !key?.startsWith('sb_publishable_') || !allowed.length) {
    res.status(503).json({ error: 'Private access is not configured yet.', code: 'AUTH_NOT_CONFIGURED' }); return;
  }
  const match = req.headers.authorization?.match(/^Bearer (\S+)$/);
  if (!match) { res.status(401).json({ error: 'Sign in to continue.', code: 'AUTH_REQUIRED' }); return; }
  try {
    const client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false }, global: { fetch: (input, init) => fetch(input, { ...init, signal: AbortSignal.timeout(10_000) }) } });
    const { data, error } = await client.auth.getUser(match[1]);
    if (error || !data.user) { res.status(401).json({ error: 'Session expired or invalid. Sign in again.', code: 'AUTH_REQUIRED' }); return; }
    if (!data.user.email_confirmed_at || !data.user.email || !allowed.includes(data.user.email.toLowerCase())) {
      res.status(403).json({ error: 'Your account is not approved for the private beta.', code: 'ACCESS_DENIED' }); return;
    }
    res.locals.userId = data.user.id;
    next();
  } catch { res.status(503).json({ error: 'Sign-in verification is temporarily unavailable.', code: 'AUTH_UNAVAILABLE' }); }
};
