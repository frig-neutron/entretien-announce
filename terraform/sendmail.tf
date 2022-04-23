resource "google_pubsub_topic" "sendmail" {
  project = google_project.entretien.project_id
  name    = "sendmail"
  labels  = {}
}
