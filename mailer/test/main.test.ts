import {Announcement} from "../src/announcement";

import Mock = jest.Mock;
import {mailer} from "../src/main"

describe("mainline", () => {
  // doing node modules to avoid importing before mock (which gets reordered by "organize imports")
  jest.mock('../src/sendmail')
  const mockedSendmail = require("../src/sendmail")
  const senderMock = <Mock<typeof mockedSendmail.smtpSender>><unknown>mockedSendmail.smtpSender

  test("happy path", () => {

    const announcement: Announcement = {
      body: "",
      primaryRecipient: "",
      secondaryRecipients: [],
      subject: ""
    }

    mailer(announcement, {}, function (){})

    expect(senderMock).toBeCalledTimes(1)
  })
})
