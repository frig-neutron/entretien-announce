import {config as dotenv_config} from "dotenv"

import {log} from "./logger";
import {Announcement} from "./announcement";
import {HttpFunction, Request} from "@google-cloud/functions-framework/build/src/functions";
import * as functions from "@google-cloud/functions-framework";
import {Response, application, json, text} from "express";
import exp from "constants";
import {formDataRouter} from "./form-data-router";
import {parseIntakeFormData} from "./intake-form-data";

process.on('uncaughtException', function (err) {
  console.error('Uncaught exception', err);
});

const envResult = dotenv_config()

// https://cloud.google.com/functions/docs/writing/background#function_parameters
// Absolutely MUST use the 3-param version b/c otherwise there seems to be no way to terminate the function properly.
// Returning a resolved Promise doesn't cut it - you still get "Finished with status: response error"
export const intake_router: HttpFunction = async (req: Request, res: Response) => {
  application.use(text())
  const input = req.rawBody;
  log.info(`Starting with data=${input?.toString()}, headers=${JSON.stringify(req.rawHeaders)}`)

  const fdr = formDataRouter()
  try {
    const parsedFormData = await parseIntakeFormData(input)
    try {
      const issueKey = await fdr.route(parsedFormData);
      return res.status(200).send(issueKey)
    } catch (err) {
      return res.status(500).send(String(err))
    }
  } catch (err) {
    return res.status(400).send(err + ": " + input)
  }

}
