import {mock} from "jest-mock-extended";
import {EmailReceived} from "../../appscript/Code";
import UrlFetchApp = GoogleAppsScript.URL_Fetch.UrlFetchApp;
import CustomMatcherResult = jest.CustomMatcherResult;


declare var global: typeof globalThis; // can't use @types/node

interface HttpEventMatchers {
  httpRequest(events: EmailReceived[], expectedUrl?: string): void
}

declare global {
  namespace jest {
    // noinspection JSUnusedGlobalSymbols - need this to give expect matcher hints
    interface Matchers<R> extends HttpEventMatchers {
    }
  }
}

function extendJestWithMessageEventMatcher() {
  expect.extend({
    httpRequest(received, events: EmailReceived[], expectedUrl?: string): CustomMatcherResult {
      const [url, options] = received
      const payload = JSON.parse(options.payload)

      expect(url).toEqual(expectedUrl)
      expect(payload).toMatchObject(events)
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

export function mockUrlFetchApp(expectToPublish: EmailReceived[], url?: string): UrlFetchAppInteractions {
  const urlFetchApp = mock<UrlFetchApp>({
    fetch: jest.fn()
  })

  // noinspection JSUnusedLocalSymbols
  global.UrlFetchApp = urlFetchApp
  extendJestWithMessageEventMatcher()
  return {
    assertUrlFetchInteractions() {
      if (expectToPublish.length === 0) {
        expect(urlFetchApp.fetch).toHaveBeenCalledTimes(0)
      } else {
        expect(urlFetchApp.fetch.mock.calls[0]).httpRequest(expectToPublish, url)
      }
    }
  }
}

export function mockUrlFetchError(): UrlFetchAppInteractions {
  const urlFetchApp = mock<UrlFetchApp>({
    fetch: jest.fn(() => {
      throw new Error("mock error")
    })
  })

  // noinspection JSUnusedLocalSymbols
  global.UrlFetchApp = urlFetchApp
  return {
    assertUrlFetchInteractions() {
      expect(urlFetchApp.fetch).toHaveBeenCalledTimes(1)
    }
  }
}
