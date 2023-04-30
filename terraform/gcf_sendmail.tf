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
    google_service_account.announcer.member,
    google_service_account.intake_router.member
  ]
}

#
# Email attachment bucket
# 

resource "google_storage_bucket" "ticket_artifacts" {
  project                     = google_project.entretien.project_id
  name                        = "ticket_artifacts_${terraform.workspace}"
  location                    = "us"
  uniform_bucket_level_access = true
}

data "google_iam_policy" "ticket_artifacts" {
  binding {
    role    = "roles/storage.objectViewer"
    members = ["allUsers"]
  }

  binding {
    role = "roles/storage.admin"
    members = [
      "user:onishik@gmail.com",
    ]
  }

  binding {
    role = "roles/storage.legacyBucketOwner"
    members = [
      "projectOwner:${google_project.entretien.project_id}",
    ]
  }
}

resource "google_storage_bucket_iam_policy" "ticket_artifacts" {
  bucket      = google_storage_bucket.ticket_artifacts.name
  policy_data = data.google_iam_policy.ticket_artifacts.policy_data
}

