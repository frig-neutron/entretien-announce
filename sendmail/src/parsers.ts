import {Announcement} from "./announcement";
import exp from "constants";
import {Secrets} from "./index";


export function parseAnnouncement(data: any): Announcement{
  // if (typeof data === "string") {
  //   // For local testing. For some reason the functions framework insists on passing the json object `-d data={...}`
  //   // as a string
  //   data = JSON.parse(data)
  // }

  return {
    body: "", primaryRecipient: "", secondaryRecipients: [], subject: ""
  }
}

export function parseSecrets(data: any): Secrets {
  return {
    smtp_from: "", smtp_host: "", smtp_password: "", smtp_username: ""
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
