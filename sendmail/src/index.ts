import {config as dotenv_config} from "dotenv"
import {EventFunctionWithCallback} from "@google-cloud/functions-framework";

import {log} from "./logger";
import {SmtpConfig, smtpSender} from "./sendmail";
import {Announcement} from "./announcement";
import {parseAnnouncement, parseSecrets} from "./parsers";


process.on('uncaughtException', function (err) {
  console.error('Uncaught exception', err);
});

const envResult = dotenv_config()
log.info({"environment": envResult})

// https://cloud.google.com/functions/docs/writing/background#function_parameters
// Absolutely MUST use the 3-param version b/c otherwise there seems to be no way to terminate the function properly.
// Returning a resolved Promise doesn't cut it - you still get "Finished with status: response error"
const sendmail: EventFunctionWithCallback = (data: any, context, callback: Function) => {
  log.info(`Starting with data=${JSON.stringify(data)}`)
  const announcement: Announcement = parseAnnouncement(data)
  const secrets = parseSecrets(process.env["SENDMAIL_SECRETS"])
  const sender = smtpSender(secrets);
  return sender.sendAnnouncement(announcement).
    then(_ => callback(null, `Send to ${announcement.primaryRecipient} OK`))
}

export interface Secrets extends SmtpConfig {
}

export {sendmail}
