import {Application, applicationImpl} from "./application";
import {jiraClientImpl} from "./jira_client";
import {reportServiceImpl} from "./report_service";
import {announcementFactoryImpl, Recipient} from "./announcement_factory";
import {SmtpConfig, smtpSender} from "./sender";
import {Version2Client} from "jira.js";

export type ApplicationFactory = (
    directory: Recipient[],
    jiraBasicAuth: JiraBasicAuth,
    smtpConfig: SmtpConfig
) => Application

export function defaultApplicationFactory(
    directory: Recipient[],
    jiraBasicAuth: JiraBasicAuth,
    smtpConfig: SmtpConfig): Application {
  const version2Client = jiraV2Client(jiraBasicAuth);
  const jiraClient = jiraClientImpl(version2Client);
  const reportService = reportServiceImpl();
  const announcementFactory = announcementFactoryImpl(directory);
  const sender = smtpSender(smtpConfig);
  return applicationImpl(jiraClient, reportService, announcementFactory, sender);
}

export interface JiraBasicAuth {
  jira_email: string
  jira_token: string
}

function jiraV2Client(jiraCreds: JiraBasicAuth): Version2Client{
  return new Version2Client({
    host: "https://lalliance.atlassian.net",
    authentication: {
      basic: {
        apiToken: jiraCreds.jira_token,
        email: jiraCreds.jira_email
      }
    }
  });
}
