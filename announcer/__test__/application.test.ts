import {Application, applicationImpl} from "../src/application";
import {JiraClient} from "../src/jira_client";
import {JiraTicket} from "../src/jira_ticket";
import {mock} from "jest-mock-extended";

describe("application", () => {
  test("happy_path", () => {

    const closedTicket = mock<JiraTicket>()

    const jiraClient = mock<JiraClient>()

    const application: Application = applicationImpl(
        jiraClient
    )

    application.announce("abc")

    expect(jiraClient.fetchTicketsClosedDuringInterval).toBeCalledTimes(1)
  })
});
