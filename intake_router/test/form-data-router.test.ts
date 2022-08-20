import {IntakeFormData} from "../src/intake-form-data";
import {mock} from "jest-mock-extended";
import {JiraService} from "../src/jira-service";
import {formDataRouter} from "../src/form-data-router";


describe("form data router", () => {
  test("happy path", () => {

    const jiraService = mock<JiraService>();
    const issueKey = "ISSUE-" + Math.random()

    jiraService.createIssue.mockResolvedValue(issueKey)

    const formData: IntakeFormData = {
      area: "" + Math.random(), building: "", description: "", priority: "regular", reporter: "", rowIndex: 0, summary: ""
    }

    const fdr = formDataRouter(jiraService)
    const resolvedKey = fdr.route(formData);

    expect(jiraService.createIssue).toBeCalledWith(formData);
    expect(resolvedKey).resolves.toEqual(issueKey)

    /**
     * Create Jira ticket
     *  - did ticket creation fail?
     * Create notifications
     *  - is ticket urgent?
     *  - which building?
     *  - Render message
     * Publish messages to pubsub topic
     *  - did publishing fail?
     * return Jira ticket key
     */

  })
})
