import {} from "../appscript/Code"

interface EmailReceived {
  ticket: string;
  email_id: string; // GCF processes each email individually by ID
}

interface EmailOps {
  message: EmailReceived
  onEventSuccess: () => string
}

type GmailThread = GoogleAppsScript.Gmail.GmailThread;
export function to_comment() {
  const threads: GoogleAppsScript.Gmail.GmailThread[] = GmailApp.search("in:Inbox -label:automation/event_sent -label:automation/irrelevant");
}

function threadToEmailOps(thread: GmailThread): EmailOps[] {
  return []
}
