locals {
  # using ternary switch b/c I don't want to use multiple varfiles
  environment = terraform.workspace == "prd" ? "prd" : "stg"
  project_id  = "entretien-${local.environment}"
}

resource "google_project" "entretien" {
  name       = local.project_id
  project_id = local.project_id
  labels     = {}

  billing_account = data.google_billing_account.default.id
}

data "google_billing_account" "default" {
  billing_account = "billingAccounts/011E93-94AD19-D2FF71"
}

resource "google_project_service" "enabled_services" {
  for_each = toset([
    "cloudbuild.googleapis.com", # support cloud functions
    "cloudfunctions.googleapis.com",
    "cloudscheduler.googleapis.com",
    "secretmanager.googleapis.com", # secretmanager
  ])
  project = google_project.entretien.project_id
  service = each.key
}

resource "google_project_iam_binding" "log_writers" {
  project = local.project_id
  role    = "roles/logging.logWriter"
  members = [
    "serviceAccount:${google_service_account.announcer.email}"
  ]
}
