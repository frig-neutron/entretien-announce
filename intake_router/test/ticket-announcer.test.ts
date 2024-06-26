import {IntakeFormData} from "../src/intake-form-data";
import {ticketAnnouncer} from "../src/ticket-announcer";
import {Announcement} from "struct_lalliance/src/announcement";
import CustomMatcherResult = jest.CustomMatcherResult;
import 'jest-extended'
import dedent from "dedent";
import exp from "node:constants";

describe("ticket announcer", () => {
  const seed = Math.floor(Math.random() * 1000);
  const issueKey = "PROJ-" + seed

  const triageEmail = `triage_${seed}@email.com`
  const triageName = `Triager`
  const urgentEmail = `emerg_${seed}@email.com`
  const urgentName = `emerg ${seed}`
  const announcer = ticketAnnouncer([
    {name: "Admin", lang: "en", email: "the-admin@gmail.com", roles: ["ADMIN"]},
    {name: "BR for 3735", lang: "en", email: "br-thirty-five@email.com", roles: ["BR_3735"]},
    {name: "BR for 3735", lang: "en", email: "co-br-thirty-five@email.com", roles: ["BR_3735"]},
    {name: "BR for 3737", lang: "en", email: "br-thirty-seven@email.com", roles: ["BR_3737"]},
    {name: "BR for 3743", lang: "en", email: "br-forty-three@email.com", roles: ["BR_3743"]},
    {name: "BR for 3743", lang: "en", email: "br-forty-three@email.com", roles: ["BR_3743"]},
    {name: triageName, lang: "en", email: triageEmail, roles: ["TRIAGE"]},
    {name: urgentName, lang: "en", email: urgentEmail, roles: ["URGENT"]},
    // the next two entries test what happens when one person is called up for two reasons
    {name: "BR w/ dup URGENT role", lang: "en", email: "br-duplicate@email.com", roles: ["BR_3737"]},
    {name: "BR w/ dup URGENT role", lang: "en", email: "br-duplicate@email.com", roles: ["URGENT"]},
    // the next two entries test the acknowledgement email
    {name: "En Member", lang: "en", email: "en-member@email.com", roles: []},
    {name: "Fr Member", lang: "fr", email: "fr-member@email.com", roles: []}
  ]);

  describe("non-urgent", () => {

    const formValues: () => IntakeFormData = () => {
      return {
        area: "Sous-sol",
        building: "3737",
        description: "L'eau chaude ne marche pas",
        priority: "regular",
        reporter: "A. Member",
        rowIndex: 0,
        summary: "chauffe-eau",
        mode: "production"
      }
    }

    it.each([
      ["3737", "br-thirty-seven@email.com"],
      ["3743", "br-forty-three@email.com"]
    ])("bldg %p routes to BR %p", (building, brEmail) => {
      const form: IntakeFormData = {
        ...formValues(),
        ...{building: building}
      }
      const announcements = announcer.emailAnnouncement(issueKey, form);
      expect(announcements).someEmailMatches(brEmailSpec(brEmail, building, form, issueKey))
      expect(announcements).not.someEmailMatches({ // this fails really weird, but it works
        to: {
          email: urgentEmail,
          name: urgentName
        }
      })
    })
    test("co building-rep routing", () => {
      const form: IntakeFormData = {
        ...formValues(),
        ...{building: "3735"}
      }
      const announcements = announcer.emailAnnouncement(issueKey, form);
      expect(announcements).someEmailMatches(brEmailSpec("br-thirty-five@email.com", "3735", form, issueKey))
      expect(announcements).someEmailMatches(brEmailSpec("co-br-thirty-five@email.com", "3735", form, issueKey))
    })
    test("route to triage", () => {
      const announcements = announcer.emailAnnouncement(issueKey, formValues());
      expect(announcements).someEmailMatches({
        to: {
          email: triageEmail,
          name: triageName
        },
        subject: "Maintenance report from A. Member",
        bodyParts: {
          source: formValues(),
          topLine: "A. Member has submitted a maintenance report",
          reasonForReceiving: "you are a triage responder",
          isUrgent: false,
          issue: issueKey
        }
      })
    })
    test("no acknowledgement email", () => {
      const form: IntakeFormData = {
        ...formValues(),
        ...{reporter: "En Member"}
      }
      const announcements = announcer.emailAnnouncement(issueKey, form);
      expect(announcements).not.someEmailMatches({
        bodyParts: {
          source: expect.anything(),
          reasonForReceiving: "you are the reporter",
          isUrgent: false,
          issue: expect.anything()
        }
      })
    })
    test("english acknowledgement email", () => {
      const form: IntakeFormData = {
        ...formValues(),
        ...{reporter: "En Member"}
      }
      const announcements = announcer.emailAnnouncement(issueKey, form);
      expect(announcements).someEmailMatches({
        to: {
          email: "en-member@email.com",
          name: form.reporter
        },
        subject: "Maintenance report received",
        bodyParts: {
          source: form,
          topLine: "Your maintenance report has been received.",
          reasonForReceiving: "the ticket was submitted on your behalf",
          isUrgent: false,
          issue: issueKey
        }
      })
    })
    test("french acknowledgement email", () => {
      const form: IntakeFormData = {
        ...formValues(),
        ...{reporter: "Fr Member"}
      }
      const announcements = announcer.emailAnnouncement(issueKey, form);
      expect(announcements).someEmailMatches({
        to: {
          email: "fr-member@email.com",
          name: form.reporter
        },
        subject: "Rapport de maintenance reçu",
        body: dedent`
          Cher ${form.reporter}, <br />
          <br />
          Votre rapport de maintenance a été reçu. <br />
             ------------------ <br />
          3737 Sous-sol: chauffe-eau <br />
          L'eau chaude ne marche pas <br />
             ------------------ <br />
          Un ticket Jira ${issueKey} a été attribué à ce rapport. <br />
          Vous recevez cet email parce que le ticket a été soumis en votre nom.`
      })
    })
    test("test mode", () => {
      const form: IntakeFormData = {
        ...formValues(),
        ...{mode: "test"}
      }
      const announcements = announcer.emailAnnouncement(issueKey, form);
      const subjects = announcements.map(a => a.subject);
      const bodies = announcements.map(a => a.body)
      const recipients = announcements.map(a => a.primary_recipient);

      const matchesRe = (re: RegExp) => (o: any): boolean => o && o.toString().match(re);

      expect(subjects).toSatisfyAll(matchesRe(/^TEST - /))
      expect(bodies).toSatisfyAll(matchesRe(/This is a test/))
      expect(recipients).toSatisfyAll(matchesRe(/the-admin\+test-[a-z0-9_-]+@gmail.com/))
    })
    test("test mode admin email redirection does not apply to admin", () => {
      const form: IntakeFormData = {
        ...formValues(),
        ...{
          mode: "test",
          reporter: "Admin"
        }
      }
      const announcements = announcer.emailAnnouncement(issueKey, form);
      const recipients = announcements.map(a => a.primary_recipient);

      expect(recipients).toSatisfyAny(r => r === "the-admin@gmail.com")
    })


    function brEmailSpec(brEmail: string, building: string, form: IntakeFormData, issueKey: string): EmailSpec {
      return {
        to: {
          email: brEmail,
          name: `BR for ${building}`
        },
        subject: "Maintenance report from A. Member",
        bodyParts: {
          source: form,
          topLine: `${form.reporter} has submitted a maintenance report`,
          reasonForReceiving: `you are a building representative for ${building}`,
          isUrgent: false,
          issue: issueKey
        },
      };
    }
  })
  describe("urgent", () => {
    const formValues: () => IntakeFormData = () => {
      return {
        area: "Sous-sol",
        building: "3737",
        description: "L'eau chaude ne marche pas",
        priority: "urgent",
        reporter: "A. Member",
        rowIndex: 0,
        summary: "chauffe-eau",
        mode: "production"
      }
    }

    test("route to emergency responder", () => {
      const announcements = announcer.emailAnnouncement(issueKey, formValues());
      expect(announcements).someEmailMatches({
        to: {
          email: urgentEmail,
          name: urgentName
        },
        subject: "Maintenance report from A. Member",
        bodyParts: {
          source: formValues(),
          topLine: "A. Member has submitted a maintenance report",
          reasonForReceiving: "you are an emergency responder",
          isUrgent: false,
          issue: issueKey
        }
      })
    })

    test("do not send duplicate email", () => {
      const announcements = announcer.emailAnnouncement(issueKey, formValues());

      const sentToDupBR = announcements.filter(a => a.primary_recipient === "br-duplicate@email.com")
      expect(sentToDupBR.length).toEqual(1)
    })

    test("prioritize emergency responder role in email body", () => {
      // because some people get ornery when you call them by the wrong title
      const announcements = announcer.emailAnnouncement(issueKey, formValues());

      expect(announcements).someEmailMatches({
        to: {
          email: "br-duplicate@email.com",
          name: "BR w/ dup URGENT role"
        },
        subject: "Maintenance report from A. Member",
        bodyParts: {
          source: formValues(),
          topLine: "A. Member has submitted a maintenance report",
          reasonForReceiving: "you are an emergency responder",
          isUrgent: false,
          issue: issueKey
        }
      })
    })

  })
})

interface EmailMatchers {
  emailMatches(emailSpec: Partial<EmailSpec>): CustomMatcherResult

  someEmailMatches(emailSpec: Partial<EmailSpec>): CustomMatcherResult
}

declare global {
  namespace jest {
    // noinspection JSUnusedGlobalSymbols - need this to give expect matcher hints
    interface Matchers<R> extends EmailMatchers {
    }

    // noinspection JSUnusedGlobalSymbols - need this to give expect matcher hints
    interface Expect extends EmailMatchers {
    }
  }
}

export type EmailSpec = {
  to: {
    email: string,
    name: string
  }
  subject: string,
  bodyParts?: {
    source: IntakeFormData,
    topLine?: string,
    reasonForReceiving: string,
    isUrgent: boolean,
    issue: string
  }
  body?: string
}


expect.extend({
  someEmailMatches(received: Announcement[], expectedEmail: Partial<EmailSpec>): CustomMatcherResult {
    type ErrOrMatchResult = CustomMatcherResult | Error

    const requireError = (e: unknown): Error => {
      if (e instanceof Error)
        return e
      else
        throw Error(`${e} should be of type Error, but it was something else`)
    }

    const Catch = (f: (() => CustomMatcherResult)): ErrOrMatchResult => {
      try {
        return f()
      } catch (assertionError: unknown) {
        return requireError(assertionError);
      }
    }

    const assertionErrorOrUndefined: ErrOrMatchResult[] = received.map(actualEmail =>
        Catch(() => expect(actualEmail).emailMatches(expectedEmail))
    )

    const isSuccess = (e: any): boolean => typeof e == "undefined" // no error == success
    const isFailure = (e: any): boolean => !isSuccess(e)
    const atLeastOneMatch = assertionErrorOrUndefined.map(isSuccess).filter((i: boolean) => i).length > 0
    const getMessage = (e: ErrOrMatchResult) => e instanceof Error ? e.message : e.message()

    const failures = assertionErrorOrUndefined.filter(isFailure);
    return {
      pass: atLeastOneMatch,
      message: () => {
        const matchFailures: string[] = failures.map(getMessage)
        return `No email matches spec ${JSON.stringify(expectedEmail, null, 2)}\n` + matchFailures.join("\n")
      }
    }
  },
  emailMatches(received: Announcement, expectedEmail: Partial<EmailSpec>): CustomMatcherResult {

    if (expectedEmail.to) {
      expect(received.primary_recipient).toBe(expectedEmail.to.email)
    }
    if (expectedEmail.subject) {
      expect(received.subject).toBe(expectedEmail.subject)
    }


    if (expectedEmail.body) {
      expect(received.body).toBe(expectedEmail.body)
    }

    const bodyParts = expectedEmail.bodyParts;
    if (bodyParts) {
      const bodyRe = (s: string) => expect(received.body).toMatch(new RegExp(s))

      if (bodyParts.topLine) {
        bodyRe(bodyParts.topLine)
      }

      const jiraSummary = ((f: IntakeFormData) => f.building + " " + f.area + ": " + f.summary)(bodyParts.source);
      if (expectedEmail.to) {
        bodyRe("^Dear " + expectedEmail.to.name + ", <br />\n")
      }
      bodyRe("\nYou are receiving this email because " + bodyParts.reasonForReceiving)
      bodyRe("\nJira ticket " + bodyParts.issue + " has been assigned to this report.")
    }


    return {
      pass: true, message: () => "ummm 🙄"
    }
  }
})
