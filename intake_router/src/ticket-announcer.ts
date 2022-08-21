import {IntakeFormData} from "./intake-form-data";
import {Announcement} from "struct_lalliance/build/src/announcement";

export interface TicketAnnouncer {
  emailAnnouncement: (form: IntakeFormData) => Announcement[]
}
export function ticketAnnouncer(): TicketAnnouncer {
  return {
    emailAnnouncement(form: IntakeFormData): Announcement[] {
      return [];
    }
  }
}
