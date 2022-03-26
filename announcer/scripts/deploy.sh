#!/bin/bash 
project_id=entretien-prd
gcloud functions deploy announcer --project=$project_id --max-instances=1 \
  --runtime=nodejs16 --trigger-topic=announcer_trigger \
  --service-account=announcer@entretien-prd.iam.gserviceaccount.com \
  --set-secrets=ANNOUNCER_SECRETS=announcer:1
