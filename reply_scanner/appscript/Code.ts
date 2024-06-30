import GmailThread = GoogleAppsScript.Gmail.GmailThread;
import GmailMessage = GoogleAppsScript.Gmail.GmailMessage;
import URLFetchRequestOptions = GoogleAppsScript.URL_Fetch.URLFetchRequestOptions;

const functionEndpointConfigKey = "FUNCTION_ENDPOINT"
const modeConfigKey = "MODE"
const robotEmailConfigKey = "ROBOT_EMAIL"
export const ticketTagPattern: RegExp = /(TRIAG-([0-9]+))/g

export interface EmailReceived {
  ticket: string[];
  email_id: string; // GCF processes each email individually by ID
}

interface MessageOp {
  message: EmailReceived
  onEventSuccess: () => string
}

export function to_comment() {
  const threads: GmailThread[] = GmailApp.search("in:Inbox -label:automation/event_sent -label:automation/irrelevant");
  const emailOps: MessageOp[] = threads.map(threadToEmailOps).flatMap(x => x);
  publishEvents(emailOps);
}

function threadToEmailOps(thread: GmailThread): MessageOp[] {
  const messages: GmailMessage[] = thread.getMessages();
  const robotEmail = scriptProperty(robotEmailConfigKey)
  const notFromTheRobot: (msg: GmailMessage) => boolean = msg => msg.getFrom() !== robotEmail
  return messages.filter(notFromTheRobot).map(messageToEmailOps)
}

function messageToEmailOps(m: GmailMessage): MessageOp {
  function parseBody(): string[] {
    const body: string = m.getBody()  // TODO: does this contain attachments?
    let matches: RegExpExecArray | null;
    const extractedTickets: string[] = [];

    while ((matches = ticketTagPattern.exec(body)) !== null) {
      extractedTickets.push(matches[0]);
    }

    return [...new Set(extractedTickets)].sort()
  }
  return {
    message: {
      ticket: parseBody(),
      email_id: m.getId()
    },
    onEventSuccess(): string {
      return "";
    }
  }
}

function publishEvents(emailOps: MessageOp[]) {
  if (emailOps.length === 0) {
    return
  }

  const options: URLFetchRequestOptions = {
    "payload": JSON.stringify(emailOps.map(m => m.message))
  };

  UrlFetchApp.fetch(scriptProperty(functionEndpointConfigKey), options)
}

function scriptProperty(propertyKey: string): string {
  const prop = PropertiesService.getScriptProperties().getProperty(propertyKey);
  if (!prop) {
    throw Error("Configure property: " + propertyKey)
  }
  return prop
}

export { functionEndpointConfigKey, modeConfigKey, robotEmailConfigKey }
