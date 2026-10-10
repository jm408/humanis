import { createClient, type SupabaseClient } from '@supabase/supabase-js';
let client: Promise<SupabaseClient> | undefined;
export function getAuthClient(): Promise<SupabaseClient> {
  return client ??= (async () => {
    const response = await fetch('/api/auth/config');
    const config = await response.json();
    if (!response.ok) throw new Error(config.error || 'Sign-in is not configured yet.');
    return createClient(config.url, config.publishableKey);
  })().catch(error => { client = undefined; throw error; });
}
export async function authenticatedFetch(input: string, init: RequestInit = {}) {
  const auth = await getAuthClient();
  const { data } = await auth.auth.getSession();
  if (!data.session) throw new Error('Sign in to continue.');
  const headers = new Headers(init.headers);
  headers.set('Authorization', `Bearer ${data.session.access_token}`);
  const response = await fetch(input, { ...init, headers });
  if (response.status === 401) { await auth.auth.signOut({ scope: 'local' }); throw new Error('Your session expired. Sign in again.'); }
  return response;
}
