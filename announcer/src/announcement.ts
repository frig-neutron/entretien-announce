/**
 * Report ready for public consumption.
 * Includes rendered content and intended recipient - everything needed by a notification channel
 */
import {ReportModel} from "./report_model";

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

export function announcementFactoryImpl(): AnnouncementFactory {
  return {
    createReportAnnouncements(report: ReportModel): Announcement[] {
      return [];
    }
  };
}
