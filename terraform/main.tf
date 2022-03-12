locals {
  project_id = "entretien-prd"
}

resource "google_project" "entretien" {
  name       = "entretien-prd"
  project_id = local.project_id

  billing_account = data.google_billing_account.default.id
}

data "google_billing_account" "default" {
  billing_account = "billingAccounts/011E93-94AD19-D2FF71"
}

resource "google_project_service" "enabled_services" {
  for_each = toset([
    "cloudbuild.googleapis.com",    # support cloud functions
    "secretmanager.googleapis.com", # secretmanager
  ])
  project = google_project.entretien.project_id
  service = each.key
}
