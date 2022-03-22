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
  ticketsByBuilding: Map<string, JiraTicket[]>
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
  type G = [string, JiraTicket[]]
  type T = G[]

  const groupByBuilding = (t1: T, t2: T): T => {
    let ret = [[t1[0][0], []]] as T
    const groupOf = (bldg: string): G => {
      for (let g of ret){
        if (g[0] === bldg)
          return g;
      }
      const newGroup: G = [bldg, []]
      ret.push(newGroup)
      return newGroup
    }
    const process = (groupList: T): void => {
      for (const [bldg, tix] of groupList) {
        const group: G = groupOf(bldg)
        const oldTix: JiraTicket[] = group[1]
        tix.forEach(t => oldTix.push(t))
      }
    }

    process(t1)
    process(t2)

    return ret
  }

  const ticketsByBuilding = tickets
    .map(t => [[t.building, [t]]] as [string, JiraTicket[]][])
    .reduce(groupByBuilding, [["unknown", []]]);

  return {
    highPriorityTickets: [],
    tickets: tickets,
    ticketsByBuilding: new Map(ticketsByBuilding)
  }
}
