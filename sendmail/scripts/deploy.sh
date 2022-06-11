#!/bin/bash 

if [ -z "$env" ]; then 
  echo "usage: env={stg,prd} $0"
  exit 1
fi

set -euo pipefail

project_id=entretien-$env

gcloud functions deploy sendmail --project=$project_id --max-instances=1 \
  --runtime=nodejs16 --trigger-topic=sendmail \
  --service-account=announcer@$project_id.iam.gserviceaccount.com \
  --set-secrets=SENDMAIL_SECRETS=announcer:latest
