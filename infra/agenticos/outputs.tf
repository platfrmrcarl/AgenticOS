output "web_url" {
  description = "Cloud Run URL for the web service"
  value       = module.agenticos.web_url
}

output "agents_url" {
  description = "Cloud Run URL for the agents service"
  value       = module.agenticos.agents_url
}

output "web_sa_email" {
  value = module.agenticos.web_sa_email
}

output "agents_sa_email" {
  value = module.agenticos.agents_sa_email
}

output "cloudbuild_sa_email" {
  value = module.agenticos.cloudbuild_sa_email
}

output "sql_connection_name" {
  value = module.agenticos.sql_connection_name
}

output "artifact_registry_url" {
  value = module.agenticos.artifact_registry_url
}

output "lb_ip" {
  description = "Global load balancer IP — point agenticos.platfrmr.com A record here"
  value       = module.agenticos.lb_ip
}
