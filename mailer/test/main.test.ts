import {Announcement} from "../src/announcement";

import Mock = jest.Mock;
import {Sendmail} from "../src/sendmail";
import {EventFunctionWithCallback} from "@google-cloud/functions-framework";
import {Secrets} from "../src/main";

describe("mainline", () => {
  // doing node modules to avoid importing before mock (which gets reordered by "organize imports")
  jest.mock('../src/sendmail')
  const mockedSendmail = require("../src/sendmail")
  const senderFactoryMock = <Mock<Sendmail>><unknown>mockedSendmail.smtpSender

  test("happy path", () => {

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

    // must use require for module import to work
    const mailer: EventFunctionWithCallback = require("../src/main").mailer

    mailer(announcement, {}, function (){})

    expect(senderFactoryMock).toBeCalledTimes(1)
    expect(senderFactoryMock.mock.calls[0][0]).toEqual(secrets)
  })
})
