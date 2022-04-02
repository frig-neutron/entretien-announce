import {mock, mockDeep} from "jest-mock-extended";

import {Issue} from "jira.js/out/version2/models";
import {Clock, JiraTicket, proxyJiraJsIssue} from "../src/jira_ticket";
import {DateTime, Duration} from "luxon";
import {Option} from "prelude-ts";
import {google} from "@google-cloud/pubsub/build/protos/protos";


describe("jira ticket", () => {
  let issue = mock<Issue>()
  let clock = mockDeep<Clock>()
  let ticket: JiraTicket = proxyJiraJsIssue(issue, clock)

  beforeEach(() => {
    issue = mock<Issue>()
    ticket = proxyJiraJsIssue(issue, clock)
  })

  test("issue key", () => {
    issue.key = "ISSUE_KEY"
    expect(ticket.key()).toEqual("ISSUE_KEY")
  })

  test("ticket summary", () => {
    issue.fields.summary = "SUMMARY"
    expect(ticket.summary()).toEqual("SUMMARY")
  })

  test("building number from field", () => {
    issue.fields.customfield_10038 = {
      value: "1234"
    }
    expect(ticket.building()).toEqual("1234")
  })

  test("building number from summary if field empty", () => {
    issue.fields.summary = "1234 title"
    expect(ticket.building()).toEqual("1234")
  })

  test("building number unknown", () => {
    issue.fields.summary = "no building title"
    expect(ticket.building()).toEqual("unknown")
  })

  test("building number unknown if no title set", () => {
    expect(ticket.building()).toEqual("unknown")
  })

  test("ticket status", () => {
    issue.fields.status = {name: "Done"}
    expect(ticket.status()).toEqual(Option.of("Done"))
  })

  test("ticket status missing", () => {
    issue.fields.status = {}
    expect(ticket.status()).toEqual(Option.none())
  })

  test("date created", () => {
    issue.fields.created = "2021-11-04T20:09:26.183-0400"
    expect(ticket.dateCreated()).toEqual(Option.of(DateTime.fromISO("2021-11-04T20:09:26.183-0400")))
  })

  test("ticket age", () => {
    issue.fields.created = "2021-11-04T20:09:26.183-0400"
    clock.time.mockReturnValue(DateTime.fromISO("2021-11-05T20:09:26.183-0400")) // one day after issue creation
    const ticketAgeInSeconds = ticket.age().getOrNull()?.seconds;
    const oneDay = Duration.fromISO("P1D").seconds;
    expect(ticketAgeInSeconds).toEqual(oneDay)
  })

  test("ticket creation parse fail", () => {
    issue.fields.created = "can't parse this"
    expect(ticket.dateCreated()).toEqual(Option.none())
  })

  test("ticket age parse fail", () => {
    issue.fields.created = "can't parse this"
    expect(ticket.age()).toEqual(Option.none())
  })
})
