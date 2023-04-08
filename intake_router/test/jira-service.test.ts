import {JiraServiceCfg, jiraService, parseJiraBasicAuth} from "../src/jira-service";
import {Callback, Version2Client} from "jira.js";
import {IntakeFormData} from "../src/intake-form-data";
import {mockDeep} from "jest-mock-extended";
import {CreateIssue} from "jira.js/out/version2/parameters";
import {CreatedIssue} from "jira.js/out/version2/models";

describe("jira service", () => {
  const rnd = Math.floor(Math.random() * 10000)
  const cfg: () => JiraServiceCfg = () => {
    return {
      intake_project_key: "PROJ_" + rnd,
      jira_host: "",
      test_mode: false,
      jira_basic_auth: {
        email: "the_cat", token: "on the mat" + rnd
      }
    }
  }

  describe("credential parsing", () => {
    test("parse credentials", async () => {
      const actualCreds = await parseJiraBasicAuth(JSON.stringify(cfg()))
      expect(actualCreds).toEqual(cfg())
    })
    test("parse credentials error", async () => {
      const actualCreds = parseJiraBasicAuth("bad format")
      await expect(actualCreds).rejects.toThrow("Invalid jira creds: bad format")
    })
  })
  describe("ticket operations", () => {
    const formData: IntakeFormData = {
      area: "Unit 1",
      building: "3740",
      priority: "regular",
      reporter: "A. Friend",
      rowIndex: 0,
      summary: "Needs love",
      description: "All out of love, so lost without you"
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
            key: cfg().intake_project_key
          },
          summary: "3740 Unit 1: Needs love", //todo: test testModePrefix + summarize(formData)",
          description: "All out of love, so lost without you\n\nReported by A. Friend",
          priority: {name: "TBD"},
          issuetype: {
            name: "Intake"
          }
        }
      }
    }

    test("create ticket", async () => {
      const client = mockDeep<Version2Client>()
      client.issues.createIssue.mockReturnValue(
          Promise.resolve(createdIssue)
      )

      const jiraClientFactory: (creds: JiraServiceCfg) => Version2Client = (_) => client;
      const jira = jiraService(cfg(), jiraClientFactory);

      const key = jira.createIssue(formData);

      await expect(client.issues.createIssue).toHaveBeenCalledWith(createIssueRequest())
      await expect(key).resolves.toEqual(createdIssue.key)
    })

    test("test-mode ticket", async () => {
      const client = mockDeep<Version2Client>()
      client.issues.createIssue.mockReturnValue(
          Promise.resolve(createdIssue)
      )

      const jiraClientFactory: (creds: JiraServiceCfg) => Version2Client = (_) => client;
      const jira = jiraService({...cfg(), test_mode: true}, jiraClientFactory);

      jira.createIssue(formData)

      const createIssue = createIssueRequest()
      createIssue.fields.summary = "TEST - 3740 Unit 1: Needs love"

      await expect(client.issues.createIssue).toHaveBeenCalledWith(createIssue)
    })
  })
})
