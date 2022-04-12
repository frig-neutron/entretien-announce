import {announcementFactoryImpl} from "../src/announcement_factory";
import {mockDeep} from "jest-mock-extended";
import {ReportModel, TicketBlock} from "../src/report_service";
import {DateTime, Duration, Interval} from "luxon";
import {Option} from "prelude-ts";
import {HTMLElement} from "node-html-parser";

import {parse} from "node-html-parser"

const createdTickets = mockTicketBlock()
const allTickets = mockTicketBlock()
const closedTickets = mockTicketBlock()

const report = mockDeep<ReportModel>()

report.created.mockReturnValue(createdTickets)
report.closed.mockReturnValue(closedTickets)
report.allOpen.mockReturnValue(allTickets)
report.reportInterval.mockReturnValue(Interval.fromISO("2021-12/P1D"))

function mockTicketBlock() {
  const ticketBlock = mockDeep<TicketBlock>();
  ticketBlock.highPriorityTickets.mockReturnValue([])
  ticketBlock.tickets.mockReturnValue([])
  ticketBlock.ticketsByBuilding.mockReturnValue(new Map())
  return ticketBlock;
}

describe("Announcement factory", () => {

  type TicketBlockStrings = {
    containerElementSelector: string,
    header: string,
    issueAge: string,
    issueKey: string,
    issueSummary: string,
    issueStatus: string
  }

  const checkTicketBlock = (reportBody: HTMLElement, strings: TicketBlockStrings) => {
    const container = reportBody.querySelector(strings.containerElementSelector)
    const headingElement = container!.querySelector('h2');

    const headerRow = container!.querySelector("table thead tr")
    const issueKeyHeader = headerRow!.querySelector(".issue-key")
    const issueSummaryHeader = headerRow!.querySelector(".issue-summary")

    const issueRow = container!.querySelector('table tbody tr');
    const issueAge = issueRow!.querySelector(".issue-age")
    const issueKeyLink = issueRow!.querySelector(".issue-key a")
    const issueSummaryCell = issueRow!.querySelector(".issue-summary")
    const issueStatus = issueRow!.querySelector(".issue-status")
    // TODO: date opened / ticket age

    expect(headingElement!.textContent.trim()).toEqual(strings.header)
    expect(issueKeyHeader!.textContent.trim()).toEqual("Ticket no.")
    expect(issueSummaryHeader!.textContent.trim()).toEqual("Summary")
    expect(issueAge!.textContent.trim()).toEqual(strings.issueAge)
    expect(issueKeyLink!.attributes['href']).toEqual(`https://3rd.circle/browse/${strings.issueKey}`)
    expect(issueKeyLink!.textContent.trim()).toEqual(strings.issueKey)
    expect(issueStatus!.textContent.trim()).toEqual(strings.issueStatus)
    expect(issueSummaryCell!.textContent.trim()).toEqual(strings.issueSummary)
  }

  test("no recipients => no announcements", () => {
    const factory = announcementFactoryImpl([])
    const announcements = factory.createReportAnnouncements(report);
    expect(announcements.length).toEqual(0)
  })
  test("announcement created for each recipient", () => {
    const factory = announcementFactoryImpl([
      {email: "charlie@bar", lang: "en", name: "charlie", roles: []},
      {email: "charlotte@baz", lang: "fr", name: "charlotte", roles: []},
    ])

    const announcements = factory.createReportAnnouncements(report);

    expect(announcements.length).toEqual(2)
    expect(announcements[0].primaryRecipient).toEqual("charlie@bar")
    expect(announcements[1].primaryRecipient).toEqual("charlotte@baz")
  })

  test("check translation en", () => {
    const factory = announcementFactoryImpl([
      {email: "charlie@bar", lang: "en", name: "charlie", roles: []},
    ])

    const announcements = factory.createReportAnnouncements(report);
    expect(announcements[0].subject).toEqual("Ticket report for December 2021")
  })

  test("check translation fr", () => {
    const factory = announcementFactoryImpl([
      {email: "charlotte@baz", lang: "fr", name: "charlotte", roles: []},
    ])

    const announcements = factory.createReportAnnouncements(report);
    expect(announcements[0].subject).toEqual("Rapport de billetterie pour décembre 2021")
  })

  test("template rendering", () => {
    const factory = announcementFactoryImpl([
      {email: "charlie@bar", lang: "en", name: "charlie", roles: []},
    ], {jiraDomain: "3rd.circle"})
    createdTickets.tickets.mockReturnValue(
        [{
          building: () => "BLDG_CREATED",
          key: () => "KEY_CREATED",
          summary: () => "SUMMARY_CREATED",
          age: () => Option.some(Duration.fromISO("P1DT3H")),
          dateCreated: () => Option.some(DateTime.fromISO("2020-01-01")),
          status: () => Option.some("STATUS_CREATED")
        }])
    closedTickets.tickets.mockReturnValue(
        [{
          building: () => "BLDG_CLOSED",
          key: () => "KEY_CLOSED",
          summary: () => "SUMMARY_CLOSED",
          age: () => Option.some(Duration.fromISO("P2DT3H")),
          dateCreated: () => Option.some(DateTime.fromISO("2020-02-01")),
          status: () => Option.some("STATUS_CLOSED")
        }])
    allTickets.tickets.mockReturnValue(
        [{
          building: () => "BLDG_EXISTS",
          key: () => "KEY_EXISTS",
          summary: () => "SUMMARY_EXISTS",
          age: () => Option.some(Duration.fromISO("P3DT3H")),
          dateCreated: () => Option.some(DateTime.fromISO("2020-03-01")),
          status: () => Option.some("STATUS_EXISTS")
        }])

    const announcements = factory.createReportAnnouncements(report);

    const reportBody: HTMLElement = parse(announcements[0].body);

    expect(reportBody.querySelector("#greeting")!.textContent).toEqual("Dear charlie,")
    expect(reportBody.querySelector("#preamble")!.textContent).toEqual(
        "Here is a summary of jira ticket activity for December 2021"
    )
    expect(announcements[0].subject).toEqual("Ticket report for December 2021")
    checkTicketBlock(reportBody, {
      containerElementSelector: '#tickets-created',
      header: "Tickets created between 12/1/2021 and 12/2/2021",
      issueAge: "1 day",
      issueKey: "KEY_CREATED",
      issueSummary: "SUMMARY_CREATED",
      issueStatus: "STATUS_CREATED"
    })
    checkTicketBlock(reportBody,{
      containerElementSelector: '#tickets-closed',
      header: "Tickets closed between 12/1/2021 and 12/2/2021",
      issueAge: "2 days",
      issueKey: "KEY_CLOSED",
      issueSummary: "SUMMARY_CLOSED",
      issueStatus: "STATUS_CLOSED"
    })
    checkTicketBlock(reportBody,{
      containerElementSelector: '#tickets-all-open',
      header: "All open tickets",
      issueAge: "3 days",
      issueKey: "KEY_EXISTS",
      issueSummary: "SUMMARY_EXISTS",
      issueStatus: "STATUS_EXISTS"
    })
  })

  test("missing value rendering", () => {
    const factory = announcementFactoryImpl([
      {email: "charlie@bar", lang: "en", name: "charlie", roles: []},
    ], {jiraDomain: "3rd.circle"})

    createdTickets.tickets.mockReturnValue(
        [{
          building: () => "BLDG_CREATED",
          key: () => "KEY_CREATED",
          summary: () => "SUMMARY_CREATED",
          age: () => Option.none(),
          dateCreated: () => Option.none(),
          status: () => Option.none()
        }])

    const announcements = factory.createReportAnnouncements(report);

    const reportBody: HTMLElement = parse(announcements[0].body);

    checkTicketBlock(reportBody, {
      containerElementSelector: '#tickets-created',
      header: "Tickets created between 12/1/2021 and 12/2/2021",
      issueAge: "Unknown",
      issueKey: "KEY_CREATED",
      issueSummary: "SUMMARY_CREATED",
      issueStatus: "Unknown"
    })
  })
})
