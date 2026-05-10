resource "google_service_account" "web" {
  account_id   = "${var.app_name}-web"
  display_name = "${var.app_name} Web SA"
  depends_on   = [google_project_service.apis]
}

resource "google_service_account" "agents" {
  account_id   = "${var.app_name}-agents-runtime"
  display_name = "${var.app_name} Agents SA"
  depends_on   = [google_project_service.apis]
}

resource "google_service_account" "cloudbuild" {
  account_id   = "${var.app_name}-cloudbuild"
  display_name = "${var.app_name} Cloud Build SA"
  depends_on   = [google_project_service.apis]
}

resource "google_service_account" "mcp" {
  count        = var.enable_mcp ? 1 : 0
  account_id   = "${var.app_name}-mcp"
  display_name = "${var.app_name} MCP SA"
  depends_on   = [google_project_service.apis]
}

locals {
  web_project_roles = [
    "roles/cloudsql.client",
    "roles/storage.objectViewer",
  ]
  agents_project_roles = [
    "roles/cloudsql.client",
  ]
  cloudbuild_roles = [
    "roles/run.admin",
    "roles/iam.serviceAccountUser",
    "roles/storage.objectAdmin",
    "roles/artifactregistry.writer",
    "roles/cloudsql.client",
  ]
}

resource "google_project_iam_member" "web" {
  for_each = toset(local.web_project_roles)
  project  = var.project_id
  role     = each.value
  member   = "serviceAccount:${google_service_account.web.email}"
}

resource "google_project_iam_member" "agents" {
  for_each = toset(local.agents_project_roles)
  project  = var.project_id
  role     = each.value
  member   = "serviceAccount:${google_service_account.agents.email}"
}

resource "google_project_iam_member" "cloudbuild" {
  for_each = toset(local.cloudbuild_roles)
  project  = var.project_id
  role     = each.value
  member   = "serviceAccount:${google_service_account.cloudbuild.email}"
}

# Agents SA can impersonate web SA for cross-service auth
resource "google_service_account_iam_member" "agents_impersonate_web" {
  service_account_id = google_service_account.web.name
  role               = "roles/iam.serviceAccountTokenCreator"
  member             = "serviceAccount:${google_service_account.agents.email}"
}
