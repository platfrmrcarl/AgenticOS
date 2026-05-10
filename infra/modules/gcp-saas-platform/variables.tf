variable "project_id" {
  type        = string
  description = "GCP project ID"
}

variable "region" {
  type        = string
  default     = "us-east1"
  description = "GCP region for Cloud Run services and Cloud SQL"
}

variable "app_name" {
  type        = string
  description = "Base name prefix for all resources. E.g. 'myapp' creates myapp, myapp-agents, myapp-mcp, myapp-db."
}

variable "github_org" {
  type        = string
  description = "GitHub organisation owning the source repo"
}

variable "github_repo" {
  type        = string
  description = "GitHub repository name"
}

variable "github_branch" {
  type        = string
  default     = "^main$"
  description = "Branch regex for the Cloud Build trigger"
}

variable "db_password" {
  type        = string
  sensitive   = true
  description = "Password for the Cloud SQL app user"
}

variable "enable_mcp" {
  type        = bool
  default     = true
  description = "Whether to provision the MCP Cloud Run service and service account"
}

variable "web_memory" {
  type        = string
  default     = "1Gi"
  description = "Memory limit for the web Cloud Run container"
}

variable "agents_memory" {
  type        = string
  default     = "1Gi"
  description = "Memory limit for the agents Cloud Run container"
}

variable "mcp_memory" {
  type        = string
  default     = "512Mi"
  description = "Memory limit for the MCP Cloud Run container"
}

variable "max_instances" {
  type        = number
  default     = 2
  description = "Maximum Cloud Run instances for all services"
}

variable "db_tier" {
  type        = string
  default     = "db-f1-micro"
  description = "Cloud SQL machine tier"
}

variable "postgres_version" {
  type        = string
  default     = "POSTGRES_15"
  description = "PostgreSQL version for Cloud SQL"
}

variable "deletion_protection" {
  type        = bool
  default     = true
  description = "Enable deletion protection on the Cloud SQL instance."
}

variable "allow_public_access" {
  type        = bool
  default     = false
  description = "Allow unauthenticated public access to web service (use false in production)"
}

variable "env" {
  description = "Environment label (dev/staging/prod)"
  type        = string
  default     = "prod"
}

variable "web_min_instances" {
  type        = number
  default     = 0
  description = "Minimum warm instances for the web service. Set to 1 to eliminate cold starts."
}

variable "agents_min_instances" {
  type        = number
  default     = 0
  description = "Minimum warm instances for the agents service. Set to 1 to eliminate cold starts."
}

variable "mcp_min_instances" {
  type        = number
  default     = 0
  description = "Minimum warm instances for the MCP service."
}

variable "web_concurrency" {
  type        = number
  default     = 80
  description = "Max concurrent requests per web instance. Next.js is I/O-bound so high values are fine."
}

variable "agents_concurrency" {
  type        = number
  default     = 80
  description = "Max concurrent requests per agents instance."
}

variable "mcp_concurrency" {
  type        = number
  default     = 10
  description = "Max concurrent requests per MCP instance."
}

variable "enable_slos" {
  type        = bool
  default     = true
  description = "Whether to create Cloud Monitoring SLO resources."
}

variable "web_availability_goal" {
  type        = number
  default     = 0.999
  description = "Web service availability SLO goal (0–1). Default: 99.9%."
}

variable "agents_availability_goal" {
  type        = number
  default     = 0.995
  description = "Agents service availability SLO goal (0–1). Default: 99.5% (LLM-bound, higher error tolerance)."
}

variable "web_latency_threshold_ms" {
  type        = number
  default     = 2000
  description = "Web service latency SLO threshold in milliseconds. 95% of requests must be below this."
}

variable "domain" {
  type        = string
  default     = ""
  description = "Custom domain for the web service (e.g. 'myapp.com'). When set, provisions a Global HTTPS LB with Cloud CDN and a managed SSL certificate."
}
