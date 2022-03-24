import {announcementFactoryImpl} from "../src/announcement_factory";
import {mockDeep} from "jest-mock-extended";
import {ReportModel, TicketBlock} from "../src/report_service";
import {Interval} from "luxon";
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
          summary: () => "SUMMARY_CREATED"
        }])
    closedTickets.tickets.mockReturnValue(
        [{
          building: () => "BLDG_CLOSED",
          key: () => "KEY_CLOSED",
          summary: () => "SUMMARY_CLOSED"
        }])
    allTickets.tickets.mockReturnValue(
        [{
          building: () => "BLDG_EXISTS",
          key: () => "KEY_EXISTS",
          summary: () => "SUMMARY_EXISTS"
        }])

    const announcements = factory.createReportAnnouncements(report);

    const reportBody = parse(announcements[0].body);

    type TicketBlockStrings = {
      containerElementSelector: string,
      header: string,
      issueKey: string,
      issueSummary: string
    }

    const checkTicketBlock = (strings: TicketBlockStrings) => {
      const createdHeadingContainer = reportBody.querySelector(strings.containerElementSelector)
      const createdHeading = createdHeadingContainer!.querySelector('h2');
      const createdTicketRow = createdHeadingContainer!.querySelector('table tr');
      const issueKeyLink = createdTicketRow!.querySelector(".issue-key a")
      const issueSummaryCell = createdTicketRow!.querySelector(".issue-summary")
      // TODO: date opened / ticket age

      expect(createdHeading!.textContent).toEqual(strings.header)
      expect(issueKeyLink!.attributes['href']).toEqual(`https://3rd.circle/browse/${strings.issueKey}`)
      expect(issueKeyLink!.textContent).toEqual(strings.issueKey)
      expect(issueSummaryCell!.textContent).toEqual(strings.issueSummary)
    }

    expect(announcements[0].subject).toEqual("Ticket report for December 2021")
    checkTicketBlock({
      containerElementSelector: '#tickets-created',
      header: "Tickets created between 12/1/2021 and 12/2/2021",
      issueKey: "KEY_CREATED",
      issueSummary: "SUMMARY_CREATED"
    })
    checkTicketBlock({
      containerElementSelector: '#tickets-closed',
      header: "Tickets closed between 12/1/2021 and 12/2/2021",
      issueKey: "KEY_CLOSED",
      issueSummary: "SUMMARY_CLOSED"
    })
    checkTicketBlock({
      containerElementSelector: '#tickets-all-open',
      header: "All open tickets",
      issueKey: "KEY_EXISTS",
      issueSummary: "SUMMARY_EXISTS"
    })
  })
})
