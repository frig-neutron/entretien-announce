resource "google_pubsub_topic" "sendmail" {
  project = google_project.entretien.project_id
  name    = "sendmail"
  labels  = {}
}

resource "google_pubsub_subscription" "sendmail_backup" {
  project = google_project.entretien.project_id
  name    = "sendmail-backup"
  topic   = google_pubsub_topic.sendmail.name

  expiration_policy {
    ttl = 0
  }
}
resource "google_pubsub_topic_iam_binding" "sendmail_publisher" {
  project = google_project.entretien.project_id
  topic   = google_pubsub_topic.sendmail.name
  role    = "roles/pubsub.publisher"
  members = [
    "serviceAccount:${google_service_account.announcer.email}"
  ]
}
