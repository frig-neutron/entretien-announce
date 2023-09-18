const fs = require('fs');

if (root_package_name() !== this_package_name()) {
  do_exec("npm ci")
}

function root_package_name() {
  const root_pkg_json_name = process.env.npm_config_local_prefix + '/package.json';
  const raw_pkg_json = fs.readFileSync(root_pkg_json_name, 'utf8');
  const parsed_pkg_json = JSON.parse(raw_pkg_json);
  return parsed_pkg_json.name;
}

function this_package_name() {
  return process.env.npm_package_name;
}

function do_exec(cmd) {
  const childProcess = require('child_process');
  childProcess.exec(cmd, (err, stdout, stderr) => {
    console.log(stdout);
    console.error(stderr);

    if (err) {
      console.error(err);
    }
  });
}
