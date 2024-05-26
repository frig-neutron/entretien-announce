#!/bin/bash

if [ -z "$env" ]; then
  echo "usage: env={stg,prd} $0"
  exit 1
fi

set -euo pipefail
scriptdir="../scripts"

. "$scriptdir/_include.sh"

require_function_root
project_id=entretien-$env

source_path=`$scriptdir/publish_function.sh $project_id`

cwd=`dirname $0`
vars_file="$cwd/env-$env.yaml"

validate_config_key DIRECTORY $vars_file
validate_config_key PUBLISH_CONFIG $vars_file
validate_config_key JIRA_OPTIONS $vars_file

gcloud functions deploy intake_router --project=$project_id --max-instances=2 \
  --source="$source_path" \
  --runtime=nodejs16 --trigger-http --allow-unauthenticated \
  --env-vars-file="$vars_file" \
  --set-secrets=SECRETS=announcer:latest \
  --service-account=intake-router@$project_id.iam.gserviceaccount.com
