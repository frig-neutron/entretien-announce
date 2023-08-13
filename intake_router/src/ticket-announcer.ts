import {IntakeFormData} from "./intake-form-data";
import {Announcement} from "struct_lalliance/src/announcement";
import {DirectoryEntry, Role} from "./intake-directory";
import {log} from "./logger";

/**
 * A factory of Announcement
 */
export interface TicketAnnouncer {
  emailAnnouncement(issueKey: String, form: IntakeFormData): Announcement[],

  errorAnnouncement(cause: any, form: IntakeFormData): Announcement[]
}

export function ticketAnnouncer(directory: DirectoryEntry[]): TicketAnnouncer {
  const summarizeForJira = (f: IntakeFormData) => f.building + " " + f.area + ": " + f.summary;

  function findByRoleKey(brRoleKey: keyof typeof Role) {
    return directory.filter(de => de.roles.find(r => r === brRoleKey))
  }

  function findBr(form: IntakeFormData): DirectoryEntry[] {

    // @ts-ignore - this has to be a runtime error
    const brRoleKey: keyof typeof Role = `BR_${form.building}`;
    return findByRoleKey(brRoleKey);
  }

  function findTriage(): DirectoryEntry[] {
    return findByRoleKey("TRIAGE")
  }

  return {
    errorAnnouncement(cause: any, form: IntakeFormData): Announcement[] {
      log.error(cause)
      return []; //todo: send error to admin (https://github.com/frig-neutron/entretien-intake/issues/22)
    },
    emailAnnouncement(issueKey: String, form: IntakeFormData): Announcement[] {
      function render(directoryEntry: DirectoryEntry, reasonForReceipt: String): Announcement {
        return {
          primary_recipient: directoryEntry.email,
          secondary_recipients: [],
          subject: "Maintenance report from A. Member", // todo: name of member goes here
          body: [`Dear ${directoryEntry.name},`,
            '',
            `${form.reporter} has submitted a maintenance report`,
            '   ------------------ ',
            reasonForReceipt,
            summarizeForJira(form),
            form.description,
            '   ------------------ ',
            `Jira ticket https://lalliance.atlassian.net/browse/${issueKey} has been assigned to this report.`,
          ].join(" <br />\n")
        }
      }

      const becauseBr = `You are receiving this email because you are a building representative for ${form.building}`
      const becauseTr = `You are receiving this email because you are a triage responder`
      const brAnnouncement = findBr(form).map(d => render(d, becauseBr))
      const triageAnnouncement = findTriage().map(d => render(d, becauseTr))
      return [
        ...brAnnouncement,
        ...triageAnnouncement
      ];
    }
  }
}
