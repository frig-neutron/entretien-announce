const fs = require("fs")

if (root_package_name() !== this_package_name()) {
  const childProcess = require("child_process");
  childProcess.exec("npm ci", (err, stdout, stderr) => {
    if (err) {
      console.error(stderr)
      console.error(err);
    } else {
      console.log(stdout);
    }
  })
}

function root_package_name(){
  const root_pkg_json_name = process.env.npm_config_local_prefix + "/package.json"
  const raw_pkg_json = fs.readFileSync(root_pkg_json_name, 'utf8');
  const parsed_pkg_json = JSON.parse(raw_pkg_json)
  return parsed_pkg_json.name
}

function this_package_name() {
  return process.env.npm_package_name
}
