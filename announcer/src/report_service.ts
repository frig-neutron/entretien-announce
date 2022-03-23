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
  const ticketsByBuilding = groupBy(tickets, t => t.building());

  return {
    highPriorityTickets: [],
    tickets: tickets,
    ticketsByBuilding: new Map(ticketsByBuilding)
  }
}

function groupBy<E>(entities: E[], keyFunc: (e: E) => string): [string, E[]][] {
  type G = [string, E[]]
  type T = G[]

  const groupByKey = (t1: T, t2: T): T => {
    let ret = [] as T

    const groupOf = (bldg: string): G => {
      for (let g of ret) {
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
        const oldTix: E[] = group[1]
        tix.forEach(t => oldTix.push(t))
      }
    }

    process(t1)
    process(t2)

    return ret
  }

  return entities
  .map(t => [[keyFunc(t), [t]]] as T)
  .reduce(groupByKey, [["unknown", []]])
  .filter(t => t[1].length > 0)
}
