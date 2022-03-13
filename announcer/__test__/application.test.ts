import {Application, applicationImpl} from "../src/application";
import {JiraClient} from "../src/jira_client";
import {JiraTicket} from "../src/jira_ticket";
import {mock} from "jest-mock-extended";

import {Interval} from "luxon";
import {ReportService} from "../src/report_model";


const jiraClient = mock<JiraClient>()
const reportService = mock<ReportService>()

describe("application", () => {
  test("happy_path", () => {

    const closedTicket = mock<JiraTicket>()
    const createdTicket = mock<JiraTicket>()
    const openTicket = mock<JiraTicket>()

    jiraClient.allOpenTickets.mockReturnValue([openTicket])
    jiraClient.ticketsClosed.mockReturnValue([closedTicket])
    jiraClient.ticketsCreated.mockReturnValue([createdTicket])

    const application: Application = applicationImpl(
        jiraClient, reportService
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
  })
});
