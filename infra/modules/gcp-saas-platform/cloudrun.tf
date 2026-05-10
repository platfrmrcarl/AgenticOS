resource "google_cloud_run_v2_service" "web" {
  name     = "${var.app_name}-web"
  location = var.region
  ingress  = var.allow_public_access ? "INGRESS_TRAFFIC_ALL" : "INGRESS_TRAFFIC_INTERNAL_LOAD_BALANCER"

  labels = {
    managed-by = "terraform"
    env        = var.env
  }

  template {
    service_account                  = google_service_account.web.email
    max_instance_request_concurrency = var.web_concurrency

    scaling {
      min_instance_count = var.web_min_instances
      max_instance_count = var.max_instances
    }

    volumes {
      name = "cloudsql"
      cloud_sql_instance {
        instances = [google_sql_database_instance.main.connection_name]
      }
    }

    containers {
      image = "us-docker.pkg.dev/cloudrun/container/hello"

      resources {
        limits = {
          memory = var.web_memory
          cpu    = "1"
        }
        cpu_idle = true
      }

      volume_mounts {
        name       = "cloudsql"
        mount_path = "/cloudsql"
      }

      startup_probe {
        http_get {
          path = "/api/health"
          port = 8080
        }
        initial_delay_seconds = 5
        period_seconds        = 5
        failure_threshold     = 10
        timeout_seconds       = 3
      }

      liveness_probe {
        http_get {
          path = "/api/health"
          port = 8080
        }
        period_seconds    = 30
        failure_threshold = 3
        timeout_seconds   = 5
      }
    }
  }

  # Cloud Build manages the container image and deployment labels — Terraform owns
  # infrastructure config only (SA, scaling, ingress, resource limits).
  lifecycle {
    ignore_changes = [
      template[0].containers[0].image,
      template[0].labels,
      template[0].containers[0].name,
      template[0].containers[0].env,
      client,
      client_version,
    ]
  }

  depends_on = [google_project_service.apis]
}

resource "google_cloud_run_v2_service" "agents" {
  name     = "${var.app_name}-agents"
  location = var.region
  ingress  = "INGRESS_TRAFFIC_INTERNAL_LOAD_BALANCER"

  labels = {
    managed-by = "terraform"
    env        = var.env
  }

  template {
    service_account                  = google_service_account.agents.email
    max_instance_request_concurrency = var.agents_concurrency

    scaling {
      min_instance_count = var.agents_min_instances
      max_instance_count = var.max_instances
    }

    volumes {
      name = "cloudsql"
      cloud_sql_instance {
        instances = [google_sql_database_instance.main.connection_name]
      }
    }

    containers {
      image = "us-docker.pkg.dev/cloudrun/container/hello"

      resources {
        limits = {
          memory = var.agents_memory
          cpu    = "1"
        }
        cpu_idle          = true
        startup_cpu_boost = true
      }

      volume_mounts {
        name       = "cloudsql"
        mount_path = "/cloudsql"
      }

      startup_probe {
        http_get {
          path = "/health"
          port = 8080
        }
        initial_delay_seconds = 5
        timeout_seconds       = 5
        period_seconds        = 5
        failure_threshold     = 3
      }

      liveness_probe {
        http_get {
          path = "/health"
          port = 8080
        }
        period_seconds    = 30
        timeout_seconds   = 5
        failure_threshold = 3
      }
    }
  }

  lifecycle {
    ignore_changes = [
      template[0].containers[0].image,
      template[0].labels,
      template[0].containers[0].name,
      template[0].containers[0].env,
      client,
      client_version,
    ]
  }

  depends_on = [google_project_service.apis]
}

resource "google_cloud_run_v2_service" "mcp" {
  count    = var.enable_mcp ? 1 : 0
  name     = "${var.app_name}-mcp"
  location = var.region
  ingress  = "INGRESS_TRAFFIC_INTERNAL_LOAD_BALANCER"

  labels = {
    managed-by = "terraform"
    env        = var.env
  }

  template {
    service_account                  = google_service_account.mcp[0].email
    max_instance_request_concurrency = var.mcp_concurrency

    scaling {
      min_instance_count = var.mcp_min_instances
      max_instance_count = var.max_instances
    }

    containers {
      image = "us-docker.pkg.dev/cloudrun/container/hello"

      resources {
        limits = {
          memory = var.mcp_memory
          cpu    = "1"
        }
        cpu_idle = true
      }

      startup_probe {
        http_get {
          path = "/health"
          port = 8080
        }
        initial_delay_seconds = 5
        timeout_seconds       = 5
        period_seconds        = 5
        failure_threshold     = 3
      }

      liveness_probe {
        http_get {
          path = "/health"
          port = 8080
        }
        period_seconds    = 30
        timeout_seconds   = 5
        failure_threshold = 3
      }
    }
  }

  lifecycle {
    ignore_changes = [
      template[0].containers[0].image,
      template[0].labels,
      template[0].containers[0].name,
      template[0].containers[0].env,
      client,
      client_version,
    ]
  }

  depends_on = [google_project_service.apis]
}

# Public access to web service — gated behind var.allow_public_access.
# Web service uses INGRESS_TRAFFIC_INTERNAL_LOAD_BALANCER; auth should be
# enforced at the LB. Keep this false in production.
resource "google_cloud_run_v2_service_iam_member" "web_public" {
  count    = var.allow_public_access ? 1 : 0
  name     = google_cloud_run_v2_service.web.name
  location = var.region
  role     = "roles/run.invoker"
  member   = "allUsers"
}

# Web SA can invoke agents service
resource "google_cloud_run_v2_service_iam_member" "web_invokes_agents" {
  name     = google_cloud_run_v2_service.agents.name
  location = var.region
  role     = "roles/run.invoker"
  member   = "serviceAccount:${google_service_account.web.email}"
}

# Web SA can invoke mcp service
resource "google_cloud_run_v2_service_iam_member" "web_invokes_mcp" {
  count    = var.enable_mcp ? 1 : 0
  name     = google_cloud_run_v2_service.mcp[0].name
  location = var.region
  role     = "roles/run.invoker"
  member   = "serviceAccount:${google_service_account.web.email}"
}
