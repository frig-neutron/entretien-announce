import {Version2Client} from "jira.js";
import {config as dotenv_config} from "dotenv"
import {google} from "@google-cloud/pubsub/build/protos/protos";
import PubsubMessage = google.pubsub.v1.PubsubMessage;
import {Context} from "@google-cloud/functions-framework";

import {ApplicationFactory, defaultApplicationFactory} from "./src/application_factory";
import {Application} from "./src/application"
import {JiraBasicAuth} from "./src/application_factory";
import {logger as log} from "./src/logger";

let applicationFactory: ApplicationFactory = defaultApplicationFactory;

exports.announcer = (message: PubsubMessage, context: Context) => {
  const result = dotenv_config()

  let jiraCreds: JiraBasicAuth = {
    email: String(process.env.JIRA_AUTH_EMAIL),
    apiToken: String(process.env.JIRA_API_TOKEN)
  }

  let application: Application = applicationFactory(jiraCreds)
  application.announce("2021-12")
  .then(nothing => log.info("moo"))

}
