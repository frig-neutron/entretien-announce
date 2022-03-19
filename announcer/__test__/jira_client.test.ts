import {any, mockDeep} from "jest-mock-extended";
import {Version2Client} from "jira.js";
import {jiraClientImpl} from "../src/jira_client";
import {Interval} from "luxon";
import {SearchResults} from "jira.js/out/version2/models";

const version2Client = mockDeep<Version2Client>()
const reportInterval = Interval.fromISO("2000-01-01/2038-01-19")

describe("jira client facade", () => {
  const jiraClient = jiraClientImpl(version2Client, {
    project: "PAPERCLIP",
    closedStatuses: "DISAVOWED"
  });

  test("find closed tickets", async () => {
    const searchForIssuesUsingJql = version2Client.issueSearch.searchForIssuesUsingJql;
    searchForIssuesUsingJql.mockReturnValue(
      Promise.resolve<SearchResults>({
        issues: [

        ]
      })
    )
    const ticketsClosed = await jiraClient.ticketsClosed(reportInterval);
    expect(searchForIssuesUsingJql).toBeCalledWith(
        {
          jql:
              'project = PAPERCLIP AND ' +
              'status in (DISAVOWED) AND ' +
              'status changed to (DISAVOWED) DURING (2000-01-01, 2038-01-19)',
          expand: ""
        }
    )
  })

  test("find all open tickest", async () => {
    const openTickets = await jiraClient.allOpenTickets()

  })

  test("find newly opened tickets", async () => {
    const ticketsCreated = await jiraClient.ticketsCreated(reportInterval)
  })
})
