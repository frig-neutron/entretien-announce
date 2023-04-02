import {JiraBasicAuth, parseJiraBasicAuth} from "../src/jira-service";
import exp from "constants";


describe("jira service", () => {
  test("parse credentials", async () => {
    const creds: JiraBasicAuth = {
      jira_email: "the_cat", jira_token: "on the mat" + Math.random()
    }
    const actualCreds = await parseJiraBasicAuth(JSON.stringify(creds))
    expect(actualCreds).toEqual(creds)
  })
  test("parse credentials error", async () => {
    const actualCreds = parseJiraBasicAuth("bad format")
    await expect(actualCreds).rejects.toThrow("Invalid jira creds: bad format")
  })
})
