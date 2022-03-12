# value is defined in secret.tfvars, which is encrypted
variable "announcer_secret_data" {
  sensitive = true
  nullable  = false
  type = object({
    jira_email  = string
    jira_token  = string
    gmail_token = string
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
