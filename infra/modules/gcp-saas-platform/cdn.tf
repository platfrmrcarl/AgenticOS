locals {
  has_cdn     = var.domain != ""
  ssl_domains = local.has_cdn ? [var.domain] : []
}

resource "google_compute_global_address" "web" {
  count = local.has_cdn ? 1 : 0
  name  = "${var.app_name}-web-ip"
}

resource "google_compute_region_network_endpoint_group" "web" {
  count                 = local.has_cdn ? 1 : 0
  name                  = "${var.app_name}-web-neg"
  network_endpoint_type = "SERVERLESS"
  region                = var.region

  cloud_run {
    service = google_cloud_run_v2_service.web.name
  }

  depends_on = [google_project_service.apis]
}

resource "google_compute_backend_service" "web" {
  count                 = local.has_cdn ? 1 : 0
  name                  = "${var.app_name}-web-backend"
  protocol              = "HTTPS"
  load_balancing_scheme = "EXTERNAL_MANAGED"
  enable_cdn            = true

  cdn_policy {
    cache_mode        = "USE_ORIGIN_HEADERS"
    default_ttl       = 300
    client_ttl        = 300
    serve_while_stale = 86400
    cache_key_policy {
      include_host         = true
      include_protocol     = true
      include_query_string = true
    }
    negative_caching = true
    negative_caching_policy {
      code = 404
      ttl  = 60
    }
  }

  backend {
    group = google_compute_region_network_endpoint_group.web[0].id
  }
}

resource "google_compute_managed_ssl_certificate" "web" {
  count = local.has_cdn ? 1 : 0
  name  = "${var.app_name}-ssl-cert"

  managed {
    domains = local.ssl_domains
  }
}

resource "google_compute_url_map" "web" {
  count           = local.has_cdn ? 1 : 0
  name            = "${var.app_name}-url-map"
  default_service = google_compute_backend_service.web[0].id
}

resource "google_compute_target_https_proxy" "web" {
  count            = local.has_cdn ? 1 : 0
  name             = "${var.app_name}-https-proxy"
  url_map          = google_compute_url_map.web[0].id
  ssl_certificates = [google_compute_managed_ssl_certificate.web[0].id]
}

resource "google_compute_global_forwarding_rule" "https" {
  count                 = local.has_cdn ? 1 : 0
  name                  = "${var.app_name}-https-rule"
  ip_address            = google_compute_global_address.web[0].address
  target                = google_compute_target_https_proxy.web[0].id
  port_range            = "443"
  load_balancing_scheme = "EXTERNAL_MANAGED"
}

resource "google_compute_url_map" "http_redirect" {
  count = local.has_cdn ? 1 : 0
  name  = "${var.app_name}-http-redirect"

  default_url_redirect {
    https_redirect         = true
    redirect_response_code = "MOVED_PERMANENTLY_DEFAULT"
    strip_query            = false
  }
}

resource "google_compute_target_http_proxy" "web" {
  count   = local.has_cdn ? 1 : 0
  name    = "${var.app_name}-http-proxy"
  url_map = google_compute_url_map.http_redirect[0].id
}

resource "google_compute_global_forwarding_rule" "http" {
  count                 = local.has_cdn ? 1 : 0
  name                  = "${var.app_name}-http-rule"
  ip_address            = google_compute_global_address.web[0].address
  target                = google_compute_target_http_proxy.web[0].id
  port_range            = "80"
  load_balancing_scheme = "EXTERNAL_MANAGED"
}
