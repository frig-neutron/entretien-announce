resource "google_storage_bucket" "gcf_sources" {
  project                     = google_project.entretien.project_id
  name                        = "gcf_sources_${terraform.workspace}"
  location                    = "us" uniform_bucket_level_access = true
}
