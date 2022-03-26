resource "google_pubsub_topic" "announcer_trigger" {
  project = google_project.entretien.project_id
  name    = "announcer_trigger"
  labels  = {}
}

resource "google_service_account" "announcer" {
  project    = google_project.entretien.project_id
  account_id = "announcer"
}
