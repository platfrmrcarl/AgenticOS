module "agenticos" {
  source = "../modules/gcp-saas-platform"

  project_id    = var.project_id
  region        = var.region
  app_name      = "agenticos"
  github_org    = var.github_org
  github_repo   = var.github_repo
  github_branch = "^main$"
  db_password   = var.db_password

  enable_mcp = false

  web_memory    = "1Gi"
  agents_memory = "1Gi"
  max_instances = 3

  web_min_instances    = 1
  agents_min_instances = 1
  db_tier              = "db-f1-micro"
  postgres_version     = "POSTGRES_16"
  deletion_protection  = true
  allow_public_access  = true
  domain               = "agenticos.platfrmr.com"
}
