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

gcloud functions deploy sendmail --project=$project_id --max-instances=2 \
  --source="$source_path" \
  --runtime=nodejs16 --trigger-topic=sendmail \
  --set-secrets=SENDMAIL_SECRETS=announcer:latest \
  --service-account=announcer@$project_id.iam.gserviceaccount.com 
