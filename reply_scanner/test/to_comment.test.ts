import {GmailAppInteractions, gmailMessage, gmailThread, mockGmailApp} from "./mock/gmail";
import {ConfigProps, mockConfigProps} from "./mock/properties";
import {mockPublishing, mockPublishingError} from "./mock/pubsub";
import {EmailReceived} from "../appscript/Code";

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
    const configProps: ConfigProps = {
      functionEndpoint: rndId("f"),
      gcpProject: rndId("proj"),
      publisherSAKey: rndId("{SA_KEY}"),
      pubsubTarget: rndId("topic"),
      robotEmail: "damn.robot@gmail.com"
    };
    const gmailInteractions: GmailAppInteractions = mockGmailApp({
      searchQuery: relevantMessageQuery,
      searchResult: []
    })
    const publishInteractions = mockPublishing([], configProps);

    await run_to_comment()

    publishInteractions.assertPublishInteractions()
    gmailInteractions.assertGmailInteractions()
  });

  test("convert message to event", async () => {
    const configProps = {
      functionEndpoint: rndId("f"),
      gcpProject: rndId("proj"),
      publisherSAKey: rndId("{SA_KEY}"),
      pubsubTarget: rndId("topic"),
      robotEmail: "not.a.robot@gmail.com"
    };
    mockConfigProps(configProps)

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

    const expectToPublish: EmailReceived[] = [
      {
        ticket: ["TRIAG-666", "TRIAG-667", "TRIAG-668", "TRIAG-669"],
        email_id: "amboog-a-lard"
      },
      {
        ticket: [],
        email_id: "iamnotanumber"
      }
    ];

    const publishInteractions = mockPublishing(expectToPublish, configProps);

    await run_to_comment()

    publishInteractions.assertPublishInteractions()
    gmailInteractions.assertGmailInteractions()
    expect(messageWithTicket.markRead).toBeCalled()
  })

  test("dont mark message processed if send fails", async () => {
    mockConfigProps({
      functionEndpoint: rndId("f"),
      gcpProject: rndId("proj"),
      publisherSAKey: rndId("{SA_KEY}"),
      pubsubTarget: rndId("topic"),
      robotEmail: "could.be.a.robot@gmail.com"
    })

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

    const publishInteractions = mockPublishingError();

    try {
      await run_to_comment()
    } catch (e: unknown) {
      if (e instanceof Error) {
        expect(e.message).toBe("mock error")
      } else {
        throw e
      }
    }

    publishInteractions.assertPublishInteractions()
    gmailInteractions.assertGmailInteractions()
    expect(message.markRead).not.toBeCalled()
  })

  test("ignore messages from robot", async () => {
    const configProps = {
      functionEndpoint: rndId("f"),
      gcpProject: rndId("proj"),
      publisherSAKey: rndId("{SA_KEY}"),
      pubsubTarget: rndId("topic"),
      robotEmail: "just.a.robot@gmail.com"
    };
    mockConfigProps(configProps)

    mockGmailApp({
      searchQuery: relevantMessageQuery,
      searchResult: [
        gmailThread([
          gmailMessage({
            from: configProps.robotEmail
          })
        ])
      ]
    })
    const publishInteractions = mockPublishing([], configProps);

    await run_to_comment()

    publishInteractions.assertPublishInteractions()
  })
})

function rndId(pfx: string) {
  return pfx + Math.floor(Math.random() * 100)
}
