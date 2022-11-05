import {config as dotenv_config} from "dotenv"

import {log} from "./logger";
import {HttpFunction, Request} from "@google-cloud/functions-framework/build/src/functions";
import {application, Response, text} from "express";
import {formDataRouter} from "./form-data-router";
import {parseIntakeFormData} from "./intake-form-data";
import {jiraService} from "./jira-service";
import {ticketAnnouncer} from "./ticket-announcer";
import {parsePublishConfig, pubsubSender, Sender} from "pubsub_lalliance/src/sender";

process.on('uncaughtException', function (err) {
  console.error('Uncaught exception', err);
});

const env = dotenv_config()

// https://cloud.google.com/functions/docs/writing/background#function_parameters
// Absolutely MUST use the 3-param version b/c otherwise there seems to be no way to terminate the function properly.
// Returning a resolved Promise doesn't cut it - you still get "Finished with status: response error"
export const intake_router: HttpFunction = async (req: Request, res: Response) => {
  application.use(text())
  const input = req.rawBody;
  log.info(`Starting with data=${input?.toString()}, headers=${JSON.stringify(req.rawHeaders)}`)

  const jira = jiraService();
  const announcer = ticketAnnouncer();
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

function publishConfig() {
  return parsePublishConfig(process.env["PUBLISH_CONFIG"]);
}
