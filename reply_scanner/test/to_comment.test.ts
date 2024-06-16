import {to_comment} from "../appscript/Code"
import {GmailAppInteractions, mockGmailApp} from "./mock/gmail";


describe("reply scanner", () => {
  test("nothing to do", () => {
    const gmailInteractions: GmailAppInteractions = mockGmailApp({
      searchQuery: "in:Inbox -label:automation/event_sent -label:automation/irrelevant",
      searchResult: []
    })

    to_comment()

    gmailInteractions.assertGmailInteractions()
  });
})
