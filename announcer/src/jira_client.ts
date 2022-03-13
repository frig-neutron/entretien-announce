import {JiraTicket} from "./jira_ticket";

export interface JiraCreds {
  email: string
  token: string
}

/**
 * Interfaces to Jira system
 */
export interface JiraClient {
  fetchTicketsClosedDuringInterval(): JiraTicket[]
}

export function jiraClientImpl(jiraCreds: JiraCreds): JiraClient {
  return {
    fetchTicketsClosedDuringInterval(): JiraTicket[] {
      return [];
    }
  }
}
