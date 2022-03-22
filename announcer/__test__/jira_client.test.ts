import {mock, mockDeep} from "jest-mock-extended";
import {Version2Client} from "jira.js";
import {jiraClientImpl} from "../src/jira_client";
import {Interval} from "luxon";
import {Issue, SearchResults} from "jira.js/out/version2/models";
import {SearchForIssuesUsingJql} from "jira.js/out/version2/parameters";

const version2Client = mockDeep<Version2Client>()
const searchForIssuesUsingJql = version2Client.issueSearch.searchForIssuesUsingJql;
const reportInterval = Interval.fromISO("2000-01-01/2038-01-19")

const issues: Issue[] = [
  {
    id: "",
    key: "ISSUE_1",
    fields: mock()
  },
  {
    id: "",
    key: "ISSUE_2",
    fields: mock()
  },
  {
    id: "",
    key: "ISSUE_3",
    fields: mock()
  }
]

searchForIssuesUsingJql.mockReturnValue(
    Promise.resolve<SearchResults>({
      issues: [issues[0]],
      total: 1
    })
)

const jiraQueryConst = {
  project: "PAPERCLIP",
  closedStatuses: "DISAVOWED",
  pageSize: 2
}

const jiraClient = jiraClientImpl(version2Client, jiraQueryConst);

describe("jira client facade", () => {

  test("find closed tickets", async () => {
    const tickets = await jiraClient.ticketsClosed(reportInterval);
    expect(searchForIssuesUsingJql).toBeCalledWith(
        {
          jql:
              'project = PAPERCLIP AND ' +
              'status in (DISAVOWED) AND ' +
              'status changed to (DISAVOWED) DURING (2000-01-01, 2038-01-19)',
          expand: "",
          startAt: 0,
          maxResults: jiraQueryConst.pageSize
        }
    )
    expect(tickets.length).toBe(1)
    expect(tickets[0].key).toBe("ISSUE_1")
  })

  test("find all open tickets", async () => {
    const tickets = await jiraClient.allOpenTickets()

    expect(searchForIssuesUsingJql).toBeCalledWith(
        {
          jql:
              'project = PAPERCLIP AND ' +
              'status not in (DISAVOWED)',
          expand: "",
          startAt: 0,
          maxResults: jiraQueryConst.pageSize,
        }
    )
    expect(tickets.length).toBe(1)
    expect(tickets[0].key).toBe("ISSUE_1")
  })

  test("find newly opened tickets", async () => {
    const tickets = await jiraClient.ticketsCreated(reportInterval)

    expect(searchForIssuesUsingJql).toBeCalledWith(
        {
          jql:
              'project = PAPERCLIP AND ' +
              'created >= 2000-01-01 AND ' +
              'created <  2038-01-19',
          expand: "",
          startAt: 0,
          maxResults: jiraQueryConst.pageSize
        }
    )
    expect(tickets.length).toBe(1)
    expect(tickets[0].key).toBe("ISSUE_1")

  })

  test("page through all results", async () => {
    const paging = pageOver(
        'project = PAPERCLIP AND ' +
        'status not in (DISAVOWED)'
    );
    searchForIssuesUsingJql.mockImplementation(
        (args: SearchForIssuesUsingJql | undefined): Promise<SearchResults> => {
          if (args === undefined) {
            return Promise.reject(`Request data should be defined ${JSON.stringify(args)}`)
          }
          if (paging.requestOnPage(1, args))
            return pageOfIssues(1)

          return Promise.reject(`Request data should include paging info ${JSON.stringify(args)}`)
        }
    )

    const tickets = await jiraClient.allOpenTickets()

    expect(tickets.length).toBe(2)
    expect(tickets[0].key).toBe("ISSUE_1")
    expect(tickets[1].key).toBe("ISSUE_2")
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

function pageOver(jql: String) {
  return {
    requestOnPage: function (page: number, args: SearchForIssuesUsingJql): boolean {
      if (args.startAt === undefined)
        return false;
      const actualPageNumber = args.startAt * jiraQueryConst.pageSize + 1
      return page == actualPageNumber
          && jiraQueryConst.pageSize == args.maxResults
          && jql == args.jql;
    }
  }
}


function pageOfIssues(page: number): Promise<SearchResults> {
  const startAt = (page - 1) * jiraQueryConst.pageSize;
  const endAt = Math.min(startAt + jiraQueryConst.pageSize, issues.length);
  return Promise.resolve({
    issues: issues.slice(startAt, endAt),
    startAt: startAt,
    total: issues.length
  });
}
