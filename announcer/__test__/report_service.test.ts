import {reportServiceImpl} from "../src/report_service";
import {Interval} from "luxon";
import {JiraTicket} from "../src/jira_ticket";

const reportService = reportServiceImpl()

describe("Report service", () => {
  test("empty report", () => {

    const reportInterval = Interval.fromISO("2020-01 / T1d");
    const reportModel = reportService.processReport({
      allOpenTickets: [],
      ticketsClosed: [],
      ticketsCreated: []
    }, reportInterval);

    expect(reportModel.allOpen.tickets).toEqual([])
    expect(reportModel.closed.tickets).toEqual([])
    expect(reportModel.created.tickets).toEqual([])
    expect(reportModel.reportInterval).toEqual(reportInterval)
  })

  test("sum up by bldg", () => {

    const ticketInBuilding = function (bldg: string): JiraTicket {
      return {
        key: "", building: bldg
      }
    }
    const reportInterval = Interval.fromISO("2020-01 / T1d");
    const reportParam = {
      allOpenTickets: [ticketInBuilding("abc"), ticketInBuilding("abc")],
      ticketsClosed: [ticketInBuilding("abc"), ticketInBuilding("def")],
      ticketsCreated: []
    };

    const reportModel = reportService.processReport(reportParam, reportInterval);

    expect(reportModel.allOpen.tickets).toEqual(reportParam.allOpenTickets)
    expect(reportModel.closed.tickets).toEqual(reportParam.ticketsClosed)
    expect(reportModel.created.tickets).toEqual(reportParam.ticketsCreated)
    expect(reportModel.reportInterval).toEqual(reportInterval)

    expect(reportModel.allOpen.ticketsByBuilding).toStrictEqual(
        new Map([
          ["abc", [
            ticketInBuilding("abc"),
            ticketInBuilding("abc")]
          ],
          ["unknown", []]
        ])
    )
    expect(reportModel.closed.ticketsByBuilding).toStrictEqual(
        new Map([
          ["abc", [ticketInBuilding("abc")]],
          ["def", [ticketInBuilding("def")]],
          ["unknown", []]
        ])
    )
  })

})
