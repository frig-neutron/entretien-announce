import {JiraClient} from "./jira_client"
import {DateTime, Interval} from "luxon";
import {ReportService} from "./report_service";
import {AnnouncementFactory} from "./announcement_factory";
import {Sender} from "./sender";
import {log} from "./logger";

export type Clock = () => DateTime

const defaultClock: Clock = () => DateTime.now()

export interface Application {
  announce(today?: string): Promise<void>
}

export function applicationImpl(
    jiraClient: JiraClient,
    reportService: ReportService,
    announcementFactory: AnnouncementFactory,
    sender: Sender,
    clock: Clock = defaultClock): Application {

  function parseDateTime(dt?: string): DateTime {
    if (dt) {
      const thisInstant = DateTime.fromISO(dt);
      if (!thisInstant.isValid) {
        throw dt + " is not a valid ISO-8106 date"
      }
      return thisInstant;
    } else {
      return clock()
    }
  }

  function parseReportInterval(today?: string): Interval {
    const thisInstant = parseDateTime(today);
    const startOfThisMonth = thisInstant.set({day: 1, hour: 0, minute: 0, second: 0, millisecond: 0})
    const startOfLastMonth = startOfThisMonth.minus({month: 1})
    return Interval.fromDateTimes(startOfLastMonth, startOfThisMonth)
  }

  return {
    async announce(today?: string): Promise<void> {
      const reportInterval = parseReportInterval(today);
      log.info(`Report interval ${reportInterval}`)
      const reportParam = {
        ticketsClosed: await jiraClient.ticketsClosed(reportInterval),
        ticketsCreated: await jiraClient.ticketsCreated(reportInterval),
        allOpenTickets: await jiraClient.allOpenTickets()
      }
      const reportModel = reportService.processReport(reportParam, reportInterval);
      const announcements = announcementFactory.createReportAnnouncements(reportModel);
      log.info(`Processing ${announcements.length} announcements.`)
      let fail = false;
      for (const announcement of announcements) {
        await sender.sendAnnouncement(announcement).
          then(log.info).
          catch(e => {
            log.error(`Error sending to ${announcement.primary_recipient}. ${e}`)
            fail = true;
        })
      }
      if (fail) {
        throw new Error("nope")
      }
      log.info(`Done. Processed ${announcements.length} announcements.`)
    }
  }
}
