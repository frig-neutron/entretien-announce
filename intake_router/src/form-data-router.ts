import {IntakeFormData} from "./intake-form-data";
import {JiraService} from "./jira-service";
import {TicketAnnouncer} from "./ticket-announcer";
import {Sender} from "pubsub_lalliance/build/src/sender";
import {Announcement} from "struct_lalliance/build/src/announcement";

export interface FormDataRouter {
  route(intakeFormData: IntakeFormData): Promise<String>
}

export function formDataRouter(
    jiraService: JiraService,
    ticketAnnouncer: TicketAnnouncer,
    pubsubSender: Sender
): FormDataRouter {
  return {
    async route(intakeFormData: IntakeFormData): Promise<String> {
      const issueKey = await jiraService.createIssue(intakeFormData);
      const announcements = ticketAnnouncer.emailAnnouncement(intakeFormData);
      const x = await Promise.all(
          announcements.map(pubsubSender.sendAnnouncement)
      );
      console.log("notification " + JSON.stringify(announcements))
      return issueKey
    }
  }
}
