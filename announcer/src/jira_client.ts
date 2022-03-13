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
  ticketsClosed(interval: Interval): JiraTicket[]
  ticketsCreated(interval: Interval): JiraTicket[]
  allOpenTickets(): JiraTicket[]
}

export function jiraClientImpl(jiraCreds: JiraCreds): JiraClient {
  return {
    allOpenTickets(): JiraTicket[] {
      return [];
    }, ticketsCreated(interval: Interval): JiraTicket[] {
      return [];
    },
    ticketsClosed(interval: Interval): JiraTicket[] {
      return [];
    }
  }
}
