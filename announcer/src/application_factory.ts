import {Application, applicationImpl} from "./application";
import {jiraClientImpl} from "./jira_client";
import {reportServiceImpl} from "./report_model";
import {announcementFactoryImpl} from "./announcement";
import {senderImpl} from "./sender";
import {Version2Client} from "jira.js";

export type ApplicationFactory = (jiraBasicAuth: JiraBasicAuth) => Application

export function defaultApplicationFactory(jiraBasicAuth: JiraBasicAuth): Application {
  const version2Client = jiraV2Client(jiraBasicAuth);
  const jiraClient = jiraClientImpl(version2Client);
  const reportService = reportServiceImpl();
  const announcementFactory = announcementFactoryImpl();
  const sender = senderImpl();
  return applicationImpl(jiraClient, reportService, announcementFactory, sender);
}

export interface JiraBasicAuth {
  email: string
  apiToken: string
}

function jiraV2Client(jiraCreds: JiraBasicAuth): Version2Client{
  return new Version2Client({
    host: "https://lalliance.atlassian.net",
    authentication: {
      basic: jiraCreds
    }
  });
}
