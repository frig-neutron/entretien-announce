import {JiraTicket} from "./jira_ticket";
import {DateTime, Interval} from "luxon";
import {Version2Client} from "jira.js";

/**
 * Interfaces to Jira system
 */
export interface JiraClient {
  ticketsClosed(interval: Interval): Promise<JiraTicket[]>

  ticketsCreated(interval: Interval): Promise<JiraTicket[]>

  allOpenTickets(): Promise<JiraTicket[]>
}

const jqlDefaultConstants = {
  project: "TRIAG",
  closedStatuses: "Closed, Done, Resolved"
}

export function jiraClientImpl(version2Client: Version2Client, jqlConst = jqlDefaultConstants): JiraClient {
  return {
    allOpenTickets(): Promise<JiraTicket[]> {
      return Promise.resolve([]);
    }, ticketsCreated(interval: Interval): Promise<JiraTicket[]> {
      return Promise.resolve([])
    },
    async ticketsClosed(interval: Interval): Promise<JiraTicket[]> {
      const jql = [
        `project = ${jqlConst.project} AND `,
        `status in (${jqlConst.closedStatuses}) AND `,
        `status changed to (${jqlConst.closedStatuses}) DURING (${formatInterval(interval)})`
      ].join('')

      const recentlyClosed = version2Client.issueSearch.searchForIssuesUsingJql(
          {jql: jql, expand: ""}
      )
      return Promise.resolve([]);
    }
  }
}

const formatInterval = function (interval: Interval): string {
  const formatDate = (dateTime: DateTime): string => {
    return dateTime.toFormat("y-MM-dd")
  }
  return `${formatDate(interval.start)}, ${formatDate(interval.end)}`
}
