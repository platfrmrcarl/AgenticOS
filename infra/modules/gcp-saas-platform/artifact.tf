resource "google_artifact_registry_repository" "containers" {
  repository_id = "cloud-run-source-deploy"
  location      = var.region
  format        = "DOCKER"
  depends_on    = [google_project_service.apis]

  cleanup_policy_dry_run = false

  cleanup_policies {
    id     = "keep-10-most-recent"
    action = "KEEP"
    most_recent_versions {
      keep_count = 10
    }
  }

  cleanup_policies {
    id     = "delete-old"
    action = "DELETE"
    condition {
      tag_state  = "TAGGED"
      older_than = "2592000s"  # 30 days
    }
  }

  cleanup_policies {
    id     = "delete-untagged"
    action = "DELETE"
    condition {
      tag_state  = "UNTAGGED"
      older_than = "604800s"
    }
  }
}
