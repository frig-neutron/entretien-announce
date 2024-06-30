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
          from: "a.member@gmail.com",
          body:  `
           I just don't wanna know
           TRIAG-667 anymore
           life shifts up and down everybody knows it's wrong
           life shifts TRIAG-669 up and down everybody TRIAG-668 knows it's wrong
           life shifts up and down everybody knows it's wrong
           why don't you care? TRIAG-666
           life
           shifts
           up 
           down
           wrong TRIAG-666
          `
        })])
      ]
    })

    const urlFetchAppInteractions = mockUrlFetchApp([
      {
        ticket: ["TRIAG-666", "TRIAG-667", "TRIAG-668", "TRIAG-669"],
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
