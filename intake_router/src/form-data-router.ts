import {IntakeFormData} from "./intake-form-data";
import {JiraService} from "./jira-service";
import {TicketAnnouncer} from "./ticket-announcer";

export interface FormDataRouter {
  route(intakeFormData: IntakeFormData): Promise<String>
}

export function formDataRouter(
    jiraService: JiraService,
    ticketAnnouncer: TicketAnnouncer
): FormDataRouter {
  return {
    async route(intakeFormData: IntakeFormData): Promise<String> {
      const issueKey = jiraService.createIssue(intakeFormData);
      const announcements = ticketAnnouncer.emailAnnouncement(intakeFormData);
      return issueKey
    }
  }
}
