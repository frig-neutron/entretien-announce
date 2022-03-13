import {JiraClient} from "./jira_client"
import {DateTime, Interval} from "luxon";

export interface Application {
  announce(today: string): void
}

export function applicationImpl(jiraClient: JiraClient): Application {
  function parseReportInterval(today: string): Interval {
    const thisInstant = DateTime.fromISO(today);
    const startOfThisMonth = thisInstant.set({day: 1, hour: 0, minute: 0, second: 0, millisecond: 0})
    const startOfLastMonth = startOfThisMonth.minus({month: 1})
    return Interval.fromDateTimes(startOfLastMonth, startOfThisMonth)
  }

  return {
    announce(today: string): void {
      const reportInterval = parseReportInterval(today);
      jiraClient.fetchTicketsClosedDuringInterval(reportInterval)
    }
  }
}
