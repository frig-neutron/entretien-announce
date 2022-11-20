import {IntakeFormData} from "../src/intake-form-data";
import {ticketAnnouncer} from "../src/ticket-announcer";
import {Announcement} from "struct_lalliance/build/src/announcement";
import CustomMatcherResult = jest.CustomMatcherResult;

describe("ticket announcer", () => {
  const issueKey = "PROJ-" + Math.floor(Math.random() * 1000)
  describe("non-urgent", () => {

    const formValues: IntakeFormData = {
      area: "Sous-sol",
      building: "3737",
      description: "L'eau chaude ne marche pas",
      priority: "regular",
      reporter: "A. Member",
      rowIndex: 0,
      summary: "chauffe-eau"
    }

    const announcer = ticketAnnouncer([
      {name: "", email: "", roles: []}
    ]);

    it.each([
      ["3737", "br-thirty-seven@email.com"],
      // ["3743", "br-forty-three@email.com"]
    ])("bldg %p routes to BR %p", (building, brEmail) => {
      const announcements = announcer.emailAnnouncement(issueKey, formValues);
      expect(announcements).someEmailMatches({
        to: {
          email: brEmail,
          name: `BR for ${building}`
        },
        subject: "Maintenance report from A. Member",
        source: formValues,
        reasonForReceiving: `you are a building representative for ${building}`,
        isUrgent: false,
        issueKey: issueKey
      })
    })
    test("route to triage", () => {
      const announcements = announcer.emailAnnouncement(issueKey, formValues);
      expect(announcements).someEmailMatches({
        to: {
          email: "triage@email.com",
          name: "Triager"
        },
        subject: "Maintenance report from A. Member",
        source: formValues,
        reasonForReceiving: "you are a triage responder",
        isUrgent: false,
        issueKey: issueKey
      })
    })
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
