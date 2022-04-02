import {mock, mockDeep} from "jest-mock-extended";

import {Issue} from "jira.js/out/version2/models";
import {Clock, JiraTicket, proxyJiraJsIssue} from "../src/jira_ticket";
import {DateTime, Duration} from "luxon";


describe("jira ticket", () => {
  let issue = mock<Issue>()
  let clock = mockDeep<Clock>()
  let ticket: JiraTicket = proxyJiraJsIssue(issue, clock)

  beforeEach(() => {
    issue = mock<Issue>()
    ticket = proxyJiraJsIssue(issue, clock)
  })

  test("issue key", () => {
    issue.key = "ISSUE_KEY"
    expect(ticket.key()).toEqual("ISSUE_KEY")
  })

  test("ticket summary", () => {
    issue.fields.summary = "SUMMARY"
    expect(ticket.summary()).toEqual("SUMMARY")
  })

  test("building number from field", () => {
    issue.fields.customfield_10038 = {
      value: "1234"
    }
    expect(ticket.building()).toEqual("1234")
  })

  test("building number from summary if field empty", () => {
    issue.fields.summary = "1234 title"
    expect(ticket.building()).toEqual("1234")
  })

  test("building number unknown", () => {
    issue.fields.summary = "no building title"
    expect(ticket.building()).toEqual("unknown")
  })

  test("building number unknown if no title set", () => {
    expect(ticket.building()).toEqual("unknown")
  })

  test("date created", () => {
    issue.fields.created = "2021-11-04T20:09:26.183-0400"
    expect(ticket.dateCreated()).toEqual(DateTime.fromISO("2021-11-04T20:09:26.183-0400"))
  })

  test("ticket age", () => {
    issue.fields.created = "2021-11-04T20:09:26.183-0400"
    clock.time.mockReturnValue(DateTime.fromISO("2021-11-05T20:09:26.183-0400")) // one day after issue creation
    const oneDay = Duration.fromISO("P1D").seconds;
    expect(ticket.age().seconds).toEqual(oneDay)
  })
})
