output "web_url" {
  description = "Cloud Run URL for the web service"
  value       = google_cloud_run_v2_service.web.uri
}

output "agents_url" {
  description = "Cloud Run URL for the agents service"
  value       = google_cloud_run_v2_service.agents.uri
}

output "mcp_url" {
  description = "Cloud Run URL for the MCP service (empty string if enable_mcp = false)"
  value       = var.enable_mcp ? google_cloud_run_v2_service.mcp[0].uri : ""
}

output "web_sa_email" {
  description = "Email of the web service account"
  value       = google_service_account.web.email
}

output "agents_sa_email" {
  description = "Email of the agents service account"
  value       = google_service_account.agents.email
}

output "mcp_sa_email" {
  description = "Email of the MCP service account (empty string if enable_mcp = false)"
  value       = var.enable_mcp ? google_service_account.mcp[0].email : ""
}

output "cloudbuild_sa_email" {
  description = "Email of the Cloud Build service account"
  value       = google_service_account.cloudbuild.email
}

output "sql_connection_name" {
  description = "Cloud SQL instance connection name (project:region:instance)"
  value       = google_sql_database_instance.main.connection_name
}

output "artifact_registry_url" {
  description = "Artifact Registry base URL (region-docker.pkg.dev/project/repo)"
  value       = "${var.region}-docker.pkg.dev/${var.project_id}/${google_artifact_registry_repository.containers.repository_id}"
}

output "lb_ip" {
  description = "Global load balancer IP (null if CDN/LB not enabled)"
  value       = local.has_cdn ? google_compute_global_address.web[0].address : null
}
