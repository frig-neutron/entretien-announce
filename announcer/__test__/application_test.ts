import {Application, applicationImpl} from "../src/application";
import {JiraClient} from "../src/jira_client";
import {JiraTicket} from "../src/jira_ticket";

test("happy_path", () => {

  const closedTicket: JiraTicket =

  const jiraClient: JiraClient = {
    fetchTicketsClosedDuringInterval: jest.fn(() => [closedTicket])
  }

  const application: Application = applicationImpl(
    jiraClient
  )

  application.announce("abc")
  
  expect(jiraClient.fetchTicketsClosedDuringInterval).toBeCalledTimes(1)
});
