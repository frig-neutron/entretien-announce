import {IntakeFormData} from "./intake-form-data";
import {Announcement} from "struct_lalliance/build/src/announcement";

export interface TicketAnnouncer {
  emailAnnouncement(issueKey: String, form: IntakeFormData): Announcement[],

  errorAnnouncement(cause: any, form: IntakeFormData): Announcement[]
}

export function ticketAnnouncer(directory: DirectoryEntry[]): TicketAnnouncer {
  const summarizeForJira = (f: IntakeFormData) => f.building + " " + f.area + ": " + f.summary;

  function findBr(form: IntakeFormData): DirectoryEntry {

    // @ts-ignore - this has to be a runtime error
    const brRoleKey: keyof typeof Role = `BR_${form.building}`;
    return directory.find(de => de.roles.find(r => r === Role[brRoleKey])) as DirectoryEntry // todo: check for error
  }

  return {
    errorAnnouncement(cause: any, form: IntakeFormData): Announcement[] {
      return [];
    },
    emailAnnouncement(issueKey: String, form: IntakeFormData): Announcement[] {
      function render(directoryEntry: DirectoryEntry): Announcement {
        return {
          primary_recipient: directoryEntry.email,
          secondary_recipients: [],
          subject: "Maintenance report from A. Member",
          body: [`Dear ${directoryEntry.name},`,
            `${form.reporter} has submitted a maintenance report`,
            `You are receiving this email because you are a building representative for ${form.building}`,
            summarizeForJira(form),
            form.description,
            `Jira ticket https://lalliance.atlassian.net/browse/${issueKey} has been assigned to this report.`,
          ].join("\n")
        }
      }

      const brAnnouncement = render(findBr(form))
      return [
        brAnnouncement,
        {
          primary_recipient: "triage@email.com",
          secondary_recipients: [],
          subject: "Maintenance report from A. Member",
          body: "Dear Triager,\n" +
              "A. Member has submitted a maintenance report" +
              "\nYou are receiving this email because you are a triage responder\n" +
              summarizeForJira(form) + "\n" + form.description +
              `\nJira ticket https://lalliance.atlassian.net/browse/${issueKey} has been assigned to this report.`
        }
      ];
    }
  }
}

export enum Role {
  BR_3735,
  BR_3737,
  BR_3739,
  BR_3743,
  BR_3745,
  TRIAGE
}

export interface DirectoryEntry {
  name: string,
  email: string,
  roles: Role[]
}
