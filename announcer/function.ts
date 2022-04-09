import {config as dotenv_config, DotenvConfigOptions} from "dotenv"
import {google} from "@google-cloud/pubsub/build/protos/protos";
import {Context} from "@google-cloud/functions-framework";

import {ApplicationFactory, defaultApplicationFactory, JiraBasicAuth} from "./src/application_factory";
import {Application} from "./src/application"
import {logger as log} from "./src/logger";
import {SmtpConfig} from "./src/sender";
import {Recipient} from "./src/announcement_factory";
import PubsubMessage = google.pubsub.v1.PubsubMessage;

let applicationFactory: ApplicationFactory = defaultApplicationFactory;

process.on('uncaughtException', function (err) {
  log.error('Caught exception: ' + err);
});

exports.announcer = async (message: PubsubMessage, context: Context) => {
  log.info(`Starting with input ${JSON.stringify(message)}`)
  const result = dotenv_config()
  log.info({"environment": result})

  let secrets = parseSecrets()

  const directory: Recipient[] = [
    {name: "Daniil", email: "daniil.alliance+test@gmail.com", lang: "en", roles: []}
  ]

  try {
    let application: Application = applicationFactory(directory, secrets, secrets)
    log.info("Application factory built application")
    await application.announce("2021-12")
    log.info("Exiting function")
  } catch (e){
    log.error("NOOOO")
    log.info("NOOOO as info")
    log.error(e)
  }
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
