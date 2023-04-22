import {getTestServer} from "@google-cloud/functions-framework/build/src/testing";

import supertest from "supertest";
import * as functions from "@google-cloud/functions-framework";
import {mock} from "jest-mock-extended";
import {IntakeFormData, parseIntakeFormData} from "../src/intake-form-data";
import {parsePublishConfig, PublishConfig, pubsubSender, Sender} from "pubsub_lalliance/src/sender";
import {Env, intake_router} from "../src";
import {FormDataRouter, formDataRouter} from "../src/form-data-router";
import {DirectoryEntry, parseRoutingDirectory} from "../src/intake-directory";
import {ticketAnnouncer, TicketAnnouncer} from "../src/ticket-announcer";
import {JiraConfig, jiraService, parseJiraBasicAuth} from "../src/jira-service";

jest.mock("../src/form-data-router")
jest.mock("../src/intake-directory")
jest.mock("../src/intake-form-data")
jest.mock("../src/jira-service")
jest.mock("../src/ticket-announcer")
jest.mock("pubsub_lalliance/src/sender")

describe("mainline", () => {
  functions.http('intake_router', intake_router);

  const sampleDirectory: DirectoryEntry = {
    email: "hurdygurdy@thefair", name: "Hurdly Gurdly", roles: []
  }

  const rnd = Math.random();
  const formData: IntakeFormData = {
    area: "51", building: "", description: "", priority: "regular", reporter: "", rowIndex: 0, summary: "" + rnd
  }

  const publishConfig: PublishConfig = {
    project_id: "paperclip", topic_name: "advanced-aeronautics"
  }

  const jiraConfig: JiraConfig = {
    secrets: {
      jira_email: "eeemail",
      jira_token: "toukeeen" + rnd,
    },
    options: {
      jira_host: "http://google.com",
      jira_intake_project_key: "PAPERCLIP",
      test_mode: false
    }
  }

  beforeEach(() => {
    // our mocks know how to handle pubconfs
    process.env[Env.PUBLISH_CONFIG] = "pubconf"
    process.env[Env.DIRECTORY] = "routing"
    process.env[Env.SECRETS] = "jcreds"
    process.env[Env.JIRA_OPTIONS] = "jopts"
  })

  const server = getTestServer("intake_router")

  test("happy path", async () => {
    const f = new MockFixture()
    const issueKey = "IssueKey-" + rnd;
    f.formDataRouterMock.route.mockResolvedValue(issueKey)

    f.mockRoutingDirectoryParsing("routing", [sampleDirectory])
    f.mockJiraCredsParsing("jcreds", "jopts", jiraConfig)
    f.mockFormDataParsing("formdata", formData);
    f.mockPublishConfigParsing("pubconf", publishConfig);

    const response = supertest(server).post("/").send("formdata");
    await response.expect(200, issueKey)

    expect(f.capturedAnnouncerFactoryCallArg()).toEqual([sampleDirectory])
    expect(f.jiraServiceFactory).toBeCalledWith(jiraConfig)
    expect(f.senderFactory).toBeCalledWith(publishConfig)
    expect(f.formDataRouterMock.route).toBeCalledWith(expect.objectContaining(formData))
  })

  test("parse routing directory or return 500", async () => {
    const f = new MockFixture()
    f.mockRoutingDirectoryParsing("routing", [sampleDirectory])
    process.env[Env.DIRECTORY] = "non-routing"

    const response = supertest(server).post("/").send("something");

    await response.expect(500, "expected routing but got non-routing")
  })

  test("parse pubsub config or return 500", async () => {
    const f = new MockFixture()
    f.mockPublishConfigParsing("pubconf", publishConfig);
    process.env[Env.PUBLISH_CONFIG] = "wrong pubconf"

    const response = supertest(server).post("/").send("something");

    await response.expect(500, "expected pubconf but got wrong pubconf")
  })

  test("parse jira creds or return 500", async () => {
    const f = new MockFixture()
    f.mockJiraCredsParsing("jcreds", "jopts", jiraConfig)
    process.env[Env.SECRETS] = "wrong jcreds"

    const response = supertest(server).post("/").send("something");

    await response.expect(500, "expected jcreds but got wrong jcreds")
  })

  test("parse jira options or return 500", async () => {
    const f = new MockFixture()
    f.mockJiraCredsParsing("jcreds", "jopts", jiraConfig)
    process.env[Env.JIRA_OPTIONS] = "wrong jopts"

    const response = supertest(server).post("/").send("something");

    await response.expect(500, "expected jcreds but got wrong jopts")
  })

  test("form parse error should return 400", async () => {
    const f = new MockFixture()
    f.parseIntakeFormDataMock.mockRejectedValue(TypeError("invalid"));

    const response = supertest(server).post("/").send("formdata");
    await response.expect(400, "TypeError: invalid: formdata")
    expect(f.formDataRouterMock.route).toBeCalledTimes(0)
  })

  test("routing error should return 500", async () => {
    const f = new MockFixture()
    f.mockFormDataParsing("formdata", formData);
    f.formDataRouterMock.route.mockRejectedValue(new Error("no"))

    const response = supertest(server).post("/").send("formdata");
    await response.expect(500, "Error: no")
  })

  class MockFixture {
    // to make functions mockable must mock packages w/ jest.mock just below imports, upstairs
    readonly formDataRouterMock = mock<FormDataRouter>();
    readonly parseIntakeFormDataMock = jest.mocked(parseIntakeFormData, true);
    readonly announcerFactory = jest.mocked(ticketAnnouncer, true)
    readonly routerFactory = jest.mocked(formDataRouter, true);
    readonly senderFactory = jest.mocked(pubsubSender, true)
    readonly jiraServiceFactory = jest.mocked(jiraService, true)

    readonly announcerMock = mock<TicketAnnouncer>()
    readonly senderMock = mock<Sender>();
    readonly parsePublishConfigMock = jest.mocked(parsePublishConfig, true);
    readonly parseJiraBasicAuthMock = jest.mocked(parseJiraBasicAuth, true);
    readonly parseRoutingDirectoryMock = jest.mocked(parseRoutingDirectory, true)

    constructor() {
      this.announcerFactory.mockImplementation(() => {
        return this.announcerMock
      })
      this.routerFactory.mockImplementation((jira, tickets, sender) => {
        if (tickets !== this.announcerMock) {
          throw new Error("Wrong announcer sent to factory")
        }
        if (sender !== this.senderMock) {
          throw new Error("Wrong sender sent to factory")
        }
        return this.formDataRouterMock
      })
      this.senderFactory.mockImplementation(() => {
        return this.senderMock;
      })
    }

    mockRoutingDirectoryParsing(rawInput: any, routingDirectory: DirectoryEntry[]): void {
      this.mockParsing(rawInput, routingDirectory, this.parseRoutingDirectoryMock)
    }

    mockFormDataParsing(rawInput: any, formData: IntakeFormData): void {
      this.mockParsing(rawInput, formData, this.parseIntakeFormDataMock)
    }

    mockPublishConfigParsing(rawInput: any, publishConfig: PublishConfig): void {
      this.mockParsing(rawInput, publishConfig, this.parsePublishConfigMock)
    }

    mockJiraCredsParsing(rawSecrets: any, rawOptions: any, output: JiraConfig): void {
      const errorOut: (actual: any) => JiraConfig = (actual) => {
        throw new Error("expected " + rawSecrets + " but got " + actual);
      };
      const mockDecoder = async (s: any, o: any) => {
        if (s != rawSecrets) return  errorOut(s);
        if (o != rawOptions) return  errorOut(o);
        return output
      }
      this.parseJiraBasicAuthMock.mockImplementation(mockDecoder)
    }

    capturedAnnouncerFactoryCallArg(): DirectoryEntry[] {
      return this.announcerFactory.mock.calls[0][0]
    }

    private mockParsing<T>(input: any, parseResult: T, parserMock: jest.MockedFunctionDeep<any>): void {
      const errorOut: (actual: any) => T = (actual) => {
        throw new Error("expected " + input + " but got " + actual);
      };
      const mockDecoder = async (data: any) => data == input ? parseResult : errorOut(data);
      parserMock.mockImplementation(mockDecoder)
    }
  }
})
