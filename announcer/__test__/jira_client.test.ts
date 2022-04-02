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

const jiraQueryConst = {
  project: "PAPERCLIP",
  closedStatuses: "DISAVOWED",
  pageSize: 2
}

const jiraClient = jiraClientImpl(version2Client, jiraQueryConst);

describe("jira client facade", () => {

  test("find closed tickets", async () => {
    setupPagingOverQuery(
        'project = PAPERCLIP AND ' +
        'status in (DISAVOWED) AND ' +
        'status changed to (DISAVOWED) DURING (2000-01-01, 2038-01-19)'
    )
    const tickets = await jiraClient.ticketsClosed(reportInterval);
    const ticketKeys = tickets.map(t => t.key());

    expect(tickets.length).toBe(3)
    expect(ticketKeys).toStrictEqual(["ISSUE_1", "ISSUE_2", "ISSUE_3"])
  })

  test("find all open tickets", async () => {
    setupPagingOverQuery(
        'project = PAPERCLIP AND ' +
        'status not in (DISAVOWED)'
    );

    const tickets = await jiraClient.allOpenTickets()
    const ticketKeys = tickets.map(t => t.key());

    expect(tickets.length).toBe(3)
    expect(ticketKeys).toStrictEqual(["ISSUE_1", "ISSUE_2", "ISSUE_3"])
  })

  test("find newly opened tickets", async () => {
    setupPagingOverQuery(
        'project = PAPERCLIP AND ' +
        'created >= 2000-01-01 AND ' +
        'created <  2038-01-19'
    )

    const tickets = await jiraClient.ticketsCreated(reportInterval)
    const ticketKeys = tickets.map(t => t.key());

    expect(tickets.length).toBe(3)
    expect(ticketKeys).toStrictEqual(["ISSUE_1", "ISSUE_2", "ISSUE_3"])
  })

  test("reject promise if closed tickets missing issues field", () => {
    searchForIssuesUsingJql.mockReturnValue(
        Promise.resolve<SearchResults>({
          total: 666 // included value to test error message rendering
        })
    )
    const ticketsClosed = jiraClient.ticketsClosed(reportInterval);
    expect(ticketsClosed).rejects.toMatch(`Response missing field 'issues': {"total":666}`)
  })
})

function setupPagingOverQuery(jql: string): void {
  let numPages = Math.ceil(issues.length / jiraQueryConst.pageSize)

  /**
   * Check if args are for the right page. If true, next call to pageOfIssues will return the page
   */
  const requestOnPage = function (page: number, args: SearchForIssuesUsingJql): boolean {
    if (args.startAt === undefined)
      return false;
    const actualPageNumber = args.startAt / jiraQueryConst.pageSize
    return page == actualPageNumber
        && jiraQueryConst.pageSize == args.maxResults
        && jql == args.jql;
  }

  /**
   * return page of issues we last checked
   */
  const pageOfIssues = function (page: number): Promise<SearchResults> {
    const startAt = page * jiraQueryConst.pageSize;
    const endAt = Math.min(startAt + jiraQueryConst.pageSize, issues.length);
    return Promise.resolve({
      issues: issues.slice(startAt, endAt),
      startAt: startAt,
      total: issues.length
    });
  }

  const guardOvershot = function (args: SearchForIssuesUsingJql): void {
    if (args.startAt && args.startAt >= issues.length) {
      throw `startAt index too high - max is ${issues.length - 1}: ${JSON.stringify(args)}`
    }
  }

  searchForIssuesUsingJql.mockImplementation(
      (args: SearchForIssuesUsingJql | undefined): Promise<SearchResults> => {
        if (args === undefined) {
          return Promise.reject(`Request data should be defined ${JSON.stringify(args)}`)
        }

        for (let pageNum = 0; pageNum < numPages; pageNum++) {
          if (requestOnPage(pageNum, args))
            return pageOfIssues(pageNum)
        }

        guardOvershot(args);
        return Promise.reject(`Did not recognize ${JSON.stringify(args)}`)
      }
  )
}
