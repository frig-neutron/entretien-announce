import {JiraTicket} from "./jira_ticket";
import {Interval} from "luxon";

export interface JiraCreds {
  email: string
  token: string
}

/**
 * Interfaces to Jira system
 */
export interface JiraClient {
  fetchTicketsClosedDuringInterval(interval: Interval): JiraTicket[]
}

export function jiraClientImpl(jiraCreds: JiraCreds): JiraClient {
  return {
    fetchTicketsClosedDuringInterval(interval: Interval): JiraTicket[] {
      return [];
    }
  }
}
