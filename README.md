# Humanis

Historical photo restoration and colorization studio (React/Vite + Express).

## Local development

Use Node 22 or newer. Run `npm ci`, copy `.env.example` to `.env`, configure the server keys, then `npm run dev`.

## Validation and production

Run `npm run lint`, `npm test`, and `npm run build`. `npm start` serves the built SPA and API on `0.0.0.0:$PORT` (default 3000). `/api/health` is a liveness endpoint and does not call paid providers.

Build the container with `docker build -t humanis .`; run with `docker run --rm -p 8080:8080 --env-file .env -e PORT=8080 humanis`. Cloud Run supplies PORT automatically. Configure runtime secrets GEMINI_API_KEY and optionally REPLICATE_API_TOKEN. Set the Cloud Run request timeout to at least 300 seconds if enabling automatic fallback. No secrets are needed during build.

Credentials are server-side only. Legacy browser-stored keys are removed on startup and incoming `apiKey` fields are ignored. Missing provider configuration returns 503; provider failure returns 502 without upstream secret details. Only JPEG/PNG/WebP Base64 data URLs up to 18 MB are accepted.

`service: gemini` and `service: replicate` never switch providers. `auto` tries Replicate when configured and can fall back to Gemini. The existing Replicate model is CodeFormer restoration; its colorization/context capabilities are not guaranteed. Gemini is the image colorization engine; its image and analysis model IDs can be configured separately. The inspector displays actual errors instead of fabricated diagnostics.

For a public deployment, configure access control and quotas at the hosting boundary: server-side secrets do not themselves prevent visitors from invoking paid endpoints.

The npm lockfile is authoritative. Docker builds and CI use npm ci.

## Private beta authentication

AI endpoints require a Bearer access token verified by Supabase `auth.getUser`; a confirmed email must be in `AUTH_ALLOWED_EMAILS` (semicolon-separated). No authentication bypass exists in production or development. Missing auth configuration or an empty allowlist blocks all AI access. `/api/health` and `/api/auth/config` stay public; the latter exposes only the project URL and public publishable key. Never configure a service_role/secret key there.

Create a Supabase project (EU region), enable email authentication, disable new user signups, and add/invite beta users from Authentication > Users. In Authentication > URL Configuration set Site URL and the exact redirect URL to the Humanis origin with a trailing slash. Configure an email provider/SMTP if the default Supabase sender does not deliver to beta users. Login uses a magic link with `shouldCreateUser: false`. The browser manages session refresh; the server independently checks the current user and approved email on every paid request.

Set SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, and AUTH_ALLOWED_EMAILS at runtime on Cloud Run, then deploy this branch. Existing production remains public until redeployment. Auth configuration changes do not require a frontend rebuild. Sign-out unmounts the studio and clears its in-memory state. Gallery persistence and storage RLS are a separate backlog item; this change creates no public photo bucket or tables.

## Gallery and batch processing (0.3)

Private originals and result versions are stored in Supabase. Individual and batch restorations now use Cloud Tasks with an authenticated worker and persisted job status. See `DEPLOYMENT.md` for the SQL migration, setup and deployment scripts, and acceptance checks. Version/commit appear on the login page and studio footer. At this release there is no billing or retention limit.
