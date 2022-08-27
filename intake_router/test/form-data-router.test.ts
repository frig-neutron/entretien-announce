import {IntakeFormData} from "../src/intake-form-data";
import {mock} from "jest-mock-extended";
import {JiraService} from "../src/jira-service";
import {formDataRouter} from "../src/form-data-router";
import {TicketAnnouncer} from "../src/ticket-announcer";
import {Announcement} from "../build/src/announcement";
import {Sender} from "pubsub_lalliance/build/src/sender";


describe("form data router", () => {
  test("happy path", async () => {

    const jiraService = mock<JiraService>();
    const ticketAnnouncer = mock<TicketAnnouncer>();
    const sender = mock<Sender>();
    const issueKey = "ISSUE-" + Math.random()
    const emailNotification = mock<Announcement>()

    jiraService.createIssue.mockResolvedValue(issueKey)
    ticketAnnouncer.emailAnnouncement.mockReturnValue([emailNotification])

    const formData: IntakeFormData = {
      area: "" + Math.random(), building: "",
      description: "🦜" + Math.random(),
      priority: "regular", reporter: "", rowIndex: 0,
      summary: "🐿" + Math.random()
    }

    const fdr = formDataRouter(
        jiraService,
        ticketAnnouncer,
        sender
    )
    const resolvedKey = await fdr.route(formData);

    expect(jiraService.createIssue).toBeCalledWith(formData);
    expect(resolvedKey).toEqual(issueKey)
    expect(ticketAnnouncer.emailAnnouncement).toBeCalledWith(formData)
    // using calls[] instead of toBeCalledWith b/c Array.map passes 3 args - not 1
    expect((sender.sendAnnouncement.mock.calls)[0][0]).toBe(emailNotification)

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
