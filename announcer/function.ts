import {config as dotenv_config} from "dotenv"
import {google} from "@google-cloud/pubsub/build/protos/protos";
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
const announcer: EventFunctionWithCallback = (message, context, callback) => {
  log.info(`Starting with input ${JSON.stringify(message)}`)
  const result = dotenv_config()
  log.info({"environment": result})

  let secrets = parseSecrets()

  const directory: Recipient[] = [
    {name: "Daniil", email: "daniil.alliance+test@gmail.com", lang: "en", roles: []}
  ]

  let application: Application = applicationFactory(directory, secrets, secrets)
  return application.announce("2021-12").
    then(_ => callback(null,"Terminating OK")).
    catch(e => callback(e, null))
}

interface Secrets extends JiraBasicAuth, SmtpConfig {
}

function parseSecrets(): Secrets {
  const rawSecrets = process.env.ANNOUNCER_SECRETS;
  if (rawSecrets)
    return JSON.parse(rawSecrets);
  else
    throw "ANNOUNCER_SECRETS env var not defined"
}

exports.announcer = announcer
