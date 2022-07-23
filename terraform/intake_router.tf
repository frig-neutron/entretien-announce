resource "google_service_account" "intake_router" {
  project    = local.project_id
  account_id = "intake_router"
}
