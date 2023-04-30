#!/bin/bash

# usage: publish_function.sh PROJECT_ID FUNC_NAME
# output: object path

# todo: check if cwd is a cloud function
project_id=$1
function_name=$2
project_number=`gcloud projects describe $project_id --format=json | jq -r '.projectNumber'`
year=`date +%Y`
month=`date +%m`
date=`date --iso-8601=seconds --utc`
dest_path="gs://gcf-sources-$project_number-us-central1/$function_name/year=$year/month=$month/src_$date.zip"

zipfile=`mktemp`

{
  find -L . \( -name '*.json' -or -name '*.js' -or -name '*.ts' \) -and -not -path '*/node_modules/*' -and -not -path '*/build/*' |
    zip - -@ > $zipfile

  gsutil cp $zipfile $dest_path 
} > /dev/null

echo $dest_path
