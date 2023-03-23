import {IntakeFormData} from "../src/intake-form-data";
import {ticketAnnouncer} from "../src/ticket-announcer";
import {Announcement} from "struct_lalliance/build/src/announcement";
import CustomMatcherResult = jest.CustomMatcherResult;
import {Role} from "../src/intake-directory";

describe("ticket announcer", () => {
  const seed = Math.floor(Math.random() * 1000);
  const issueKey = "PROJ-" + seed
  describe("non-urgent", () => {

    const formValues: () => IntakeFormData = () => {
      return {
        area: "Sous-sol",
        building: "3737",
        description: "L'eau chaude ne marche pas",
        priority: "regular",
        reporter: "A. Member",
        rowIndex: 0,
        summary: "chauffe-eau"
      }
    }
    const triageEmail = `triage_${seed}@email.com`
    const announcer = ticketAnnouncer([
      {name: "BR for 3735", email: "br-thirty-five@email.com", roles: ["BR_3735"]},
      {name: "BR for 3735", email: "co-br-thirty-five@email.com", roles: ["BR_3735"]},
      {name: "BR for 3737", email: "br-thirty-seven@email.com", roles: ["BR_3737"]},
      {name: "BR for 3743", email: "br-forty-three@email.com", roles: ["BR_3743"]},
      {name: "Triage", email: triageEmail, roles: ["TRIAGE"]}
    ]);

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
          name: "Triage"
        },
        subject: "Maintenance report from A. Member",
        source: formValues(),
        reasonForReceiving: "you are a triage responder",
        isUrgent: false,
        issueKey: issueKey
      })
    })
    function brEmailSpec(brEmail: string, building: string, form: IntakeFormData, issueKey: string) {
      return {
        to: {
          email: brEmail,
          name: `BR for ${building}`
        },
        subject: "Maintenance report from A. Member",
        source: form,
        reasonForReceiving: `you are a building representative for ${building}`,
        isUrgent: false,
        issueKey: issueKey
      };
    }
  })
})

interface EmailMatchers {
  emailMatches(emailSpec: EmailSpec): CustomMatcherResult

  someEmailMatches(emailSpec: EmailSpec): CustomMatcherResult
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
  source: IntakeFormData,
  reasonForReceiving: string,
  isUrgent: boolean,
  issueKey: string
}


expect.extend({
  someEmailMatches(received: Announcement[], expectedEmail: EmailSpec): CustomMatcherResult {
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
  emailMatches(received: Announcement, expectedEmail: EmailSpec): CustomMatcherResult {

    expect(received.primary_recipient).toBe(expectedEmail.to.email)
    expect(received.subject).toBe(expectedEmail.subject)

    const bodyRe = (s: string) => expect(received.body).toMatch(new RegExp(s))

    bodyRe(expectedEmail.source.reporter + " has submitted " +
        (expectedEmail.isUrgent ? "an URGENT" : "a") +
        " maintenance report")

    const jiraSummary = ((f: IntakeFormData) => f.building + " " + f.area + ": " + f.summary)(expectedEmail.source);

    bodyRe("^Dear " + expectedEmail.to.name + ",\n")
    bodyRe("\n" + jiraSummary + "\n" + expectedEmail.source.description)
    bodyRe("\nYou are receiving this email because " + expectedEmail.reasonForReceiving)
    bodyRe(
        "\nJira ticket https://lalliance.atlassian.net/browse/" + expectedEmail.issueKey +
        " has been assigned to this report."
    )

    return {
      pass: true, message: () => "ummm 🙄"
    }
  }
})
