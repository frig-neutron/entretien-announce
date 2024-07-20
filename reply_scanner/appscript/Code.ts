import GmailThread = GoogleAppsScript.Gmail.GmailThread;
import GmailMessage = GoogleAppsScript.Gmail.GmailMessage;
import URLFetchRequestOptions = GoogleAppsScript.URL_Fetch.URLFetchRequestOptions;
import {GASPubsubPublisher} from "./pubsub_publisher";

const functionEndpointConfigKey = "FUNCTION_ENDPOINT"
const robotEmailConfigKey = "ROBOT_EMAIL"
const ticketTagPattern: RegExp = /(TRIAG-([0-9]+))/g

export interface EmailReceived {
  ticket: string[];
  email_id: string; // GCF processes each email individually by ID
}

interface MessageOp {
  message: EmailReceived
  onEventSuccess: () => void
}

export function to_comment() {
  const threads: GmailThread[] = GmailApp.search("in:Inbox is:unread");
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
    onEventSuccess(): void {
      m.markRead();
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

  console.log(`Sent ${emailOps.length} messages`)
  emailOps.forEach(m => m.onEventSuccess())
}

function scriptProperty(propertyKey: string): string {
  const prop = PropertiesService.getScriptProperties().getProperty(propertyKey);
  if (!prop) {
    throw Error("Configure property: " + propertyKey)
  }
  return prop
}

// DO NOT export identifiers at declaration time - the GAS TS transpiler will declare them as `exports.foo = `...
// which makes them invisible to uses from the same file
export { functionEndpointConfigKey, robotEmailConfigKey, ticketTagPattern }
