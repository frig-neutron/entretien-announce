import {Application, applicationImpl} from "../src/application";
import {JiraClient} from "../src/jira_client";
import {JiraTicket} from "../src/jira_ticket";
import {mock} from "jest-mock-extended";

import {Interval} from "luxon";
import {ReportModel, ReportService} from "../src/report_model";
import {Announcement, AnnouncementFactory} from "../src/announcement";
import {Sender} from "../src/sender";


const jiraClient = mock<JiraClient>()
const reportService = mock<ReportService>()
const announcementFactory = mock<AnnouncementFactory>()
const sender = mock<Sender>()

describe("application", () => {
  test("happy_path", () => {

    const closedTicket = mock<JiraTicket>()
    const createdTicket = mock<JiraTicket>()
    const openTicket = mock<JiraTicket>()
    const reportModel = mock<ReportModel>()
    const announcement = mock<Announcement>()

    jiraClient.allOpenTickets.mockReturnValue([openTicket])
    jiraClient.ticketsClosed.mockReturnValue([closedTicket])
    jiraClient.ticketsCreated.mockReturnValue([createdTicket])
    reportService.processReport.mockReturnValue(reportModel)
    announcementFactory.createReportAnnouncements.mockReturnValue([announcement])

    const application: Application = applicationImpl(
        jiraClient, reportService, announcementFactory, sender
    )

    application.announce("2038-01-19T12:34:56.789")

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
});