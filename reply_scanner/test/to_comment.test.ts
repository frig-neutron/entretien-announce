import {to_comment} from "../appscript/Code"
import {GmailAppInteractions, gmailMessage, gmailThread, mockGmailApp} from "./mock/gmail";
import {mockUrlFetchApp} from "./mock/http";
import {mockPropertiesServiceFunctionEndpoint, mockRobotEmail} from "./mock/properties";


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
    mockRobotEmail("not.a.robot@gmail.com")
    mockPropertiesServiceFunctionEndpoint("http://endpoint_0.1234567890")

    const message = gmailMessage({
      id: "amboog-a-lard",
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
    });

    const gmailInteractions: GmailAppInteractions = mockGmailApp({
      searchQuery: relevantMessageQuery,
      searchResult: [
        gmailThread([message])
      ]
    })

    const urlFetchAppInteractions = mockUrlFetchApp([
      {
        ticket: ["TRIAG-666", "TRIAG-667", "TRIAG-668", "TRIAG-669"],
        email_id: "amboog-a-lard"
      }
    ], "http://endpoint_0.1234567890")

    to_comment()

    gmailInteractions.assertGmailInteractions()
    urlFetchAppInteractions.assertUrlFetchInteractions()
    expect(message.markRead).toBeCalled()
  })

  test("ignore messages from robot", () => {
    mockRobotEmail("just.a.robot@gmail.com")
    mockGmailApp({
      searchQuery: relevantMessageQuery,
      searchResult: [
        gmailThread([
          gmailMessage({
            from: "just.a.robot@gmail.com"
          })
        ])
      ]
    })
    const urlFetchAppInteractions = mockUrlFetchApp([])

    to_comment()

    urlFetchAppInteractions.assertUrlFetchInteractions()
  })
})
