/**
 * Simplified interface to issue from jira.js
 */
import {Issue} from "jira.js/out/version2/models";

export interface JiraTicket {

}

export function proxyJiraJsIssue(issue: Issue): JiraTicket {
  return {

  }
}
