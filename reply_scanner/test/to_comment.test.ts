import {to_comment} from "../appscript/Code"
import {GmailAppInteractions, gmailMessage, gmailThread, mockGmailApp} from "./mock/gmail";
import {mockUrlFetchApp} from "./mock/http";


describe("reply scanner", () => {
  test("nothing to do", () => {
    const gmailInteractions: GmailAppInteractions = mockGmailApp({
      searchQuery: "in:Inbox -label:automation/event_sent -label:automation/irrelevant",
      searchResult: []
    })
    const urlFetchAppInteractions = mockUrlFetchApp([])

    to_comment()

    gmailInteractions.assertGmailInteractions()
    urlFetchAppInteractions.assertUrlFetchInteractions() // TODO - suppress request
  });

  test("convert message to event", () => {
      const gmailInteractions: GmailAppInteractions = mockGmailApp({
        searchQuery: "in:Inbox -label:automation/event_sent -label:automation/irrelevant",
        searchResult: [
            gmailThread([gmailMessage({})])
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
    const gmailInteractions: GmailAppInteractions = mockGmailApp({
      searchQuery: "in:Inbox -label:automation/event_sent -label:automation/irrelevant",
      searchResult: [
          gmailThread([gmailMessage({})])
      ]
    })

    to_comment()
  })
})
