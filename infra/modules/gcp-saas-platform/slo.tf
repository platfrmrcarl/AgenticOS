# ── Register Cloud Run services with Cloud Monitoring ─────────────────────────

resource "google_monitoring_custom_service" "web" {
  count        = var.enable_slos ? 1 : 0
  service_id   = "${var.app_name}-web"
  display_name = "${var.app_name} Web"
  project      = var.project_id
  depends_on   = [google_project_service.apis]
}

resource "google_monitoring_custom_service" "agents" {
  count        = var.enable_slos ? 1 : 0
  service_id   = "${var.app_name}-agents"
  display_name = "${var.app_name} Agents"
  project      = var.project_id
  depends_on   = [google_project_service.apis]
}

# ── Web: availability SLO (99.9%) ─────────────────────────────────────────────

resource "google_monitoring_slo" "web_availability" {
  count        = var.enable_slos ? 1 : 0
  service      = google_monitoring_custom_service.web[0].service_id
  slo_id       = "${var.app_name}-web-availability"
  display_name = "${var.app_name} Web Availability"
  project      = var.project_id

  goal                = var.web_availability_goal
  rolling_period_days = 28

  request_based_sli {
    good_total_ratio {
      good_service_filter  = join(" AND ", [
        "resource.type=\"cloud_run_revision\"",
        "resource.labels.service_name=\"${var.app_name}\"",
        "metric.type=\"run.googleapis.com/request_count\"",
        "metric.labels.response_code_class!=\"5xx\"",
      ])
      total_service_filter = join(" AND ", [
        "resource.type=\"cloud_run_revision\"",
        "resource.labels.service_name=\"${var.app_name}\"",
        "metric.type=\"run.googleapis.com/request_count\"",
      ])
    }
  }
}

# ── Web: latency SLO (95% of requests < threshold) ────────────────────────────

resource "google_monitoring_slo" "web_latency" {
  count        = var.enable_slos ? 1 : 0
  service      = google_monitoring_custom_service.web[0].service_id
  slo_id       = "${var.app_name}-web-latency"
  display_name = "${var.app_name} Web Latency (p95)"
  project      = var.project_id

  goal                = 0.95
  rolling_period_days = 28

  request_based_sli {
    distribution_cut {
      distribution_filter = join(" AND ", [
        "resource.type=\"cloud_run_revision\"",
        "resource.labels.service_name=\"${var.app_name}\"",
        "metric.type=\"run.googleapis.com/request_latencies\"",
      ])
      range {
        max = var.web_latency_threshold_ms
      }
    }
  }
}

# ── Agents: availability SLO (99.5%) ──────────────────────────────────────────

resource "google_monitoring_slo" "agents_availability" {
  count        = var.enable_slos ? 1 : 0
  service      = google_monitoring_custom_service.agents[0].service_id
  slo_id       = "${var.app_name}-agents-availability"
  display_name = "${var.app_name} Agents Availability"
  project      = var.project_id

  goal                = var.agents_availability_goal
  rolling_period_days = 28

  request_based_sli {
    good_total_ratio {
      good_service_filter  = join(" AND ", [
        "resource.type=\"cloud_run_revision\"",
        "resource.labels.service_name=\"${var.app_name}-agents\"",
        "metric.type=\"run.googleapis.com/request_count\"",
        "metric.labels.response_code_class!=\"5xx\"",
      ])
      total_service_filter = join(" AND ", [
        "resource.type=\"cloud_run_revision\"",
        "resource.labels.service_name=\"${var.app_name}-agents\"",
        "metric.type=\"run.googleapis.com/request_count\"",
      ])
    }
  }
}
