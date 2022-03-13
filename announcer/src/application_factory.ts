import {Application, applicationImpl} from "./application";
import {jiraClientImpl, JiraCreds} from "./jira_client";
import {reportServiceImpl} from "./report_model";
import {announcementFactoryImpl} from "./announcement";
import {senderImpl} from "./sender";

export type ApplicationFactory = (jiraCreds: JiraCreds) => Application

export function defaultApplicationFactory(jiraCreds: JiraCreds): Application {
  const jiraClient = jiraClientImpl(jiraCreds);
  const reportService = reportServiceImpl();
  const announcementFactory = announcementFactoryImpl();
  const sender = senderImpl();
  return applicationImpl(jiraClient, reportService, announcementFactory, sender);
}
