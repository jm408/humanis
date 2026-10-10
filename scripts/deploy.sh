#!/usr/bin/env bash
# Run from a clean checkout of the desired Humanis commit.
set -euo pipefail
cd "$(dirname "$0")/.."
if [[ -n "$(git status --porcelain)" ]]; then
  printf 'Deploy from a clean checkout so the displayed commit matches the deployed source.\n' >&2
  exit 1
fi
HUMANIS_PROJECT="${HUMANIS_PROJECT:-humanis-511115}"
HUMANIS_REGION="${HUMANIS_REGION:-europe-west1}"
HUMANIS_URL="${HUMANIS_URL:-https://humanis-621197441599.europe-west1.run.app}"
HUMANIS_COMMIT="$(git rev-parse HEAD)"
HUMANIS_IMAGE="${HUMANIS_REGION}-docker.pkg.dev/${HUMANIS_PROJECT}/cloud-run-source-deploy/humanis:${HUMANIS_COMMIT:0:7}"
gcloud builds submit . --project "$HUMANIS_PROJECT" --region "$HUMANIS_REGION" \
  --config cloudbuild.yaml --substitutions="_COMMIT=${HUMANIS_COMMIT},_IMAGE=${HUMANIS_IMAGE}"
# Existing Supabase URL, publishable key and allowed emails are retained.
gcloud run deploy humanis --project "$HUMANIS_PROJECT" --region "$HUMANIS_REGION" \
  --image "$HUMANIS_IMAGE" --port 8080 --timeout 300 --memory 1Gi --concurrency 4 \
  --service-account="humanis-runtime@${HUMANIS_PROJECT}.iam.gserviceaccount.com" \
  --no-invoker-iam-check \
  --update-secrets="GEMINI_API_KEY=GEMINI_API_KEY:latest,SUPABASE_SECRET_KEY=SUPABASE_SECRET_KEY:latest" \
  --update-env-vars="APP_URL=${HUMANIS_URL},TASKS_PROJECT=${HUMANIS_PROJECT},TASKS_LOCATION=${HUMANIS_REGION},TASKS_QUEUE=humanis-restorations,TASKS_SERVICE_ACCOUNT=humanis-tasks@${HUMANIS_PROJECT}.iam.gserviceaccount.com"
gcloud run services add-iam-policy-binding humanis --project "$HUMANIS_PROJECT" --region "$HUMANIS_REGION" \
  --member="serviceAccount:humanis-tasks@${HUMANIS_PROJECT}.iam.gserviceaccount.com" --role=roles/run.invoker >/dev/null
curl --fail --silent --show-error "${HUMANIS_URL}/api/version"
printf '\n'
