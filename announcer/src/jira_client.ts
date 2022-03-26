import {JiraTicket, proxyJiraJsIssue} from "./jira_ticket";
import {DateTime, Interval} from "luxon";
import {Version2Client} from "jira.js";
import {Issue, SearchResults} from "jira.js/out/version2/models";

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
  closedStatuses: "Closed, Done, Resolved",
  pageSize: 50
}

export function jiraClientImpl(version2Client: Version2Client, jqlConst = jqlDefaultConstants): JiraClient {

  const formatInterval = function (interval: Interval): string {
    return `${formatDate(interval.start)}, ${formatDate(interval.end)}`
  }

  const formatDate = (dateTime: DateTime): string => {
    return dateTime.toFormat("y-MM-dd")
  }

  async function queryJira(jql: string) {
    async function jiraResponsePages(): Promise<SearchResults[]> {
      let done = false;

      const areWeDone = function (searchResults: SearchResults): boolean {
        function requiredFieldMissing(fieldName: string) {
          return `Response missing field '${fieldName}': ${JSON.stringify(searchResults)}`
        }

        if (searchResults.issues === undefined) {
          throw requiredFieldMissing("issues")
        }
        if (searchResults.total === undefined) {
          throw requiredFieldMissing("total")
        }
        if (searchResults.startAt === undefined) {
          throw requiredFieldMissing("startAt")
        }

        const responseSize = searchResults.issues.length
        const totalIssuesFetched = searchResults.startAt + responseSize
        return  totalIssuesFetched >= searchResults.total
      }

      const responses: SearchResults[] = []
      while (!done) {
        const currentPage = responses.length
        const startAt = currentPage * jqlConst.pageSize
        const response = await version2Client.issueSearch.searchForIssuesUsingJql(
            {
              jql: jql, expand: "", startAt: startAt, maxResults: jqlConst.pageSize
            }
        )

        done = areWeDone(response)
        responses.push(response)
      }

      return responses;
    }

    async function convertResponseToTickets(responses: SearchResults[]) {
      function requiredFieldMissing(fieldName: string) {
        return `Response missing field ${fieldName}: ${JSON.stringify(responses)}`
      }

      if (responses[0].issues == undefined) {
        return Promise.reject(requiredFieldMissing("issues"))
      }

      const allIssues: (Issue | undefined)[] = responses.flatMap(r => r.issues)
      // @ts-ignore: tsc doesn't see that the filter effectively removes undefined
      const allDefinedIssues: Issue[] = allIssues.filter(i => i !== undefined)
      return allDefinedIssues.map(proxyJiraJsIssue);
    }

    const pageSearchResults = await jiraResponsePages()
    return await convertResponseToTickets(pageSearchResults);
  }

  return {
    async allOpenTickets(): Promise<JiraTicket[]> {
      const jql = [
        `project = ${jqlConst.project} AND `,
        `status not in (${jqlConst.closedStatuses})`
      ].join('')

      return await queryJira(jql);
    },
    async ticketsCreated(interval: Interval): Promise<JiraTicket[]> {
      const jql = [
        `project = ${jqlConst.project} AND `,
        `created >= ${formatDate(interval.start)} AND `,
        `created <  ${formatDate(interval.end)}`
      ].join('')

      return await queryJira(jql);
    },
    async ticketsClosed(interval: Interval): Promise<JiraTicket[]> {
      const jql = [
        `project = ${jqlConst.project} AND `,
        `status in (${jqlConst.closedStatuses}) AND `,
        `status changed to (${jqlConst.closedStatuses}) DURING (${formatInterval(interval)})`
      ].join('')

      return await queryJira(jql);
    }
  }
}
