# Humanis 0.3: gallery and background batch processing

The code is ready for staging/production only after the migration and infrastructure steps below. Existing authentication remains mandatory. Do not deploy this release using the old image-only command before configuration; single-photo restoration now uses the durable queue too.

## 1. Apply the Supabase migration

Open the SQL Editor of project `pcgxeefgmiwjmsrwpmmd`. Copy the full contents of `supabase/migrations/202610110001_gallery.sql` into a new query and run it. It creates the photo/job tables, private bucket, owner-scoped read policies and server-only transactional functions. The migration has been tested on a PostgreSQL-compatible PGlite engine with Supabase schema fixtures. No production migration has been executed by Codex.

Verify the bucket `humanis-private` is private. Keep self-service signup disabled and the existing beta email allowlist. Do not loosen RLS policies or expose the server secret key to the browser.

## 2. Fetch the branch in Cloud Shell

```bash
cd /home/jm/humanis-deploy-XarU2C
git pull --ff-only
```

## 3. Configure Cloud Tasks and server secrets

Find the Supabase **server secret key** in project Settings / API Keys (`sb_secret_…`, or the legacy `service_role` key). It differs from the publishable key. Do not paste it into ChatGPT or commit it.

```bash
bash scripts/setup-cloud.sh
```

The script asks for that key with hidden input and stores it in Google Secret Manager. It creates a dedicated Cloud Run runtime account and a Cloud Tasks OIDC account. The runtime can read only the two application secrets and enqueue tasks. The worker endpoint verifies a Google-signed OIDC token, exact service-account email and audience; the application's public sign-in page does not make that endpoint publicly callable.

The queue initially processes at most **2 photos concurrently**, with 1 dispatch per second. Retries use 60–600 second backoff for infrastructure failures. A DB lease lasts 10 minutes; no two workers can claim a job with a live lease. AI errors are saved as failed and require explicit user retry, rather than automatic paid-generation retries. A process crash may require another model call once the lease expires; distributed exactly-once billing cannot be guaranteed.

## 4. Deploy

```bash
bash scripts/deploy.sh
```

The script requires a clean checkout, tags the image with its commit, injects the same commit during the build, and preserves the existing Supabase public configuration and approved emails. The footer and `/api/version` expose version, commit and build timestamp. Build metadata is compiled into the artifact; no keys or `.git` directory are needed in the image.

## 5. Acceptance checks

1. Log in, upload and save one original; refresh and reopen it from Gallery.
2. Restore it; close the browser while it is queued/processing, reopen Gallery and confirm the result appears.
3. Import two photos with common year/location/context; confirm independent progress.
4. Select finished photos and download the ZIP.
5. Produce a second version, reopen an older version in the studio and download it.
6. Delete a completed photo and verify original/results disappear. A running photo cannot be deleted.
7. Confirm an anonymous request to `/api/photos` gets 401 and another account cannot see these photos.
8. Check viewport dragging does not select/tint the images; verify footer commit matches the image tag.

## Operational boundaries

- Imports: at most 50 files per selection, 18 MB per original (JPEG/PNG/WebP). Files upload sequentially; keep the page open until upload and enqueue complete. Accepted queued work continues independently of the browser.
- Admission: at most 100 queued/processing jobs per user. Same request ID is idempotent; each explicit new restoration creates a new version with its context snapshot.
- Gallery: 25 photos per page, refresh every 10 seconds while visible. Image URLs expire after 15 minutes; refresh/reopen to renew. Originals and every successful result remain until the user deletes the photo. No subscription retention limits are implemented yet.
- A job persisted before a failed task enqueue is repaired when its gallery page is reopened or the same request is retried. There is no scheduled outbox sweeper in this release.
- Delete failures leave a visible “Deletion pending” row so cleanup can be retried. Removing a photo deletes its original and all stored result versions; table rows are removed only after Storage cleanup succeeds.
- Do not delete users directly from Supabase without storage cleanup: auth row cascade removes metadata, but does not remove Storage objects. Account deletion workflow is future work.
- Current studio fine-tuning sliders remain local and are not saved as a version or applied to the ZIP; downloads contain the AI output. Batch jobs currently use Gemini, consistent with the deployed provider configuration.
- Signed URLs are temporary access capabilities; anyone who receives a URL can use it until expiry. Never place them in public pages or logs.
