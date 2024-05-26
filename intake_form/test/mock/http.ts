import {FormData, responseFieldLabels} from "../../appscript/Code";
import {Responses} from "../intake.test";
import {mock} from "jest-mock-extended";
import UrlFetchApp = GoogleAppsScript.URL_Fetch.UrlFetchApp;
import HTTPResponse = GoogleAppsScript.URL_Fetch.HTTPResponse;
import CustomMatcherResult = jest.CustomMatcherResult;
import {mockPropertiesServiceFunctionEndpoint} from "./properties";

declare var global: typeof globalThis; // can't use @types/node

interface TicketMatchers {
  filesJiraTicket(formData: FormData): CustomMatcherResult,
}

declare global {
  namespace jest {
    // noinspection JSUnusedGlobalSymbols - need this to give expect matcher hints
    interface Matchers<R> extends TicketMatchers {
    }
  }
}

function extendJestWithJiraMatcher(resp: Responses, functionEndpoint: string) {

  expect.extend({
    filesJiraTicket(received, formData: FormData) {
      const [url, options] = received
      const payload = JSON.parse(options.payload)

      expect(url).toEqual(functionEndpoint)
      expect(options).toMatchObject({
        // todo: seems redundant to have multiple content type specs. retest.
        "contentType": "application/json",
        "method": "post",
        headers: {
          "contentType": "application/json",
          "Accept": "application/json",
        }
      })
      expect(payload).toMatchObject(formData)
      return {
        pass: true,
        message: () => "I ain't nothing to say to you"
      }
    }
  })
}


function mockTheUrlFetchApp(issueKey: string, errors: string[]) {
  let fetchAttempt: number = 0

  return mock<UrlFetchApp>({
    fetch: jest.fn((): HTTPResponse => {
      if (fetchAttempt < errors.length) {
        fetchAttempt++
        throw Error(errors[fetchAttempt - 1])
      }
      return mock<HTTPResponse>({
            getContentText() {
              return issueKey
            }
          }
      )
    })
  });
}

/**
 * @param resp - the goods
 * @param errors - throw all these errors before returning a response
 */
export function mockUrlFetchApp(resp: Responses,  ... errors: string[]) {
  const issueKey = "ISSUE-" + Math.random()
  const functionEndpoint = "http://endpoint_" + Math.random()
  const urlFetchApp = mockTheUrlFetchApp(issueKey, errors);

  const urlFetchAppInteractions = {
    issueKey: issueKey,
    assertTicketCreated(t: FormData) {
      expect(urlFetchApp.fetch.mock.calls[errors.length]).filesJiraTicket(t)
    },
  };

  // noinspection JSUnusedLocalSymbols
  global.UrlFetchApp = urlFetchApp
  mockPropertiesServiceFunctionEndpoint(functionEndpoint)
  extendJestWithJiraMatcher(resp, functionEndpoint)
  return urlFetchAppInteractions
}
