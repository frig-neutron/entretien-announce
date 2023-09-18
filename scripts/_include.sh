if [[ "${BASH_SOURCE[0]}" = "$0" ]]; then
    echo "include file is being executed - for sourcing only"
    exit 1
fi

function seterr() {
  set -euo pipefail
}

function require_function_root() {
  test -f package.json || {
    echo "package.json not found"
    echo "Script must be executed from root of function "
    exit 1
  }
}

# param: $1 - project name
function project_number() {
  seterr
  gcloud projects describe $1 --format=json | jq -r '.projectNumber'
}

function gcf_funcname() {
  seterr
  < package.json jq -r '.name'
}

# param: $1 - project name
function gcf_source_path() {
  seterr
  project_number=`project_number $1`
  year=`date +%Y`
  month=`date +%m`
  date=`date --iso-8601=hours --utc`
  source_hash=`git rev-parse --short HEAD`
  bucket="gs://gcf-sources-$project_number-us-central1"
  path="gcf_name=`gcf_funcname`/year=$year/month=$month/src_${date}_$source_hash.zip"
  echo "$bucket/$path"
}
