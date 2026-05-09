---
name: gcp-cloud-run-deploy
description: Use this skill whenever deploying, configuring, or debugging GCP Cloud Run services in the Platfrmr stack. Trigger on any mention of Cloud Run, gcloud, Cloud Build, Artifact Registry, Secret Manager, Dockerfile (especially for Next.js or Python services), service account, IAM, custom domain mapping, or "deploy to GCP". Encodes Platfrmr-specific deploy patterns including Cloud SQL connection, secret injection, and per-service configurations; do NOT default to Vercel/Heroku/Docker generic patterns — Platfrmr orchestrates these exact gcloud commands at runtime.
---

# GCP Cloud Run Deployment

Platfrmr's deploy pipeline targets Cloud Run for everything: Next.js frontends, Python ADK agent services, and background workers. This skill is **especially critical** because Platfrmr generates these exact deploy commands programmatically — inconsistency between Claude-generated code and Platfrmr-orchestrated infra causes silent breakage.

## When to use this skill

- Writing or fixing a Dockerfile for a Next.js or Python service
- Writing `cloudbuild.yaml` or deploy commands
- Configuring Cloud Run service settings (CPU, memory, scaling)
- Connecting Cloud Run to Cloud SQL
- Injecting secrets from Secret Manager
- Setting up Artifact Registry
- Configuring custom domain mapping
- Debugging cold starts, timeouts, or memory issues

## Decisions to fill in

- **Region**: [us-central1 / us-east1 / etc.] — `us-central1` assumed
- **Project ID**: [your-project-id]
- **Artifact Registry repo**: `[REGION]-docker.pkg.dev/[PROJECT]/[REPO]`
- **Package manager (Node)**: [pnpm / npm / bun] — affects Dockerfile
- **Python deps**: [uv / poetry / pip + requirements.txt] — `uv` recommended for speed

## Service architecture

```
Cloud Run
  ├── platfrmr-web         (Next.js — public-facing)
  ├── platfrmr-agents      (Python ADK — invoked by web)
  └── platfrmr-workers     (Python — Pub/Sub triggered)

Cloud SQL (Postgres) ←─ all services connect via Auth Proxy / Unix socket
Secret Manager       ←─ all secrets injected at deploy time
Artifact Registry    ←─ all container images
```

## Dockerfile patterns

**Next.js → see `templates/Dockerfile.nextjs`** — uses standalone output mode for ~5x smaller images and faster cold starts. Key choices:
- Multi-stage build (deps, builder, runner)
- `output: 'standalone'` in `next.config.js`
- Non-root user
- `PORT` env var (Cloud Run sets to 8080)

**Python ADK → see `templates/Dockerfile.python`** — uses `uv` for fast installs. Key choices:
- Slim Python base
- `uv` for dep install (10x faster than pip)
- Non-root user
- Uvicorn with proper worker count

**Don't use one Dockerfile for both** — the optimization patterns differ enough that a "flexible" Dockerfile produces worse results for both.

## Standard service settings

For most services, these settings work:

```bash
gcloud run deploy SERVICE_NAME \
  --image=REGION-docker.pkg.dev/PROJECT/REPO/SERVICE:TAG \
  --region=us-central1 \
  --platform=managed \
  --allow-unauthenticated \
  --service-account=SERVICE_NAME-sa@PROJECT.iam.gserviceaccount.com \
  --add-cloudsql-instances=PROJECT:REGION:DB_INSTANCE \
  --set-env-vars="NODE_ENV=production,DB_HOST=/cloudsql/PROJECT:REGION:DB_INSTANCE" \
  --set-secrets="DATABASE_URL=database-url:latest,STRIPE_SECRET_KEY=stripe-secret:latest" \
  --memory=512Mi \
  --cpu=1 \
  --min-instances=0 \
  --max-instances=20 \
  --concurrency=80 \
  --timeout=300s
```

**Per-service tuning**:

| Service type | Memory | CPU | min-instances | max-instances | concurrency |
|---|---|---|---|---|---|
| Next.js (low traffic) | 512Mi | 1 | 0 | 10 | 80 |
| Next.js (steady traffic) | 1Gi | 1 | 1 | 20 | 80 |
| Python ADK agent | 1Gi | 2 | 0 | 10 | 10 |
| Background worker | 512Mi | 1 | 0 | 5 | 1 |

**`min-instances=1` for production frontends** — eliminates cold starts at the cost of one always-on instance. Worth it for user-facing services.

**`concurrency=10` for ADK services** — agents hold long-lived LLM connections; high concurrency starves CPU.

## Secret Manager

**Never** put secrets in env vars at deploy time (visible in Cloud Run console). Always use `--set-secrets`:

```bash
# Create secret
echo -n "sk_live_..." | gcloud secrets create stripe-secret --data-file=-

# Grant Cloud Run service account access
gcloud secrets add-iam-policy-binding stripe-secret \
  --member=serviceAccount:platfrmr-web-sa@PROJECT.iam.gserviceaccount.com \
  --role=roles/secretmanager.secretAccessor

# Inject at deploy
gcloud run deploy platfrmr-web \
  --set-secrets="STRIPE_SECRET_KEY=stripe-secret:latest"
```

For automatic rotation, reference `:latest` (always reads newest version).

## Service accounts (least privilege)

**One service account per service.** Don't share. Don't use the default Compute service account.

```bash
gcloud iam service-accounts create platfrmr-web-sa \
  --display-name="Platfrmr Web SA"

# Grant only what this service needs
gcloud projects add-iam-policy-binding PROJECT \
  --member=serviceAccount:platfrmr-web-sa@PROJECT.iam.gserviceaccount.com \
  --role=roles/cloudsql.client

gcloud projects add-iam-policy-binding PROJECT \
  --member=serviceAccount:platfrmr-web-sa@PROJECT.iam.gserviceaccount.com \
  --role=roles/secretmanager.secretAccessor
```

The agent service typically needs additionally: `roles/aiplatform.user` (for Gemini), and storage access if generating images.

## Cloud Build pipelines

`cloudbuild.yaml` per service. Triggered by GitHub push or manually.

See `templates/cloudbuild-nextjs.yaml` and `templates/cloudbuild-python.yaml`.

Standard pipeline:
1. Build container with build args (commit SHA as tag)
2. Push to Artifact Registry
3. Deploy to Cloud Run with new image
4. (Optional) Run smoke test against new revision before fully routing traffic

## Custom domain mapping

```bash
gcloud beta run domain-mappings create \
  --service=platfrmr-web \
  --domain=app.platfrmr.com \
  --region=us-central1
```

Then add the DNS records GCP returns to your DNS provider. Note: Cloud Run domain mappings can take 15-30 min to provision SSL.

For multi-domain setups (e.g., generated subdomains for user apps), use a load balancer + Cloud Run instead of direct domain mapping.

## Cold start mitigation

Cloud Run cold starts on Python with heavy deps (e.g., google-generativeai) can be 3-5s. Strategies:

1. **`min-instances=1`** for user-facing services (fastest, costs ~$10/mo per service)
2. **Lazy imports** in Python — defer heavy imports until first request
3. **Smaller container images** — multistage builds, slim base images
4. **CPU boost during startup** — `--cpu-boost` flag gives 2x CPU during the first instance boot

## Reference files

- `reference/iam-roles.md` — Standard role bundles per service type
- `reference/cold-start-optimization.md` — Detailed cold start tuning
- `reference/cost-monitoring.md` — Cloud Run cost gotchas and monitoring
- `templates/Dockerfile.nextjs` — Next.js standalone Dockerfile
- `templates/Dockerfile.python` — Python + uv Dockerfile
- `templates/cloudbuild-nextjs.yaml` — Build + deploy pipeline for Next.js
- `templates/cloudbuild-python.yaml` — Build + deploy pipeline for Python
- `templates/deploy.sh` — Manual deploy script (useful for first-time deploys)

## Anti-patterns to avoid

- ❌ Using the default Compute service account (over-privileged)
- ❌ Secrets in `--set-env-vars` (visible in console; use `--set-secrets`)
- ❌ Single Dockerfile for both Next.js and Python services
- ❌ `concurrency=80` for LLM-calling services (starves CPU)
- ❌ Forgetting `--add-cloudsql-instances` (connection will fail at runtime, not deploy time)
- ❌ Running as root in container (security; also breaks some Cloud Run features)
- ❌ `latest` tag for production images (no rollback target — use commit SHA)
- ❌ `min-instances=0` for user-facing prod services (cold starts hurt UX)
- ❌ Missing `--timeout` for ADK services (default 300s may be too short for long agent runs)
