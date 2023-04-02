import {IntakeFormData} from "./intake-form-data";
import {Version2Client} from "jira.js";
import Ajv, {JTDSchemaType} from "ajv/dist/jtd";

const ajv = new Ajv({verbose: true, allErrors: true})

export function jiraService(
    jiraCreds: JiraBasicAuth,
    jiraClientFactory: (creds: JiraBasicAuth) => Version2Client = jiraV2Client
): JiraService {
  return {
    createIssue(intakeFormData: IntakeFormData): Promise<String> {
      // TODO: idempotence - replaying the same issue multiple times should not re-create issue
      // probably a good idea to use a hidden field w/ form data hash
      return Promise.resolve("");
    }

  }
}

export interface JiraService {
  createIssue: (intakeFormData: IntakeFormData) => Promise<String>
}

export interface JiraBasicAuth {
  jira_email: string
  jira_token: string
}

const jiraBasicAuthSchema: JTDSchemaType<JiraBasicAuth> = {
  properties: {
    jira_token: {
      type: "string"
    },
    jira_email: {
      type: "string"
    }
  }
}

export function parseJiraBasicAuth(data: any): Promise<JiraBasicAuth> {
  const parser = ajv.compileParser(jiraBasicAuthSchema);
  const parseResult = parser(String(data))

  return parseResult
      ? Promise.resolve(parseResult)
      : Promise.reject(Error(`Invalid jira creds: ${data}`))
}

function jiraV2Client(jiraCreds: JiraBasicAuth): Version2Client {
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
