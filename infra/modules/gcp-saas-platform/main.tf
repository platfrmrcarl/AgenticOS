terraform {
  required_version = ">= 1.5, < 2.0"
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }
  # Configure backend in the calling root module, e.g.:
  # terraform {
  #   backend "gcs" {
  #     bucket = "<your-tf-state-bucket>"
  #     prefix = "<project_id>"
  #   }
  # }
}

provider "google" {
  project = var.project_id
  region  = var.region
}
