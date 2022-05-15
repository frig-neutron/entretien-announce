import {Announcement} from "./announcement";
import {Secrets} from "./index";

/**
 * Per https://cloud.google.com/functions/docs/writing/background#function_parameters
 *
 * @param data depends on the trigger for which the function was registered, for example, Pub/Sub or
 * Cloud Storage. In the case of direct-triggered functions, triggered using the `gcloud functions call` command,
 * the event data contains the message you sent directly.
 */
export function parseAnnouncement(data: any): Announcement{
  // if (typeof data === "string") {
  //   // For local testing. For some reason the functions framework insists on passing the json object `-d data={...}`
  //   // as a string
  //   data = JSON.parse(data)
  // }

  return JSON.parse(data)
}

export function parseSecrets(data: any): Secrets {
  return JSON.parse(data)
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
