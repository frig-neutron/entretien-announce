/**
 * Report ready for public consumption.
 * Includes rendered content and intended recipient - everything needed by a notification channel
 */
import {ReportModel} from "./report_service";
import {BaseTranslation} from "typesafe-i18n";
import {DateTimeFormatOptions, Interval} from "luxon";
import L from './i18n/i18n-node'
import {loadAllLocales} from './i18n/i18n-util.sync'
import {detectLocale, i18nObject, locales} from './i18n/i18n-util'
import {TranslationFunctions} from "./i18n/i18n-types";

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

  const formatOpts: DateTimeFormatOptions = {month: "long", year: "numeric"};

  return {
    createReportAnnouncements(report: ReportModel): Announcement[] {

      const renderReport = function (recipient: Recipient): Announcement {
        const L: TranslationFunctions = i18nObject("en")

        const formattedReportInterval = report.reportInterval().start.setLocale(recipient.lang).toLocaleString(formatOpts);

        return {
          body: "",
          subject: L.subject({interval: report.reportInterval()}),
          primaryRecipient: recipient.email,
          secondaryRecipients: []
        }
      }

      return directory.map(renderReport);
    }
  };
}
