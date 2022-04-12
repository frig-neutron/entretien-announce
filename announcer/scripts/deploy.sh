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

gcloud functions deploy announcer --project=$project_id --max-instances=1 \
  --runtime=nodejs16 --trigger-topic=announcer_trigger \
  --service-account=announcer@$project_id.iam.gserviceaccount.com \
  --set-secrets=ANNOUNCER_SECRETS=announcer:latest \
  --update-env-vars=^--^DIRECTORY="`cat $dirfile`" 
