import {robotEmail, to_comment} from "../appscript/Code"
import {GmailAppInteractions, gmailMessage, gmailThread, mockGmailApp} from "./mock/gmail";
import {mockUrlFetchApp} from "./mock/http";


describe("reply scanner", () => {
  const relevantMessageQuery = "in:Inbox -label:automation/event_sent -label:automation/irrelevant"
  test("nothing to do", () => {
    const gmailInteractions: GmailAppInteractions = mockGmailApp({
      searchQuery: relevantMessageQuery,
      searchResult: []
    })
    const urlFetchAppInteractions = mockUrlFetchApp([])

    to_comment()

    gmailInteractions.assertGmailInteractions()
    urlFetchAppInteractions.assertUrlFetchInteractions()
  });

  test("convert message to event", () => {
    const gmailInteractions: GmailAppInteractions = mockGmailApp({
      searchQuery: relevantMessageQuery,
      searchResult: [
        gmailThread([gmailMessage({
          from: "a.member@gmail.com"
        })])
      ]
    })

    const urlFetchAppInteractions = mockUrlFetchApp([
      {
        ticket: "ticket",
        email_id: ""
      }
    ])

    to_comment()

    gmailInteractions.assertGmailInteractions()
    urlFetchAppInteractions.assertUrlFetchInteractions()
  })

  test("ignore messages from robot", () => {
    mockGmailApp({
      searchQuery: relevantMessageQuery,
      searchResult: [
        gmailThread([
          gmailMessage({
            from: robotEmail
          })
        ])
      ]
    })
    const urlFetchAppInteractions = mockUrlFetchApp([])

    to_comment()

    urlFetchAppInteractions.assertUrlFetchInteractions()
  })
})
