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
      const issueKey = jiraService.createIssue(intakeFormData);
      const announcements = await issueKey
        .then(key => ticketAnnouncer.emailAnnouncement(key, intakeFormData))
        .catch(e => ticketAnnouncer.errorAnnouncement(e, intakeFormData))

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
