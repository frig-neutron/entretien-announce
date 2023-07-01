import {IntakeFormData} from "../src/intake-form-data";
import {mock} from "jest-mock-extended";
import {JiraService} from "../src/jira-service";
import {formDataRouter} from "../src/form-data-router";
import {TicketAnnouncer} from "../src/ticket-announcer";
import {Announcement} from "struct_lalliance/src/announcement";
import {Sender} from "pubsub_lalliance/src/sender";


describe("form data router", () => {
  const formData: IntakeFormData = {
    area: "" + Math.random(), building: "",
    description: "🦜" + Math.random(),
    priority: "regular", reporter: "", rowIndex: 0,
    summary: "🐿" + Math.random(),
    mode: "production"
  }

  const jiraService = mock<JiraService>();
  const ticketAnnouncer = mock<TicketAnnouncer>();
  const publisher = mock<Sender>();

  const issueKey = "ISSUE-" + Math.random()
  const emailNotification = mock<Announcement>()

  afterEach(() => {
    jest.clearAllMocks();
  });

  test("happy path", async () => {
    jiraService.createIssue.mockResolvedValue(issueKey)
    ticketAnnouncer.emailAnnouncement.mockReturnValue([emailNotification])

    const fdr = newFormDataRouter();
    const result = fdr.route(formData);

    await expect(result).resolves.toEqual(issueKey)
    await expect(jiraService.createIssue).toBeCalledWith(formData);
    await expect(ticketAnnouncer.emailAnnouncement).toBeCalledWith(issueKey, formData)
    await expectTicketNotificationIsPublished();

    /**
     * Create Jira ticket
     *  - did ticket creation fail?
     * Create notifications
     *  - is ticket urgent?
     *  - which building?
     *  - Render message
     */
  })

  test("email admin if ticket creation fails", async () => {
    jiraService.createIssue.mockRejectedValue("jira says no")
    ticketAnnouncer.errorAnnouncement.mockReturnValue([emailNotification])

    const result = newFormDataRouter().route(formData);

    await expect(result).rejects.toEqual("jira says no")
    await expect(ticketAnnouncer.errorAnnouncement).toBeCalledWith("jira says no", formData)
    await expectTicketNotificationIsPublished()
  })

  test("fail if pubsub publish fails", async () => {
    jiraService.createIssue.mockResolvedValue(issueKey)
    ticketAnnouncer.emailAnnouncement.mockReturnValue([emailNotification])
    publisher.sendAnnouncement.mockRejectedValue(new Error("nope"))

    const result = newFormDataRouter().route(formData);

    await expect(result).rejects.toBe("Publishing notifications failed because of [Error: nope]")
  })

  function newFormDataRouter() {
    return formDataRouter(
        jiraService,
        ticketAnnouncer,
        publisher
    );
  }

  function expectTicketNotificationIsPublished() {
    // using calls[] instead of toBeCalledWith b/c Array.map passes 3 args - not 1
    const publisherCalls = publisher.sendAnnouncement.mock.calls;
    expect(publisherCalls[0][0]).toBe(emailNotification)
  }
})
