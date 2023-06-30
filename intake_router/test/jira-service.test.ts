import {JiraConfig, jiraService, parseJiraBasicAuth} from "../src/jira-service";
import {Version2Client} from "jira.js";
import {IntakeFormData} from "../src/intake-form-data";
import {mockDeep} from "jest-mock-extended";
import {CreateIssue} from "jira.js/out/version2/parameters";
import {CreatedIssue} from "jira.js/out/version2/models";

describe("jira service", () => {
  const rnd = Math.floor(Math.random() * 10000)

  const config: () => JiraConfig = () => {
    return {
      secrets: {
        jira_intake_project_key: "PROJ_" + rnd,
        jira_host: "",
        jira_email: "the_cat",
        jira_token: "on the mat" + rnd
      },
      options: {
        jira_intake_project_key: "PROJ_" + rnd,
        jira_host: "",
      }
    }
  }

  describe("credential parsing", () => {
    test("parse credentials", async () => {
      const cfg = config()
      const actualCreds = await parseJiraBasicAuth(
          JSON.stringify(cfg.secrets),
          JSON.stringify(cfg.options)
      )
      expect(actualCreds).toEqual(config())
    })
    test("parse credentials allows extra keys", async () => {
      const cfg = config();
      const aLittleExtraSecrets = {
        somethingMore: "foo",
        ...cfg.secrets
      }
      const actualCreds = await parseJiraBasicAuth(
          JSON.stringify(aLittleExtraSecrets),
          JSON.stringify(cfg.options)
      )
      expect(actualCreds.secrets).toEqual(aLittleExtraSecrets)
    })
    test("parse secrets error", async () => {
      const actualCreds = parseJiraBasicAuth(
          "bad format",
          JSON.stringify(config().options)
      )
      await expect(actualCreds).rejects.toThrow("Invalid jira secrets: unexpected token b")
    })
    test("parse options error", async () => {
      const actualCreds = parseJiraBasicAuth(
          JSON.stringify(config().secrets),
          "options bad"
      )
      await expect(actualCreds).rejects.toThrow("Invalid jira options: unexpected token o")
    })
  })
  describe("ticket operations", () => {
    const formData: (formCustomizer: (d: IntakeFormData) => IntakeFormData) => IntakeFormData =
        formCustomizer => {
          return formCustomizer({
                area: "Unit 1",
                building: "3740",
                priority: "regular",
                reporter: "A. Friend",
                rowIndex: 0,
                summary: "Needs love",
                description: "All out of love, so lost without you",
                mode: "production"
              }
          )
        }


    const createdIssue: CreatedIssue = {
      id: "",
      key: "K-" + rnd,
      self: ""
    }

    const createIssueRequest: () => CreateIssue = () => {
      return {
        fields: {
          project: {
            key: config().options.jira_intake_project_key
          },
          summary: "3740 Unit 1: Needs love",
          description: "All out of love, so lost without you\n\nReported by A. Friend",
          priority: {name: "Medium"},
          issuetype: {
            name: "Intake"
          }
        }
      }
    }

    test("create regular priority ticket", async () => {
      const client = mockDeep<Version2Client>()
      client.issues.createIssue.mockReturnValue(
          Promise.resolve(createdIssue)
      )

      const jiraClientFactory: (creds: JiraConfig) => Version2Client = (_) => client;
      const jira = jiraService(config(), jiraClientFactory);

      const key = jira.createIssue(formData(x => ({...x, mode: "production"})));

      await expect(client.issues.createIssue).toHaveBeenCalledWith(createIssueRequest())
      await expect(key).resolves.toEqual(createdIssue.key)
    })

    test("create urgent priority ticket", async () => {
      const client = mockDeep<Version2Client>()
      client.issues.createIssue.mockReturnValue(
          Promise.resolve(createdIssue)
      )

      const jiraClientFactory: (creds: JiraConfig) => Version2Client = (_) => client;
      const jira = jiraService(config(), jiraClientFactory);

      const urgentFormSubmission = formData(x => ({...x,
        priority: "urgent",
        mode: "production",
      }));
      await jira.createIssue(urgentFormSubmission);

      const urgentTicketRequest = createIssueRequest();
      urgentTicketRequest.fields.priority = {name: "Urgent"}
      await expect(client.issues.createIssue).toHaveBeenCalledWith(urgentTicketRequest)
    })

    test("test-mode ticket", async () => {
      const client = mockDeep<Version2Client>()
      client.issues.createIssue.mockReturnValue(
          Promise.resolve(createdIssue)
      )

      const jiraClientFactory: (creds: JiraConfig) => Version2Client = (_) => client;
      const testModeConfig = config();
      const jira = jiraService(testModeConfig, jiraClientFactory);

      await jira.createIssue(formData(x => ({...x, mode: "test"})))

      const createIssue = createIssueRequest()
      createIssue.fields.summary = "TEST - 3740 Unit 1: Needs love"

      await expect(client.issues.createIssue).toHaveBeenCalledWith(createIssue)
    })
  })
})
