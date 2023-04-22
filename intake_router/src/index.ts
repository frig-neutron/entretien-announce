import {config as dotenv_config} from "dotenv"

import {log} from "./logger";
import * as ff from "@google-cloud/functions-framework";
import {application, text} from "express";
import {formDataRouter} from "./form-data-router";
import {parseIntakeFormData} from "./intake-form-data";
import {jiraService, parseJiraBasicAuth} from "./jira-service";
import {ticketAnnouncer} from "./ticket-announcer";
import {parsePublishConfig, pubsubSender, Sender} from "pubsub_lalliance/src/sender";
import {parseRoutingDirectory} from "./intake-directory";

process.on('uncaughtException', function (err) {
  console.error('Uncaught exception', err);
});

const dotEnv = dotenv_config()
export enum Env {
  SECRETS = "SECRETS",
  JIRA_OPTIONS = "JIRA_OPTIONS",
  PUBLISH_CONFIG = "PUBLISH_CONFIG",
  DIRECTORY = "DIRECTORY"
}

// https://cloud.google.com/functions/docs/writing/background#function_parameters
// Absolutely MUST use the 3-param version b/c otherwise there seems to be no way to terminate the function properly.
// Returning a resolved Promise doesn't cut it - you still get "Finished with status: response error"
export const intake_router: ff.HttpFunction = async (req: ff.Request, res: ff.Response) => {
  application.use(text())
  const input = req.rawBody;
  log.info(`Starting with data=${input?.toString()}, headers=${JSON.stringify(req.rawHeaders)}`)

  const jira = jiraService(await jiraCreds());
  const announcer = ticketAnnouncer(await intakeDirectory());
  const sender: Sender = pubsubSender(await publishConfig())

  const fdr = formDataRouter(jira, announcer, sender)

  function forwardErrorToClient(e: any) {
    if (e instanceof TypeError) {
      res.status(400).send(e + ": " + input)
    } else {
      res.status(500).send(String(e))
    }
  }

  await parseIntakeFormData(input)
    .then(fdr.route)
    .then(issueKey => res.status(200).send(issueKey))
    .catch(forwardErrorToClient)
}

function jiraCreds() {
  // TODO: jira config must be secret
  // todo: take env var names to constants
  return parseJiraBasicAuth(
      process.env[Env.SECRETS],
      process.env[Env.JIRA_OPTIONS]
  )
}

function publishConfig() {
  return parsePublishConfig(process.env[Env.PUBLISH_CONFIG]);
}

function intakeDirectory() {
  return parseRoutingDirectory(process.env[Env.DIRECTORY])
}

ff.http("intake_router", intake_router)
