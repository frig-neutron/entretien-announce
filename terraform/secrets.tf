# value is defined in secret.tfvars, which is encrypted
variable "announcer_secret_data" {
  sensitive = true
  nullable  = false
  type = object({
    jira_email    = string
    jira_token    = string
    smtp_username = string
    smtp_password = string
  })
}

resource "google_secret_manager_secret" "announcer" {
  project   = google_project.entretien.project_id
  secret_id = "announcer"
  replication {
    automatic = true
  }
  depends_on = [google_project_service.enabled_services]
}

resource "google_secret_manager_secret_version" "announcer" {
  secret      = google_secret_manager_secret.announcer.id
  secret_data = jsonencode(var.announcer_secret_data)
}

resource "google_secret_manager_secret_iam_binding" "announcer" {
  project   = google_project.entretien.project_id
  secret_id = google_secret_manager_secret.announcer.id
  role      = "roles/secretmanager.secretAccessor"
  members   = ["serviceAccount:${google_service_account.announcer.email}"]
}
