import {announcementFactoryImpl} from "../src/announcement_factory";
import {mockDeep} from "jest-mock-extended";
import {ReportModel} from "../src/report_service";
import {Interval} from "luxon";

let report = mockDeep<ReportModel>()
beforeEach(() => {
  // necessary b/c clearing mocks doesn't fix reassigned props
  report = mockDeep<ReportModel>()
})

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

    report.reportInterval.mockReturnValue(Interval.fromISO("2021-12/P1D"))
    const announcements = factory.createReportAnnouncements(report);

    expect(announcements.length).toEqual(2)
    expect(announcements[0].primaryRecipient).toEqual("charlie@bar")
    expect(announcements[0].subject).toEqual("Ticket report for December 2021")
    expect(announcements[1].primaryRecipient).toEqual("charlotte@baz")
  })
})
