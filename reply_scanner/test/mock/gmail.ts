import {mock} from "jest-mock-extended";
import GmailApp = GoogleAppsScript.Gmail.GmailApp;
import GmailThread = GoogleAppsScript.Gmail.GmailThread;
import GmailMessage = GoogleAppsScript.Gmail.GmailMessage;

declare var global: typeof globalThis; // can't use @types/node


interface SearchOp {
  searchQuery: string
  searchResult: GmailThread[]
}

export interface MessageSpec {
  from: string,
  body?: string,
  id?: string
}
export interface GmailAppInteractions {
  assertGmailInteractions(): void
}
export function mockGmailApp(searchOp: SearchOp): GmailAppInteractions {
  global.GmailApp = mock<GmailApp>({
    search: jest.fn((searchQuery: string): GmailThread[] => {
      if (searchQuery === searchOp.searchQuery) {
        return searchOp.searchResult;
      } else {
        throw Error("unexpected search query " + searchQuery)
      }
    })
  })

  return {
    assertGmailInteractions() {
      expect(GmailApp.search).toHaveBeenCalledWith(searchOp.searchQuery)
    }
  }
}

export function gmailThread(messages: GmailMessage[]): GmailThread {
  return mock<GmailThread>({
    getMessages: () => messages
  })
}

export function gmailMessage(messageSpec: MessageSpec): GmailMessage {
  const holder: {mock?: ReturnType<typeof mock<GmailMessage>>} = {

  }
  holder.mock = mock<GmailMessage>({
    getFrom: () => resultIfDefine("from", messageSpec.from),
    getBody: () => resultIfDefine("body", messageSpec.body),
    getId: () => resultIfDefine("id", messageSpec.id),
    markRead: jest.fn(() => {
      return holder.mock!!
    })
  });
  return holder.mock;
}

function resultIfDefine(n: string, f: undefined | string): string {
  if (f) {
    return f
  } else {
    throw Error("Mock is incomplete. Expected mock value for " + n + " is undefined")
  }
}
