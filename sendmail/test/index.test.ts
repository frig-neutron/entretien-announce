import {Announcement} from "../src/announcement";
import {Sendmail} from "../src/sendmail";
import {EventFunctionWithCallback} from "@google-cloud/functions-framework";
import {Secrets} from "../src";
import {mockDeep, mockFn} from "jest-mock-extended";
import SMTPTransport from "nodemailer/lib/smtp-transport";
import Mock = jest.Mock;

describe("mainline", () => {
  const senderFactoryMock = mockedSenderFactory()
  const [
      announcementParser,
      secretParser
  ] = mockedParsers()

  const sendmail = mockDeep<Sendmail>()

  const announcement: Announcement = {
    subject: "flippity floppity flip",
    body: "a mouse on a möbius strip",
    primaryRecipient: "Mr.Croup",
    secondaryRecipients: ["Mr.Vandemar"],
  }

  const secrets: Secrets = {
    smtp_from: "setec_astronomy",
    smtp_host: "smtp1.playtronics.net",
    smtp_password: "my voice is my passport",
    smtp_username: "werner_bandes"
  }

  const rawAnnouncementData = "i carry a secret message";
  const rawSecrets = "that i must give to you";

  process.env["SENDMAIL_SECRETS"]= rawSecrets

  // must use require for module import to work
  const mailer: EventFunctionWithCallback = require("../src").sendmail
  const callback = mockFn()

  // defaults set for happy path
  announcementParser.mockReturnValue(announcement)
  secretParser.mockReturnValue(secrets)
  senderFactoryMock.mockReturnValue(sendmail)
  sendmail.sendAnnouncement.mockReturnValue(Promise.resolve(mockDeep<SMTPTransport.SentMessageInfo>()))

  function die(causeOfDeath: string) {
    return function (_: any): never {
      throw causeOfDeath;
    }
  }

  function expectCallbackFailureCall(failureMessage: string){
    expect(callback.mock.calls[0][0]).toEqual(failureMessage)
    expect(callback.mock.calls[0][1]).toEqual(null)
  }

  test("happy path", async () => {
    await mailer(rawAnnouncementData, {}, callback)

    expect(secretParser.mock.calls[0][0]).toEqual(rawSecrets)
    expect(announcementParser.mock.calls[0][0]).toEqual(rawAnnouncementData)
    expect(senderFactoryMock.mock.calls[0][0]).toEqual(secrets)
    expect(sendmail.sendAnnouncement.mock.calls[0][0]).toEqual(announcement)

    expect(callback.mock.calls[0][0]).toEqual(null)
    expect(callback.mock.calls[0][1]).toEqual("Send to Mr.Croup OK")
  })

  test("fail if sending fails", async () => {
    sendmail.sendAnnouncement.mockReturnValue(Promise.reject("u r spam"))
    try {
      await mailer(rawAnnouncementData, {}, callback)
    } catch (notImportant){
    }

    expectCallbackFailureCall("Send to Mr.Croup failed because u r spam")
  })

  test("fail if secret decoding fails", async () => {
    secretParser.mockImplementation(die("hissy fit"))

    try {
      await mailer(rawAnnouncementData, {}, callback)
    } catch (notImportant){
    }

    expectCallbackFailureCall("Send to Mr.Croup failed because hissy fit")
  })


  test("fail if message decoding fails", async () => {
    announcementParser.mockImplementation(die( "tantrum" ))

    try {
      await mailer(rawAnnouncementData, {}, callback)
    } catch (notImportant){
    }

    expectCallbackFailureCall("Announcement decoding failed because tantrum")
  })
})

function mockedSenderFactory(): Mock<any, any> {
  // doing node modules to avoid importing before mock (which gets reordered by "organize imports")
  jest.mock('../src/sendmail')
  const sm = require("../src/sendmail")
  return <Mock<typeof sm.smtpSender>><unknown>sm.smtpSender
}

function mockedParsers(): [Mock<Announcement, any>, Mock<Secrets, any>] {
  // doing node modules to avoid importing before mock (which gets reordered by "organize imports")
  jest.mock('../src/parsers')
  const parsers = require("../src/parsers")
  return [
      <Mock<Announcement>><unknown>parsers.parseAnnouncement,
      <Mock<Secrets>><unknown>parsers.parseSecrets
  ]
}
