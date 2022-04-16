import {config as dotenv_config} from "dotenv"
import {EventFunctionWithCallback} from "@google-cloud/functions-framework";

import {log} from "./src/logger";
import {SmtpConfig} from "./src/sendmail";


process.on('uncaughtException', function (err) {
  console.error('Uncaught exception', err);
});

// https://cloud.google.com/functions/docs/writing/background#function_parameters
// Absolutely MUST use the 3-param version b/c otherwise there seems to be no way to terminate the function properly.
// Returning a resolved Promise doesn't cut it - you still get "Finished with status: response error"
const mailer: EventFunctionWithCallback = (data: any, context, callback) => {
  log.info(`Starting with data=${JSON.stringify(data)}`)
  if (typeof data === "string"){
    // For local testing. For some reason the functions framework insists on passing the json object `-d data={...}`
    // as a string
    data = JSON.parse(data)
  }

  const result = dotenv_config()
  log.info({"environment": result})

  let secrets = parseSecrets()

  const {now: announcementDate} = data

}

interface Secrets extends SmtpConfig {
}

function parseEnvVar(envVarName: string) {
  const rawSecrets = process.env[envVarName];
  if (rawSecrets)
    return JSON.parse(rawSecrets);
  else
    throw `${envVarName} env var not defined`
}

function parseSecrets(): Secrets {
  return parseEnvVar("ANNOUNCER_SECRETS");
}

exports.mailer = mailer
