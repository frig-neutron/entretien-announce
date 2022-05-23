import {Announcement} from "./announcement";
import Ajv, {Schema} from "ajv"
import addFormats from "ajv-formats"
import {SmtpConfig} from "./sendmail";

/**
 * Per https://cloud.google.com/functions/docs/writing/background#function_parameters
 *
 * @param data depends on the trigger for which the function was registered, for example, Pub/Sub or
 * Cloud Storage. In the case of direct-triggered functions, triggered using the `gcloud functions call` command,
 * the event data contains the message you sent directly.
 */
export function parseAnnouncement(data: any): Announcement {
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
  })
  return convertToObject(data)
}

export function parseSecrets(data: any): Secrets {
  validate(data, {
    $schema: "http://json-schema.org/draft-07/schema#",
    type: "object",
    properties: {
      smtp_from: {
        type: "string",
        minLength: 1
      },
      smtp_host: {
        type: "string",
        minLength: 1,
        format: "hostname"
      },
      smtp_password: {
        type: "string",
        minLength: 1
      },
      smtp_username: {
        type: "string",
        minLength: 1
      },
    },
    required: [
      "smtp_from",
      "smtp_host",
      "smtp_password",
      "smtp_username",
    ]
  })
  return JSON.parse(data)
}

function validate(data: any, schema: Schema): void {
  const ajv = new Ajv({verbose: true, allErrors: true})
  addFormats(ajv)
  let validator = ajv.compile(schema);

  const dataObj = convertToObject(data)
  const valid = validator(dataObj);
  if (!valid) {
    throw validator.errors
  }
}

function convertToObject(data: any) {
  // During local runs, Functions Framework passes the json object `-d data={...}` as a string with no leading "data="
  // With pubsub though, the data comes in as "Object", pre-parsed.
  if (typeof data === "string") {
    return JSON.parse(data)
  } else {
    return data
  }
}

export interface Secrets extends SmtpConfig {
}
