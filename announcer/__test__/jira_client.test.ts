import {mockDeep, mock} from "jest-mock-extended";
import {Version2Client} from "jira.js";
import {jiraClientImpl} from "../src/jira_client";
import {Interval} from "luxon";
import {SearchResults, Issue} from "jira.js/out/version2/models";

const version2Client = mockDeep<Version2Client>()
const searchForIssuesUsingJql = version2Client.issueSearch.searchForIssuesUsingJql;
const reportInterval = Interval.fromISO("2000-01-01/2038-01-19")

const sampleIssue: Issue = {
  fields: mock(),
  id: "", key: "ISSUE_KEY"
}
searchForIssuesUsingJql.mockReturnValue(
    Promise.resolve<SearchResults>({
      issues: [sampleIssue]
    })
)

describe("jira client facade", () => {
  const jiraClient = jiraClientImpl(version2Client, {
    project: "PAPERCLIP",
    closedStatuses: "DISAVOWED"
  });

  test("find closed tickets", async () => {
    const tickets = await jiraClient.ticketsClosed(reportInterval);
    expect(searchForIssuesUsingJql).toBeCalledWith(
        {
          jql:
              'project = PAPERCLIP AND ' +
              'status in (DISAVOWED) AND ' +
              'status changed to (DISAVOWED) DURING (2000-01-01, 2038-01-19)',
          expand: ""
        }
    )
    expect(tickets.length).toBe(1)
    expect(tickets[0].key).toBe("ISSUE_KEY")
  })

  test("find all open tickest", async () => {
    const tickets = await jiraClient.allOpenTickets()

    expect(searchForIssuesUsingJql).toBeCalledWith(
        {
          jql:
              'project = PAPERCLIP AND ' +
              'status not in (DISAVOWED)',
          expand: ""
        }
    )
    expect(tickets.length).toBe(1)
    expect(tickets[0].key).toBe("ISSUE_KEY")
  })

  test("find newly opened tickets", async () => {
    const tickets = await jiraClient.ticketsCreated(reportInterval)

    expect(searchForIssuesUsingJql).toBeCalledWith(
        {
          jql:
              'project = PAPERCLIP AND ' +
              'created >= 2000-01-01 AND ' +
              'created <  2038-01-19',
          expand: ""
        }
    )
    expect(tickets.length).toBe(1)
    expect(tickets[0].key).toBe("ISSUE_KEY")

  })

  test("reject promise if closed tickets missing issues field", () => {
    const searchForIssuesUsingJql = version2Client.issueSearch.searchForIssuesUsingJql;
    searchForIssuesUsingJql.mockReturnValue(
        Promise.resolve<SearchResults>({
          total: 666 // included value to test error message rendering
        })
    )
    const ticketsClosed = jiraClient.ticketsClosed(reportInterval);
    expect(ticketsClosed).rejects.toMatch('Response missing field issues: {"total":666}')
  })
})
