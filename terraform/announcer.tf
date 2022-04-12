resource "google_pubsub_topic" "announcer_trigger" {
  project = google_project.entretien.project_id
  name    = "announcer_trigger"
  labels  = {}
}

resource "google_service_account" "announcer" {
  project    = google_project.entretien.project_id
  account_id = "announcer"
}

resource "google_cloud_scheduler_job" "trigger_announcements" {
  depends_on  = [google_project_service.enabled_services]
  project     = google_project.entretien.project_id
  name        = "trigger-announcements"
  description = "Trigger generation and sending of Jira announcements"
  schedule    = "0 1 1 * *"

  pubsub_target {
    topic_name = google_pubsub_topic.announcer_trigger.id
    data       = base64encode("{}")
  }
}

