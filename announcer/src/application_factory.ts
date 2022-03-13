import {Application, applicationImpl} from "./application";
import {jiraClientImpl, JiraCreds} from "./jira_client";

export type ApplicationFactory = (jiraCreds: JiraCreds) => Application

export function defaultApplicationFactory(jiraCreds: JiraCreds): Application {
  let jiraClient = jiraClientImpl(jiraCreds);
  return applicationImpl(jiraClient);
}
