/**
 * Simplified interface to issue from jira.js
 */
import {Issue} from "jira.js/out/version2/models";

export interface JiraTicket {
  key(): string
  building(): string,
  summary(): string
}

export function proxyJiraJsIssue(issue: Issue): JiraTicket {
  return {
    key: () => issue.key,
    building: () => "",
    summary: () => issue.fields.summary
  }
}
