import {config as dotenv_config} from "dotenv"
import {EventFunctionWithCallback} from "@google-cloud/functions-framework";

import {ApplicationFactory, defaultApplicationFactory, JiraBasicAuth} from "./application_factory";
import {log} from "./logger";
import {Recipient} from "./announcement_factory";
import {PublishConfig} from "../lib/pubsub/src/sender";
import {parsePublishConfig} from "pubsub_lalliance/src/sender";

let applicationFactory: ApplicationFactory = defaultApplicationFactory;

process.on('uncaughtException', function (err) {
  console.error('Uncaught exception', err);
});

// https://cloud.google.com/functions/docs/writing/background#function_parameters
// Absolutely MUST use the 3-param version b/c otherwise there seems to be no way to terminate the function properly.
// Returning a resolved Promise doesn't cut it - you still get "Finished with status: response error"
const announcer: EventFunctionWithCallback = (data: any, context, callback) => {
  log.info(`Starting with data=${JSON.stringify(data)}`)
  if (typeof data === "string") {
    // For local testing. For some reason the Functions Framework insists on passing the json object `-d data={...}`
    // as a string
    data = JSON.parse(data)
  }

  const result = dotenv_config()
  log.info({"environment": result})

  const secrets = parseSecrets()
  const directory: Recipient[] = parseDirectory() // todo: validate structure in all the parsing / test parsing

  const {now: announcementDate} = data

  const publishConfig: Promise<PublishConfig> = parsePubsubConfigEnv();
  publishConfig.
    then(pc => applicationFactory(directory, secrets, pc)).
    then(application => application.announce(announcementDate)).
    then(_ => callback(null,"Terminating OK")).
    catch(e => callback(e, null))
}

interface Secrets extends JiraBasicAuth {
}

function parseSecrets(): Secrets {
  return parseEnvVarJson("ANNOUNCER_SECRETS");
}

function parseDirectory(): Recipient[] {
  return parseEnvVarJson("DIRECTORY");
}

function parsePubsubConfigEnv(): Promise<PublishConfig> {
  return parsePublishConfig(
      requireEnvVar("PUBLISH_CONFIG")
  );
}

function parseEnvVarJson(envVarName: string) {
  return JSON.parse(requireEnvVar(envVarName));
}

function requireEnvVar(envVarName: string): string {
  const val = process.env[envVarName]
  if (typeof val !== "undefined" && val) {
    return val;
  } else {
    dieUndefined(envVarName)
  }
}

function dieUndefined(envVarName: string): never {
  throw `${envVarName} env var not defined`
}

exports.announcer = announcer
