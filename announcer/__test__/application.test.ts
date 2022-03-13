import {Application, applicationImpl} from "../src/application";
import {JiraClient} from "../src/jira_client";
import {JiraTicket} from "../src/jira_ticket";
import {mock} from "jest-mock-extended";

import {Interval} from "luxon";

describe("application", () => {
  test("happy_path", () => {

    const closedTicket = mock<JiraTicket>()

    const jiraClient = mock<JiraClient>()

    const application: Application = applicationImpl(
        jiraClient
    )

    application.announce("2038-01-19T12:34:56.789")

    const reportInterval = Interval.fromISO("2037-12-01/2038-01-01")

    expect(jiraClient.fetchTicketsClosedDuringInterval).toBeCalledWith(reportInterval)
  })
});
