/**
 * Report ready for public consumption.
 * Includes rendered content and intended recipient - everything needed by a notification channel
 */
import {ReportModel} from "./report_service";

export interface Announcement {
  primaryRecipient: string
  secondaryRecipients: string[]
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

export interface Recipient{
  email: string
  name: string
  lang: string
  roles: Role[]
}

export function announcementFactoryImpl(directory: Recipient[] = []): AnnouncementFactory {
  return {
    createReportAnnouncements(report: ReportModel): Announcement[] {

      const renderReport = function (recipient: Recipient): Announcement {
        return {
          primaryRecipient: recipient.email,
          secondaryRecipients: []
        }
      }

      return directory.map(renderReport);
    }
  };
}
