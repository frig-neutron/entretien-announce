import {mockDeep} from "jest-mock-extended";
import {Version2Client} from "jira.js";
import {jiraClientImpl} from "../src/jira_client";
import {Interval} from "luxon";

const version2Client = mockDeep<Version2Client>()
const reportInterval = Interval.fromISO("2000-01-01/2038-01-19")

describe("jira client facade", () => {
  const jiraClient = jiraClientImpl(version2Client, {
    project: "PAPERCLIP",
    closedStatuses: "DISAVOWED"
  });

  test("find closed tickets", () => {
    const ticketsClosed = jiraClient.ticketsClosed(reportInterval);
    expect(version2Client.issueSearch.searchForIssuesUsingJql).toBeCalledWith(
        {
          jql:
              'project = PAPERCLIP AND ' +
              'status in (DISAVOWED) AND ' +
              'status changed to (DISAVOWED) DURING (2000-01-01, 2038-01-19)',
          expand: ""
        }
    )
  })

  test("find all open tickest", () => {
    const openTickets = jiraClient.allOpenTickets()

  })

  test("find newly opened tickets", () => {
    const ticketsCreated = jiraClient.ticketsClosed(reportInterval)
  })
})
