import {IntakeFormData} from "./intake-form-data";
import {Announcement} from "struct_lalliance/build/src/announcement";

export interface TicketAnnouncer {
  emailAnnouncement(issueKey: String, form: IntakeFormData): Announcement[],

  errorAnnouncement(cause: any, form: IntakeFormData): Announcement[]
}

export function ticketAnnouncer(directory: DirectoryEntry[]): TicketAnnouncer {
  const summarizeForJira = (f: IntakeFormData) => f.building + " " + f.area + ": " + f.summary;
  return {
    errorAnnouncement(cause: any, form: IntakeFormData): Announcement[] {
      return [];
    },
    emailAnnouncement(issueKey: String, form: IntakeFormData): Announcement[] {
      return [
        {
          primary_recipient: "br-3737@email.com",
          secondary_recipients: [],
          subject: "Maintenance report from A. Member",
          body: "Dear BR for 3737,\n" +
              "A. Member has submitted a maintenance report" +
              "\nYou are receiving this email because you are a building representative for 3737 \n" +
              summarizeForJira(form) + "\n" + form.description +
              `\nJira ticket https://lalliance.atlassian.net/browse/${issueKey} has been assigned to this report.`
        },
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
