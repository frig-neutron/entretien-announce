import {JiraClient} from "./jira_client"
import {DateTime, Interval} from "luxon";
import {ReportService} from "./report_service";
import {AnnouncementFactory} from "./announcement_factory";
import {Sender} from "./sender";
import {logger as log} from "./logger";

export interface Application {
  announce(today: string): Promise<void>
}

export function applicationImpl(
    jiraClient: JiraClient,
    reportService: ReportService,
    announcementFactory: AnnouncementFactory,
    sender: Sender): Application {

  function parseReportInterval(today: string): Interval {
    const thisInstant = DateTime.fromISO(today);
    const startOfThisMonth = thisInstant.set({day: 1, hour: 0, minute: 0, second: 0, millisecond: 0})
    const startOfLastMonth = startOfThisMonth.minus({month: 1})
    return Interval.fromDateTimes(startOfLastMonth, startOfThisMonth)
  }

  return {
    async announce(today: string): Promise<void> {
      const reportInterval = parseReportInterval(today);
      const reportParam = {
        ticketsClosed: await jiraClient.ticketsClosed(reportInterval),
        ticketsCreated: await jiraClient.ticketsCreated(reportInterval),
        allOpenTickets: await jiraClient.allOpenTickets()
      }
      const reportModel = reportService.processReport(reportParam, reportInterval);
      const announcements = announcementFactory.createReportAnnouncements(reportModel);
      for (const announcement of announcements){
        await sender.sendAnnouncement(announcement).
        catch(e => log.error(`Error sending to ${announcement.primaryRecipient}. ${e}`))
      }
      log.info(`Done. Processed ${announcements.length} announcements.`)
    }
  }
}
