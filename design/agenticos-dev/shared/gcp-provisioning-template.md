# GCP Provisioning Template

## Every new product gets:

### 1. Public Cloud Run Service (Next.js)
- Runtime: Node.js
- Visibility: Public
- Auto-scaling: enabled
- Region: us-central1 (default)

### 2. Private Cloud Run Service (FastAPI)
- Runtime: Python 3.11
- Visibility: Private (internal only)
- Auto-scaling: enabled
- Region: us-central1 (default)

### 3. PostgreSQL Database
- Size: 10GB
- Version: PostgreSQL 15
- Cost target: ~$9-10/mo

### 4. Google OAuth
- OAuth 2.0 credentials created automatically
- Authorized redirect URIs configured for Cloud Run URL

### 5. Artifact Registry
- Docker repository created per product
- Images pushed on every deployment

## Deployment Steps
1. Build Docker images for Next.js and FastAPI
2. Push to Artifact Registry
3. Deploy to Cloud Run
4. Run database migrations
5. Ping founder with live URL and IP address for domain setup
