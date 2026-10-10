#!/usr/bin/env bash
# Run once from Cloud Shell, after applying the Supabase migration.
set -euo pipefail
HUMANIS_PROJECT="${HUMANIS_PROJECT:-humanis-511115}"
HUMANIS_REGION="${HUMANIS_REGION:-europe-west1}"
HUMANIS_RUNTIME="humanis-runtime@${HUMANIS_PROJECT}.iam.gserviceaccount.com"
HUMANIS_WORKER="humanis-tasks@${HUMANIS_PROJECT}.iam.gserviceaccount.com"
gcloud services enable cloudtasks.googleapis.com iam.googleapis.com secretmanager.googleapis.com --project "$HUMANIS_PROJECT"
for HUMANIS_ACCOUNT in humanis-runtime humanis-tasks; do
  if ! gcloud iam service-accounts describe "${HUMANIS_ACCOUNT}@${HUMANIS_PROJECT}.iam.gserviceaccount.com" --project "$HUMANIS_PROJECT" >/dev/null 2>&1; then
    gcloud iam service-accounts create "$HUMANIS_ACCOUNT" --project "$HUMANIS_PROJECT"
  fi
done
if ! gcloud tasks queues describe humanis-restorations --project "$HUMANIS_PROJECT" --location "$HUMANIS_REGION" >/dev/null 2>&1; then
  gcloud tasks queues create humanis-restorations --project "$HUMANIS_PROJECT" --location "$HUMANIS_REGION"
fi
gcloud tasks queues update humanis-restorations --project "$HUMANIS_PROJECT" --location "$HUMANIS_REGION" \
  --max-concurrent-dispatches=2 --max-dispatches-per-second=1 \
  --max-attempts=30 --max-retry-duration=86400s --min-backoff=60s --max-backoff=600s
if ! gcloud secrets describe SUPABASE_SECRET_KEY --project "$HUMANIS_PROJECT" >/dev/null 2>&1; then
  gcloud secrets create SUPABASE_SECRET_KEY --project "$HUMANIS_PROJECT" --replication-policy=automatic
fi
read -r -s -p 'Paste the Supabase server secret key (sb_secret_... or legacy service_role), then Enter: ' HUMANIS_SUPABASE_SECRET
printf '\n'
test -n "$HUMANIS_SUPABASE_SECRET"
printf '%s' "$HUMANIS_SUPABASE_SECRET" | gcloud secrets versions add SUPABASE_SECRET_KEY --project "$HUMANIS_PROJECT" --data-file=-
unset HUMANIS_SUPABASE_SECRET
for HUMANIS_SECRET in GEMINI_API_KEY SUPABASE_SECRET_KEY; do
  gcloud secrets add-iam-policy-binding "$HUMANIS_SECRET" --project "$HUMANIS_PROJECT" --member="serviceAccount:${HUMANIS_RUNTIME}" --role=roles/secretmanager.secretAccessor >/dev/null
done
gcloud projects add-iam-policy-binding "$HUMANIS_PROJECT" --member="serviceAccount:${HUMANIS_RUNTIME}" --role=roles/cloudtasks.enqueuer --condition=None >/dev/null
gcloud iam service-accounts add-iam-policy-binding "$HUMANIS_WORKER" --project "$HUMANIS_PROJECT" --member="serviceAccount:${HUMANIS_RUNTIME}" --role=roles/iam.serviceAccountUser >/dev/null
HUMANIS_PROJECT_NUMBER="$(gcloud projects describe "$HUMANIS_PROJECT" --format='value(projectNumber)')"
gcloud iam service-accounts add-iam-policy-binding "$HUMANIS_WORKER" --project "$HUMANIS_PROJECT" --member="serviceAccount:service-${HUMANIS_PROJECT_NUMBER}@gcp-sa-cloudtasks.iam.gserviceaccount.com" --role=roles/iam.serviceAccountTokenCreator >/dev/null
gcloud iam service-accounts add-iam-policy-binding "$HUMANIS_WORKER" --project "$HUMANIS_PROJECT" --member="serviceAccount:service-${HUMANIS_PROJECT_NUMBER}@gcp-sa-cloudtasks.iam.gserviceaccount.com" --role=roles/iam.serviceAccountUser >/dev/null
printf 'Cloud Tasks and runtime identity configured. Run bash scripts/deploy.sh next.\n'
