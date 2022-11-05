#!/bin/bash 

if [ -z "$env" ]; then 
  echo "usage: env={stg,prd} $0"
  exit 1
fi

set -euo pipefail

project_id=entretien-$env

gcloud functions deploy intake_router --project=$project_id --max-instances=1 \
  --runtime=nodejs16 --trigger-http --allow-unauthenticated \
  --update-env-vars=^--^PUBLISH_CONFIG='{"project_id": "'$project_id'", "topic_name": "sendmail"}' \
  --service-account=intake-router@$project_id.iam.gserviceaccount.com 
