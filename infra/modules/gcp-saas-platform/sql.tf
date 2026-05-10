resource "google_sql_database_instance" "main" {
  name             = "${var.app_name}-db"
  region           = var.region
  database_version = var.postgres_version

  deletion_protection = true

  settings {
    tier              = var.db_tier
    availability_type = "ZONAL"
    disk_type         = "PD_SSD"
    disk_size         = 10

    deletion_protection_enabled = var.deletion_protection

    user_labels = {
      managed-by = "terraform"
      env        = var.env
    }

    backup_configuration {
      enabled                        = true
      start_time                     = "02:00"
      point_in_time_recovery_enabled = true
      backup_retention_settings {
        retained_backups = 7
        retention_unit   = "COUNT"
      }
    }

    ip_configuration {
      require_ssl = true
      # TODO: Set private_network once VPC is configured.
      # ipv4_enabled    = false
      # private_network = google_compute_network.vpc.self_link
    }

    maintenance_window {
      day          = 7
      hour         = 2
      update_track = "stable"
    }
  }

  lifecycle {
    ignore_changes = [
      settings[0].password_validation_policy,
      settings[0].database_flags,
      settings[0].enable_dataplex_integration,
    ]
  }
  depends_on = [google_project_service.apis]
}

resource "google_sql_database" "app" {
  name     = "${var.app_name}db"
  instance = google_sql_database_instance.main.name
}

resource "google_sql_user" "app" {
  name     = var.app_name
  instance = google_sql_database_instance.main.name
  password = var.db_password
}
