import {JiraTicket} from "./jira_ticket";
import {Interval} from "luxon";
import {Version2Client} from "jira.js";

/**
 * Interfaces to Jira system
 */
export interface JiraClient {
  ticketsClosed(interval: Interval): JiraTicket[]
  ticketsCreated(interval: Interval): JiraTicket[]
  allOpenTickets(): JiraTicket[]
}

export function jiraClientImpl(version2Client: Version2Client): JiraClient {
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
