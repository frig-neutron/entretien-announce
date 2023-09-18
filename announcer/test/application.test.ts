import {Application, applicationImpl, Clock} from "../src/application";
import {JiraClient} from "../src/jira_client";
import {JiraTicket} from "../src/jira_ticket";
import {mock, mockFn} from "jest-mock-extended";

import {DateTime, Interval} from "luxon";
import {ReportModel, ReportService} from "../src/report_service";
import {AnnouncementFactory} from "../src/announcement_factory";
import {Announcement} from "struct_lalliance/src/announcement";
import {Sender} from "pubsub_lalliance/src/sender";


const jiraClient = mock<JiraClient>()
const reportService = mock<ReportService>()
const announcementFactory = mock<AnnouncementFactory>()
const sender = mock<Sender>()
const clock = mockFn<Clock>()

const application: Application = applicationImpl(
    jiraClient, reportService, announcementFactory, sender, clock
)

describe("application", () => {
  test("happy_path", async () => {

    const closedTicket = mock<JiraTicket>()
    const createdTicket = mock<JiraTicket>()
    const openTicket = mock<JiraTicket>()
    const reportModel = mock<ReportModel>()
    const announcement = mock<Announcement>()

    jiraClient.allOpenTickets.mockReturnValue(Promise.resolve([openTicket]))
    jiraClient.ticketsClosed.mockReturnValue(Promise.resolve([closedTicket]))
    jiraClient.ticketsCreated.mockReturnValue(Promise.resolve([createdTicket]))
    reportService.processReport.mockReturnValue(reportModel)
    announcementFactory.createReportAnnouncements.mockReturnValue([announcement])
    sender.sendAnnouncement.mockReturnValue(Promise.resolve({}))

    await application.announce("2038-01-19T12:34:56.789")

    const reportInterval = Interval.fromISO("2037-12-01/2038-01-01")

    expect(jiraClient.ticketsClosed).toBeCalledWith(reportInterval)
    expect(jiraClient.ticketsCreated).toBeCalledWith(reportInterval)
    expect(jiraClient.allOpenTickets).toBeCalledWith()
    expect(reportService.processReport).toBeCalledWith({
      ticketsClosed: [closedTicket],
      ticketsCreated: [createdTicket],
      allOpenTickets: [openTicket]
    }, reportInterval)
    expect(announcementFactory.createReportAnnouncements).toBeCalledWith(reportModel)
    expect(sender.sendAnnouncement).toBeCalledWith(announcement)
  })

  test("reject invalid today string", async () => {
    try {
      await application.announce("Mooooo...")
    } catch (e) {
      expect(e).toBe("Mooooo... is not a valid ISO-8106 date")
    }
    expect(jiraClient.ticketsClosed).toBeCalledTimes(0)
    expect(jiraClient.ticketsCreated).toBeCalledTimes(0)
    expect(jiraClient.allOpenTickets).toBeCalledTimes(0)
  })

  test("fall back to clock function if today is missing", async () => {
    clock.mockReturnValue(DateTime.fromISO("1997-08-29"))

    await application.announce(undefined)
    const reportInterval = Interval.fromISO("1997-07-01/1997-08-01")

    expect(jiraClient.ticketsClosed).toBeCalledWith(reportInterval)
  })

  test("reject on failure to send a message", async () => {

    const announcement = mock<Announcement>()
    announcementFactory.createReportAnnouncements.mockReturnValue([announcement])
    sender.sendAnnouncement.mockReturnValue(Promise.reject("wrong"))

    const res = application.announce("2038-01-19T12:34:56.789")

    await expect(res).rejects.toThrow(new Error("nope"))
  })
});
