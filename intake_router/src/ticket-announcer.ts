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

  // find urgent responders IF the issue is urgent
  function findUrgent(form: IntakeFormData): DirectoryEntry[] {
    return form.priority == "urgent"
        ? findByRoleKey("URGENT")
        : []
  }

  function findReporter(form: IntakeFormData): DirectoryEntry[] {
    return directory.filter(de => de.name === form.reporter)
  }

  return {
    errorAnnouncement(cause: any, form: IntakeFormData): Announcement[] {
      log.error(cause)
      return []; //todo: send error to admin (https://github.com/frig-neutron/entretien-intake/issues/22)
    },
    emailAnnouncement(issueKey: String, form: IntakeFormData): Announcement[] {
      const testModeSubj = form.mode === "production" ? "" : "TEST - "
      const testModeBody = form.mode === "production" ? "" : "This is a test - ignore "

      function renderServiceRequest(directoryEntry: DirectoryEntry, reasonForReceipt: String): Announcement {
        return {
          primary_recipient: directoryEntry.email,
          secondary_recipients: [],
          subject: `${testModeSubj}Maintenance report from ${form.reporter}`,
          body: [`Dear ${directoryEntry.name},`,
            '',
            `${testModeBody}${form.reporter} has submitted a maintenance report`,
            '   ------------------ ',
            summarizeForJira(form),
            form.description,
            '   ------------------ ',
            `Jira ticket https://lalliance.atlassian.net/browse/${issueKey} has been assigned to this report.`,
            reasonForReceipt,
          ].join(" <br />\n")
        }
      }

      function renderReportAcknowledgement(directoryEntry: DirectoryEntry): Announcement {
        return {
          primary_recipient: directoryEntry.email,
          secondary_recipients: [],
          subject: `${testModeSubj}Maintenance report received`,
          body: [`Dear ${form.reporter},`,
            '',
            `${testModeBody}Your maintenance report has been received.`,
            '   ------------------ ',
            summarizeForJira(form),
            form.description,
            '   ------------------ ',
            `Jira ticket https://lalliance.atlassian.net/browse/${issueKey} has been assigned to this report.`,
            'You are receiving this email because you are the reporter.'
          ].join(" <br />\n")
        }
      }

      const becauseBr = `You are receiving this email because you are a building representative for ${form.building}`
      const becauseTr = `You are receiving this email because you are a triage responder`
      const becauseUr = `You are receiving this email because you are an emergency responder`
      const brAnnouncement = findBr(form).map(d => renderServiceRequest(d, becauseBr))
      const triageAnnouncement = findTriage().map(d => renderServiceRequest(d, becauseTr))
      const emergAnnouncement = findUrgent(form).map(d => renderServiceRequest(d, becauseUr));
      const reporterAnnouncement = findReporter(form).map(d => renderReportAcknowledgement(d));
      const allAnnouncements = [
        ...emergAnnouncement,
        ...brAnnouncement,
        ...triageAnnouncement,
        ...reporterAnnouncement
      ];
      return deduplicateRecipients(allAnnouncements);
    }
  }
}

function deduplicateRecipients(allAnnouncements: Announcement[]): Announcement[] {
  const dedupd: Announcement[] = [];
  const alreadySeen = function (searchKey: Announcement): boolean {
    return dedupd.find(a => a.primary_recipient === searchKey.primary_recipient) != undefined
  }
  allAnnouncements.forEach(a => {
    if (!alreadySeen(a)) dedupd.push(a)
  });
  return dedupd;
}
