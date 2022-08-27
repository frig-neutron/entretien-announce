import {IntakeFormData} from "../src/intake-form-data";
import {mock} from "jest-mock-extended";
import {JiraService} from "../src/jira-service";
import {formDataRouter} from "../src/form-data-router";
import {TicketAnnouncer} from "../src/ticket-announcer";
import {Announcement} from "../build/src/announcement";
import {Sender} from "pubsub_lalliance/build/src/sender";


describe("form data router", () => {
  const formData: IntakeFormData = {
    area: "" + Math.random(), building: "",
    description: "🦜" + Math.random(),
    priority: "regular", reporter: "", rowIndex: 0,
    summary: "🐿" + Math.random()
  }

  const jiraService = mock<JiraService>();
  const ticketAnnouncer = mock<TicketAnnouncer>();
  const publisher = mock<Sender>();

  const issueKey = "ISSUE-" + Math.random()
  const emailNotification = mock<Announcement>()


  function newFormDataRouter() {
    const fdr = formDataRouter(
        jiraService,
        ticketAnnouncer,
        publisher
    )
    return fdr;
  }

  test("happy path", async () => {
    jiraService.createIssue.mockResolvedValue(issueKey)
    ticketAnnouncer.emailAnnouncement.mockReturnValue([emailNotification])

    const fdr = newFormDataRouter();
    const resolvedKey = await fdr.route(formData);

    expect(jiraService.createIssue).toBeCalledWith(formData);
    expect(resolvedKey).toEqual(issueKey)
    expect(ticketAnnouncer.emailAnnouncement).toBeCalledWith(formData)
    // using calls[] instead of toBeCalledWith b/c Array.map passes 3 args - not 1
    expect((publisher.sendAnnouncement.mock.calls)[0][0]).toBe(emailNotification)

    /**
     * Create Jira ticket
     *  - did ticket creation fail?
     * Create notifications
     *  - is ticket urgent?
     *  - which building?
     *  - Render message
     * Publish messages to pubsub topic
     *  - did publishing fail?
     */
  })

  test("fail if pubsub publish fails", async () => {
    jiraService.createIssue.mockResolvedValue(issueKey)
    ticketAnnouncer.emailAnnouncement.mockReturnValue([emailNotification])
    publisher.sendAnnouncement.mockRejectedValue(new Error("nope"))

    const fdr = formDataRouter(
        jiraService,
        ticketAnnouncer,
        publisher
    )

    const result = fdr.route(formData);

    await expect(result).rejects.toBe("Publishing notifications failed because of [Error: nope]")
  })
})
