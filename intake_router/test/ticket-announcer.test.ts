import {IntakeFormData} from "../src/intake-form-data";
import {ticketAnnouncer} from "../src/ticket-announcer";
import {Announcement} from "struct_lalliance/build/src/announcement";
import CustomMatcherResult = jest.CustomMatcherResult;

expect.extend({
  emailMatches(received: Announcement, expectedEmail: EmailSpec): CustomMatcherResult {

    const submittedBy = expectedEmail.source.reporter

    expect(received.primary_recipient).toBe(expectedEmail.to.email)
    expect(received.subject).toBe(expectedEmail.subject)

    const bodyRe = (s: string) => expect(received.body).toMatch(new RegExp(s))

    if (expectedEmail.isUrgent) {
      bodyRe(submittedBy + " has submitted an URGENT maintenance report")
    } else {
      bodyRe(submittedBy + " has submitted a maintenance report")
    }

    const jiraSummary = ((f: IntakeFormData) => f.building + " " + f.area + ": " + f.summary)(expectedEmail.source);

    bodyRe("^Dear " + expectedEmail.to.name)
    bodyRe("You are receiving this email because " + expectedEmail.reasonForReceiving)
    bodyRe(jiraSummary + "\n" + expectedEmail.source.description)
    bodyRe("Jira ticket https://lalliance.atlassian.net/browse/" + expectedEmail.issueKey
        + " has been assigned to this report.")

    return {
      pass: true, message: () => "ummm 🙄"
    }
  }
})

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

    test("end-to-end, non-urgent", () => {

      const announcer = ticketAnnouncer();
      const announcements = announcer.emailAnnouncement(issueKey, formValues);

      expect(announcements[0]).emailMatches({
        to: {
          email: "br-3737@email.com",
          name: "BR for 3737"
        },
        subject: "Maintenance report from A. Member",
        source: formValues,
        reasonForReceiving: "you are a building representative for 3737",
        isUrgent: false,
        issueKey: issueKey
      })
    })
  })
})

interface EmailMatchers {
  emailMatches(emailSpec: EmailSpec): CustomMatcherResult
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
