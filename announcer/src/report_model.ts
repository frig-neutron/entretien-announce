/**
 * Present report data for easy rendering to html
 */
import {JiraTicket} from "./jira_ticket";
import {Interval} from "luxon";

export interface ReportParams {
  ticketsClosed: JiraTicket[],
  ticketsCreated: JiraTicket[],
  allOpenTickets: JiraTicket[]
}

export interface ReportModel {

}

export interface ReportService {
  processReport(param: ReportParams, reportInterval: Interval): ReportModel
}
