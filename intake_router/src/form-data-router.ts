import {IntakeFormData} from "./intake-form-data";
import {JiraService} from "./jira-service";
import {TicketAnnouncer} from "./ticket-announcer";
import {Sender} from "pubsub_lalliance/build/src/sender";

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
      const announcements = ticketAnnouncer.emailAnnouncement(issueKey, intakeFormData);
      const promisesToPublish = announcements.map(pubsubSender.sendAnnouncement);
      return Promise.all(promisesToPublish).
        catch(formatPublishError).
        then(_ => issueKey)
    }
  }
}

function formatPublishError(e: Error) {
  return Promise.reject('Publishing notifications failed because of [' + e + ']');
}
