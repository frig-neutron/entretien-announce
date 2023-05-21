#!/bin/bash
# usage: publish_function.sh PROJECT_ID FUNC_NAME
# output: object path

. "`dirname $0`/_include.sh"

require_function_root

project_id=$1
function_name=$2

dest_path=`gcf_source_path $project_id $function_name`
zip_file=`mktemp`

{
  find -L . \( -name '*.json' -or -name '*.js' -or -name '*.ts' \) -and -not -path '*/node_modules/*' -and -not -path '*/build/*' |
    zip - -@ > $zip_file

  gsutil cp $zip_file $dest_path
} > /dev/null

echo $dest_path
