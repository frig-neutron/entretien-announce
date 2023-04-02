import {IntakeFormData} from "./intake-form-data";
import {Version2Client} from "jira.js";
import Ajv, {JTDSchemaType} from "ajv/dist/jtd";
import {CreateIssue} from "jira.js/out/version2/parameters";

const ajv = new Ajv({verbose: true, allErrors: true})

export function jiraService(
    config: JiraServiceCfg,
    jiraClientFactory: (creds: JiraServiceCfg) => Version2Client = jiraV2Client
): JiraService {
  const version2Client = jiraClientFactory(config);
  const converFormToIssue = (form: IntakeFormData): CreateIssue => {
    const isTest = config.test_mode ? "TEST - " : "";
    return {
      fields: {
        project: {
          key: config.intake_project_key
        },
        summary: isTest + `${form.building} ${form.area}: ${form.summary}`, //"testModePrefix + summarize(formData)",
        description: "TBD", // "createDescription(formData)",
        // "customfield_10038": {"id": 10033}, // building
        // "Area": formData.area,
        priority: {name: "TBD"},
        issuetype: {
          name: "Intake"
        }
      }
    }
  }
  return {
    createIssue(intakeFormData: IntakeFormData): Promise<String> {
      // TODO: idempotence - replaying the same issue multiple times should not re-create issue
      // probably a good idea to use a hidden field w/ form data hash

      version2Client.issues.createIssue(converFormToIssue(intakeFormData))
      return Promise.resolve("");
    }

  }
}

export interface JiraService {
  createIssue: (intakeFormData: IntakeFormData) => Promise<String>
}

export interface JiraServiceCfg {
  jira_basic_auth: {
    email: string
    token: string
  }
  jira_host: string
  intake_project_key: string
  test_mode: boolean
}

const jiraBasicAuthSchema: JTDSchemaType<JiraServiceCfg> = {
  properties: {
    jira_basic_auth: {
      properties: {
        token: {
          type: "string"
        },
        email: {
          type: "string"
        }
      }
    },
    jira_host: {
      type: "string"
    },
    intake_project_key: {
      type: "string"
    },
    test_mode: {
      type: "boolean"
    }
  }
}

export function parseJiraBasicAuth(data: any): Promise<JiraServiceCfg> {
  const parser = ajv.compileParser(jiraBasicAuthSchema);
  const parseResult = parser(String(data))

  return parseResult
      ? Promise.resolve(parseResult)
      : Promise.reject(Error(`Invalid jira creds: ${data}`))
}

function jiraV2Client(config: JiraServiceCfg): Version2Client {
  return new Version2Client({
    host: config.jira_host,
    authentication: {
      basic: {
        apiToken: config.jira_basic_auth.token,
        email: config.jira_basic_auth.email
      }
    }
  });
}
