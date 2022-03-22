/**
 * Present report data for easy rendering to html
 */
import {JiraTicket} from "./jira_ticket";
import {Interval} from "luxon";

export interface ReportService {
  processReport(param: ReportParams, reportInterval: Interval): ReportModel
}

export interface ReportParams {
  ticketsClosed: JiraTicket[],
  ticketsCreated: JiraTicket[],
  allOpenTickets: JiraTicket[]
}

export interface ReportModel {
  reportInterval: Interval,
  closed: TicketBlock,
  created: TicketBlock,
  allOpen: TicketBlock
}

export interface TicketBlock {
  tickets: JiraTicket[],
  highPriorityTickets: JiraTicket[],
  ticketsByBuilding: Map<string, JiraTicket>
}

export function reportServiceImpl(): ReportService {
  return {
    processReport(param: ReportParams, reportInterval: Interval): ReportModel {
      return {
        allOpen: ticketBlockImpl(param.allOpenTickets, reportInterval),
        closed: ticketBlockImpl(param.ticketsClosed, reportInterval),
        created: ticketBlockImpl(param.ticketsCreated, reportInterval),
        reportInterval: reportInterval
      };
    }
  }
}

function ticketBlockImpl(tickets: JiraTicket[], reportInterval: Interval): TicketBlock {

  return {
    highPriorityTickets: [],
    tickets: tickets,
    ticketsByBuilding: new Map
  }
}
