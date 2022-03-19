import {JiraTicket, proxyJiraJsIssue} from "./jira_ticket";
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

  function requiredFieldMissing(fieldName: string, response: object) {
    return `Response missing field ${fieldName}: ${JSON.stringify(response)}`
  }

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

      const response = await version2Client.issueSearch.searchForIssuesUsingJql(
          {jql: jql, expand: ""}
      )
      const wrappedIssues = response.issues?.map(proxyJiraJsIssue);

      return wrappedIssues !== undefined
          ? Promise.resolve(wrappedIssues)
          : Promise.reject(requiredFieldMissing("issues", response))
    }
  }
}

const formatInterval = function (interval: Interval): string {
  const formatDate = (dateTime: DateTime): string => {
    return dateTime.toFormat("y-MM-dd")
  }
  return `${formatDate(interval.start)}, ${formatDate(interval.end)}`
}
