import {JiraClient} from "./jira_client"

export interface Application {
  announce(today: string): void
}

export function applicationImpl(jiraClient: JiraClient): Application {
  return {
    announce(today: string): void {
      jiraClient.fetchTicketsClosedDuringInterval()
    }
  }
}
