#!/bin/bash 

if [ -z "$env" ]; then 
  echo "usage: env={stg,prd} $0"
  exit 1
fi

set -euo pipefail

cwd=`dirname $0`
project_id=entretien-$env
dirfile="$cwd/directory.$project_id.json"

if [ ! -r $dirfile ]; then 
  echo "$dirfile is not readable for env=$env"
  echo "    known directory files: "
  find $cwd -name 'directory.*.json' -exec basename {} \; | sed -e 's/^/    - /'
  exit 1
fi 

gcloud functions deploy intake_router --project=$project_id --max-instances=2 \
  --runtime=nodejs16 --trigger-http --allow-unauthenticated \
  --env-vars-file="env-$env.yaml" \
  --set-secrets=SECRETS=announcer:latest \
  --service-account=intake-router@$project_id.iam.gserviceaccount.com 
