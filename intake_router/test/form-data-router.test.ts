import {IntakeFormData} from "../src/intake-form-data";
import {JiraTicket} from "struct_lalliance/build/src/jira_ticket";
import {mock} from "jest-mock-extended";
import {JiraService} from "../src/jira-service";


describe("form data router", () => {
  test("happy path", () => {

    const jiraService = mock<JiraService>();

    const formData: IntakeFormData = {
      area: "", building: "", description: "", priority: "regular", reporter: "", rowIndex: 0, summary: ""
    }

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
