import {mock} from "jest-mock-extended";
import GmailApp = GoogleAppsScript.Gmail.GmailApp;
import GmailThread = GoogleAppsScript.Gmail.GmailThread;

declare var global: typeof globalThis; // can't use @types/node


interface SearchOp {
  searchQuery: string
  searchResult: GmailThread[]
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
