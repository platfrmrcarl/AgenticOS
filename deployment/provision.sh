#!/usr/bin/env bash
set -euo pipefail

# ─── Configuration ─────────────────────────────────────────────────────────────
# Pass these via environment variables before running this script.
#
#   PROJECT_ID=your-gcp-project-id \
#   BILLING_ACCOUNT=XXXXXX-XXXXXX-XXXXXX \
#   REGION=us-east1 \
#   ./deployment/provision.sh
#
PROJECT_ID="${PROJECT_ID:-agenticos-platfrmr}"
BILLING_ACCOUNT="01489D-B2BF75-E7E924"
REGION="${REGION:-us-east1}"
APP_NAME="agenticos"
TF_BUCKET="${PROJECT_ID}-tf-state"

if [[ -z "$PROJECT_ID" ]]; then
  echo "ERROR: PROJECT_ID environment variable is required."
  echo "  Usage: PROJECT_ID=my-project BILLING_ACCOUNT=XXXXXX-XXXXXX-XXXXXX ./deployment/provision.sh"
  exit 1
fi

echo "Project:    $PROJECT_ID"
echo "App name:   $APP_NAME"
echo "Region:     $REGION"
echo "TF bucket:  $TF_BUCKET"
echo ""

# ─── Create & configure project ────────────────────────────────────────────────
if gcloud projects describe "$PROJECT_ID" &>/dev/null; then
  echo "==> Project $PROJECT_ID already exists, skipping create."
else
  echo "==> Creating GCP project: $PROJECT_ID"
  gcloud projects create "$PROJECT_ID" --name="$APP_NAME"
fi
gcloud config set project "$PROJECT_ID"

# Link billing — required before APIs can be enabled.
if [[ -n "${BILLING_ACCOUNT:-}" ]]; then
  echo "==> Linking billing account: $BILLING_ACCOUNT"
  gcloud billing projects link "$PROJECT_ID" \
    --billing-account="$BILLING_ACCOUNT"
else
  echo "WARNING: BILLING_ACCOUNT env var not set — APIs won't activate until billing is linked."
  echo "  Run: gcloud billing projects link $PROJECT_ID --billing-account=<ACCOUNT_ID>"
fi

# ─── Enable APIs ───────────────────────────────────────────────────────────────
echo "==> Enabling required APIs..."
gcloud services enable \
  run.googleapis.com \
  sqladmin.googleapis.com \
  secretmanager.googleapis.com \
  artifactregistry.googleapis.com \
  cloudbuild.googleapis.com \
  compute.googleapis.com \
  iam.googleapis.com \
  cloudresourcemanager.googleapis.com \
  monitoring.googleapis.com \
  storage.googleapis.com

# ─── Terraform state bucket ────────────────────────────────────────────────────
echo "==> Creating Terraform state bucket: $TF_BUCKET"
gcloud storage buckets create "gs://${TF_BUCKET}" \
  --location="$REGION" \
  --uniform-bucket-level-access

gcloud storage buckets update "gs://${TF_BUCKET}" \
  --versioning

# ─── Cloud Build SA setup ──────────────────────────────────────────────────────
# Terraform creates the SA; here we connect GitHub and set up the trigger manually
# after `terraform apply` if using the Cloud Build GitHub app.
echo ""
echo "==> Cloud Build service account will be created by Terraform."
echo "    After terraform apply, connect your GitHub repo in the Cloud Build UI:"
echo "    https://console.cloud.google.com/cloud-build/triggers;region=$REGION?project=$PROJECT_ID"
echo ""

# ─── Secret Manager — create empty secret placeholders ─────────────────────────
echo "==> Creating Secret Manager secrets..."

SECRETS=(
  "agenticos-db-password"
  "database-url-web"
  "database-url-agents"
  "auth-secret"
  "auth-google-secret"
  "anthropic-api-key"
)

for SECRET in "${SECRETS[@]}"; do
  if gcloud secrets describe "$SECRET" --project="$PROJECT_ID" &>/dev/null; then
    echo "    Secret '$SECRET' already exists, skipping."
  else
    gcloud secrets create "$SECRET" \
      --project="$PROJECT_ID" \
      --replication-policy="automatic"
    echo "    Created secret: $SECRET"
  fi
done

# ─── Populate agenticos-db-password ───────────────────────────────────────────
DB_PASS="$(head /dev/urandom | tr -dc A-Za-z0-9 | head -c 24)"
echo "$DB_PASS" | gcloud secrets versions add "agenticos-db-password" \
  --project="$PROJECT_ID" \
  --data-file=-
echo "==> Generated and stored DB password in secret 'agenticos-db-password'."

# ─── Summary ───────────────────────────────────────────────────────────────────
echo ""
echo "════════════════════════════════════════════════════════"
echo "  Provisioning bootstrap complete"
echo "════════════════════════════════════════════════════════"
echo "  Project:       $PROJECT_ID"
echo "  Region:        $REGION"
echo "  TF state:      gs://${TF_BUCKET}"
echo ""
echo "  Next steps:"
echo "  1. Populate remaining secrets in Secret Manager:"
echo "     - database-url-web"
echo "     - database-url-agents"
echo "     - auth-secret          (random string, e.g. openssl rand -hex 32)"
echo "     - auth-google-secret   (Google OAuth client secret)"
echo "     - anthropic-api-key    (from https://console.anthropic.com)"
echo ""
echo "  2. Run Terraform to provision infrastructure:"
echo "     cd infra/agenticos"
echo "     make PROJECT_ID=$PROJECT_ID init"
echo "     make PROJECT_ID=$PROJECT_ID plan"
echo "     make PROJECT_ID=$PROJECT_ID apply"
echo ""
echo "  3. Connect GitHub repo in Cloud Build UI:"
echo "     https://console.cloud.google.com/cloud-build/triggers;region=${REGION}?project=${PROJECT_ID}"
echo ""
echo "  4. Update cloudbuild.yaml substitutions with outputs from terraform apply:"
echo "     _SQL_INSTANCE, _AGENTS_SERVICE_URL, _AGENTS_AUDIENCE"
echo ""
echo "  IMPORTANT: DB password is stored in Secret Manager secret 'agenticos-db-password'."
echo "             It will not be displayed again."
echo "════════════════════════════════════════════════════════"
