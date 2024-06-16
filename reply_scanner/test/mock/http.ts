import {mock} from "jest-mock-extended";
import {EmailReceived} from "../../appscript/Code";
import UrlFetchApp = GoogleAppsScript.URL_Fetch.UrlFetchApp;
import CustomMatcherResult = jest.CustomMatcherResult;


declare var global: typeof globalThis; // can't use @types/node

interface MessageEventMatchers {
  publishesEvents(events: EmailReceived[]): void
}

declare global {
  namespace jest {
    // noinspection JSUnusedGlobalSymbols - need this to give expect matcher hints
    interface Matchers<R> extends MessageEventMatchers {
    }
  }
}

function extendJestWithMessageEventMatcher() {
  expect.extend({
    publishesEvents(received, events: EmailReceived[]): CustomMatcherResult {
      const [url, options] = received
      const payload = JSON.parse(options.payload)

      expect(payload).toHaveLength(events.length)
      return {
        pass: true,
        message: () => "I ain't nothing to say to you"
      }
    }
  })
}

export interface UrlFetchAppInteractions {
  assertUrlFetchInteractions(): void
}

export function mockUrlFetchApp(expectToPublish: EmailReceived[]): UrlFetchAppInteractions {
  const urlFetchApp = mock<UrlFetchApp>({
    fetch: jest.fn()
  })

  // noinspection JSUnusedLocalSymbols
  global.UrlFetchApp = urlFetchApp
  extendJestWithMessageEventMatcher()
  return {
    assertUrlFetchInteractions() {
      expect(urlFetchApp.fetch.mock.calls[0]).publishesEvents(expectToPublish)
    }
  }
}
