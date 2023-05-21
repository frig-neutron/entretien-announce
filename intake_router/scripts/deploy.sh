#!/bin/bash

if [ -z "$env" ]; then
  echo "usage: env={stg,prd} $0"
  exit 1
fi

set -euo pipefail

. "`dirname $0`/../scripts/_include.sh"

require_function_root

project_id=entretien-$env
cwd=`dirname $0`

gcloud functions deploy intake_router --project=$project_id --max-instances=2 \
  --source="`gcf_source_path $project_id`" \
  --runtime=nodejs16 --trigger-http --allow-unauthenticated \
  --env-vars-file="$cwd/env-$env.yaml" \
  --set-secrets=SECRETS=announcer:latest \
  --service-account=intake-router@$project_id.iam.gserviceaccount.com
