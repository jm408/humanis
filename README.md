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
