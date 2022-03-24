import {announcementFactoryImpl} from "../src/announcement_factory";
import {mockDeep} from "jest-mock-extended";
import {ReportModel, TicketBlock} from "../src/report_service";
import {Interval} from "luxon";

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
    ])
    createdTickets.tickets.mockReturnValue(
        [{
          building: () => "BLDG",
          key: () => "KEY",
          summary: () => "SUMMARY"
        }]
    )

    const announcements = factory.createReportAnnouncements(report);
    expect(announcements[0].subject).toEqual("Ticket report for December 2021")
  })
})
