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
  log.info(`Starting with data=${req.rawBody?.toString()}, headers=${JSON.stringify(req.rawHeaders)}`)

  const fdr = formDataRouter()
  const parsedFormData = parseIntakeFormData(req.rawBody)
  fdr.route(parsedFormData)

  res.send("in the pipe, five by five")
}
