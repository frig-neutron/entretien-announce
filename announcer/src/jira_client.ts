import {JiraTicket, proxyJiraJsIssue} from "./jira_ticket";
import {DateTime, Interval} from "luxon";
import {Version2Client} from "jira.js";
import {SearchResults} from "jira.js/out/version2/models";

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

  const formatInterval = function (interval: Interval): string {
    return `${formatDate(interval.start)}, ${formatDate(interval.end)}`
  }

  const formatDate = (dateTime: DateTime): string => {
    return dateTime.toFormat("y-MM-dd")
  }

  function convertResponseToTickets(response: SearchResults) {
    function requiredFieldMissing(fieldName: string) {
      return `Response missing field ${fieldName}: ${JSON.stringify(response)}`
    }

    const wrappedIssues = response.issues?.map(proxyJiraJsIssue);

    return wrappedIssues !== undefined
        ? Promise.resolve(wrappedIssues)
        : Promise.reject(requiredFieldMissing("issues"))
  }

  return {
    async allOpenTickets(): Promise<JiraTicket[]> {
      const jql = [
        `project = ${jqlConst.project} AND `,
        `status not in (${jqlConst.closedStatuses})`
      ].join('')

      const response = await version2Client.issueSearch.searchForIssuesUsingJql(
          {jql: jql, expand: ""}
      )
      return convertResponseToTickets(response);
    },
    async ticketsCreated(interval: Interval): Promise<JiraTicket[]> {
      const jql = [
        `project = ${jqlConst.project} AND `,
        `created >= ${formatDate(interval.start)} AND `,
        `created <  ${formatDate(interval.end)}`
      ].join('')

      const response = await version2Client.issueSearch.searchForIssuesUsingJql(
          {jql: jql, expand: ""}
      )
      return convertResponseToTickets(response);
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
      return convertResponseToTickets(response);
    }
  }
}
