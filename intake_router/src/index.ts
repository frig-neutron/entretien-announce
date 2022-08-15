import {config as dotenv_config} from "dotenv"

import {log} from "./logger";
import {HttpFunction, Request} from "@google-cloud/functions-framework/build/src/functions";
import {application, Response, text} from "express";
import {formDataRouter} from "./form-data-router";
import {IntakeFormData, parseIntakeFormData} from "./intake-form-data";

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
  await parseIntakeFormData(input)
        .catch(e => res.status(400).send(e + ": " + input))
        .then(form => fdr.route(form as IntakeFormData))
        .catch(e => res.status(500).send(String(e)))
        .then(issueKey => res.status(200).send(issueKey));
}
