# Standard Stack Configuration

## Frontend
- Framework: Next.js
- Deployment: GCP Cloud Run (public-facing)
- Auth: Google OAuth via GCP

## Backend
- Framework: Python FastAPI
- Deployment: GCP Cloud Run (private)
- Communication: Internal service-to-service via GCP

## Database
- Type: PostgreSQL
- Size: 10GB (starting)
- Cost target: ~$9-10/mo

## Infrastructure
- Cloud Provider: Google Cloud Platform (GCP)
- Container Registry: Google Artifact Registry
- Deployment: Cloud Run (serverless containers)

## GitHub
- One repo per product
- designdoc.md in root of every repo
- Feature branches: feature/[feature-name]
- PRs required before merging to main
- Tests must pass before GCP deployment

## Google Drive
- /content_research — research input folder
- /linkedin_articles — finished articles output folder

## Stripe
- Stripe Connect for partnership payment splits
- Auto-route revenue share to founder business account
