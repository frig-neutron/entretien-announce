import {mockDeep, mock} from "jest-mock-extended";

import {Issue} from "jira.js/out/version2/models";
import {JiraTicket, proxyJiraJsIssue} from "../src/jira_ticket";


describe("jira ticket", () => {
  test("field access", () => {
    const issue: Issue = mockDeep()
    issue.key = "ISSUE_KEY"

    const ticket: JiraTicket = proxyJiraJsIssue(issue)

    expect(ticket.key).toMatch("ISSUE_KEY")
  })
})
