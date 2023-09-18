import {IntakeFormData} from "./intake-form-data";
import {Version2Client} from "jira.js";
import Ajv, {JTDParser, JTDSchemaType} from "ajv/dist/jtd";
import {CreateIssue} from "jira.js/out/version2/parameters";
import {log} from "./logger"

const ajv = new Ajv({verbose: true, allErrors: true})

const jiraPriorityUrgent = "Urgent"
const jiraPriorityMedium = "Medium"

export function jiraService(
    config: JiraConfig,
    jiraClientFactory: (creds: JiraConfig) => Version2Client = jiraV2Client
): JiraService {
  const version2Client = jiraClientFactory(config);
  const converFormToIssue = (form: IntakeFormData): CreateIssue => {
    const testPrefix = form.mode === "test" ? "TEST - " : "";

    function summarize() {
      return `${form.building} ${form.area}: ${form.summary}`;
    }

    function createDescription() {
      return `${form.description}\n\nReported by ${form.reporter}`;
    }

    function jiraPriorityName() {
      if (form.priority.startsWith("urgent")) {
        return jiraPriorityUrgent
      } else {
        return jiraPriorityMedium
      }
    }

    return {
      fields: {
        project: {
          key: config.options.jira_intake_project_key
        },
        summary: testPrefix + summarize(),
        description: createDescription(),
        // "customfield_10038": {"id": 10033}, // building
        // "Area": formData.area,
        priority: {name: jiraPriorityName()},
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

      const issue: CreateIssue = converFormToIssue(intakeFormData);
      if (intakeFormData.mode !== "noop") {
        const createdIssue = version2Client.issues.createIssue(issue)
        return createdIssue.then(ci => ci.key);
      } else {
        log.info(issue)
        return Promise.resolve("dry-run")
      }
    }
  }
}

export interface JiraService {
  createIssue: (intakeFormData: IntakeFormData) => Promise<String>
}

export interface JiraSecrets {
  jira_email: string
  jira_token: string
}

export interface JiraOptions {
  jira_host: string
  jira_intake_project_key: string
}

export interface JiraConfig {
  secrets: JiraSecrets
  options: JiraOptions
}

const jiraSecretsSchema: JTDSchemaType<JiraSecrets> = {
  properties: {
    jira_email: {
      type: "string"
    },
    jira_token: {
      type: "string"
    },
  },
  // To stay in gcp free tier w/ secrets, we share secret definitions with other functions
  // Stuff like SMTP secrets are also defined here.
  additionalProperties: true
}

const jiraOptionsSchema: JTDSchemaType<JiraOptions> = {
  properties: {
    jira_host: {
      type: "string"
    },
    jira_intake_project_key: {
      type: "string"
    },
  }
}

export function parseJiraBasicAuth(secrets: any, options: any): Promise<JiraConfig> {
  const secretsParser = ajv.compileParser(jiraSecretsSchema);
  const secretsParseResult = secretsParser(String(secrets))

  const optionsParser = ajv.compileParser(jiraOptionsSchema)
  const optionsParseResult = optionsParser(options)

  const errMsg = (m: string, p: JTDParser<any>) => p.message ? `${m}: ${p.message}` : ""
  const secretsErr = errMsg("secrets", secretsParser);
  const optionsErr = errMsg("options", optionsParser);

  return secretsParseResult && optionsParseResult
      ? Promise.resolve({secrets: secretsParseResult, options: optionsParseResult})
      : Promise.reject(Error(`Invalid jira ${secretsErr}${optionsErr}`))
}

function jiraV2Client(config: JiraConfig): Version2Client {
  return new Version2Client({
    host: config.options.jira_host,
    authentication: {
      basic: {
        apiToken: config.secrets.jira_token,
        email: config.secrets.jira_email
      }
    }
  });
}
