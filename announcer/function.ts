import {config as dotenv_config} from "dotenv"
import {EventFunctionWithCallback} from "@google-cloud/functions-framework";

import {ApplicationFactory, defaultApplicationFactory, JiraBasicAuth} from "./src/application_factory";
import {Application} from "./src/application"
import {log} from "./src/logger";
import {SmtpConfig} from "./src/sender";
import {Recipient} from "./src/announcement_factory";

let applicationFactory: ApplicationFactory = defaultApplicationFactory;

process.on('uncaughtException', function (err) {
  console.error('Uncaught exception', err);
});

// https://cloud.google.com/functions/docs/writing/background#function_parameters
// Absolutely MUST use the 3-param version b/c otherwise there seems to be no way to terminate the function properly.
// Returning a resolved Promise doesn't cut it - you still get "Finished with status: response error"
const announcer: EventFunctionWithCallback = (data: any, context, callback) => {
  log.info(`Starting with data=${JSON.stringify(data)}`)
  if (typeof data === "string"){
    // For local testing. For some reason the functions framework insists on passing the json object `-d data={...}`
    // as a string
    data = JSON.parse(data)
  }

  const result = dotenv_config()
  log.info({"environment": result})

  let secrets = parseSecrets()
  const directory: Recipient[] = parseDirectory() // todo: validate structure in all the parsing / test parsing

  const {now: announcementDate} = data

  let application: Application = applicationFactory(directory, secrets, secrets)
  return application.announce(announcementDate).
    then(_ => callback(null,"Terminating OK")).
    catch(e => callback(e, null))
}

interface Secrets extends JiraBasicAuth, SmtpConfig {
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

function parseDirectory(): Recipient[] {
  return parseEnvVar("DIRECTORY");
}

exports.announcer = announcer
