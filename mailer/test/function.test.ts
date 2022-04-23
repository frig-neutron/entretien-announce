import {Announcement} from "../src/announcement";
import {smtpSender} from "../src/sendmail"

jest.mock('../src/sendmail')

describe("mainline", () => {
  test("happy path", () => {

    const announcement: Announcement = {
      body: "",
      primaryRecipient: "",
      secondaryRecipients: [],
      subject: ""
    }

    const fn = require("../function")

    fn.mailer(announcement)

    expect(smtpSender).toBeCalledTimes(1)
  })
})
