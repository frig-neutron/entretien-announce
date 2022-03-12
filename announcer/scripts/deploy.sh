#!/bin/bash 
gcloud functions deploy announcer --project=entretien-prd --max-instances=1 --source=dist --runtime=nodejs16 --trigger-http --allow-unauthenticated
