#!/bin/bash
# usage: publish_function.sh PROJECT_ID
# output: object path

. "`dirname $0`/_include.sh"

require_function_root

project_id=$1
dest_path=`gcf_source_path $project_id`
zip_file=`mktemp`

{
  find -L . -type f -and -not -path '*/node_modules/*' -and -not -path '*/build/*' |
    zip - -@ > $zip_file

  gsutil cp $zip_file $dest_path
} > /dev/null

echo $dest_path
