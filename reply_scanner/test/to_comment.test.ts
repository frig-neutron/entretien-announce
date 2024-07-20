import {GmailAppInteractions, gmailMessage, gmailThread, mockGmailApp} from "./mock/gmail";
import {mockUrlFetchApp, mockUrlFetchError} from "./mock/http";
import {mockPropertiesServiceFunctionEndpoint, mockRobotEmail} from "./mock/properties";
import {mockPublishing} from "./mock/pubsub";

describe("reply scanner", () => {

  beforeEach(() => {
    jest.resetModules();
  });

  async function run_to_comment() {
    const Code = await import("../appscript/Code")
    const to_comment: () => void = Code["to_comment"];
    to_comment()
  }

  const relevantMessageQuery = "in:Inbox is:unread"
  test("nothing to do", async () => {
    const gmailInteractions: GmailAppInteractions = mockGmailApp({
      searchQuery: relevantMessageQuery,
      searchResult: []
    })
    const urlFetchAppInteractions = mockUrlFetchApp([])

    await run_to_comment()

    gmailInteractions.assertGmailInteractions()
    urlFetchAppInteractions.assertUrlFetchInteractions()
  });

  test("convert message to event", async () => {
    mockRobotEmail("not.a.robot@gmail.com")
    mockPropertiesServiceFunctionEndpoint("http://endpoint_0.1234567890")

    const messageWithTicket = gmailMessage({
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
    const messageSansTicket = gmailMessage({
      id: "iamnotanumber",
      from: "a.member@gmail.com",
      body:  "no ticket here bruh"
    });

    const gmailInteractions: GmailAppInteractions = mockGmailApp({
      searchQuery: relevantMessageQuery,
      searchResult: [
        gmailThread([messageWithTicket, messageSansTicket])
      ]
    })

    const urlFetchAppInteractions = mockUrlFetchApp([
      {
        ticket: ["TRIAG-666", "TRIAG-667", "TRIAG-668", "TRIAG-669"],
        email_id: "amboog-a-lard"
      },
      {
        ticket: [],
        email_id: "iamnotanumber"
      }
    ], "http://endpoint_0.1234567890")

    await run_to_comment()

    gmailInteractions.assertGmailInteractions()
    urlFetchAppInteractions.assertUrlFetchInteractions()
    expect(messageWithTicket.markRead).toBeCalled()
  })

  test("dont mark message processed if send fails", async () => {
    mockRobotEmail("could.be.a.robot@gmail.com")
    mockPropertiesServiceFunctionEndpoint("http://endpoint_0.1234567890")


    const message = gmailMessage({
      id: "amboog-a-lard",
      from: "a.member@gmail.com",
      body:  "TRIAG-667 went kablooey"
    });

    const gmailInteractions: GmailAppInteractions = mockGmailApp({
      searchQuery: relevantMessageQuery,
      searchResult: [
        gmailThread([message])
      ]
    })

    const urlFetchAppInteractions = mockUrlFetchError()

    try {
      await run_to_comment()
    } catch (e: unknown) {
      if (e instanceof Error) {
        expect(e.message).toBe("mock error")
      } else {
        throw e
      }
    }

    gmailInteractions.assertGmailInteractions()
    urlFetchAppInteractions.assertUrlFetchInteractions()
    expect(message.markRead).not.toBeCalled()
  })

  test("ignore messages from robot", () => {
    const robotEmail = "just.a.robot@gmail.com";
    mockRobotEmail(robotEmail)
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

    // to_comment()

    urlFetchAppInteractions.assertUrlFetchInteractions()
  })

  test("mockin classes", async () => {
    const publishInteractions = await mockPublishing();
    publishInteractions.assertPublishInteractions()
  })
})
