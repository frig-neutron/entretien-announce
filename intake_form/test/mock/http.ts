import {FormData, responseFieldLabels} from "../../appscript/Code";
import {Responses} from "../intake.test";
import {mock} from "jest-mock-extended";
import UrlFetchApp = GoogleAppsScript.URL_Fetch.UrlFetchApp;
import HTTPResponse = GoogleAppsScript.URL_Fetch.HTTPResponse;
import CustomMatcherResult = jest.CustomMatcherResult;
import {mockConfigurationViaThePropertiesService} from "./properties";

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


function mockTheUrlFetchApp(issueKey: string) {
  return mock<UrlFetchApp>({
    fetch: jest.fn((): HTTPResponse => {

      return mock<HTTPResponse>({
            getContentText() {
              return issueKey
            }
          }
      )
    })
  });
}

export function mockJira(resp: Responses) {
  const issueKey = "ISSUE-" + Math.random()
  const functionEndpoint = "http://endpoint_" + Math.random()
  const urlFetchApp = mockTheUrlFetchApp(issueKey);

  const ticketRouterMocks = {
    issueKey: issueKey,
    assertTicketCreated(t: FormData) {
      expect(urlFetchApp.fetch.mock.calls[0]).filesJiraTicket(t)
    },
  };

  // noinspection JSUnusedLocalSymbols
  global.UrlFetchApp = urlFetchApp
  mockConfigurationViaThePropertiesService(functionEndpoint)
  extendJestWithJiraMatcher(resp, functionEndpoint)
  return ticketRouterMocks
}
