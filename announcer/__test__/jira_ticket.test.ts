import {mockDeep, mock} from "jest-mock-extended";

import {Issue} from "jira.js/out/version2/models";
import {JiraTicket, proxyJiraJsIssue} from "../src/jira_ticket";


describe("jira ticket", () => {
  let issue = mock<Issue>()
  let ticket: JiraTicket = proxyJiraJsIssue(issue)

  beforeEach(() => {
    issue = mock<Issue>()
    ticket = proxyJiraJsIssue(issue)
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
})
