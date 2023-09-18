import {config as dotenv_config} from "dotenv"
import {EventFunctionWithCallback} from "@google-cloud/functions-framework";

import {log} from "./logger";
import {smtpSender} from "./sendmail";
import {parseAnnouncement, parseSecrets} from "./parsers";
import {Announcement} from "struct_lalliance/src/announcement";


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
      let success = successMsg(`Send to ${announcement.primary_recipient}`, result);
      // log explicitly b/c callback msg does not make it to StackDriver logs
      // duplicating object b/c log.info injects a "level" which I don't want in callback function
      // using obj for log.info b/c I want structured output in StackDriver
      log.info({...success})
      callback(null, JSON.stringify(success))
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

function successMsg(op: string, detail: any): object {
  return {
    message: `${op} OK`,
    detail: detail
  }
}

export {sendmail}
