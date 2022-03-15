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

const jqlDefaultConstants = {
  project: "TRIAG",
  closedStatuses:"Closed, Done, Resolved"
}

export function jiraClientImpl(version2Client: Version2Client, jqlConstants = jqlDefaultConstants): JiraClient {
  return {
    allOpenTickets(): JiraTicket[] {
      return [];
    }, ticketsCreated(interval: Interval): JiraTicket[] {
      return [];
    },
    ticketsClosed(interval: Interval): JiraTicket[] {
      const jql = `project = "TRIAG" AND status in (Closed, Done, Resolved) AND status changed to (Closed, Done, Resolved) DURING ("2022-01-01", "2022-04-04")`
      const recentlyClosed = version2Client.issueSearch.searchForIssuesUsingJql(
          {jql: jql, expand: ""}
      )

      return [];
    }
  }
}
