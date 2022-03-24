/**
 * Report ready for public consumption.
 * Includes rendered content and intended recipient - everything needed by a notification channel
 */
import {ReportModel, TicketBlock} from "./report_service";
import {loadAllLocales} from './i18n/i18n-util.sync'
import {i18nObject} from './i18n/i18n-util'
import {Locales, TranslationFunctions} from "./i18n/i18n-types";
import {JiraTicket} from "./jira_ticket";

export interface Announcement {
  primaryRecipient: string
  secondaryRecipients: string[]
  subject: string,
  body: string
}

/**
 * Converts a report to zero or more announcements.
 * Internationalization takes place here.
 */
export interface AnnouncementFactory {
  createReportAnnouncements(report: ReportModel): Announcement[]
}

export enum Role {
  SUPERVISOR,
  DETAILED_REPORT_RECIPIENT,
  SUMMARY_REPORT_RECIPIENT,
  OWN_TICKET_RECIPIENT
}

export interface Recipient {
  email: string
  name: string
  lang: string
  roles: Role[]
}

export function announcementFactoryImpl(directory: Recipient[] = []): AnnouncementFactory {
  loadAllLocales()

  return {
    createReportAnnouncements(report: ReportModel): Announcement[] {

      const renderReport = function (recipient: Recipient): Announcement {
        const L: TranslationFunctions = i18nObject(<Locales>recipient.lang)

        const detailedTicketRow = (ticket: JiraTicket): string => {
          return `
            <li>
              <a href="https://lalliance.atlassian.net/browse/${ticket.key()}">${ticket.key()}</a>
              <span>${ticket.summary()}</span>
            </li>
          `
        }

        const ticketSection = (block: TicketBlock, strings: { heading: string }): string => {
          const jiraTickets = block.tickets();
          return `
            <div>
              <h2>${strings.heading}</h2>
              ${jiraTickets.map(t => detailedTicketRow(t))}
            </div>
          `
        }

        const root = `
          <div>
            ${ticketSection(report.created(), {
              heading: L.created.heading({
                start: report.reportInterval().start, 
                end: report.reportInterval().end
              })
            })}
          </div>
        `

        return {
          body: root,
          subject: L.subject({interval: report.reportInterval()}),
          primaryRecipient: recipient.email,
          secondaryRecipients: []
        }
      }

      return directory.map(renderReport);
    }
  };
}
