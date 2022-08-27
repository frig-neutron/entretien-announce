import {IntakeFormData} from "./intake-form-data";
import {Announcement} from "struct_lalliance/build/src/announcement";

export interface TicketAnnouncer {
  emailAnnouncement(issueKey: String, form: IntakeFormData): Announcement[],
  errorAnnouncement(cause: any, form: IntakeFormData): Announcement[]
}
export function ticketAnnouncer(): TicketAnnouncer {
  return {
    errorAnnouncement(cause: any, form: IntakeFormData): Announcement[] {
      return [];
    },
    emailAnnouncement(issueKey: String, form: IntakeFormData): Announcement[] {
      return [];
    }
  }
}
