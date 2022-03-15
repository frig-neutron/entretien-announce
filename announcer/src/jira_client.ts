import {JiraTicket} from "./jira_ticket";
import {DateTime, Interval} from "luxon";
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
  closedStatuses: "Closed, Done, Resolved"
}

export function jiraClientImpl(version2Client: Version2Client, jqlConst = jqlDefaultConstants): JiraClient {
  return {
    allOpenTickets(): JiraTicket[] {
      return [];
    }, ticketsCreated(interval: Interval): JiraTicket[] {
      return [];
    },
    ticketsClosed(interval: Interval): JiraTicket[] {
      const jql = [
        `project = ${jqlConst.project} AND `,
        `status in (${jqlConst.closedStatuses}) AND `,
        `status changed to (${jqlConst.closedStatuses}) DURING (${formatInterval(interval)})`
      ].join('')

      const recentlyClosed = version2Client.issueSearch.searchForIssuesUsingJql(
          {jql: jql, expand: ""}
      ).then()
      return [];
    }
  }
}

const formatInterval = function (interval: Interval): string {
  const formatDate = (dateTime: DateTime): string => {
    return dateTime.toFormat("y-MM-dd")
  }
  return `${formatDate(interval.start)}, ${formatDate(interval.end)}`
}
