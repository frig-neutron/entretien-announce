import {config as dotenv_config} from "dotenv"
import {EventFunctionWithCallback} from "@google-cloud/functions-framework";

import {log} from "./logger";
import {smtpSender} from "./sendmail";
import {Announcement} from "./announcement";
import {parseAnnouncement, parseSecrets} from "./parsers";


process.on('uncaughtException', function (err) {
  console.error('Uncaught exception', err);
});

const envResult = dotenv_config()

// https://cloud.google.com/functions/docs/writing/background#function_parameters
// Absolutely MUST use the 3-param version b/c otherwise there seems to be no way to terminate the function properly.
// Returning a resolved Promise doesn't cut it - you still get "Finished with status: response error"
const sendmail: EventFunctionWithCallback = async (data: any, context, callback: Function) => {
  log.info(`Starting with data=${JSON.stringify(data)}`)
  try {
    const announcement: Announcement = parseAnnouncement(data)

    try {
      const secrets = parseSecrets(process.env["SENDMAIL_SECRETS"])
      const sender = smtpSender(secrets);
      const result = await sender.sendAnnouncement(announcement)
      callback(null, successMsg(`Send to ${announcement.primary_recipient}`, result))
    } catch (e) {
      callback(failureMsg(`Send to ${announcement.primary_recipient}`, e), null)
    }
  } catch (ee) {
    callback(failureMsg(`Announcement decoding`, ee), null)
  }
}

function failureMsg(op: string, e: any): string {
  return JSON.stringify({
    message: `${op} failed`,
    cause: e,
  })
}

function successMsg(op: string, detail: any): string {
  return JSON.stringify({
    message: `${op} OK`,
    detail: null
  })
}

export {sendmail}
