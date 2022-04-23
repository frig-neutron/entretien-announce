import {Announcement} from "../src/announcement";

import Mock = jest.Mock;

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
    const fn = require("../function")

    fn.mailer(announcement)

    expect(senderMock).toBeCalledTimes(1)
  })
})
