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
        }]
    )

    const announcements = factory.createReportAnnouncements(report);

    const reportBody = parse(announcements[0].body);

    const createdHeading = reportBody.querySelector('#created-tickets h2');
    const createdTicketRow = reportBody.querySelector('#created-tickets table tr');
    const issueKeyLink = createdTicketRow!.querySelector(".issue-key a")
    const issueSummaryCell = createdTicketRow!.querySelector(".issue-summary")
    // TODO: date opened / ticket age

    expect(announcements[0].subject).toEqual("Ticket report for December 2021")
    expect(createdHeading!.textContent).toEqual("Tickets created between 12/1/2021 and 12/2/2021")
    expect(issueKeyLink!.attributes['href']).toEqual("https://3rd.circle/browse/KEY_CREATED")
    expect(issueKeyLink!.textContent).toEqual("KEY_CREATED")
    expect(issueSummaryCell!.textContent).toEqual("SUMMARY_CREATED")
  })
})
