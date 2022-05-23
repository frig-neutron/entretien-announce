import {Announcement} from "../src/announcement";
import {parseAnnouncement, parseSecrets, Secrets} from "../src/parsers";

describe("parsers", () => {

  describe("secret parser", () => {

    const okSecrets: Secrets = {
      smtp_from: "setec_astronomy",
      smtp_host: "smtp1.playtronics.net",
      smtp_password: "my voice is my passport",
      smtp_username: "werner_bandes"
    }

    it.each([
      "smtp_from", "smtp_host", "smtp_password", "smtp_username"
    ])("error if missing %p", (field) => {
      expect(parseForIdentity(delProp(okSecrets, field), parseSecrets)).toThrow()
    })

    it.each([
      "smtp_from", "smtp_host", "smtp_password", "smtp_username"
    ])("error if null %p", (field) => {
      const mutant = mkMutant(okSecrets, (c: any) => c[field] = null)
      expect(parseForIdentity(mutant, parseSecrets)).toThrow()
    })

    it.each([
      "smtp_from", "smtp_host", "smtp_password", "smtp_username"
    ])("error if empty %p", (field) => {
      const mutant = mkMutant(okSecrets, (c: any) => c[field] = "")
      expect(parseForIdentity(mutant, parseSecrets)).toThrow()
    })

    test("error if invalid host name", () => {
      const mutant = mkMutant(okSecrets, (c: any) => c["smtp_host"] = "!")
      expect(parseForIdentity(mutant, parseSecrets)).toThrow()
    })

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
