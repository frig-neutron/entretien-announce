terraform {
  backend "gcs" {
    bucket = "db-tfstate"
    prefix = "entretien-prd"
  }
}
