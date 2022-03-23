import {reportServiceImpl} from "../src/report_service";
import {Interval} from "luxon";
import {JiraTicket} from "../src/jira_ticket";
import {mockDeep} from "jest-mock-extended";

const reportService = reportServiceImpl()

describe("Report service", () => {
  test("empty report", () => {

    const reportInterval = Interval.fromISO("2020-01/T1D");
    const reportModel = reportService.processReport({
      allOpenTickets: [],
      ticketsClosed: [],
      ticketsCreated: []
    }, reportInterval);

    expect(reportModel.allOpen().tickets).toEqual([])
    expect(reportModel.closed().tickets).toEqual([])
    expect(reportModel.created().tickets).toEqual([])
    expect(reportModel.reportInterval()).toEqual(reportInterval)
  })

  test("sum up by bldg", () => {

    const ticketInBuilding = function (bldg: string): JiraTicket {
      const ticket = mockDeep<JiraTicket>()
      ticket.building.mockReturnValue(bldg)
      return ticket
    }
    const reportInterval = Interval.fromISO("2020-01/P1D");

    const ticketInAbc = [ticketInBuilding("abc"), ticketInBuilding("abc"), ticketInBuilding("abc")]
    const ticketInDef = [ticketInBuilding("def")]
    const reportParam = {
      allOpenTickets: [ticketInAbc[0], ticketInAbc[1]],
      ticketsClosed: [ticketInAbc[2], ticketInDef[0]],
      ticketsCreated: []
    };

    const reportModel = reportService.processReport(reportParam, reportInterval);

    expect(reportModel.allOpen().tickets).toEqual(reportParam.allOpenTickets)
    expect(reportModel.closed().tickets).toEqual(reportParam.ticketsClosed)
    expect(reportModel.created().tickets).toEqual(reportParam.ticketsCreated)
    expect(reportModel.reportInterval()).toEqual(reportInterval)

    expect(reportModel.allOpen().ticketsByBuilding).toStrictEqual(
        new Map([
          ["abc", [
            ticketInAbc[0],
            ticketInAbc[1]]
          ],
        ])
    )
    expect(reportModel.closed().ticketsByBuilding).toStrictEqual(
        new Map([
          ["abc", [ticketInAbc[2]]],
          ["def", [ticketInDef[0]]],
        ])
    )
  })

})
