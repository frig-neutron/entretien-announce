import {Announcement} from "../src/announcement";
import {Sendmail} from "../src/sendmail";
import {EventFunctionWithCallback} from "@google-cloud/functions-framework";
import {Secrets} from "../src";
import {mockDeep} from "jest-mock-extended";
import Mock = jest.Mock;

describe("mainline", () => {
  // doing node modules to avoid importing before mock (which gets reordered by "organize imports")
  jest.mock('../src/sendmail')
  const sm = require("../src/sendmail")
  const senderFactoryMock = <Mock<typeof sm.createSender>><unknown>sm.smtpSender

  test("happy path", () => {
    const sendmail = mockDeep<Sendmail>()

    const announcement: Announcement = {
      body: "",
      primaryRecipient: "",
      secondaryRecipients: [],
      subject: ""
    }

    const secrets: Secrets = {
      smtp_from: "setec_astronomy",
      smtp_host: "smtp1.playtronics.net",
      smtp_password: "my voice is my passport",
      smtp_username: "werner_bandes"
    }

    process.env["ANNOUNCER_SECRETS"]=JSON.stringify(secrets)

    senderFactoryMock.mockReturnValue(sendmail)

    // must use require for module import to work
    const mailer: EventFunctionWithCallback = require("../src").mailer

    // RUNNER
    mailer(JSON.stringify(announcement), {}, function (){})

    expect(senderFactoryMock).toBeCalledTimes(1)
    expect(senderFactoryMock.mock.calls[0][0]).toEqual(secrets)

    expect(sendmail.sendAnnouncement).toBeCalledTimes(1)
    expect(sendmail.sendAnnouncement.mock.calls[0][0]).toEqual(announcement)
  })
})
