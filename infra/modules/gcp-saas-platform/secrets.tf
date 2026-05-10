locals {
  web_secret_names = [
    "database-url-web",
    "auth-google-secret",
    "auth-secret",
  ]
  agents_secret_names = [
    "database-url-agents",
    "anthropic-api-key",
  ]
}

resource "google_secret_manager_secret" "web" {
  for_each  = toset(local.web_secret_names)
  secret_id = each.value
  project   = var.project_id

  replication {
    auto {}
  }

  depends_on = [google_project_service.apis]
}

resource "google_secret_manager_secret" "agents" {
  for_each  = toset(local.agents_secret_names)
  secret_id = each.value
  project   = var.project_id

  replication {
    auto {}
  }

  depends_on = [google_project_service.apis]
}

resource "google_secret_manager_secret_iam_member" "web_sa_access" {
  for_each  = toset(local.web_secret_names)
  secret_id = google_secret_manager_secret.web[each.key].secret_id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.web.email}"
  project   = var.project_id
}

resource "google_secret_manager_secret_iam_member" "agents_sa_access" {
  for_each  = toset(local.agents_secret_names)
  secret_id = google_secret_manager_secret.agents[each.key].secret_id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.agents.email}"
  project   = var.project_id
}
