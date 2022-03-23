import {announcementFactoryImpl} from "../src/announcement_factory";
import {mockDeep} from "jest-mock-extended";
import {ReportModel} from "../src/report_service";

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

    const announcements = factory.createReportAnnouncements(report);

    expect(announcements.length).toEqual(2)
    expect(announcements[0].primaryRecipient).toEqual("charlie@bar")
    expect(announcements[1].primaryRecipient).toEqual("charlotte@baz")
  })
})
