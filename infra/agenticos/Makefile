# Terraform wrapper for agenticos
# Fetches db_password from Secret Manager automatically.
#
# Usage:
#   make PROJECT_ID=<your-project-id> init
#   make PROJECT_ID=<your-project-id> plan
#   make PROJECT_ID=<your-project-id> apply

PROJECT_ID  ?= $(error Set PROJECT_ID: make PROJECT_ID=your-project-id <target>)
DB_SECRET   ?= agenticos-db-password

DB_PASSWORD := $(shell gcloud secrets versions access latest \
                 --secret=$(DB_SECRET) \
                 --project=$(PROJECT_ID) 2>/dev/null)

export TF_VAR_project_id   := $(PROJECT_ID)
export TF_VAR_db_password  := $(DB_PASSWORD)

.PHONY: init plan apply destroy

init:
	terraform init

plan:
	terraform plan

apply:
	terraform apply

destroy:
	terraform destroy
