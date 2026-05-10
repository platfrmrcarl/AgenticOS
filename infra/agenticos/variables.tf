variable "project_id" {
  type        = string
  description = "GCP project ID for this deployment"
}

variable "region" {
  type        = string
  default     = "us-east1"
  description = "GCP region"
}

variable "db_password" {
  type        = string
  sensitive   = true
  description = "Cloud SQL app user password"
}

variable "github_org" {
  description = "GitHub organization for Cloud Build trigger"
  type        = string
  default     = "platfrmrcarl"
}

variable "github_repo" {
  description = "GitHub repository for Cloud Build trigger"
  type        = string
  default     = "AgenticOS"
}
