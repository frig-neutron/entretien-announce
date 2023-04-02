import {JiraBasicAuth, jiraService, parseJiraBasicAuth} from "../src/jira-service";
import {Version2Client} from "jira.js";
import {IntakeFormData} from "../src/intake-form-data";
import {mock, mockDeep} from "jest-mock-extended";
import {CreateIssue} from "jira.js/out/version2/parameters";

describe("jira service", () => {
  const creds: JiraBasicAuth = {
    jira_email: "the_cat", jira_token: "on the mat" + Math.random()
  }

  describe("credential parsing", () => {
    test("parse credentials", async () => {
      const actualCreds = await parseJiraBasicAuth(JSON.stringify(creds))
      expect(actualCreds).toEqual(creds)
    })
    test("parse credentials error", async () => {
      const actualCreds = parseJiraBasicAuth("bad format")
      await expect(actualCreds).rejects.toThrow("Invalid jira creds: bad format")
    })
  })
  describe("ticket operations", () => {
    const formData: IntakeFormData = {
      area: "",
      building: "",
      description: "",
      priority: "regular",
      reporter: "",
      rowIndex: 0,
      summary: ""
    }

    test("create ticket", () => {
      const client = mockDeep<Version2Client>()

      const jiraClientFactory: (creds: JiraBasicAuth) => Version2Client = (_) => client;
      const jira = jiraService(creds, jiraClientFactory);

      const createIssueReq: CreateIssue = {
        fields: {
          project: {
            key: "TRIAG"
          },
          summary: "TBD", //"testModePrefix + summarize(formData)",
          description: "TBD", // "createDescription(formData)",
          // "customfield_10038": {"id": 10033}, // building
          // "Area": formData.area,
          priority: {name: "TBD"},
          issuetype: {
            name: "Intake"
          }
        }
      }

      jira.createIssue(formData)

      expect(client.issues.createIssue).toHaveBeenCalledWith(createIssueReq)
    })
  })
})
