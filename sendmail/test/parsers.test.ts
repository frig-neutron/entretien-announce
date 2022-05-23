import {Announcement} from "../src/announcement";
import {parseAnnouncement, parseSecrets} from "../src/parsers";
import {Secrets} from "../src";


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

    let announce: Announcement;

    beforeEach(() => {
      announce = {
        subject: "flippity floppity flip",
        body: "a mouse on a möbius strip",
        primary_recipient: "Mr.Croup@below.co.uk",
        secondary_recipients: ["Mr.Vandemar"],
      }
    })

    it.each([
      "body", "primary_recipient", "subject"
    ])("error if missing %p", (field) => {
      expect(parseForIdentity(delProp(announce, field), parseAnnouncement)).toThrow()
    })

    test("error if invalid primary_recipient", () => {
      announce.primary_recipient = "nyan"
      expect(parseForIdentity(announce, parseAnnouncement)).toThrow()
    })

    test("error if empty subject", () => {
      announce.subject = ""
      expect(parseForIdentity(announce, parseAnnouncement)).toThrow()
    })

    test("error if empty body", () => {
      announce.body = ""
      expect(parseForIdentity(announce, parseAnnouncement)).toThrow()
    })

    test("happy path from string", () => {
      testParsedJsonIdentity(announce, parseAnnouncement)
    })
  })

  function delProp<T extends object>(orig: T, prop: string): object {
    return mkMutant(orig, (c: any) => delete c[prop])
  }

  function mkMutant<T extends object>(orig: T, mutagen: (_: object) => any): object {
    const copy: object = {...orig}
    mutagen(copy)
    return copy
  }

  function parseForIdentity<T>(reference: T, parser: (_: any) => T): () => T {
    return (): T => {
      return parser(JSON.stringify(reference))
    }
  }

  function testParsedJsonIdentity<T>(reference: T, parser: (_: any) => T) {
    const parsed: T = parseForIdentity(reference, parser)()
    expect(parsed).toEqual(reference)
  }
})
