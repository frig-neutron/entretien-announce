import {Announcement} from "./announcement";
import {Secrets} from "./index"; //TODO: should not depend on mainline

import Ajv, {Schema} from "ajv"
import addFormats from "ajv-formats"

import Ajv2020 from "ajv/dist/2020";

/**
 * Per https://cloud.google.com/functions/docs/writing/background#function_parameters
 *
 * @param data depends on the trigger for which the function was registered, for example, Pub/Sub or
 * Cloud Storage. In the case of direct-triggered functions, triggered using the `gcloud functions call` command,
 * the event data contains the message you sent directly.
 */
export function parseAnnouncement(data: any): Announcement {
  // if (typeof data === "string") {
  //   // For local testing. For some reason the functions framework insists on passing the json object `-d data={...}`
  //   // as a string
  //   data = JSON.parse(data)
  // }
  validate(data, {
    $schema: "http://json-schema.org/draft-07/schema#",
    type: "object",
    properties: {
      primary_recipient: {
        type: "string",
        format: "email"
      },
      subject: {
        type: "string",
        minLength: 3
      },
      body: {
        type: "string",
        minLength: 10
      }
    },
    required: [
      "body",
      "primary_recipient",
      "subject",
    ],
    // additionalProperties: false,
  })
  return JSON.parse(data)
}

export function parseSecrets(data: any): Secrets {
  return JSON.parse(data)
}

function validate(data: any, schema: Schema): void {
  const ajv = new Ajv({verbose: true})
  addFormats(ajv)
  let validator = ajv.compile(schema);

  const dataObj = converToObject(data)
  const valid = validator(dataObj);
  if (!valid) {
    let errors = validator.errors;
    console.log(errors)
    throw errors
  }
}

function converToObject(data: any) {
  if (typeof data === "string") {
    return JSON.parse(data)
  } else {
    return data
  }
}

/*
function parseSecrets(): Secrets {
  return parseEnvVar("SENDMAIL_SECRETS");
}

function parseEnvVar(envVarName: string): string {
  const rawSecrets = "";
  if (rawSecrets)
    return rawSecrets;
  else
    throw `${envVarName} env var not defined`
}

 */
