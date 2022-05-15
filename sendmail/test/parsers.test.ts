import {Announcement} from "../src/announcement";
import {parseAnnouncement, parseSecrets} from "../src/parsers";
import {Secrets} from "../src";
import exp from "constants";

describe("parsers", () => {

  describe("secret parser", () => {

    const okSecrets: Secrets = {
      smtp_from: "setec_astronomy",
      smtp_host: "smtp1.playtronics.net",
      smtp_password: "my voice is my passport",
      smtp_username: "werner_bandes"
    }

    test("happy path from string", () => {
      testParsedJsonIdentity(okSecrets, parseSecrets)
    })

  })

  describe("announcement parser", () => {

    const okAnnouncement: Announcement = {
      subject: "flippity floppity flip",
      body: "a mouse on a möbius strip",
      primaryRecipient: "Mr.Croup",
      secondaryRecipients: ["Mr.Vandemar"],
    }

    test("happy path from string", () => {
      testParsedJsonIdentity(okAnnouncement, parseAnnouncement)
    })
  })

  function testParsedJsonIdentity<T>(reference: T, parser: (_: any) => T){
    const parsed = parser(JSON.stringify(reference))
    expect(parsed).toEqual(reference)
  }
})
