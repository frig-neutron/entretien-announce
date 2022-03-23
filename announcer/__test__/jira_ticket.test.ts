import {mockDeep, mock} from "jest-mock-extended";

import {Issue} from "jira.js/out/version2/models";
import {JiraTicket, proxyJiraJsIssue} from "../src/jira_ticket";


describe("jira ticket", () => {
  const issue: Issue = mockDeep()
  const ticket: JiraTicket = proxyJiraJsIssue(issue)

  test("issue key", () => {
    issue.key = "ISSUE_KEY"
    expect(ticket.key()).toEqual("ISSUE_KEY")
  })

  test("ticket summary", () => {
    issue.fields.summary = "SUMMARY"
    expect(ticket.summary()).toEqual("SUMMARY")
  })

})
